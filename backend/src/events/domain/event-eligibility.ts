export interface EventRequirement {
  requiredGrowthLevel: number | null;
  requiredAttendanceCount: number | null;
}

export interface UserEventStanding {
  growthLevel: number;
  attendanceCount: number;
}

export interface EventEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/// 이벤트 참가 자격을 판정한다. 요구 조건이 null이면 해당 항목은 검사하지
/// 않는다. 두 조건 모두 충족해야 eligible.
export function resolveEventEligibility(
  requirement: EventRequirement,
  standing: UserEventStanding,
): EventEligibilityResult {
  const reasons: string[] = [];

  if (
    requirement.requiredGrowthLevel !== null &&
    standing.growthLevel < requirement.requiredGrowthLevel
  ) {
    reasons.push(
      `성장 단계 ${requirement.requiredGrowthLevel + 1} 이상이 필요합니다 (현재 ${standing.growthLevel + 1})`,
    );
  }

  if (
    requirement.requiredAttendanceCount !== null &&
    standing.attendanceCount < requirement.requiredAttendanceCount
  ) {
    reasons.push(
      `누적 출석 ${requirement.requiredAttendanceCount}회 이상이 필요합니다 (현재 ${standing.attendanceCount}회)`,
    );
  }

  return { eligible: reasons.length === 0, reasons };
}
