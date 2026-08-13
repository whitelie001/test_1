import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/features/events/data/events_repository.dart';

import '../../../support/fake_http_client_adapter.dart';
import '../../../support/in_memory_token_storage.dart';

void main() {
  late FakeHttpClientAdapter adapter;
  late EventsRepository repository;

  setUp(() {
    adapter = FakeHttpClientAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
      ..httpClientAdapter = adapter;
    repository = EventsRepository(
      apiClient: ApiClient(
        baseUrl: 'http://test.local',
        tokenStorage: InMemoryTokenStorage(),
        dio: dio,
      ),
    );
  });

  test('list()는 이벤트 목록을 파싱한다', () async {
    adapter.whenRequest('GET', '/events', statusCode: 200, body: {
      'success': true,
      'data': {
        'events': [
          {
            'id': 'e1',
            'name': '가을 러닝 페스티벌',
            'type': 'festival',
            'status': 'upcoming',
            'start_date': '2026-10-01T00:00:00Z',
            'end_date': null,
            'required_growth_level': null,
            'required_attendance_count': null,
            'site_url': 'https://pium-events.com/e1',
          },
        ],
      },
      'error': null,
    });

    final events = await repository.list();

    expect(events, hasLength(1));
    expect(events.single.name, '가을 러닝 페스티벌');
    expect(events.single.requiredGrowthLevel, isNull);
  });

  test('getEligibility()는 참가 자격 판정 결과를 파싱한다', () async {
    adapter.whenRequest('GET', '/users/me/event-eligibility/e1', statusCode: 200, body: {
      'success': true,
      'data': {
        'eligible': false,
        'growth_level': 1,
        'attendance_count': 3,
        'reasons': ['성장 단계 4 이상이 필요합니다 (현재 2)'],
      },
      'error': null,
    });

    final eligibility = await repository.getEligibility('e1');

    expect(eligibility.eligible, isFalse);
    expect(eligibility.reasons, hasLength(1));
  });

  test('getEventToken()은 이벤트 토큰을 파싱한다', () async {
    adapter.whenRequest('GET', '/users/me/event-token', statusCode: 200, body: {
      'success': true,
      'data': {
        'event_token': 'tok123',
        'expires_in': 300,
        'redirect_url': 'https://pium-events.com?token=tok123',
      },
      'error': null,
    });

    final token = await repository.getEventToken();

    expect(token.eventToken, 'tok123');
    expect(token.expiresIn, 300);
  });
}
