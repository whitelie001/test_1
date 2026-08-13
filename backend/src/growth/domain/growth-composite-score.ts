import {
  LARGE_GROUP_STAGE_THRESHOLDS,
  SMALL_GROUP_STAGE_THRESHOLDS,
} from './growth-stage-thresholds';

/// 랭킹/피움 점수용 가중치 복합 점수. 문서 1.3절의 가중치를 그대로 쓰되,
/// 정규화 방법은 문서에 없어 잠정 채택: 각 지표를 7단계(최고단계) 임계값
/// 대비 0~1로 정규화한 뒤 가중합 → 0~100점.
const MAX_SMALL = SMALL_GROUP_STAGE_THRESHOLDS[SMALL_GROUP_STAGE_THRESHOLDS.length - 1];
const MAX_LARGE = LARGE_GROUP_STAGE_THRESHOLDS[LARGE_GROUP_STAGE_THRESHOLDS.length - 1];

function norm(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(value / max, 1);
}

export interface SmallGroupScoreInputs {
  attendanceRate: number; // 0~1
  streakCount: number;
  totalCount: number;
  fillRate: number; // 0~1, currentMembers/maxMembers
}

export function computeSmallGroupScore(inputs: SmallGroupScoreInputs): number {
  const score =
    Math.min(inputs.attendanceRate, 1) * 0.4 +
    norm(inputs.streakCount, MAX_SMALL.streakCount) * 0.3 +
    norm(inputs.totalCount, MAX_SMALL.totalCount) * 0.2 +
    Math.min(inputs.fillRate, 1) * 0.1;
  return Math.round(score * 100);
}

export interface LargeGroupScoreInputs {
  cumulativeMembers: number;
  meetingCount: number;
  attendanceRate: number; // 0~1
  newInflowRate: number; // 0~1
}

export function computeLargeGroupScore(inputs: LargeGroupScoreInputs): number {
  const score =
    norm(inputs.cumulativeMembers, MAX_LARGE.cumulativeMembers) * 0.35 +
    norm(inputs.meetingCount, MAX_LARGE.meetingCount) * 0.3 +
    Math.min(inputs.attendanceRate, 1) * 0.25 +
    Math.min(inputs.newInflowRate, 1) * 0.1;
  return Math.round(score * 100);
}
