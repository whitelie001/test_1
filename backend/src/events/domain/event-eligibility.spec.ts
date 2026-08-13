import { resolveEventEligibility } from './event-eligibility';

describe('resolveEventEligibility', () => {
  it('두 조건 모두 충족하면 eligible', () => {
    const result = resolveEventEligibility(
      { requiredGrowthLevel: 2, requiredAttendanceCount: 10 },
      { growthLevel: 3, attendanceCount: 15 },
    );
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('성장 단계 미달이면 reasons에 사유가 담기고 eligible=false', () => {
    const result = resolveEventEligibility(
      { requiredGrowthLevel: 2, requiredAttendanceCount: null },
      { growthLevel: 1, attendanceCount: 100 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(1);
  });

  it('출석 횟수 미달이면 reasons에 사유가 담기고 eligible=false', () => {
    const result = resolveEventEligibility(
      { requiredGrowthLevel: null, requiredAttendanceCount: 10 },
      { growthLevel: 5, attendanceCount: 3 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(1);
  });

  it('두 조건 모두 미달이면 사유가 2개 담긴다', () => {
    const result = resolveEventEligibility(
      { requiredGrowthLevel: 5, requiredAttendanceCount: 10 },
      { growthLevel: 0, attendanceCount: 0 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(2);
  });

  it('요구 조건이 둘 다 null이면 항상 eligible', () => {
    const result = resolveEventEligibility(
      { requiredGrowthLevel: null, requiredAttendanceCount: null },
      { growthLevel: 0, attendanceCount: 0 },
    );
    expect(result.eligible).toBe(true);
  });

  it('경계값(정확히 요구치와 동일)은 eligible', () => {
    const result = resolveEventEligibility(
      { requiredGrowthLevel: 3, requiredAttendanceCount: 10 },
      { growthLevel: 3, attendanceCount: 10 },
    );
    expect(result.eligible).toBe(true);
  });
});
