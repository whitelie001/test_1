import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/growth_repository.dart';
import '../../domain/growth_stage_icons.dart';
import '../group_providers.dart';

/// 모임 상세 화면에 붙는 성장 마스코트 위젯. 서버가 계산한 성장 현황을
/// 그대로 보여준다(단계/이름/포인트/다음 단계까지 진행률).
class GrowthMascotWidget extends ConsumerWidget {
  const GrowthMascotWidget({super.key, required this.meetupId});

  final String meetupId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final growthAsync = ref.watch(growthStatusProvider(meetupId));

    return growthAsync.when(
      loading: () => const SizedBox(
        height: 96,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stackTrace) => const SizedBox.shrink(),
      data: (GrowthStatus growth) {
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      iconForGrowthLevel(growth.growthLevel),
                      style: const TextStyle(fontSize: 40),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          growth.growthName,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text('피움 점수 ${growth.piumScore}'),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (growth.nextLevel != null) ...[
                  LinearProgressIndicator(value: growth.progressPct / 100),
                  const SizedBox(height: 4),
                  Text('다음 단계까지 ${growth.progressPct}%'),
                ] else
                  const Text('최고 단계 도달!'),
              ],
            ),
          ),
        );
      },
    );
  }
}
