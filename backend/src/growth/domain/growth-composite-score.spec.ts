import { computeLargeGroupScore, computeSmallGroupScore } from './growth-composite-score';

describe('computeSmallGroupScore', () => {
  it('모든 지표가 0이면 0점', () => {
    expect(
      computeSmallGroupScore({ attendanceRate: 0, streakCount: 0, totalCount: 0, fillRate: 0 }),
    ).toBe(0);
  });

  it('모든 지표가 7단계(최고) 임계값 이상이면 100점', () => {
    expect(
      computeSmallGroupScore({
        attendanceRate: 1,
        streakCount: 100,
        totalCount: 200,
        fillRate: 1,
      }),
    ).toBe(100);
  });

  it('가중치(40/30/20/10)가 반영된다 — 출석률만 100%면 40점', () => {
    expect(
      computeSmallGroupScore({ attendanceRate: 1, streakCount: 0, totalCount: 0, fillRate: 0 }),
    ).toBe(40);
  });
});

describe('computeLargeGroupScore', () => {
  it('가중치(35/30/25/10)가 반영된다 — 누적인원만 최대면 35점', () => {
    expect(
      computeLargeGroupScore({
        cumulativeMembers: 1800,
        meetingCount: 0,
        attendanceRate: 0,
        newInflowRate: 0,
      }),
    ).toBe(35);
  });

  it('모든 지표 최대면 100점', () => {
    expect(
      computeLargeGroupScore({
        cumulativeMembers: 5000,
        meetingCount: 200,
        attendanceRate: 1,
        newInflowRate: 1,
      }),
    ).toBe(100);
  });
});
