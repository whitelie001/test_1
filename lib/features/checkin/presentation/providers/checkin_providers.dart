import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../auth/presentation/auth_providers.dart';
import '../../../anchor/data/anchor_repository.dart';
import '../../data/checkin_repository.dart';

final checkinRepositoryProvider = Provider<CheckinRepository>((ref) {
  return CheckinRepository(apiClient: ref.watch(apiClientProvider));
});

final anchorRepositoryProvider = Provider<AnchorRepository>((ref) {
  return AnchorRepository(apiClient: ref.watch(apiClientProvider));
});
