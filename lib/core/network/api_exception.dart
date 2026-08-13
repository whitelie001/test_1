/// 백엔드 공통 에러 응답(`{success:false, error:{code,message}}`)을 표현하는 예외.
///
/// "피움 API 기획서 v1.0" 12장의 에러 코드 카탈로그와 1:1 대응한다. UI는
/// [code]로 분기해 로컬라이즈된 안내를 보여줄 수 있다.
class PiumApiException implements Exception {
  const PiumApiException(this.code, this.message);

  final String code;
  final String message;

  factory PiumApiException.fromJson(Map<String, dynamic> json) {
    return PiumApiException(
      json['code'] as String? ?? 'INTERNAL_ERROR',
      json['message'] as String? ?? '알 수 없는 오류가 발생했습니다',
    );
  }

  @override
  String toString() => 'PiumApiException($code: $message)';
}

/// 네트워크 자체가 실패한 경우(서버 무응답, 타임아웃, 연결 거부 등) —
/// 서버가 문서 포맷의 에러 응답을 준 게 아니므로 [PiumApiException]과 구분한다.
class NetworkUnavailableException implements Exception {
  const NetworkUnavailableException([this.message = '네트워크에 연결할 수 없습니다']);

  final String message;

  @override
  String toString() => 'NetworkUnavailableException($message)';
}
