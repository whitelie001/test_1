import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/meetup_repository.dart';
import '../domain/meetup.dart';

final meetupRepositoryProvider = Provider<MeetupRepository>((ref) {
  return MeetupRepository(apiClient: ref.watch(apiClientProvider));
});

/// 모임 목록 조회 파라미터. 지금은 서울 시청 좌표를 기본값으로 쓴다 —
/// 실제 위치 기반 조회는 geolocator로 현재 위치를 가져오는 화면 붙일 때 교체.
class MeetupListParams {
  const MeetupListParams({
    this.lat = 37.5665,
    this.lng = 126.9780,
    this.radius = 5000,
    this.sport,
  });

  final double lat;
  final double lng;
  final int radius;
  final String? sport;
}

final meetupListProvider =
    FutureProvider.autoDispose<MeetupListResult>((ref) async {
  const params = MeetupListParams();
  final repository = ref.watch(meetupRepositoryProvider);
  return repository.list(
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    sport: params.sport,
  );
});

final meetupDetailProvider =
    FutureProvider.autoDispose.family<Meetup, String>((ref, id) async {
  final repository = ref.watch(meetupRepositoryProvider);
  return repository.getById(id);
});
