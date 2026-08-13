import 'package:geolocator/geolocator.dart';

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

/// 계산된 거리가 주어진 반경 이내인지 판정한다.
///
/// 반경은 호출부에서 명시한다 (모임 체크인은 100m, 팀장 앵커는 30m로 서로
/// 다르므로 이 함수 자체는 기본값을 갖지 않는다).
bool isWithinRadius(double distanceMeters, double radiusMeters) {
  return distanceMeters <= radiusMeters;
}
