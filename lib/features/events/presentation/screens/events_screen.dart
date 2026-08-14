import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/widgets/error_view.dart';
import '../../domain/pium_event.dart';
import '../events_providers.dart';

/// 이벤트 연계 화면 (문서 10장). 실제 브라우저 이동 대신, 발급된 SSO
/// 이동 링크를 다이얼로그로 보여준다 — 이벤트 사이트(pium-events.com)가
/// 아직 존재하지 않고, 이 세션엔 url_launcher 등 외부 브라우저 연동
/// 패키지를 새로 추가할 네트워크 접근도 없다.
class EventsScreen extends ConsumerWidget {
  const EventsScreen({super.key});

  static const _dateFormat = 'yyyy.MM.dd';

  Future<void> _showEligibility(BuildContext context, WidgetRef ref, PiumEvent event) async {
    try {
      final eligibility = await ref.read(eventEligibilityProvider(event.id).future);
      if (!context.mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(event.name),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(eligibility.eligible ? '참가 자격을 충족했어요!' : '아직 참가 자격을 충족하지 못했어요.'),
              const SizedBox(height: 8),
              Text('현재 성장 단계: ${eligibility.growthLevel + 1}'),
              Text('누적 출석: ${eligibility.attendanceCount}회'),
              if (eligibility.reasons.isNotEmpty) ...[
                const SizedBox(height: 8),
                ...eligibility.reasons.map((r) => Text('· $r')),
              ],
            ],
          ),
          actions: [
            if (eligibility.eligible)
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _showEventToken(context, ref);
                },
                child: const Text('참가 링크 받기'),
              ),
            TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('닫기')),
          ],
        ),
      );
    } on PiumApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  Future<void> _showEventToken(BuildContext context, WidgetRef ref) async {
    final token = await ref.read(eventsRepositoryProvider).getEventToken();
    if (!context.mounted) return;
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('이벤트 사이트 이동 링크'),
        content: SelectableText('${token.redirectUrl}\n\n(${token.expiresIn}초 이내 유효)'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('닫기')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(eventsListProvider);
    final dateFormat = DateFormat(_dateFormat);

    return Scaffold(
      appBar: AppBar(title: const Text('이벤트')),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorView(error: error),
        data: (events) {
          if (events.isEmpty) {
            return const Center(child: Text('진행 중인 이벤트가 없어요.'));
          }
          return ListView.separated(
            itemCount: events.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final event = events[index];
              return ListTile(
                title: Text(event.name),
                subtitle: Text('${event.type} · ${dateFormat.format(event.startDate)}부터'),
                trailing: Text(event.status),
                onTap: () => _showEligibility(context, ref, event),
              );
            },
          );
        },
      ),
    );
  }
}
