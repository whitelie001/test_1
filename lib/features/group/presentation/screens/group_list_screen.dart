import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/error_view.dart';
import '../group_providers.dart';

/// 운동 모임 목록 화면. 반경 내 모임을 서버에서 불러와 보여준다.
class GroupListScreen extends ConsumerWidget {
  const GroupListScreen({
    super.key,
    this.onCreatePressed,
    this.onMeetupTap,
    this.onRankingsPressed,
    this.onNotificationsPressed,
    this.onEventsPressed,
    this.onProfilePressed,
  });

  final VoidCallback? onCreatePressed;
  final void Function(String meetupId)? onMeetupTap;
  final VoidCallback? onRankingsPressed;
  final VoidCallback? onNotificationsPressed;
  final VoidCallback? onEventsPressed;
  final VoidCallback? onProfilePressed;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meetupsAsync = ref.watch(meetupListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('pium'),
        actions: [
          IconButton(
            onPressed: onProfilePressed,
            icon: const Icon(Icons.person_outline),
            tooltip: '내 프로필',
          ),
          IconButton(
            onPressed: onEventsPressed,
            icon: const Icon(Icons.campaign_outlined),
            tooltip: '이벤트',
          ),
          IconButton(
            onPressed: onNotificationsPressed,
            icon: const Icon(Icons.notifications_outlined),
            tooltip: '알림',
          ),
          IconButton(
            onPressed: onRankingsPressed,
            icon: const Icon(Icons.leaderboard_outlined),
            tooltip: '랭킹',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: onCreatePressed,
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(meetupListProvider.future),
        child: meetupsAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => ErrorView(error: error),
          data: (result) {
            if (result.meetups.isEmpty) {
              return const _EmptyView();
            }
            return ListView.builder(
              itemCount: result.meetups.length,
              itemBuilder: (context, index) {
                final meetup = result.meetups[index];
                return ListTile(
                  title: Text(meetup.name),
                  subtitle: Text('${meetup.sport} · ${meetup.locationName}'),
                  trailing: Text('${meetup.currentMembers}/${meetup.maxMembers}'),
                  onTap: () => onMeetupTap?.call(meetup.id),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        Padding(
          padding: EdgeInsets.only(top: 120),
          child: Center(
            child: Text(
              '운동 모임이 아직 없어요.\n모임을 만들고 함께 성장시켜 보세요!',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ],
    );
  }
}
