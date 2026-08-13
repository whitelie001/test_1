import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/feed_repository.dart';
import '../domain/feed_post.dart';

final feedRepositoryProvider = Provider<FeedRepository>((ref) {
  return FeedRepository(apiClient: ref.watch(apiClientProvider));
});

final feedListProvider =
    FutureProvider.autoDispose.family<List<FeedPost>, String>((ref, meetupId) async {
  return ref.watch(feedRepositoryProvider).listFeed(meetupId);
});
