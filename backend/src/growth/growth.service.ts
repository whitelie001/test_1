import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MeetupNotFoundException } from '../common/exceptions/pium-api.exception';
import {
  computeLargeGroupScore,
  computeSmallGroupScore,
} from './domain/growth-composite-score';
import {
  computeLargeGroupProgress,
  computeSmallGroupProgress,
} from './domain/growth-progress';
import {
  GrowthStage,
  resolveLargeGroupStage,
  resolveSmallGroupStage,
} from './domain/growth-stage-resolver';
import { SMALL_GROUP_STAGE_THRESHOLDS, SEED_STAGE } from './domain/growth-stage-thresholds';

interface RawMetrics {
  attendanceRate: number;
  streakCount: number;
  meetingCount: number;
  cumulativeMembers: number;
  fillRate: number;
  newInflowRate: number;
}

@Injectable()
export class GrowthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getGrowth(meetupId: string) {
    const meetup = await this.prisma.meetup.findUnique({ where: { id: meetupId } });
    if (!meetup) throw new MeetupNotFoundException();

    const metrics = await this.computeMetrics(meetupId, meetup.currentMembers, meetup.maxMembers);
    const isSmall = meetup.meetupType === 'small';

    const stage = isSmall
      ? resolveSmallGroupStage({
          attendanceRate: metrics.attendanceRate,
          streakCount: metrics.streakCount,
          totalCount: metrics.meetingCount,
        })
      : resolveLargeGroupStage({
          cumulativeMembers: metrics.cumulativeMembers,
          meetingCount: metrics.meetingCount,
          attendanceRate: metrics.attendanceRate,
        });

    const score = isSmall
      ? computeSmallGroupScore({
          attendanceRate: metrics.attendanceRate,
          streakCount: metrics.streakCount,
          totalCount: metrics.meetingCount,
          fillRate: metrics.fillRate,
        })
      : computeLargeGroupScore({
          cumulativeMembers: metrics.cumulativeMembers,
          meetingCount: metrics.meetingCount,
          attendanceRate: metrics.attendanceRate,
          newInflowRate: metrics.newInflowRate,
        });

    const progress = isSmall
      ? computeSmallGroupProgress(
          { attendanceRate: metrics.attendanceRate, streakCount: metrics.streakCount, totalCount: metrics.meetingCount },
          stage.level,
        )
      : computeLargeGroupProgress(
          { cumulativeMembers: metrics.cumulativeMembers, meetingCount: metrics.meetingCount, attendanceRate: metrics.attendanceRate },
          stage.level,
        );

    await this.recordHistoryIfChanged(meetupId, meetup.name, stage, score, metrics);

    return {
      growth_level: stage.level,
      growth_name: stage.name,
      pium_score: score,
      next_level: progress.nextLevel,
      progress_pct: progress.progressPct,
      attendance_rate: Math.round(metrics.attendanceRate * 100) / 100,
      streak_count: metrics.streakCount,
      total_count: metrics.meetingCount,
    };
  }

  async getGrowthHistory(meetupId: string) {
    const rows = await this.prisma.growthHistory.findMany({
      where: { meetupId },
      orderBy: { achievedAt: 'asc' },
    });
    return {
      history: rows.map((r) => ({
        level: r.level,
        name: this.nameForLevel(r.level),
        achieved_at: r.achievedAt,
      })),
    };
  }

  /// 랭킹 계산 등 외부에서도 재사용할 수 있도록 점수만 별도로 공개.
  async computeScore(meetupId: string): Promise<{ score: number; growthLevel: number }> {
    const meetup = await this.prisma.meetup.findUniqueOrThrow({ where: { id: meetupId } });
    const metrics = await this.computeMetrics(meetupId, meetup.currentMembers, meetup.maxMembers);
    const isSmall = meetup.meetupType === 'small';

    const stage = isSmall
      ? resolveSmallGroupStage({
          attendanceRate: metrics.attendanceRate,
          streakCount: metrics.streakCount,
          totalCount: metrics.meetingCount,
        })
      : resolveLargeGroupStage({
          cumulativeMembers: metrics.cumulativeMembers,
          meetingCount: metrics.meetingCount,
          attendanceRate: metrics.attendanceRate,
        });

    const score = isSmall
      ? computeSmallGroupScore({
          attendanceRate: metrics.attendanceRate,
          streakCount: metrics.streakCount,
          totalCount: metrics.meetingCount,
          fillRate: metrics.fillRate,
        })
      : computeLargeGroupScore({
          cumulativeMembers: metrics.cumulativeMembers,
          meetingCount: metrics.meetingCount,
          attendanceRate: metrics.attendanceRate,
          newInflowRate: metrics.newInflowRate,
        });

    return { score, growthLevel: stage.level };
  }

  private nameForLevel(level: number): string {
    if (level === 0) return SEED_STAGE.name;
    const th = SMALL_GROUP_STAGE_THRESHOLDS.find((t) => t.level === level);
    return th?.name ?? SEED_STAGE.name;
  }

  private async recordHistoryIfChanged(
    meetupId: string,
    meetupName: string,
    stage: GrowthStage,
    score: number,
    metrics: RawMetrics,
  ) {
    const latest = await this.prisma.growthHistory.findFirst({
      where: { meetupId },
      orderBy: { achievedAt: 'desc' },
    });
    if (latest && latest.level >= stage.level) return;

    await this.prisma.growthHistory.create({
      data: {
        meetupId,
        level: stage.level,
        score,
        metrics: metrics as unknown as Prisma.InputJsonValue,
      },
    });

    await this.notificationsService.notifyMeetupMembers(
      meetupId,
      'growth_achieved',
      '피움 성장 알림',
      `${meetupName} 모임이 '${stage.name}' 단계로 성장했어요!`,
      { meetup_id: meetupId, growth_level: stage.level, growth_name: stage.name },
    );
  }

  /// 모임의 원시 지표를 세션/체크인 기록에서 계산한다.
  ///
  /// - attendanceRate: 완료된 체크인 수 / (세션 수 × 현재 인원)
  /// - streakCount: 가장 최근 세션부터 거슬러 올라가며 연속으로 출석(완료
  ///   체크인 1건 이상)이 있었던 세션 수
  /// - meetingCount: 실제로 출석이 있었던(=열린) 세션 수
  /// - cumulativeMembers: 이 모임에 한 번이라도 가입했던 전체 인원(탈퇴 포함)
  /// - fillRate: 현재 인원 / 최대 인원
  /// - newInflowRate: 최근 30일 내 신규 가입자 비율
  private async computeMetrics(
    meetupId: string,
    currentMembers: number,
    maxMembers: number,
  ): Promise<RawMetrics> {
    const sessions = await this.prisma.meetupSession.findMany({
      where: { meetupId },
      orderBy: { sessionDate: 'desc' },
      include: { checkins: { where: { status: 'completed' }, select: { id: true } } },
    });

    let streakCount = 0;
    for (const session of sessions) {
      if (session.checkins.length > 0) streakCount++;
      else break;
    }

    const meetingCount = sessions.filter((s) => s.checkins.length > 0).length;
    const totalCompletedCheckins = sessions.reduce((sum, s) => sum + s.checkins.length, 0);
    const attendanceRate =
      sessions.length > 0 && currentMembers > 0
        ? Math.min(totalCompletedCheckins / (sessions.length * currentMembers), 1)
        : 0;

    const cumulativeMembers = await this.prisma.meetupMember.count({ where: { meetupId } });
    const fillRate = maxMembers > 0 ? Math.min(currentMembers / maxMembers, 1) : 0;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newMembers = await this.prisma.meetupMember.count({
      where: { meetupId, joinedAt: { gte: thirtyDaysAgo } },
    });
    const newInflowRate = cumulativeMembers > 0 ? newMembers / cumulativeMembers : 0;

    return { attendanceRate, streakCount, meetingCount, cumulativeMembers, fillRate, newInflowRate };
  }
}
