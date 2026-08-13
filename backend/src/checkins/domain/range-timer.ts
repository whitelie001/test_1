/// 반경 이탈/복귀에 따라 체류 시간을 누적/일시정지하는 순수 상태머신.
///
/// 문서 6.1절(기본 체크인 — 이탈 시 즉시 일시정지)과 6.2절(팀장 앵커 모드 —
/// 이탈 후 30초 유예)이 사실상 같은 로직에 유예시간(gracePeriodSeconds)
/// 파라미터만 다른 것이어서, 하나의 함수로 통합했다: 기본 체크인은
/// gracePeriodSeconds=0(유예 없이 즉시 정지), 앵커 모드는 30을 넘긴다.
///
/// 설계: elapsedSeconds는 "정지 상태에서도 항상 정확한" 값으로 유지한다.
/// 즉, 매 핑마다 그 시점까지의 경과를 확정해서 누적하고
/// rangeStateChangedAt을 그 시점으로 이동시킨다. 그래서 서버 재시작/앱
/// 재접속 시에도 핑 이력을 재생할 필요 없이 [computeCurrentElapsedSeconds]
/// 하나로 항상 정확한 값을 돌려줄 수 있다.
export interface RangeTimerState {
  elapsedSeconds: number;
  /// 유예 기간까지 포함해 "출석으로 인정되는 중"인지 여부.
  isInRange: boolean;
  /// 현재 세그먼트(누적 중이거나 정지 중)가 시작된 시각.
  rangeStateChangedAt: Date;
  /// 물리적으로 반경을 벗어난 것을 처음 감지한 시각. 반경 안으로 돌아오거나
  /// 유예가 끝나 정지되면 null로 리셋된다.
  outOfRangeSince: Date | null;
}

export function createInitialRangeTimerState(now: Date): RangeTimerState {
  return {
    elapsedSeconds: 0,
    isInRange: true,
    rangeStateChangedAt: now,
    outOfRangeSince: null,
  };
}

function diffSeconds(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / 1000);
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function applyLocationPing(
  state: RangeTimerState,
  params: {
    isPhysicallyInRange: boolean;
    now: Date;
    gracePeriodSeconds?: number;
  },
): RangeTimerState {
  const grace = params.gracePeriodSeconds ?? 0;
  const now = params.now;

  if (params.isPhysicallyInRange) {
    const elapsedSeconds = state.isInRange
      ? state.elapsedSeconds + diffSeconds(state.rangeStateChangedAt, now)
      : state.elapsedSeconds; // 정지되어 있던 구간은 카운트하지 않는다
    return {
      elapsedSeconds,
      isInRange: true,
      rangeStateChangedAt: now,
      outOfRangeSince: null,
    };
  }

  // 이 시점부터는 물리적으로 반경 밖.
  if (!state.isInRange) {
    // 이미 정지된 상태 — 계속 정지 유지.
    return state;
  }

  // 유예 시계는 "핑을 받은 시점"이 아니라 "마지막으로 반경 안이 확인된
  // 시점"(rangeStateChangedAt)부터 시작한다. 핑은 30초 주기라 이탈이
  // 언제 실제로 일어났는지 정확히 알 수 없으므로, 마지막 확인 시점을
  // 기준으로 삼아야 grace=0일 때 핑 사이 시간을 잘못 적립하지 않는다.
  const outOfRangeSince = state.outOfRangeSince ?? state.rangeStateChangedAt;
  const outDuration = diffSeconds(outOfRangeSince, now);

  if (outDuration < grace) {
    // 유예 기간 이내 — 아직은 출석 중인 것으로 계속 누적한다.
    return {
      elapsedSeconds:
        state.elapsedSeconds + diffSeconds(state.rangeStateChangedAt, now),
      isInRange: true,
      rangeStateChangedAt: now,
      outOfRangeSince,
    };
  }

  // 유예가 이번 핑에서 만료됨 — 유예 만료 시점까지만 인정하고 그 이후로 정지.
  const graceExpiry = addSeconds(outOfRangeSince, grace);
  return {
    elapsedSeconds:
      state.elapsedSeconds + diffSeconds(state.rangeStateChangedAt, graceExpiry),
    isInRange: false,
    rangeStateChangedAt: graceExpiry,
    outOfRangeSince,
  };
}

/// 현재 시각 기준 경과 시간. isInRange면 마지막 세그먼트를 더해 계산하고,
/// 정지 상태면 저장된 값을 그대로 돌려준다.
export function computeCurrentElapsedSeconds(
  state: RangeTimerState,
  now: Date,
): number {
  if (!state.isInRange) return state.elapsedSeconds;
  return state.elapsedSeconds + diffSeconds(state.rangeStateChangedAt, now);
}

export function canExit(
  state: RangeTimerState,
  now: Date,
  minStaySeconds: number,
): boolean {
  return computeCurrentElapsedSeconds(state, now) >= minStaySeconds;
}
