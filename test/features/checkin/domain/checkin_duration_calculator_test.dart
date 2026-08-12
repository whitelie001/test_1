import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/checkin/domain/checkin_duration_calculator.dart';

void main() {
  group('CheckinDurationCalculator', () {
    final sessionStart = DateTime(2026, 1, 1, 10, 0);
    final sessionEnd = DateTime(2026, 1, 1, 13, 0);

    test('세션 범위 안에서 정상적으로 체크인~체크아웃 시간을 계산한다', () {
      final result = CheckinDurationCalculator.calculate(
        checkinAt: DateTime(2026, 1, 1, 10, 30),
        checkoutAt: DateTime(2026, 1, 1, 12, 0),
        sessionStart: sessionStart,
        sessionEnd: sessionEnd,
      );
      expect(result, const Duration(hours: 1, minutes: 30));
    });

    test('체크인이 세션 시작 이전이면 세션 시작 시각으로 클램프한다', () {
      final result = CheckinDurationCalculator.calculate(
        checkinAt: DateTime(2026, 1, 1, 9, 0),
        checkoutAt: DateTime(2026, 1, 1, 11, 0),
        sessionStart: sessionStart,
        sessionEnd: sessionEnd,
      );
      expect(result, const Duration(hours: 1));
    });

    test('체크아웃이 세션 종료 이후면 세션 종료 시각으로 클램프한다', () {
      final result = CheckinDurationCalculator.calculate(
        checkinAt: DateTime(2026, 1, 1, 12, 0),
        checkoutAt: DateTime(2026, 1, 1, 14, 0),
        sessionStart: sessionStart,
        sessionEnd: sessionEnd,
      );
      expect(result, const Duration(hours: 1));
    });

    test('체크아웃이 체크인보다 이르면 0을 반환한다', () {
      final result = CheckinDurationCalculator.calculate(
        checkinAt: DateTime(2026, 1, 1, 11, 0),
        checkoutAt: DateTime(2026, 1, 1, 10, 30),
        sessionStart: sessionStart,
        sessionEnd: sessionEnd,
      );
      expect(result, Duration.zero);
    });
  });
}
