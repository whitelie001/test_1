import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/features/auth/domain/kakao_login_client.dart';
import 'package:pium/services/auth/auth_repository.dart';

import '../../support/fake_http_client_adapter.dart';
import '../../support/in_memory_token_storage.dart';

void main() {
  late FakeHttpClientAdapter adapter;
  late InMemoryTokenStorage tokenStorage;
  late ApiClient apiClient;
  late AuthRepository repository;

  setUp(() {
    adapter = FakeHttpClientAdapter();
    tokenStorage = InMemoryTokenStorage();
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
      ..httpClientAdapter = adapter;
    apiClient = ApiClient(
      baseUrl: 'http://test.local',
      tokenStorage: tokenStorage,
      dio: dio,
    );
    repository = AuthRepository(
      kakaoLoginClient: FakeKakaoLoginClient(fixedToken: 'fake-kakao-token'),
      apiClient: apiClient,
      tokenStorage: tokenStorage,
      deviceToken: 'device-xyz',
    );
  });

  test('login()은 카카오 토큰으로 백엔드 인증 후 JWT를 저장하고 사용자 정보를 반환한다', () async {
    adapter.whenRequest('POST', '/auth/kakao', statusCode: 201, body: {
      'success': true,
      'data': {
        'access_token': 'access-1',
        'refresh_token': 'refresh-1',
        'user': {'id': 'u1', 'nickname': '김민준', 'is_new': true},
      },
      'error': null,
    });

    final user = await repository.login();

    expect(user.id, 'u1');
    expect(user.nickname, '김민준');
    expect(user.isNew, isTrue);
    expect(await tokenStorage.readAccessToken(), 'access-1');
    expect(await tokenStorage.readRefreshToken(), 'refresh-1');

    final sentBody = adapter.requests.single.data as Map;
    expect(sentBody['kakao_token'], 'fake-kakao-token');
    expect(sentBody['device_token'], 'device-xyz');
  });

  test('logout()은 refresh token으로 서버에 로그아웃을 알리고 로컬 토큰을 지운다', () async {
    await tokenStorage.saveTokens(accessToken: 'a1', refreshToken: 'r1');
    adapter.whenRequest('POST', '/auth/logout', statusCode: 200, body: {
      'success': true,
      'data': null,
      'error': null,
    });

    await repository.logout();

    expect(await tokenStorage.readAccessToken(), isNull);
    expect(await tokenStorage.readRefreshToken(), isNull);
  });

  test('isLoggedIn()은 access token 저장 여부로 판단한다', () async {
    expect(await repository.isLoggedIn(), isFalse);
    await tokenStorage.saveTokens(accessToken: 'a1', refreshToken: 'r1');
    expect(await repository.isLoggedIn(), isTrue);
  });
}
