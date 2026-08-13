import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/events_repository.dart';
import '../domain/pium_event.dart';

final eventsRepositoryProvider = Provider<EventsRepository>((ref) {
  return EventsRepository(apiClient: ref.watch(apiClientProvider));
});

final eventsListProvider = FutureProvider.autoDispose<List<PiumEvent>>((ref) async {
  return ref.watch(eventsRepositoryProvider).list();
});

final eventEligibilityProvider =
    FutureProvider.autoDispose.family<EventEligibility, String>((ref, eventId) async {
  return ref.watch(eventsRepositoryProvider).getEligibility(eventId);
});
