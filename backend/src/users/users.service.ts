import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { seoulDateKey, seoulYearMonth, seoulYearMonthRange } from '../common/time/seoul-time';
import { computeCurrentStreakDays } from './domain/attendance-streak';
import { computeUserPiumScore } from './domain/user-pium-score';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();

    const [pium_score, badges, totalCheckins, meetupsJoined] = await Promise.all([
      this.getPiumScore(userId),
      this.getBadges(userId),
      this.prisma.checkin.count({ where: { userId, status: 'completed' } }),
      this.prisma.meetupMember.count({ where: { userId, leftAt: null } }),
    ]);

    return {
      id: user.id,
      nickname: user.nickname,
      profile_image: user.profileImageUrl,
      favorite_sports: user.favoriteSports,
      region: { sido: user.regionSido, gungu: user.regionGungu },
      pium_score,
      badges: badges.badges,
      activity_summary: { total_checkins: totalCheckins, meetups_joined: meetupsJoined },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nickname !== undefined ? { nickname: dto.nickname } : {}),
        ...(dto.profile_image !== undefined ? { profileImageUrl: dto.profile_image } : {}),
        ...(dto.sports !== undefined ? { favoriteSports: dto.sports } : {}),
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      profile_image: user.profileImageUrl,
      favorite_sports: user.favoriteSports,
    };
  }

  async getStats(userId: string, yearParam: number | undefined, monthParam: number | undefined) {
    const defaults = seoulYearMonth(new Date());
    const year = yearParam ?? defaults.year;
    const month = monthParam ?? defaults.month;
    const { start, end } = seoulYearMonthRange(year, month);

    const checkins = await this.prisma.checkin.findMany({
      where: { userId, status: 'completed', date: { gte: start, lt: end } },
      include: { session: { include: { meetup: { select: { sport: true } } } } },
    });

    const attendedDates = new Set(checkins.map((c) => seoulDateKey(c.date)));
    const heatmap = [...attendedDates].sort().map((date) => ({ date, attended: true }));

    const sportCounts = new Map<string, number>();
    for (const c of checkins) {
      const sport = c.session.meetup.sport;
      sportCounts.set(sport, (sportCounts.get(sport) ?? 0) + 1);
    }
    const total = checkins.length;
    const sportRatio = Object.fromEntries(
      [...sportCounts.entries()].map(([sport, count]) => [
        sport,
        total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      ]),
    );

    return { heatmap, sport_ratio: sportRatio };
  }

  /// 문서 5.4절 "배지" 조회. 배지 부여(적립) 로직은 문서에 조건이 명시돼
  /// 있지 않아 이 스코프엔 없다 — 현재는 조회 API만 제공하며, 아직 아무
  /// 배지도 부여되지 않으므로 항상 빈 배열을 반환하는 게 정상이다.
  async getBadges(userId: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });
    return {
      badges: userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        icon: ub.badge.icon,
        earned_at: ub.earnedAt,
      })),
    };
  }

  async getPiumScore(userId: string) {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = seoulYearMonthRange(
      seoulYearMonth(now).year,
      seoulYearMonth(now).month,
    );

    const [allTimeAgg, monthAgg, recentCheckins] = await Promise.all([
      this.prisma.checkin.aggregate({
        where: { userId, status: 'completed' },
        _sum: { piumScoreEarned: true },
      }),
      this.prisma.checkin.aggregate({
        where: { userId, status: 'completed', date: { gte: monthStart, lt: monthEnd } },
        _sum: { piumScoreEarned: true },
      }),
      this.prisma.checkin.findMany({
        where: { userId, status: 'completed' },
        select: { date: true },
        orderBy: { date: 'desc' },
        take: 60,
      }),
    ]);

    const attendedDateKeys = new Set(recentCheckins.map((c) => seoulDateKey(c.date)));
    const streakDays = computeCurrentStreakDays(attendedDateKeys, now);

    const result = computeUserPiumScore({
      attendanceScoreAllTime: Number(allTimeAgg._sum.piumScoreEarned ?? 0),
      attendanceScoreThisMonth: Number(monthAgg._sum.piumScoreEarned ?? 0),
      streakDays,
    });

    return {
      total_score: result.totalScore,
      this_month: result.thisMonth,
      breakdown: result.breakdown,
    };
  }
}
