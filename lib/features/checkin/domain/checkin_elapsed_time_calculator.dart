/// 반경 이탈/복귀에 따라 체류 시간을 누적/일시정지하는 순수 상태머신.
///
/// 백엔드 `backend/src/checkins/domain/range-timer.ts`와 동일한 알고리즘을
/// 그대로 미러링한다 — 기본 체크인(문서 6.1절, 유예 없이 즉시 정지)과 팀장
/// 앵커 모드(문서 6.2절, 30초 유예)를 gracePeriodSeconds 파라미터 하나로
/// 통합해서 표현한다.
///
/// 설계: elapsedSeconds는 "정지 상태에서도 항상 정확한" 값으로 유지한다.
/// 매 핑마다 그 시점까지의 경과를 확정해서 누적하고 rangeStateChangedAt을
/// 그 시점으로 이동시킨다.
class RangeTimerState {
  const RangeTimerState({
    required this.elapsedSeconds,
    required this.isInRange,
    required this.rangeStateChangedAt,
    required this.outOfRangeSince,
  });

  final double elapsedSeconds;
  final bool isInRange;
  final DateTime rangeStateChangedAt;
  final DateTime? outOfRangeSince;

  factory RangeTimerState.initial(DateTime now) {
    return RangeTimerState(
      elapsedSeconds: 0,
      isInRange: true,
      rangeStateChangedAt: now,
      outOfRangeSince: null,
    );
  }
}

double _diffSeconds(DateTime from, DateTime to) {
  final seconds = to.difference(from).inMilliseconds / 1000;
  return seconds < 0 ? 0 : seconds;
}

DateTime _addSeconds(DateTime date, int seconds) {
  return date.add(Duration(seconds: seconds));
}

RangeTimerState applyLocationPing(
  RangeTimerState state, {
  required bool isPhysicallyInRange,
  required DateTime now,
  int gracePeriodSeconds = 0,
}) {
  if (isPhysicallyInRange) {
    final elapsedSeconds = state.isInRange
        ? state.elapsedSeconds + _diffSeconds(state.rangeStateChangedAt, now)
        : state.elapsedSeconds; // 정지되어 있던 구간은 카운트하지 않는다
    return RangeTimerState(
      elapsedSeconds: elapsedSeconds,
      isInRange: true,
      rangeStateChangedAt: now,
      outOfRangeSince: null,
    );
  }

  // 이 시점부터는 물리적으로 반경 밖.
  if (!state.isInRange) {
    return state; // 이미 정지된 상태 — 계속 정지 유지.
  }

  // 유예 시계는 "핑을 받은 시점"이 아니라 "마지막으로 반경 안이 확인된
  // 시점"(rangeStateChangedAt)부터 시작한다.
  final outOfRangeSince = state.outOfRangeSince ?? state.rangeStateChangedAt;
  final outDuration = _diffSeconds(outOfRangeSince, now);

  if (outDuration < gracePeriodSeconds) {
    return RangeTimerState(
      elapsedSeconds:
          state.elapsedSeconds + _diffSeconds(state.rangeStateChangedAt, now),
      isInRange: true,
      rangeStateChangedAt: now,
      outOfRangeSince: outOfRangeSince,
    );
  }

  final graceExpiry = _addSeconds(outOfRangeSince, gracePeriodSeconds);
  return RangeTimerState(
    elapsedSeconds: state.elapsedSeconds +
        _diffSeconds(state.rangeStateChangedAt, graceExpiry),
    isInRange: false,
    rangeStateChangedAt: graceExpiry,
    outOfRangeSince: outOfRangeSince,
  );
}

double computeCurrentElapsedSeconds(RangeTimerState state, DateTime now) {
  if (!state.isInRange) return state.elapsedSeconds;
  return state.elapsedSeconds + _diffSeconds(state.rangeStateChangedAt, now);
}

bool canExit(RangeTimerState state, DateTime now, int minStaySeconds) {
  return computeCurrentElapsedSeconds(state, now) >= minStaySeconds;
}
