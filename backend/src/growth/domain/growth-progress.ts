import {
  LARGE_GROUP_STAGE_THRESHOLDS,
  SMALL_GROUP_STAGE_THRESHOLDS,
} from './growth-stage-thresholds';
import { LargeGroupMetrics, SmallGroupMetrics } from './growth-stage-resolver';

export interface GrowthProgress {
  nextLevel: number | null;
  progressPct: number;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function metricProgress(current: number, prev: number, next: number): number {
  if (next === prev) return current >= next ? 1 : 0;
  return clamp01((current - prev) / (next - prev));
}

/// 다음 단계까지의 진행률. 3개 지표 중 가장 뒤처진(병목) 지표 기준으로
/// 계산한다 — 셋 다 충족해야 승급하므로 가장 느린 지표가 진행률을 결정한다.
export function computeSmallGroupProgress(
  metrics: SmallGroupMetrics,
  currentLevel: number,
): GrowthProgress {
  if (currentLevel >= SMALL_GROUP_STAGE_THRESHOLDS.length) {
    return { nextLevel: null, progressPct: 100 };
  }
  const prev =
    currentLevel === 0
      ? { attendanceRate: 0, streakCount: 0, totalCount: 0 }
      : SMALL_GROUP_STAGE_THRESHOLDS[currentLevel - 1];
  const next = SMALL_GROUP_STAGE_THRESHOLDS[currentLevel];

  const progress = Math.min(
    metricProgress(metrics.attendanceRate, prev.attendanceRate, next.attendanceRate),
    metricProgress(metrics.streakCount, prev.streakCount, next.streakCount),
    metricProgress(metrics.totalCount, prev.totalCount, next.totalCount),
  );
  return { nextLevel: next.level, progressPct: Math.round(progress * 100) };
}

export function computeLargeGroupProgress(
  metrics: LargeGroupMetrics,
  currentLevel: number,
): GrowthProgress {
  if (currentLevel >= LARGE_GROUP_STAGE_THRESHOLDS.length) {
    return { nextLevel: null, progressPct: 100 };
  }
  const prev =
    currentLevel === 0
      ? { cumulativeMembers: 0, meetingCount: 0, attendanceRate: 0 }
      : LARGE_GROUP_STAGE_THRESHOLDS[currentLevel - 1];
  const next = LARGE_GROUP_STAGE_THRESHOLDS[currentLevel];

  const progress = Math.min(
    metricProgress(metrics.cumulativeMembers, prev.cumulativeMembers, next.cumulativeMembers),
    metricProgress(metrics.meetingCount, prev.meetingCount, next.meetingCount),
    metricProgress(metrics.attendanceRate, prev.attendanceRate, next.attendanceRate),
  );
  return { nextLevel: next.level, progressPct: Math.round(progress * 100) };
}
