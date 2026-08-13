import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/network/api_client.dart';
import 'package:pium/features/group/data/meetup_repository.dart';
import 'package:pium/features/group/domain/meetup_type_classifier.dart';

import '../../../support/fake_http_client_adapter.dart';
import '../../../support/in_memory_token_storage.dart';

void main() {
  late FakeHttpClientAdapter adapter;
  late MeetupRepository repository;

  Map<String, dynamic> sampleMeetupJson({String id = 'm1'}) => {
        'id': id,
        'hostId': 'h1',
        'name': '월요일 풋살',
        'sport': '축구',
        'description': null,
        'meetupType': 'small',
        'maxMembers': 10,
        'currentMembers': 4,
        'lat': 37.5665,
        'lng': 126.978,
        'locationName': '한강공원',
        'level': '중급',
        'fee': null,
      };

  setUp(() {
    adapter = FakeHttpClientAdapter();
    final tokenStorage = InMemoryTokenStorage();
    final dio = Dio(BaseOptions(baseUrl: 'http://test.local'))
      ..httpClientAdapter = adapter;
    repository = MeetupRepository(
      apiClient: ApiClient(
        baseUrl: 'http://test.local',
        tokenStorage: tokenStorage,
        dio: dio,
      ),
    );
  });

  test('list()는 meta.total을 정확히 반영해 결과를 반환한다', () async {
    adapter.whenRequest('GET', '/meetups', statusCode: 200, body: {
      'success': true,
      'data': [sampleMeetupJson()],
      'error': null,
      'meta': {'page': 1, 'limit': 20, 'total': 7},
    });

    final result = await repository.list(lat: 37.5665, lng: 126.978);

    expect(result.meetups, hasLength(1));
    expect(result.meetups.single.name, '월요일 풋살');
    expect(result.meetups.single.meetupType, MeetupType.small);
    expect(result.total, 7);
  });

  test('create()는 요청 바디를 문서 파라미터명(snake_case)으로 보낸다', () async {
    adapter.whenRequest('POST', '/meetups', statusCode: 201, body: {
      'success': true,
      'data': sampleMeetupJson(id: 'new-id'),
      'error': null,
    });

    final meetup = await repository.create(
      name: '월요일 풋살',
      sport: '축구',
      maxMembers: 10,
      lat: 37.5665,
      lng: 126.978,
      locationName: '한강공원',
      schedule: {'day': '월', 'time': '19:00'},
    );

    expect(meetup.id, 'new-id');
    final sentBody = adapter.requests.single.data as Map;
    expect(sentBody['max_members'], 10);
    expect(sentBody['location_name'], '한강공원');
    expect(sentBody['schedule'], {'day': '월', 'time': '19:00'});
  });

  test('join()은 message를 그대로 전달한다', () async {
    adapter.whenRequest('POST', '/meetups/m1/join', statusCode: 201, body: {
      'success': true,
      'data': {'status': 'joined', 'member_count': 5},
      'error': null,
    });

    await repository.join('m1', message: '참여하고 싶어요');

    final sentBody = adapter.requests.single.data as Map;
    expect(sentBody['message'], '참여하고 싶어요');
  });
}
