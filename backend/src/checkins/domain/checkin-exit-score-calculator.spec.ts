import { computeCheckinScore } from './checkin-exit-score-calculator';

describe('computeCheckinScore', () => {
  it('최소 체류(1시간) 미만이면 0점', () => {
    expect(computeCheckinScore(3599)).toBe(0);
  });

  it('정확히 1시간(3600초)이면 5점', () => {
    expect(computeCheckinScore(3600)).toBe(5);
  });

  it('90분(5400초)이면 8점 — 문서 6.3절 응답 예시와 일치', () => {
    expect(computeCheckinScore(5400)).toBe(8);
  });

  it('2시간(7200초)이면 11점', () => {
    expect(computeCheckinScore(7200)).toBe(11);
  });
});
