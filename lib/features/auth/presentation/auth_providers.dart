import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/secure_token_storage.dart';
import '../../../core/network/token_storage.dart';
import '../../../services/auth/auth_repository.dart';
import '../domain/kakao_login_client.dart';

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return SecureTokenStorage();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    baseUrl: ApiConstants.devBaseUrl,
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});

/// 카카오 개발자 앱 연동 전까지는 항상 [FakeKakaoLoginClient]를 사용한다.
/// 실제 SDK 연동 시 이 provider만 교체하면 된다.
final kakaoLoginClientProvider = Provider<KakaoLoginClient>((ref) {
  return FakeKakaoLoginClient();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    kakaoLoginClient: ref.watch(kakaoLoginClientProvider),
    apiClient: ref.watch(apiClientProvider),
    tokenStorage: ref.watch(tokenStorageProvider),
  );
});
