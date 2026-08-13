import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/core/network/api_exception.dart';
import 'package:pium/features/checkin/data/checkin_repository.dart';

import '../../../support/fake_http_client_adapter.dart';
import '../../../support/in_memory_token_storage.dart';

void main() {
  late FakeHttpClientAdapter adapter;
  late CheckinRepository repository;

  setUp(() {
    adapter = FakeHttpClientAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
      ..httpClientAdapter = adapter;
    repository = CheckinRepository(
      apiClient: ApiClient(
        baseUrl: 'http://test.local',
        tokenStorage: InMemoryTokenStorage(),
        dio: dio,
      ),
    );
  });

  test('enter()는 anchor_mode를 요청 바디에 포함한다', () async {
    adapter.whenRequest('POST', '/meetups/m1/checkin/enter', statusCode: 201, body: {
      'success': true,
      'data': {
        'checkin_id': 'c1',
        'entered_at': '2026-01-01T10:00:00Z',
        'status': 'entered',
      },
      'error': null,
    });

    final result = await repository.enter('m1', lat: 37.5, lng: 127.0, anchorMode: true);

    expect(result.checkinId, 'c1');
    final sentBody = adapter.requests.single.data as Map;
    expect(sentBody['anchor_mode'], true);
  });

  test('반경 밖 입장 시 OUT_OF_RANGE PiumApiException을 던진다', () async {
    adapter.whenRequest('POST', '/meetups/m1/checkin/enter', statusCode: 400, body: {
      'success': false,
      'data': null,
      'error': {'code': 'OUT_OF_RANGE', 'message': '모임 장소 반경 밖입니다'},
    });

    await expectLater(
      repository.enter('m1', lat: 0, lng: 0),
      throwsA(isA<PiumApiException>().having((e) => e.code, 'code', 'OUT_OF_RANGE')),
    );
  });

  test('updateLocation()은 is_in_range/elapsed_seconds를 파싱한다', () async {
    adapter.whenRequest('PUT', '/checkins/c1/location', statusCode: 200, body: {
      'success': true,
      'data': {'status': 'staying', 'elapsed_seconds': 2537, 'is_in_range': true},
      'error': null,
    });

    final result = await repository.updateLocation('c1', lat: 37.5, lng: 127.0);

    expect(result.elapsedSeconds, 2537);
    expect(result.isInRange, isTrue);
  });

  test('exit()는 퇴장 결과를 파싱한다', () async {
    adapter.whenRequest('POST', '/checkins/c1/exit', statusCode: 201, body: {
      'success': true,
      'data': {
        'status': 'completed',
        'total_seconds': 5400,
        'pium_score_earned': 8,
        'attendance_confirmed': true,
      },
      'error': null,
    });

    final result = await repository.exit('c1', lat: 37.5, lng: 127.0);

    expect(result.totalSeconds, 5400);
    expect(result.piumScoreEarned, 8);
    expect(result.attendanceConfirmed, isTrue);
  });
}
