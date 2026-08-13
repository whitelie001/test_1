/// 백엔드 API 관련 상수.
class ApiConstants {
  ApiConstants._();

  /// 로컬 개발 백엔드 기본 주소.
  /// - Android 에뮬레이터: 호스트의 localhost는 10.0.2.2로 접근한다.
  /// - iOS 시뮬레이터 / 실기기: 환경에 맞게 교체 필요.
  /// 실제 배포 시 `https://api.pium.app/v1`(문서 Base URL)로 교체한다.
  static const String devBaseUrl = 'http://10.0.2.2:3000/v1';
}
