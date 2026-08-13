import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/features/notifications/data/notifications_repository.dart';

import '../../../support/fake_http_client_adapter.dart';
import '../../../support/in_memory_token_storage.dart';

void main() {
  late FakeHttpClientAdapter adapter;
  late NotificationsRepository repository;

  setUp(() {
    adapter = FakeHttpClientAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
      ..httpClientAdapter = adapter;
    repository = NotificationsRepository(
      apiClient: ApiClient(
        baseUrl: 'http://test.local',
        tokenStorage: InMemoryTokenStorage(),
        dio: dio,
      ),
    );
  });

  test('list()는 알림 목록을 파싱한다', () async {
    adapter.whenRequest('GET', '/notifications', statusCode: 200, body: {
      'success': true,
      'data': {
        'notifications': [
          {
            'id': 'n1',
            'type': 'checkin_completed',
            'title': '출석 완료',
            'body': '체크인이 완료됐어요. +6점을 획득했습니다.',
            'payload': {'checkin_id': 'c1'},
            'is_read': false,
            'created_at': '2026-01-01T10:00:00Z',
          },
        ],
      },
      'error': null,
      'meta': {'page': 1, 'limit': 20, 'total': 1},
    });

    final notifications = await repository.list();

    expect(notifications, hasLength(1));
    expect(notifications.single.type, 'checkin_completed');
    expect(notifications.single.isRead, isFalse);
    expect(notifications.single.payload?['checkin_id'], 'c1');
  });

  test('markRead()는 PUT 요청을 보낸다', () async {
    adapter.whenRequest('PUT', '/notifications/n1/read', statusCode: 200, body: {
      'success': true,
      'data': null,
      'error': null,
    });

    await repository.markRead('n1');

    expect(adapter.requests.single.method, 'PUT');
    expect(adapter.requests.single.path, '/notifications/n1/read');
  });

  test('markAllRead()는 PUT 요청을 보낸다', () async {
    adapter.whenRequest('PUT', '/notifications/read-all', statusCode: 200, body: {
      'success': true,
      'data': null,
      'error': null,
    });

    await repository.markAllRead();

    expect(adapter.requests.single.method, 'PUT');
    expect(adapter.requests.single.path, '/notifications/read-all');
  });
}
