/// 백엔드 API 관련 상수.
class ApiConstants {
  ApiConstants._();

  /// 로컬 개발 백엔드 기본 주소.
  /// - Android 에뮬레이터: 호스트의 localhost는 10.0.2.2로 접근한다(기본값).
  /// - 웹/iOS 시뮬레이터/실기기 등에서는 빌드 시
  ///   `--dart-define=API_BASE_URL=http://localhost:3000/v1`처럼 재정의한다.
  /// 실제 배포 시 `https://api.pium.app/v1`(문서 Base URL)로 교체한다.
  static const String devBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/v1',
  );
}
