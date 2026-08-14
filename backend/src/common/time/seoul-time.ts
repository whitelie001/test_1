/// 한국 표준시(UTC+9, 서머타임 없음) 기준 날짜 유틸.
/// 문서의 "당일 자정 초기화"(6.1절), 월별 출석 조회(6.3절) 등 날짜 경계가
/// 중요한 로직에서 서버 시스템 타임존과 무관하게 항상 KST 기준으로 계산한다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/// 주어진 시각을 KST 자정(00:00) 기준 `Date`(UTC로 저장되는 달력일)로 변환한다.
export function seoulStartOfDay(date: Date): Date {
  const kstMs = date.getTime() + KST_OFFSET_MS;
  const kstDate = new Date(kstMs);
  const startOfDayKstMs = Date.UTC(
    kstDate.getUTCFullYear(),
    kstDate.getUTCMonth(),
    kstDate.getUTCDate(),
  );
  return new Date(startOfDayKstMs - KST_OFFSET_MS);
}

export function seoulYearMonthRange(
  year: number,
  month: number,
): { start: Date; end: Date } {
  const startUtcMs = Date.UTC(year, month - 1, 1) - KST_OFFSET_MS;
  const endUtcMs = Date.UTC(year, month, 1) - KST_OFFSET_MS;
  return { start: new Date(startUtcMs), end: new Date(endUtcMs) };
}

/// 주어진 시각을 KST 기준 연/월로 변환한다(월은 1~12).
export function seoulYearMonth(date: Date): { year: number; month: number } {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  return { year: kstDate.getUTCFullYear(), month: kstDate.getUTCMonth() + 1 };
}

/// 주어진 시각을 KST 기준 `YYYY-MM-DD` 문자열로 변환한다. (주의:
/// `seoulStartOfDay(date).toISOString().slice(0,10)`은 KST 자정을 UTC로
/// 표현하는 과정에서 하루 전 날짜가 나올 수 있어 쓰지 않는다 — 항상 이
/// 함수로 KST 달력일을 구한다.)
export function seoulDateKey(date: Date): string {
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  const y = kstDate.getUTCFullYear();
  const m = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kstDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
