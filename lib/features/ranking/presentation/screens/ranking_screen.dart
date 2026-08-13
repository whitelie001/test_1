import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../group/domain/growth_stage_icons.dart';
import '../ranking_providers.dart';

/// 전국 모임 랭킹 화면 (문서 8장). 지역/종목 필터는 추후 UI에 추가.
class RankingScreen extends ConsumerWidget {
  const RankingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rankingsAsync = ref.watch(nationalRankingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('전국 모임 랭킹')),
      body: rankingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(child: Text('$error')),
        data: (rankings) {
          if (rankings.isEmpty) {
            return const Center(child: Text('아직 랭킹에 표시할 모임이 없어요.'));
          }
          return ListView.builder(
            itemCount: rankings.length,
            itemBuilder: (context, index) {
              final entry = rankings[index];
              return ListTile(
                leading: CircleAvatar(child: Text('${entry.rank}')),
                title: Text(entry.name),
                subtitle: Text('${iconForGrowthLevel(entry.growthLevel)} 성장 ${entry.growthLevel}단계'),
                trailing: Text('${entry.score}점'),
              );
            },
          );
        },
      ),
    );
  }
}
