import 'package:flutter_test/flutter_test.dart';
import 'package:pium/core/constants/checkin_constants.dart';
import 'package:pium/features/checkin/domain/distance_calculator.dart';

void main() {
  group('isWithinCheckinRadius', () {
    test('반경보다 정확히 작으면 true', () {
      expect(isWithinCheckinRadius(1.99), isTrue);
    });

    test('반경과 정확히 같으면 true (경계 포함)', () {
      expect(
        isWithinCheckinRadius(CheckinConstants.checkInRadiusMeters),
        isTrue,
      );
    });

    test('반경보다 크면 false', () {
      expect(isWithinCheckinRadius(2.01), isFalse);
    });

    test('커스텀 반경을 지정할 수 있다', () {
      expect(isWithinCheckinRadius(40, radius: 50), isTrue);
      expect(isWithinCheckinRadius(60, radius: 50), isFalse);
    });
  });
}
