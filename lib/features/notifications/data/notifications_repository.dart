import '../../../core/network/api_client.dart';
import '../domain/app_notification.dart';

/// `/notifications` REST 래퍼 (문서 11장).
class NotificationsRepository {
  NotificationsRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<List<AppNotification>> list({bool? isRead, int page = 1}) async {
    final response = await apiClient.get(
      '/notifications',
      queryParameters: {if (isRead != null) 'is_read': isRead, 'page': page},
    );
    final notifications = (response as Map<String, dynamic>)['notifications'] as List;
    return notifications
        .map((n) => AppNotification.fromJson(n as Map<String, dynamic>))
        .toList();
  }

  Future<void> markRead(String id) async {
    await apiClient.put('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await apiClient.put('/notifications/read-all');
  }
}
