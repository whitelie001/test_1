/// 여러 모임을 넘나드는 사용자 단위 연속 출석일수를 계산한다(성장 시스템의
/// 모임 단위 streakCount와 별개 개념). [attendedDateKeys]는 완료된 체크인이
/// 하루라도 있었던 날짜(`YYYY-MM-DD`, KST 기준) 집합이다.
///
/// 오늘 아직 출석이 없다면 "끊긴 것"으로 보지 않고 어제부터 거슬러 올라가며
/// 계산한다(오늘은 아직 하루가 끝나지 않았으므로).
export function computeCurrentStreakDays(attendedDateKeys: ReadonlySet<string>, today: Date): number {
  const cursor = new Date(today);
  if (!attendedDateKeys.has(toDateKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (attendedDateKeys.has(toDateKey(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
