/// 체크인 지속 시간을 모임 성장 포인트로 환산하는 순수 계산 로직.
///
/// 규칙(사용자 확정): 체크인 후 첫 2시간은 시간당 1.5포인트, 이후 시간은
/// 시간당 1포인트. 예) 3시간 체크인 = 2h*1.5 + 1h*1 = 4포인트.
///
/// 주의: 이 로직은 Cloud Functions(TypeScript)의 `checkOut` 함수에도 동일하게
/// 구현되어 있다. 이 파일은 클라이언트 미리보기용이며, 포인트의 실제 신뢰
/// 원천(source of truth)은 서버 측 계산이다. 두 구현은 공유하지 않고 동일한
/// 테스트 케이스로 정합성을 검증한다.
class GrowthPointCalculator {
  GrowthPointCalculator._();

  static const double firstTierHours = 2.0;
  static const double firstTierRatePerHour = 1.5;
  static const double secondTierRatePerHour = 1.0;

  /// [duration]에 해당하는 성장 포인트를 계산한다.
  static double calculate(Duration duration) {
    final hours = duration.inSeconds / 3600.0;
    if (hours <= 0) return 0;
    if (hours <= firstTierHours) {
      return hours * firstTierRatePerHour;
    }
    final firstTierPoints = firstTierHours * firstTierRatePerHour;
    final remainingHours = hours - firstTierHours;
    return firstTierPoints + remainingHours * secondTierRatePerHour;
  }
}
