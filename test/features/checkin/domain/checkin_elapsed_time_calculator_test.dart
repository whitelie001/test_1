import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/checkin/domain/checkin_elapsed_time_calculator.dart';

DateTime t(int secondsFromEpoch) =>
    DateTime.fromMillisecondsSinceEpoch(secondsFromEpoch * 1000, isUtc: true);

void main() {
  group('range-timer (grace=0, 기본 체크인)', () {
    test('반경 안에 계속 있으면 시간이 그대로 누적된다', () {
      var state = RangeTimerState.initial(t(0));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(30));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(60));
      expect(state.elapsedSeconds, 60);
      expect(state.isInRange, isTrue);
    });

    test('반경을 벗어나면 즉시 정지된다(유예 없음)', () {
      var state = RangeTimerState.initial(t(0));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(100));
      state = applyLocationPing(state, isPhysicallyInRange: false, now: t(130));
      expect(state.elapsedSeconds, 100);
      expect(state.isInRange, isFalse);
      expect(computeCurrentElapsedSeconds(state, t(500)), 100);
    });

    test('정지 후 복귀하면 이탈 구간은 카운트하지 않고 재개한다', () {
      var state = RangeTimerState.initial(t(0));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(100));
      state = applyLocationPing(state, isPhysicallyInRange: false, now: t(130));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(500));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(520));
      expect(state.elapsedSeconds, 120);
    });

    test('canExit: 최소 체류 시간 경계값', () {
      var state = RangeTimerState.initial(t(0));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(3599));
      expect(canExit(state, t(3599), 3600), isFalse);
      expect(canExit(state, t(3600), 3600), isTrue);
    });
  });

  group('range-timer (grace=30, 팀장 앵커 모드)', () {
    const grace = 30;

    test('유예 기간 안에 복귀하면 정지 없이 계속 누적된다', () {
      var state = RangeTimerState.initial(t(0));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(100));
      state = applyLocationPing(
        state,
        isPhysicallyInRange: false,
        now: t(110),
        gracePeriodSeconds: grace,
      );
      expect(state.isInRange, isTrue);
      state = applyLocationPing(
        state,
        isPhysicallyInRange: true,
        now: t(115),
        gracePeriodSeconds: grace,
      );
      expect(state.elapsedSeconds, 115);
    });

    test('유예 기간을 넘기면 유예 만료 시점까지만 인정하고 정지된다', () {
      var state = RangeTimerState.initial(t(0));
      state = applyLocationPing(state, isPhysicallyInRange: true, now: t(100));
      state = applyLocationPing(
        state,
        isPhysicallyInRange: false,
        now: t(110),
        gracePeriodSeconds: grace,
      );
      state = applyLocationPing(
        state,
        isPhysicallyInRange: false,
        now: t(150),
        gracePeriodSeconds: grace,
      );
      expect(state.isInRange, isFalse);
      expect(state.elapsedSeconds, 130);
    });
  });
}
