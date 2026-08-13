import '../../../core/network/api_client.dart';
import '../domain/pium_event.dart';

/// `/events`, `/users/me/event-eligibility`, `/users/me/event-token` REST 래퍼 (문서 10장).
class EventsRepository {
  EventsRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<List<PiumEvent>> list({String? type, String? status}) async {
    final response = await apiClient.get(
      '/events',
      queryParameters: {if (type != null) 'type': type, if (status != null) 'status': status},
    );
    final events = (response as Map<String, dynamic>)['events'] as List;
    return events.map((e) => PiumEvent.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<PiumEvent> getById(String id) async {
    final response = await apiClient.get('/events/$id');
    return PiumEvent.fromJson(response as Map<String, dynamic>);
  }

  Future<EventEligibility> getEligibility(String eventId) async {
    final response = await apiClient.get('/users/me/event-eligibility/$eventId');
    return EventEligibility.fromJson(response as Map<String, dynamic>);
  }

  Future<EventToken> getEventToken() async {
    final response = await apiClient.get('/users/me/event-token');
    return EventToken.fromJson(response as Map<String, dynamic>);
  }
}
