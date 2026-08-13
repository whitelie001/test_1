/// JWT access/refresh 토큰 저장소 인터페이스.
///
/// 실제 구현([SecureTokenStorage])은 `flutter_secure_storage`(Keychain/
/// Keystore)를 사용한다. 테스트에서는 [InMemoryTokenStorage]로 대체해
/// 플랫폼 채널 없이 [ApiClient]/[AuthRepository]를 검증할 수 있다.
abstract class TokenStorage {
  Future<String?> readAccessToken();
  Future<String?> readRefreshToken();
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  });
  Future<void> clear();
}
