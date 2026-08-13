import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/core/network/api_exception.dart';

import '../../support/fake_http_client_adapter.dart';
import '../../support/in_memory_token_storage.dart';

void main() {
  group('unwrapEnvelope', () {
    test('success:true면 data를 반환한다', () {
      final result = unwrapEnvelope({
        'success': true,
        'data': {'foo': 'bar'},
        'error': null,
      });
      expect(result, {'foo': 'bar'});
    });

    test('success:false면 PiumApiException을 던진다', () {
      expect(
        () => unwrapEnvelope({
          'success': false,
          'data': null,
          'error': {'code': 'MEETUP_NOT_FOUND', 'message': '모임을 찾을 수 없습니다'},
        }),
        throwsA(
          isA<PiumApiException>()
              .having((e) => e.code, 'code', 'MEETUP_NOT_FOUND'),
        ),
      );
    });

    test('Map이 아닌 응답이면 NetworkUnavailableException을 던진다', () {
      expect(
        () => unwrapEnvelope('not a map'),
        throwsA(isA<NetworkUnavailableException>()),
      );
    });
  });

  group('ApiClient', () {
    late FakeHttpClientAdapter adapter;
    late InMemoryTokenStorage tokenStorage;
    late ApiClient client;

    setUp(() {
      adapter = FakeHttpClientAdapter();
      tokenStorage = InMemoryTokenStorage();
      final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
        ..httpClientAdapter = adapter;
      client = ApiClient(
        baseUrl: 'http://test.local',
        tokenStorage: tokenStorage,
        dio: dio,
      );
    });

    test('저장된 access token을 Authorization 헤더에 자동으로 첨부한다', () async {
      await tokenStorage.saveTokens(accessToken: 'token-abc', refreshToken: 'r1');
      adapter.whenRequest('GET', '/meetups', statusCode: 200, body: {
        'success': true,
        'data': [],
        'error': null,
      });

      await client.get('/meetups');

      expect(adapter.requests.single.headers['Authorization'], 'Bearer token-abc');
    });

    test('TOKEN_EXPIRED 응답을 받으면 refresh 후 원래 요청을 1회 재시도한다', () async {
      await tokenStorage.saveTokens(accessToken: 'old-token', refreshToken: 'refresh-1');

      adapter.whenRequest('GET', '/users/me', statusCode: 401, body: {
        'success': false,
        'data': null,
        'error': {'code': 'TOKEN_EXPIRED', 'message': '토큰이 만료됐습니다'},
      });
      adapter.whenRequest('POST', '/auth/refresh', statusCode: 200, body: {
        'success': true,
        'data': {'access_token': 'new-token', 'refresh_token': 'refresh-2', 'expires_in': 3600},
        'error': null,
      });
      adapter.whenRequest('GET', '/users/me', statusCode: 200, body: {
        'success': true,
        'data': {'id': '1'},
        'error': null,
      });

      final result = await client.get('/users/me');

      expect(result, {'id': '1'});
      expect(await tokenStorage.readAccessToken(), 'new-token');
      expect(await tokenStorage.readRefreshToken(), 'refresh-2');
    });

    test('refresh마저 실패하면 토큰을 지우고 원래 에러를 던진다', () async {
      await tokenStorage.saveTokens(accessToken: 'old-token', refreshToken: 'refresh-1');

      adapter.whenRequest('GET', '/users/me', statusCode: 401, body: {
        'success': false,
        'data': null,
        'error': {'code': 'TOKEN_EXPIRED', 'message': '토큰이 만료됐습니다'},
      });
      adapter.whenRequest('POST', '/auth/refresh', statusCode: 401, body: {
        'success': false,
        'data': null,
        'error': {'code': 'UNAUTHORIZED', 'message': '인증이 필요합니다'},
      });

      await expectLater(
        client.get('/users/me'),
        throwsA(isA<PiumApiException>().having((e) => e.code, 'code', 'TOKEN_EXPIRED')),
      );
      expect(await tokenStorage.readAccessToken(), isNull);
    });

    test('일반 API 에러(NOT_MEMBER 등)는 재시도 없이 즉시 던진다', () async {
      adapter.whenRequest('POST', '/meetups/1/join', statusCode: 403, body: {
        'success': false,
        'data': null,
        'error': {'code': 'NOT_MEMBER', 'message': '모임 멤버가 아닙니다'},
      });

      await expectLater(
        client.post('/meetups/1/join'),
        throwsA(isA<PiumApiException>().having((e) => e.code, 'code', 'NOT_MEMBER')),
      );
    });
  });
}
