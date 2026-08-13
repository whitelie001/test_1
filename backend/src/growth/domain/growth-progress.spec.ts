import { computeSmallGroupProgress, computeLargeGroupProgress } from './growth-progress';

describe('computeSmallGroupProgress', () => {
  it('0단계에서 아무 활동도 없으면 진행률 0%, 다음 단계는 1', () => {
    const { nextLevel, progressPct } = computeSmallGroupProgress(
      { attendanceRate: 0, streakCount: 0, totalCount: 0 },
      0,
    );
    expect(nextLevel).toBe(1);
    expect(progressPct).toBe(0);
  });

  it('0단계에서 절반만큼 채우면 진행률 약 50%', () => {
    // 1단계 조건: attendance 0.6 / streak 2 / total 5. 정확히 절반씩 채움.
    const { progressPct } = computeSmallGroupProgress(
      { attendanceRate: 0.3, streakCount: 1, totalCount: 2.5 },
      0,
    );
    expect(progressPct).toBe(50);
  });

  it('세 지표 중 가장 뒤처진 지표가 진행률을 결정한다(병목)', () => {
    // attendance/total은 거의 다 채웠지만 streak만 0
    const { progressPct } = computeSmallGroupProgress(
      { attendanceRate: 0.6, streakCount: 0, totalCount: 5 },
      0,
    );
    expect(progressPct).toBe(0);
  });

  it('최고 단계(6)면 다음 단계 없이 100%', () => {
    const { nextLevel, progressPct } = computeSmallGroupProgress(
      { attendanceRate: 1, streakCount: 100, totalCount: 500 },
      6,
    );
    expect(nextLevel).toBeNull();
    expect(progressPct).toBe(100);
  });
});

describe('computeLargeGroupProgress', () => {
  it('중간 단계에서 다음 단계 임계값 기준으로 진행률을 계산한다', () => {
    // 3단계(나무 300/20/0.6) -> 4단계(큰나무 600/35/0.6) 진행 중
    const { nextLevel, progressPct } = computeLargeGroupProgress(
      { cumulativeMembers: 450, meetingCount: 27.5, attendanceRate: 0.6 },
      3,
    );
    expect(nextLevel).toBe(4);
    expect(progressPct).toBe(50);
  });
});
