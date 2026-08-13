import '../../core/network/api_client.dart';
import '../../core/network/token_storage.dart';
import '../../features/auth/domain/kakao_login_client.dart';

/// 로그인한 사용자의 최소 정보. `POST /auth/kakao` 응답의 `user` 필드에 대응.
class AuthUser {
  const AuthUser({
    required this.id,
    required this.nickname,
    required this.isNew,
  });

  final String id;
  final String nickname;
  final bool isNew;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      nickname: json['nickname'] as String,
      isNew: json['is_new'] as bool? ?? false,
    );
  }
}

/// 카카오 로그인 → 백엔드 JWT 발급 → 토큰 저장까지의 인증 흐름을 담당한다.
class AuthRepository {
  AuthRepository({
    required this.kakaoLoginClient,
    required this.apiClient,
    required this.tokenStorage,
    this.deviceToken,
  });

  final KakaoLoginClient kakaoLoginClient;
  final ApiClient apiClient;
  final TokenStorage tokenStorage;
  final String? deviceToken;

  Future<AuthUser> login() async {
    final kakaoAccessToken = await kakaoLoginClient.loginAndGetAccessToken();

    final result = await apiClient.post(
      '/auth/kakao',
      data: {
        'kakao_token': kakaoAccessToken,
        if (deviceToken != null) 'device_token': deviceToken,
      },
    ) as Map<String, dynamic>;

    await tokenStorage.saveTokens(
      accessToken: result['access_token'] as String,
      refreshToken: result['refresh_token'] as String,
    );

    return AuthUser.fromJson(result['user'] as Map<String, dynamic>);
  }

  Future<void> logout() async {
    final refreshToken = await tokenStorage.readRefreshToken();
    if (refreshToken != null) {
      await apiClient.post('/auth/logout', data: {'refresh_token': refreshToken});
    }
    await tokenStorage.clear();
  }

  Future<void> withdraw() async {
    await apiClient.delete('/auth/withdraw');
    await tokenStorage.clear();
  }

  Future<bool> isLoggedIn() async {
    return (await tokenStorage.readAccessToken()) != null;
  }
}
