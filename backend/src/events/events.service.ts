import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { EventNotFoundException } from '../common/exceptions/pium-api.exception';
import { resolveEventEligibility } from './domain/event-eligibility';

const EVENT_TOKEN_TTL_SECONDS = 300;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  async list(type: string | undefined, status: string | undefined) {
    const events = await this.prisma.event.findMany({
      where: { ...(type ? { type } : {}), ...(status ? { status } : {}) },
      orderBy: { startDate: 'asc' },
    });
    return { events: events.map((e) => this.serialize(e)) };
  }

  async getById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new EventNotFoundException();
    return this.serialize(event);
  }

  async getEligibility(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new EventNotFoundException();

    const standing = await this.computeUserStanding(userId);
    const result = resolveEventEligibility(
      {
        requiredGrowthLevel: event.requiredGrowthLevel,
        requiredAttendanceCount: event.requiredAttendanceCount,
      },
      standing,
    );

    return {
      eligible: result.eligible,
      growth_level: standing.growthLevel,
      attendance_count: standing.attendanceCount,
      reasons: result.reasons,
    };
  }

  async issueEventToken(userId: string) {
    const token = randomUUID();
    await this.redis.set(`event-token:${token}`, userId, 'EX', EVENT_TOKEN_TTL_SECONDS);
    const siteUrl = this.config.get<string>('EVENTS_SITE_URL', 'https://pium-events.com');
    return {
      event_token: token,
      expires_in: EVENT_TOKEN_TTL_SECONDS,
      redirect_url: `${siteUrl}?token=${token}`,
    };
  }

  /// growth_level/attendance_count는 문서에 사용자 단위 정의가 없다(성장은
  /// 모임 단위 개념). 소속된 모임들 중 최고 성장 단계와, 전체 모임에서
  /// 완료한 체크인 누적 횟수로 잠정 채택했다.
  private async computeUserStanding(userId: string) {
    const [attendanceCount, memberships] = await Promise.all([
      this.prisma.checkin.count({ where: { userId, status: 'completed' } }),
      this.prisma.meetupMember.findMany({
        where: { userId, leftAt: null },
        select: { meetupId: true },
      }),
    ]);

    if (memberships.length === 0) {
      return { growthLevel: 0, attendanceCount };
    }

    const latestLevels = await this.prisma.growthHistory.findMany({
      where: { meetupId: { in: memberships.map((m) => m.meetupId) } },
      orderBy: { achievedAt: 'desc' },
    });
    const bestPerMeetup = new Map<string, number>();
    for (const row of latestLevels) {
      if (!bestPerMeetup.has(row.meetupId)) bestPerMeetup.set(row.meetupId, row.level);
    }
    const growthLevel = bestPerMeetup.size > 0 ? Math.max(...bestPerMeetup.values()) : 0;

    return { growthLevel, attendanceCount };
  }

  private serialize(event: {
    id: string;
    name: string;
    type: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    requiredGrowthLevel: number | null;
    requiredAttendanceCount: number | null;
    siteUrl: string;
  }) {
    return {
      id: event.id,
      name: event.name,
      type: event.type,
      status: event.status,
      start_date: event.startDate,
      end_date: event.endDate,
      required_growth_level: event.requiredGrowthLevel,
      required_attendance_count: event.requiredAttendanceCount,
      site_url: event.siteUrl,
    };
  }
}
