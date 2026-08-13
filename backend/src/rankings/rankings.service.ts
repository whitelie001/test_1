import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrowthService } from '../growth/growth.service';
import { seoulYearMonth } from '../common/time/seoul-time';

interface ScoredMeetup {
  meetupId: string;
  name: string;
  score: number;
  growthLevel: number;
}

/// 문서 8장 랭킹 API. Redis 사전 집계 없이, 요청마다 GrowthService의
/// 복합 점수를 모든 대상 모임에 대해 계산해 정렬하는 방식으로 구현했다
/// (MVP 단계에서는 정확성/단순성을 우선 — 모임 수가 많아지면 Redis
/// ZSET 사전 집계로 교체할 수 있도록 GrowthService.computeScore를 분리해둠).
///
/// `change`(순위 변동) 필드는 문서에 있지만, 월별 스냅샷을 비교하려면
/// 별도의 정산 배치(자정/월말 크론)가 필요해 이 단계에서는 항상 0을
/// 반환한다 — 추측으로 채우지 않고 명시적으로 미구현 상태를 표시.
@Injectable()
export class RankingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly growthService: GrowthService,
  ) {}

  async national(sport: string | undefined, page: number, limit = 20) {
    const { rankings } = await this.rank({ sport }, page, limit);
    return { rankings, month: this.currentMonthLabel() };
  }

  async sport(sport: string, page: number, limit = 20) {
    const { rankings } = await this.rank({ sport }, page, limit);
    return { rankings, sport };
  }

  async regional(region: string, sport: string | undefined) {
    // "서울-마포구" 형식. region_sido/region_gungu는 카카오맵 역지오코딩이
    // 없어 현재 항상 null이라, 이 필터는 지금은 항상 빈 결과를 반환한다.
    const [regionSido, regionGungu] = region.split('-');
    const { rankings } = await this.rank({ sport, regionSido, regionGungu }, 1, 100);
    return { rankings, region };
  }

  async myMeetup(userId: string) {
    const memberships = await this.prisma.meetupMember.findMany({
      where: { userId, leftAt: null },
      select: { meetupId: true },
    });
    const myMeetupIds = new Set(memberships.map((m) => m.meetupId));
    if (myMeetupIds.size === 0) return { meetups: [] };

    const all = await this.computeAllScores({});
    all.sort((a, b) => b.score - a.score);

    const meetups = all
      .map((m, index) => ({ ...m, rank: index + 1 }))
      .filter((m) => myMeetupIds.has(m.meetupId))
      .map((m) => ({
        meetup_id: m.meetupId,
        name: m.name,
        national_rank: m.rank,
        score: m.score,
        change: 0,
      }));

    return { meetups };
  }

  private async rank(
    filter: { sport?: string; regionSido?: string; regionGungu?: string },
    page: number,
    limit: number,
  ) {
    const all = await this.computeAllScores(filter);
    all.sort((a, b) => b.score - a.score);
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);

    return {
      rankings: paged.map((m, index) => ({
        rank: start + index + 1,
        meetup_id: m.meetupId,
        name: m.name,
        score: m.score,
        growth_level: m.growthLevel,
        change: 0,
      })),
    };
  }

  private async computeAllScores(filter: {
    sport?: string;
    regionSido?: string;
    regionGungu?: string;
  }): Promise<ScoredMeetup[]> {
    const meetups = await this.prisma.meetup.findMany({
      where: {
        sport: filter.sport,
        regionSido: filter.regionSido,
        regionGungu: filter.regionGungu,
      },
    });

    const results: ScoredMeetup[] = [];
    for (const meetup of meetups) {
      const { score, growthLevel } = await this.growthService.computeScore(meetup.id);
      results.push({ meetupId: meetup.id, name: meetup.name, score, growthLevel });
    }
    return results;
  }

  private currentMonthLabel(): string {
    const { year, month } = seoulYearMonth(new Date());
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}
