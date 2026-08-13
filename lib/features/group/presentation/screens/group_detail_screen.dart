import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_exception.dart';
import '../group_providers.dart';

/// 모임 상세 화면. 가입/탈퇴 액션을 제공한다.
/// 체크인 진입, 성장 마스코트 등은 각 기능 단계(Phase 3/4)에서 추가한다.
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
        error: (error, _) => Center(child: Text('$error')),
        data: (meetup) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(meetup.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text('${meetup.sport} · ${meetup.locationName}'),
                Text('${meetup.currentMembers} / ${meetup.maxMembers}명'),
                if (meetup.description != null) ...[
                  const SizedBox(height: 16),
                  Text(meetup.description!),
                ],
                const SizedBox(height: 24),
                Row(
                  children: [
                    ElevatedButton(
                      onPressed: (_isProcessing || meetup.isFull) ? null : _join,
                      child: Text(meetup.isFull ? '정원 마감' : '가입하기'),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: _isProcessing ? null : _leave,
                      child: const Text('탈퇴하기'),
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
