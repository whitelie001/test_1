import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/ranking_repository.dart';

final rankingRepositoryProvider = Provider<RankingRepository>((ref) {
  return RankingRepository(apiClient: ref.watch(apiClientProvider));
});

final nationalRankingsProvider =
    FutureProvider.autoDispose<List<RankingEntry>>((ref) async {
  return ref.watch(rankingRepositoryProvider).national();
});
