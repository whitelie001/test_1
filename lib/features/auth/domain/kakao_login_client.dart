/// 카카오 로그인으로 카카오 액세스 토큰을 얻는 인터페이스.
///
/// 실제 구현은 공식 `kakao_flutter_sdk_user` 패키지를 사용하지만, 네이티브
/// 설정(안드로이드 key hash, iOS URL scheme, 실제 카카오 앱)이 필요해 이
/// 세션에서는 종단간 테스트가 불가하다. 개발/테스트 중에는
/// [FakeKakaoLoginClient]로 대체해 나머지 인증 흐름(백엔드 연동, 토큰 저장)을
/// 검증한다.
abstract class KakaoLoginClient {
  Future<String> loginAndGetAccessToken();
}

/// 실제 카카오 로그인 없이 고정된(또는 지정된) 토큰 문자열을 반환하는 개발용 구현.
/// 백엔드의 `MockKakaoOAuthClient`와 짝을 이룬다 — 같은 토큰 문자열이면
/// 같은 카카오 사용자로 취급된다.
class FakeKakaoLoginClient implements KakaoLoginClient {
  FakeKakaoLoginClient({this.fixedToken = 'dev-fake-kakao-token'});

  final String fixedToken;

  @override
  Future<String> loginAndGetAccessToken() async => fixedToken;
}
