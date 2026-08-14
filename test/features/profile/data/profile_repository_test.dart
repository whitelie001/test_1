import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/features/profile/data/profile_repository.dart';

import '../../../support/fake_http_client_adapter.dart';
import '../../../support/in_memory_token_storage.dart';

void main() {
  late FakeHttpClientAdapter adapter;
  late ProfileRepository repository;

  setUp(() {
    adapter = FakeHttpClientAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
      ..httpClientAdapter = adapter;
    repository = ProfileRepository(
      apiClient: ApiClient(
        baseUrl: 'http://test.local',
        tokenStorage: InMemoryTokenStorage(),
        dio: dio,
      ),
    );
  });

  Map<String, dynamic> profileBody() => {
        'success': true,
        'data': {
          'id': 'u1',
          'nickname': '김민준',
          'profile_image': null,
          'favorite_sports': ['러닝'],
          'pium_score': {
            'total_score': 20,
            'this_month': 8,
            'breakdown': {'attendance': 13, 'streak': 7, 'events': 0},
          },
          'badges': [
            {'id': 'b1', 'name': '첫 출석', 'icon': '🏅', 'earned_at': '2026-01-01T00:00:00Z'},
          ],
          'activity_summary': {'total_checkins': 3, 'meetups_joined': 2},
        },
        'error': null,
      };

  test('getProfile()은 프로필/점수/배지/활동요약을 파싱한다', () async {
    adapter.whenRequest('GET', '/users/me', statusCode: 200, body: profileBody());

    final profile = await repository.getProfile();

    expect(profile.nickname, '김민준');
    expect(profile.piumScore.totalScore, 20);
    expect(profile.piumScore.breakdown.attendance, 13);
    expect(profile.badges.single.name, '첫 출석');
    expect(profile.activitySummary.totalCheckins, 3);
  });

  test('updateProfile()은 PUT 요청 후 최신 프로필을 다시 조회한다', () async {
    adapter.whenRequest('PUT', '/users/me', statusCode: 200, body: {
      'success': true,
      'data': {'id': 'u1', 'nickname': '새닉네임', 'profile_image': null, 'favorite_sports': []},
      'error': null,
    });
    adapter.whenRequest('GET', '/users/me', statusCode: 200, body: profileBody());

    final profile = await repository.updateProfile(nickname: '새닉네임');

    expect(profile.nickname, '김민준'); // GET 응답 기준
    expect(adapter.requests.first.method, 'PUT');
    expect(adapter.requests.first.data, {'nickname': '새닉네임'});
  });

  test('getStats()는 heatmap/sport_ratio를 파싱한다', () async {
    adapter.whenRequest('GET', '/users/me/stats', statusCode: 200, body: {
      'success': true,
      'data': {
        'heatmap': [
          {'date': '2026-03-01', 'attended': true},
        ],
        'sport_ratio': {'러닝': 100.0},
      },
      'error': null,
    });

    final stats = await repository.getStats();

    expect(stats.attendedDates, ['2026-03-01']);
    expect(stats.sportRatio['러닝'], 100.0);
  });
}
