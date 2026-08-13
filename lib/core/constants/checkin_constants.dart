/// 체크인(GPS 출석) 관련 상수.
///
/// 값은 "피움 API 기획서 v1.0" 6장(GPS 체크인 API)의 규격을 따른다.
class CheckinConstants {
  CheckinConstants._();

  /// 모임 고정 장소 기준 체크인 인정 반경(미터).
  static const double meetupCheckinRadiusMeters = 100.0;

  /// 퇴장 체크인(출석 인정)을 위한 최소 체류 시간(초). 1시간.
  static const int minimumStaySeconds = 3600;

  /// 체류 중 클라이언트가 서버에 위치를 갱신하는 주기(초).
  static const int locationPingIntervalSeconds = 30;
}
