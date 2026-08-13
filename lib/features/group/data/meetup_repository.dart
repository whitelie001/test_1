import '../../../core/network/api_client.dart';
import '../domain/meetup.dart';

class MeetupListResult {
  const MeetupListResult({required this.meetups, required this.total});

  final List<Meetup> meetups;
  final int total;
}

/// `/meetups` 관련 REST 엔드포인트를 감싸는 리포지토리.
class MeetupRepository {
  MeetupRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<MeetupListResult> list({
    required double lat,
    required double lng,
    int radius = 5000,
    String? sport,
    String? level,
    String? type,
    int page = 1,
    int limit = 20,
  }) async {
    final envelope = await apiClient.getWithMeta(
      '/meetups',
      queryParameters: {
        'lat': lat,
        'lng': lng,
        'radius': radius,
        if (sport != null) 'sport': sport,
        if (level != null) 'level': level,
        if (type != null) 'type': type,
        'page': page,
        'limit': limit,
      },
    );

    final meetups = (envelope.data as List)
        .map((json) => Meetup.fromJson(json as Map<String, dynamic>))
        .toList();

    return MeetupListResult(
      meetups: meetups,
      total: envelope.meta?['total'] as int? ?? meetups.length,
    );
  }

  Future<Meetup> getById(String id) async {
    final response = await apiClient.get('/meetups/$id');
    return Meetup.fromJson(response as Map<String, dynamic>);
  }

  Future<Meetup> create({
    required String name,
    required String sport,
    String? description,
    required int maxMembers,
    required double lat,
    required double lng,
    required String locationName,
    required Map<String, dynamic> schedule,
    String? level,
    int? fee,
  }) async {
    final response = await apiClient.post(
      '/meetups',
      data: {
        'name': name,
        'sport': sport,
        if (description != null) 'description': description,
        'max_members': maxMembers,
        'lat': lat,
        'lng': lng,
        'location_name': locationName,
        'schedule': schedule,
        if (level != null) 'level': level,
        if (fee != null) 'fee': fee,
      },
    );
    return Meetup.fromJson(response as Map<String, dynamic>);
  }

  Future<void> join(String meetupId, {String? message}) async {
    await apiClient.post(
      '/meetups/$meetupId/join',
      data: {if (message != null) 'message': message},
    );
  }

  Future<void> leave(String meetupId) async {
    await apiClient.delete('/meetups/$meetupId/leave');
  }

  Future<List<Meetup>> myMeetups({String? role}) async {
    final response = await apiClient.get(
      '/users/me/meetups',
      queryParameters: {if (role != null) 'role': role},
    );
    return (response as List)
        .map((json) => Meetup.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
