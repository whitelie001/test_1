import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/widgets/error_view.dart';
import '../group_providers.dart';
import '../widgets/growth_mascot_widget.dart';

/// 모임 상세 화면. 성장 마스코트, 가입/탈퇴/GPS 체크인 진입 액션을 제공한다.
class GroupDetailScreen extends ConsumerStatefulWidget {
  const GroupDetailScreen({super.key, required this.meetupId});

  final String meetupId;

  @override
  ConsumerState<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends ConsumerState<GroupDetailScreen> {
  bool _isProcessing = false;

  Future<void> _join() async {
    setState(() => _isProcessing = true);
    try {
      await ref.read(meetupRepositoryProvider).join(widget.meetupId);
      ref.invalidate(meetupDetailProvider(widget.meetupId));
    } on PiumApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _leave() async {
    setState(() => _isProcessing = true);
    try {
      await ref.read(meetupRepositoryProvider).leave(widget.meetupId);
      ref.invalidate(meetupDetailProvider(widget.meetupId));
    } on PiumApiException catch (e) {
      _showError(e.message);
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final meetupAsync = ref.watch(meetupDetailProvider(widget.meetupId));

    return Scaffold(
      appBar: AppBar(title: const Text('모임 상세')),
      body: meetupAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ErrorView(error: error),
        data: (meetup) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GrowthMascotWidget(meetupId: meetup.id),
                const SizedBox(height: 16),
                Text(meetup.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text('${meetup.sport} · ${meetup.locationName}'),
                Text('${meetup.currentMembers} / ${meetup.maxMembers}명'),
                if (meetup.description != null) ...[
                  const SizedBox(height: 16),
                  Text(meetup.description!),
                ],
                const SizedBox(height: 24),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ElevatedButton(
                      onPressed: (_isProcessing || meetup.isFull) ? null : _join,
                      child: Text(meetup.isFull ? '정원 마감' : '가입하기'),
                    ),
                    OutlinedButton(
                      onPressed: _isProcessing ? null : _leave,
                      child: const Text('탈퇴하기'),
                    ),
                    TextButton(
                      onPressed: () => context.push(
                        '/meetups/${meetup.id}/checkin?lat=${meetup.lat}&lng=${meetup.lng}',
                      ),
                      child: const Text('GPS 체크인'),
                    ),
                    TextButton(
                      onPressed: () => context.push('/meetups/${meetup.id}/feed'),
                      child: const Text('활동 피드'),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
