/// 체크인(GPS 참여 확인) 관련 상수.
class CheckinConstants {
  CheckinConstants._();

  /// 체크인 인정 반경(미터). 사용자가 실외 GPS 오차(보통 5~20m)를 인지한 상태로
  /// 2m를 그대로 유지하기로 확정한 값 — 실기기 테스트에서 간헐적 실패가
  /// 발생할 수 있음을 알고 있는 리스크이며, 값 자체는 여기서만 바꾸면 된다.
  static const double checkInRadiusMeters = 2.0;
}
