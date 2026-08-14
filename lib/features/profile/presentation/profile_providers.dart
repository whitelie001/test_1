import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/profile_repository.dart';
import '../domain/user_profile.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(apiClient: ref.watch(apiClientProvider));
});

final userProfileProvider = FutureProvider.autoDispose<UserProfile>((ref) async {
  return ref.watch(profileRepositoryProvider).getProfile();
});

final userStatsProvider = FutureProvider.autoDispose<UserStats>((ref) async {
  return ref.watch(profileRepositoryProvider).getStats();
});
