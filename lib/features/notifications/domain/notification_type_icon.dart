import 'package:flutter/material.dart';

/// 알림 유형 7종(문서 11.1절)에 대응하는 아이콘.
IconData iconForNotificationType(String type) {
  switch (type) {
    case 'checkin_reminder':
      return Icons.alarm;
    case 'growth_achieved':
      return Icons.eco;
    case 'ranking_change':
      return Icons.leaderboard;
    case 'new_member':
      return Icons.person_add;
    case 'event_notice':
      return Icons.campaign;
    case 'anchor_disconnected':
      return Icons.link_off;
    case 'checkin_completed':
      return Icons.check_circle;
    default:
      return Icons.notifications;
  }
}
