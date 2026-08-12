import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/checkin/domain/growth_point_calculator.dart';

void main() {
  group('GrowthPointCalculator', () {
    test('0시간이면 0포인트', () {
      expect(GrowthPointCalculator.calculate(Duration.zero), 0);
    });

    test('음수 duration이면 0포인트', () {
      expect(
        GrowthPointCalculator.calculate(const Duration(seconds: -10)),
        0,
      );
    });

    test('1시간이면 1.5포인트 (첫 구간 요율)', () {
      expect(
        GrowthPointCalculator.calculate(const Duration(hours: 1)),
        closeTo(1.5, 0.0001),
      );
    });

    test('2시간이면 3.0포인트 (첫 구간 경계)', () {
      expect(
        GrowthPointCalculator.calculate(const Duration(hours: 2)),
        closeTo(3.0, 0.0001),
      );
    });

    test('3시간이면 4.0포인트 (사용자 확인 예시: 2h*1.5 + 1h*1)', () {
      expect(
        GrowthPointCalculator.calculate(const Duration(hours: 3)),
        closeTo(4.0, 0.0001),
      );
    });

    test('2시간 30분이면 3.5포인트 (2h*1.5 + 0.5h*1)', () {
      expect(
        GrowthPointCalculator.calculate(const Duration(hours: 2, minutes: 30)),
        closeTo(3.5, 0.0001),
      );
    });
  });
}
