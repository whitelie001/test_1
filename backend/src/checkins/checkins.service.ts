import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AnchorsService } from '../anchors/anchors.service';
import { GrowthService } from '../growth/growth.service';
import {
  CheckinAlreadyActiveException,
  CheckinNotFoundException,
  InsufficientStayException,
  MeetupNotFoundException,
  NotMemberException,
  OutOfRangeException,
} from '../common/exceptions/pium-api.exception';
import { seoulStartOfDay, seoulYearMonth, seoulYearMonthRange } from '../common/time/seoul-time';
import { haversineMeters, isWithinRadius } from './domain/geo';
import {
  applyLocationPing,
  canExit,
  computeCurrentElapsedSeconds,
  RangeTimerState,
} from './domain/range-timer';
import { computeCheckinScore } from './domain/checkin-exit-score-calculator';
import {
  LOCATION_PING_INTERVAL_SECONDS,
  MEETUP_CHECKIN_RADIUS_METERS,
  MINIMUM_STAY_SECONDS,
} from './domain/checkin-constants';
import { ANCHOR_GRACE_PERIOD_SECONDS, ANCHOR_RADIUS_METERS } from '../anchors/domain/anchor-constants';
import { CheckinEnterDto } from './dto/checkin-enter.dto';
import { CheckinLocationDto } from './dto/checkin-location.dto';
import { CheckinExitDto } from './dto/checkin-exit.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';

interface CheckinTarget {
  lat: number;
  lng: number;
  radiusMeters: number;
  gracePeriodSeconds: number;
}

@Injectable()
export class CheckinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anchorsService: AnchorsService,
    private readonly growthService: GrowthService,
  ) {}

  async enter(meetupId: string, userId: string, dto: CheckinEnterDto) {
    const meetup = await this.prisma.meetup.findUnique({ where: { id: meetupId } });
    if (!meetup) throw new MeetupNotFoundException();

    const membership = await this.prisma.meetupMember.findFirst({
      where: { meetupId, userId, leftAt: null },
    });
    if (!membership) throw new NotMemberException();

    const activeCheckin = await this.prisma.checkin.findFirst({
      where: { userId, status: 'active' },
    });
    if (activeCheckin) throw new CheckinAlreadyActiveException();

    let anchorId: string | null = null;
    let target: CheckinTarget = {
      lat: meetup.lat,
      lng: meetup.lng,
      radiusMeters: MEETUP_CHECKIN_RADIUS_METERS,
      gracePeriodSeconds: 0,
    };

    if (dto.anchor_mode) {
      const anchor = await this.anchorsService.getActiveAnchorForMeetup(meetupId);
      // 앵커 모드를 요청했지만 활성 앵커가 없으면 고정 위치 기준으로 대체한다
      // (문서에 이 상황을 위한 전용 에러 코드가 없어, 체크인 자체가 막히지
      // 않도록 우아하게 대체하는 쪽을 택했다).
      if (anchor) {
        anchorId = anchor.id;
        target = {
          lat: anchor.lat,
          lng: anchor.lng,
          radiusMeters: ANCHOR_RADIUS_METERS,
          gracePeriodSeconds: ANCHOR_GRACE_PERIOD_SECONDS,
        };
      }
    }

    const distance = haversineMeters(dto.lat, dto.lng, target.lat, target.lng);
    if (!isWithinRadius(distance, target.radiusMeters)) {
      throw new OutOfRangeException();
    }

    const now = new Date();
    const session = await this.findOrCreateTodaySession(meetupId, now);

    const checkin = await this.prisma.checkin.create({
      data: {
        sessionId: session.id,
        userId,
        status: 'active',
        enteredAt: now,
        lastLat: dto.lat,
        lastLng: dto.lng,
        lastLocationAt: now,
        isInRange: true,
        elapsedSeconds: 0,
        rangeStateChangedAt: now,
        outOfRangeSince: null,
        anchorId,
        date: seoulStartOfDay(now),
      },
    });

    return { checkin_id: checkin.id, entered_at: checkin.enteredAt, status: 'entered' };
  }

  async updateLocation(checkinId: string, userId: string, dto: CheckinLocationDto) {
    const checkin = await this.getActiveOwnedCheckin(checkinId, userId);
    const target = await this.resolveTarget(checkin);
    const now = new Date();

    const distance = haversineMeters(dto.lat, dto.lng, target.lat, target.lng);
    const newState = applyLocationPing(this.toState(checkin), {
      isPhysicallyInRange: isWithinRadius(distance, target.radiusMeters),
      now,
      gracePeriodSeconds: target.gracePeriodSeconds,
    });

    await this.prisma.checkin.update({
      where: { id: checkin.id },
      data: {
        ...this.fromState(newState),
        lastLat: dto.lat,
        lastLng: dto.lng,
        lastLocationAt: now,
      },
    });

    return {
      status: 'staying',
      elapsed_seconds: Math.round(newState.elapsedSeconds),
      is_in_range: newState.isInRange,
    };
  }

  async exit(checkinId: string, userId: string, dto: CheckinExitDto) {
    const checkin = await this.getActiveOwnedCheckin(checkinId, userId);
    const target = await this.resolveTarget(checkin);
    const now = new Date();

    const distance = haversineMeters(dto.lat, dto.lng, target.lat, target.lng);
    const finalState = applyLocationPing(this.toState(checkin), {
      isPhysicallyInRange: isWithinRadius(distance, target.radiusMeters),
      now,
      gracePeriodSeconds: target.gracePeriodSeconds,
    });

    if (!canExit(finalState, now, MINIMUM_STAY_SECONDS)) {
      throw new InsufficientStayException();
    }

    const totalSeconds = Math.round(finalState.elapsedSeconds);
    const score = computeCheckinScore(totalSeconds);

    await this.prisma.checkin.update({
      where: { id: checkin.id },
      data: {
        ...this.fromState(finalState),
        status: 'completed',
        exitedAt: now,
        lastLat: dto.lat,
        lastLng: dto.lng,
        lastLocationAt: now,
        piumScoreEarned: score,
      },
    });

    // 성장 단계는 실시간 계산이라 별도 저장이 필요 없지만, 새 완료 체크인이
    // 방금 반영된 지표로 성장 이력(growth_history)이 갱신되도록 즉시 재계산한다.
    const session = await this.prisma.meetupSession.findUniqueOrThrow({
      where: { id: checkin.sessionId },
      select: { meetupId: true },
    });
    await this.growthService.getGrowth(session.meetupId);

    return {
      status: 'completed',
      total_seconds: totalSeconds,
      pium_score_earned: score,
      attendance_confirmed: true,
    };
  }

  async getStatus(checkinId: string, userId: string) {
    const checkin = await this.prisma.checkin.findFirst({
      where: { id: checkinId, userId },
    });
    if (!checkin) throw new CheckinNotFoundException();

    const elapsedSeconds =
      checkin.status === 'active'
        ? Math.round(computeCurrentElapsedSeconds(this.toState(checkin), new Date()))
        : checkin.elapsedSeconds;

    return {
      checkin_id: checkin.id,
      status: this.mapStatus(checkin.status),
      elapsed_seconds: elapsedSeconds,
      entered_at: checkin.enteredAt,
    };
  }

  async getAttendance(meetupId: string, userId: string, query: AttendanceQueryDto) {
    const defaults = seoulYearMonth(new Date());
    const year = query.year ?? defaults.year;
    const month = query.month ?? defaults.month;
    const { start, end } = seoulYearMonthRange(year, month);

    const checkins = await this.prisma.checkin.findMany({
      where: {
        userId,
        session: { meetupId },
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
    });

    return {
      records: checkins.map((c) => ({
        date: c.date.toISOString().slice(0, 10),
        attended: c.status === 'completed',
        duration_seconds: c.elapsedSeconds,
      })),
    };
  }

  /// 자정(KST) 기준 미완료 체크인을 무효화한다. 문서 6.1절 "자정 초기화".
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Seoul' })
  async invalidateExpiredCheckins() {
    const today = seoulStartOfDay(new Date());
    await this.prisma.checkin.updateMany({
      where: { status: 'active', date: { lt: today } },
      data: { status: 'invalidated' },
    });
  }

  private async getActiveOwnedCheckin(checkinId: string, userId: string) {
    const checkin = await this.prisma.checkin.findFirst({
      where: { id: checkinId, userId, status: 'active' },
    });
    if (!checkin) throw new CheckinNotFoundException();
    return checkin;
  }

  private async resolveTarget(checkin: { anchorId: string | null; sessionId: string }): Promise<CheckinTarget> {
    if (checkin.anchorId) {
      const anchor = await this.prisma.anchor.findUnique({ where: { id: checkin.anchorId } });
      if (anchor) {
        return {
          lat: anchor.lat,
          lng: anchor.lng,
          radiusMeters: ANCHOR_RADIUS_METERS,
          gracePeriodSeconds: ANCHOR_GRACE_PERIOD_SECONDS,
        };
      }
    }
    const session = await this.prisma.meetupSession.findUniqueOrThrow({
      where: { id: checkin.sessionId },
      include: { meetup: true },
    });
    return {
      lat: session.meetup.lat,
      lng: session.meetup.lng,
      radiusMeters: MEETUP_CHECKIN_RADIUS_METERS,
      gracePeriodSeconds: 0,
    };
  }

  private async findOrCreateTodaySession(meetupId: string, now: Date) {
    const sessionDate = seoulStartOfDay(now);
    return this.prisma.meetupSession.upsert({
      where: { meetupId_sessionDate: { meetupId, sessionDate } },
      create: { meetupId, sessionDate, status: 'scheduled' },
      update: {},
    });
  }

  private toState(checkin: {
    elapsedSeconds: number;
    isInRange: boolean;
    rangeStateChangedAt: Date;
    outOfRangeSince: Date | null;
  }): RangeTimerState {
    return {
      elapsedSeconds: checkin.elapsedSeconds,
      isInRange: checkin.isInRange,
      rangeStateChangedAt: checkin.rangeStateChangedAt,
      outOfRangeSince: checkin.outOfRangeSince,
    };
  }

  private fromState(state: RangeTimerState) {
    return {
      elapsedSeconds: Math.round(state.elapsedSeconds),
      isInRange: state.isInRange,
      rangeStateChangedAt: state.rangeStateChangedAt,
      outOfRangeSince: state.outOfRangeSince,
    };
  }

  private mapStatus(status: string): string {
    if (status === 'active') return 'staying';
    return status;
  }
}
