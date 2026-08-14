import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_exception.dart';
import '../../../auth/presentation/auth_providers.dart';
import '../../domain/user_profile.dart';
import '../profile_providers.dart';

/// 프로필/피움 점수/배지/운동 기록 화면 (문서 4장, 7.3절).
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key, this.onLoggedOut});

  final VoidCallback? onLoggedOut;

  Future<void> _editNickname(BuildContext context, WidgetRef ref, String currentNickname) async {
    final controller = TextEditingController(text: currentNickname);
    final newNickname = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('닉네임 수정'),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('취소')),
          TextButton(
            onPressed: () => Navigator.of(context).pop(controller.text.trim()),
            child: const Text('저장'),
          ),
        ],
      ),
    );
    if (newNickname == null || newNickname.isEmpty || newNickname == currentNickname) return;

    try {
      await ref.read(profileRepositoryProvider).updateProfile(nickname: newNickname);
      ref.invalidate(userProfileProvider);
    } on PiumApiException catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('내 프로필'),
        actions: [
          IconButton(
            onPressed: () async {
              await ref.read(authRepositoryProvider).logout();
              onLoggedOut?.call();
            },
            icon: const Icon(Icons.logout),
            tooltip: '로그아웃',
          ),
        ],
      ),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('$error')),
        data: (profile) => RefreshIndicator(
          onRefresh: () => ref.refresh(userProfileProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 32,
                    backgroundImage: profile.profileImage != null
                        ? NetworkImage(profile.profileImage!)
                        : null,
                    child: profile.profileImage == null ? const Icon(Icons.person, size: 32) : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(profile.nickname, style: Theme.of(context).textTheme.titleLarge),
                        if (profile.favoriteSports.isNotEmpty)
                          Text(profile.favoriteSports.join(', ')),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => _editNickname(context, ref, profile.nickname),
                    icon: const Icon(Icons.edit_outlined),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              _PiumScoreCard(score: profile.piumScore),
              const SizedBox(height: 16),
              _ActivitySummaryCard(summary: profile.activitySummary),
              const SizedBox(height: 16),
              Text('배지', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              if (profile.badges.isEmpty)
                const Text('아직 획득한 배지가 없어요.')
              else
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: profile.badges
                      .map((b) => Chip(avatar: Text(b.icon), label: Text(b.name)))
                      .toList(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PiumScoreCard extends StatelessWidget {
  const _PiumScoreCard({required this.score});

  final PiumScoreSummary score;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('피움 점수', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('총점 ${score.totalScore} · 이번 달 ${score.thisMonth}'),
            const SizedBox(height: 8),
            Wrap(
              spacing: 16,
              children: [
                Text('출석 ${score.breakdown.attendance}'),
                Text('연속 ${score.breakdown.streak}'),
                Text('이벤트 ${score.breakdown.events}'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivitySummaryCard extends StatelessWidget {
  const _ActivitySummaryCard({required this.summary});

  final ActivitySummary summary;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            Column(
              children: [
                Text('${summary.totalCheckins}', style: Theme.of(context).textTheme.headlineSmall),
                const Text('누적 출석'),
              ],
            ),
            Column(
              children: [
                Text('${summary.meetupsJoined}', style: Theme.of(context).textTheme.headlineSmall),
                const Text('참여 모임'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
