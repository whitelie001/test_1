import { computeUserPiumScore, STREAK_BONUS_PER_DAY } from './user-pium-score';

describe('computeUserPiumScore', () => {
  it('출석/연속/이달치를 합산해 total_score와 breakdown을 계산한다', () => {
    const result = computeUserPiumScore({
      attendanceScoreAllTime: 40,
      attendanceScoreThisMonth: 12,
      streakDays: 5,
    });

    expect(result.breakdown.attendance).toBe(40);
    expect(result.breakdown.streak).toBe(5 * STREAK_BONUS_PER_DAY);
    expect(result.breakdown.events).toBe(0);
    expect(result.totalScore).toBe(40 + 5 * STREAK_BONUS_PER_DAY);
    expect(result.thisMonth).toBe(12);
  });

  it('활동이 전혀 없으면 모든 값이 0', () => {
    const result = computeUserPiumScore({
      attendanceScoreAllTime: 0,
      attendanceScoreThisMonth: 0,
      streakDays: 0,
    });
    expect(result.totalScore).toBe(0);
    expect(result.thisMonth).toBe(0);
  });
});
