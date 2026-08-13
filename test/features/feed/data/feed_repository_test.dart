import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/features/feed/data/feed_repository.dart';

import '../../../support/fake_http_client_adapter.dart';
import '../../../support/in_memory_token_storage.dart';

void main() {
  late FakeHttpClientAdapter adapter;
  late FeedRepository repository;

  setUp(() {
    adapter = FakeHttpClientAdapter();
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
      ..httpClientAdapter = adapter;
    repository = FeedRepository(
      apiClient: ApiClient(
        baseUrl: 'http://test.local',
        tokenStorage: InMemoryTokenStorage(),
        dio: dio,
      ),
    );
  });

  test('listFeed()는 게시물 목록을 파싱한다', () async {
    adapter.whenRequest('GET', '/meetups/m1/feed', statusCode: 200, body: {
      'success': true,
      'data': {
        'posts': [
          {
            'id': 'p1',
            'author': {'id': 'u1', 'nickname': '김민준', 'profile_image': null},
            'media': [
              {'type': 'photo', 'url': '/uploads/a.png'},
            ],
            'text': '오늘 풋살 최고!',
            'reactions': {
              '🔥': {'count': 3, 'my_reaction': true},
            },
            'created_at': '2026-01-01T10:00:00Z',
          },
        ],
      },
      'error': null,
    });

    final posts = await repository.listFeed('m1');

    expect(posts, hasLength(1));
    expect(posts.single.text, '오늘 풋살 최고!');
    expect(posts.single.media.single.url, '/uploads/a.png');
    expect(posts.single.reactions['🔥']!.count, 3);
    expect(posts.single.reactions['🔥']!.myReaction, isTrue);
  });

  test('toggleReaction()은 토글 결과를 파싱한다', () async {
    adapter.whenRequest('POST', '/feed/p1/reactions', statusCode: 201, body: {
      'success': true,
      'data': {'emoji': '🔥', 'count': 1, 'my_reaction': true},
      'error': null,
    });

    final result = await repository.toggleReaction('p1', '🔥');

    expect(result.count, 1);
    expect(result.myReaction, isTrue);
  });

  test('deletePost()는 DELETE 요청을 보낸다', () async {
    adapter.whenRequest('DELETE', '/feed/p1', statusCode: 200, body: {
      'success': true,
      'data': null,
      'error': null,
    });

    await repository.deletePost('p1');

    expect(adapter.requests.single.method, 'DELETE');
  });
}
