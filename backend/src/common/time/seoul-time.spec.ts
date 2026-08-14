import { seoulDateKey, seoulStartOfDay, seoulYearMonth, seoulYearMonthRange } from './seoul-time';

describe('seoulStartOfDay', () => {
  it('KST 오전 9시(=UTC 0시)는 당일 KST 자정으로 계산된다', () => {
    const result = seoulStartOfDay(new Date('2026-01-15T00:00:00Z')); // KST 09:00
    expect(result.toISOString()).toBe('2026-01-14T15:00:00.000Z'); // KST 2026-01-15 00:00
  });

  it('KST 자정 직전(UTC 14:59)은 전날로 계산된다', () => {
    const result = seoulStartOfDay(new Date('2026-01-14T14:59:00Z')); // KST 01-14 23:59
    expect(result.toISOString()).toBe('2026-01-13T15:00:00.000Z');
  });
});

describe('seoulYearMonth', () => {
  it('UTC로는 전날이어도 KST로는 다음날/다음달일 수 있다', () => {
    // UTC 2026-01-31 15:30 = KST 2026-02-01 00:30
    const result = seoulYearMonth(new Date('2026-01-31T15:30:00Z'));
    expect(result).toEqual({ year: 2026, month: 2 });
  });
});

describe('seoulDateKey', () => {
  it('KST 자정 인스턴트를 그대로 KST 달력일 문자열로 되돌린다 (seoulStartOfDay와 왕복)', () => {
    const kstMidnight = seoulStartOfDay(new Date('2026-03-10T05:00:00Z')); // KST 03-10 14:00
    expect(seoulDateKey(kstMidnight)).toBe('2026-03-10');
  });

  it('UTC 자정 값을 그대로 슬라이스하면 하루가 밀리지만 seoulDateKey는 정확하다', () => {
    const instant = new Date('2026-01-14T15:00:00.000Z'); // KST 2026-01-15 00:00
    expect(instant.toISOString().slice(0, 10)).toBe('2026-01-14');
    expect(seoulDateKey(instant)).toBe('2026-01-15');
  });
});

describe('seoulYearMonthRange', () => {
  it('해당 월의 KST 시작~다음달 시작 직전까지의 범위를 반환한다', () => {
    const { start, end } = seoulYearMonthRange(2026, 2);
    expect(start.toISOString()).toBe('2026-01-31T15:00:00.000Z'); // KST 2026-02-01 00:00
    expect(end.toISOString()).toBe('2026-02-28T15:00:00.000Z'); // KST 2026-03-01 00:00
  });
});
