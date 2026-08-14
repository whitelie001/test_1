/// 문서 7절 `GET /users/me/pium-score`의 `breakdown:{attendance,streak,events}`
/// 정확한 산출 공식이 명시돼 있지 않아 잠정 채택한 계산이다.
/// - attendance: 완료된 체크인의 `pium_score_earned` 합산(전체 기간)
/// - streak: 모임 전체를 넘나드는 사용자 단위 연속 출석일수 × 보너스
/// - events: 이벤트 참여 성과 추적 기능이 이 스코프에 없어 항상 0
export const STREAK_BONUS_PER_DAY = 2;

export interface UserPiumScoreInput {
  attendanceScoreAllTime: number;
  attendanceScoreThisMonth: number;
  streakDays: number;
}

export interface UserPiumScoreResult {
  totalScore: number;
  thisMonth: number;
  breakdown: { attendance: number; streak: number; events: number };
}

export function computeUserPiumScore(input: UserPiumScoreInput): UserPiumScoreResult {
  const streakScore = input.streakDays * STREAK_BONUS_PER_DAY;
  const eventScore = 0;

  return {
    totalScore: input.attendanceScoreAllTime + streakScore + eventScore,
    thisMonth: input.attendanceScoreThisMonth,
    breakdown: {
      attendance: input.attendanceScoreAllTime,
      streak: streakScore,
      events: eventScore,
    },
  };
}
