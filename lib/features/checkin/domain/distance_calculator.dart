import 'package:geolocator/geolocator.dart';

import '../../../core/constants/checkin_constants.dart';

/// 두 좌표 간 거리(미터)를 계산하는 인터페이스.
///
/// 실제 구현([GeolocatorDistanceCalculator])은 플랫폼 채널을 통하지 않는
/// [Geolocator.distanceBetween](순수 Haversine 공식)을 감싸지만, 테스트에서는
/// 이 인터페이스를 목킹해 GPS 플랫폼 바인딩 없이 체크인 로직을 검증할 수 있다.
abstract class DistanceCalculator {
  double distanceMeters(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  );
}

class GeolocatorDistanceCalculator implements DistanceCalculator {
  @override
  double distanceMeters(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    return Geolocator.distanceBetween(lat1, lng1, lat2, lng2);
  }
}

/// 계산된 거리가 체크인 인정 반경 이내인지 판정한다.
bool isWithinCheckinRadius(
  double distanceMeters, {
  double radius = CheckinConstants.checkInRadiusMeters,
}) {
  return distanceMeters <= radius;
}
