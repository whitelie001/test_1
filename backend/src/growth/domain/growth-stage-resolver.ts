import {
  LARGE_GROUP_STAGE_THRESHOLDS,
  SEED_STAGE,
  SMALL_GROUP_STAGE_THRESHOLDS,
} from './growth-stage-thresholds';

export interface GrowthStage {
  level: number;
  name: string;
  icon: string;
}

export interface SmallGroupMetrics {
  attendanceRate: number;
  streakCount: number;
  totalCount: number;
}

export interface LargeGroupMetrics {
  cumulativeMembers: number;
  meetingCount: number;
  attendanceRate: number;
}

/// 임계값을 내림차순으로 훑어 "모든 조건을 만족하는" 가장 높은 단계를 찾는다.
/// 어느 것도 만족 못 하면 씨앗(0단계).
export function resolveSmallGroupStage(metrics: SmallGroupMetrics): GrowthStage {
  for (let i = SMALL_GROUP_STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    const th = SMALL_GROUP_STAGE_THRESHOLDS[i];
    if (
      metrics.attendanceRate >= th.attendanceRate &&
      metrics.streakCount >= th.streakCount &&
      metrics.totalCount >= th.totalCount
    ) {
      return { level: th.level, name: th.name, icon: th.icon };
    }
  }
  return { ...SEED_STAGE };
}

export function resolveLargeGroupStage(metrics: LargeGroupMetrics): GrowthStage {
  for (let i = LARGE_GROUP_STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    const th = LARGE_GROUP_STAGE_THRESHOLDS[i];
    if (
      metrics.cumulativeMembers >= th.cumulativeMembers &&
      metrics.meetingCount >= th.meetingCount &&
      metrics.attendanceRate >= th.attendanceRate
    ) {
      return { level: th.level, name: th.name, icon: th.icon };
    }
  }
  return { ...SEED_STAGE };
}
