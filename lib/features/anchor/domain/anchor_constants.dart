/// 팀장 앵커 모드 관련 상수. "피움 API 기획서 v1.0" 6.2절 기준.
class AnchorConstants {
  AnchorConstants._();

  static const double anchorRadiusMeters = 30.0;
  static const int gracePeriodSeconds = 30;
  static const int validWindowMinutes = 30;
  static const int pingIntervalSeconds = 10;
}
