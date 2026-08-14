import { computeCurrentStreakDays } from './attendance-streak';

describe('computeCurrentStreakDays', () => {
  it('오늘까지 3일 연속 출석이면 3', () => {
    const today = new Date('2026-03-10T09:00:00.000Z');
    const dates = new Set(['2026-03-10', '2026-03-09', '2026-03-08']);
    expect(computeCurrentStreakDays(dates, today)).toBe(3);
  });

  it('오늘은 아직 출석 전이지만 어제까지 연속이면 어제부터 센다', () => {
    const today = new Date('2026-03-10T09:00:00.000Z');
    const dates = new Set(['2026-03-09', '2026-03-08']);
    expect(computeCurrentStreakDays(dates, today)).toBe(2);
  });

  it('오늘도 어제도 출석이 없으면 0(끊김)', () => {
    const today = new Date('2026-03-10T09:00:00.000Z');
    const dates = new Set(['2026-03-01']);
    expect(computeCurrentStreakDays(dates, today)).toBe(0);
  });

  it('출석 기록이 아예 없으면 0', () => {
    const today = new Date('2026-03-10T09:00:00.000Z');
    expect(computeCurrentStreakDays(new Set(), today)).toBe(0);
  });

  it('중간에 하루라도 비면 그 이전 연속 구간은 세지 않는다', () => {
    const today = new Date('2026-03-10T09:00:00.000Z');
    const dates = new Set(['2026-03-10', '2026-03-08', '2026-03-07']);
    expect(computeCurrentStreakDays(dates, today)).toBe(1);
  });
});
