import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/error_view.dart';
import '../../domain/notification_type_icon.dart';
import '../notifications_providers.dart';

/// 알림 목록 화면 (문서 11장).
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('알림'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationsRepositoryProvider).markAllRead();
              ref.invalidate(notificationsListProvider);
            },
            child: const Text('모두 읽음'),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorView(error: error),
        data: (notifications) {
          if (notifications.isEmpty) {
            return const Center(child: Text('알림이 없어요.'));
          }
          return ListView.separated(
            itemCount: notifications.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final notification = notifications[index];
              return ListTile(
                leading: Icon(iconForNotificationType(notification.type)),
                title: Text(
                  notification.title,
                  style: TextStyle(
                    fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
                  ),
                ),
                subtitle: Text(notification.body),
                trailing: notification.isRead
                    ? null
                    : Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                onTap: () async {
                  if (!notification.isRead) {
                    await ref.read(notificationsRepositoryProvider).markRead(notification.id);
                    ref.invalidate(notificationsListProvider);
                  }
                },
              );
            },
          );
        },
      ),
    );
  }
}
