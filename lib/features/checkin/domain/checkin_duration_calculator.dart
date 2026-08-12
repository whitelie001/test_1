/// 체크인/체크아웃 시각으로부터 실제 인정 참여 시간을 계산하는 순수 로직.
///
/// 체크인 시각이 세션 시작 이전이면 세션 시작 시각으로, 체크아웃 시각이
/// 세션 종료 이후면 세션 종료 시각으로 각각 클램프한다(세션 범위를 벗어난
/// 시간은 포인트로 인정하지 않기 위함).
class CheckinDurationCalculator {
  CheckinDurationCalculator._();

  static Duration calculate({
    required DateTime checkinAt,
    required DateTime checkoutAt,
    required DateTime sessionStart,
    required DateTime sessionEnd,
  }) {
    final start = checkinAt.isBefore(sessionStart) ? sessionStart : checkinAt;
    final end = checkoutAt.isAfter(sessionEnd) ? sessionEnd : checkoutAt;
    if (end.isBefore(start)) return Duration.zero;
    return end.difference(start);
  }
}
