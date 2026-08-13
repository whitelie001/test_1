import { resolveLargeGroupStage, resolveSmallGroupStage } from './growth-stage-resolver';

describe('resolveSmallGroupStage', () => {
  it('아무 조건도 못 채우면 씨앗(0단계)', () => {
    expect(resolveSmallGroupStage({ attendanceRate: 0, streakCount: 0, totalCount: 0 })).toEqual({
      level: 0,
      name: '씨앗',
      icon: '🌱',
    });
  });

  it('2단계(새싹) 조건 경계값 — 정확히 충족하면 승급', () => {
    const stage = resolveSmallGroupStage({ attendanceRate: 0.6, streakCount: 2, totalCount: 5 });
    expect(stage.level).toBe(1);
    expect(stage.name).toBe('새싹');
  });

  it('세 조건 중 하나라도 미달이면 승급하지 않는다', () => {
    const stage = resolveSmallGroupStage({ attendanceRate: 0.6, streakCount: 2, totalCount: 4 });
    expect(stage.level).toBe(0);
  });

  it('최고 단계(울창한숲) 조건 충족', () => {
    const stage = resolveSmallGroupStage({ attendanceRate: 0.95, streakCount: 25, totalCount: 120 });
    expect(stage.level).toBe(6);
    expect(stage.name).toBe('울창한숲');
  });

  it('중간 단계 조건만 충족하면 그 단계까지만', () => {
    const stage = resolveSmallGroupStage({ attendanceRate: 0.72, streakCount: 6, totalCount: 26 });
    expect(stage.level).toBe(3); // 나무(3단계) 조건은 충족, 큰나무(4단계, streak 9)는 미달
  });
});

describe('resolveLargeGroupStage', () => {
  it('아무 조건도 못 채우면 씨앗', () => {
    expect(
      resolveLargeGroupStage({ cumulativeMembers: 0, meetingCount: 0, attendanceRate: 0 }),
    ).toEqual({ level: 0, name: '씨앗', icon: '🌱' });
  });

  it('2단계(새싹) 조건 경계값', () => {
    const stage = resolveLargeGroupStage({
      cumulativeMembers: 50,
      meetingCount: 4,
      attendanceRate: 0.5,
    });
    expect(stage.level).toBe(1);
  });

  it('최고 단계 조건 충족', () => {
    const stage = resolveLargeGroupStage({
      cumulativeMembers: 2000,
      meetingCount: 90,
      attendanceRate: 0.75,
    });
    expect(stage.level).toBe(6);
  });
});
