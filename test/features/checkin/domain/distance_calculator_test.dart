import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/checkin/domain/distance_calculator.dart';

void main() {
  group('isWithinRadius', () {
    test('반경보다 정확히 작으면 true', () {
      expect(isWithinRadius(99, 100), isTrue);
    });

    test('반경과 정확히 같으면 true (경계 포함)', () {
      expect(isWithinRadius(100, 100), isTrue);
    });

    test('반경보다 크면 false', () {
      expect(isWithinRadius(101, 100), isFalse);
    });

    test('앵커 모드처럼 더 작은 반경도 그대로 동작한다', () {
      expect(isWithinRadius(29, 30), isTrue);
      expect(isWithinRadius(31, 30), isFalse);
    });
  });
}
