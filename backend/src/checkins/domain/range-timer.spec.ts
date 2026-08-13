import {
  applyLocationPing,
  canExit,
  computeCurrentElapsedSeconds,
  createInitialRangeTimerState,
  RangeTimerState,
} from './range-timer';

const t = (secondsFromEpoch: number) => new Date(secondsFromEpoch * 1000);

describe('range-timer (grace=0, 기본 체크인)', () => {
  it('반경 안에 계속 있으면 시간이 그대로 누적된다', () => {
    let state = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(30) });
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(60) });
    expect(state.elapsedSeconds).toBe(60);
    expect(state.isInRange).toBe(true);
  });

  it('반경을 벗어나면 즉시 정지된다(유예 없음)', () => {
    let state = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(100) });
    state = applyLocationPing(state, { isPhysicallyInRange: false, now: t(130) });
    expect(state.elapsedSeconds).toBe(100);
    expect(state.isInRange).toBe(false);

    // 정지 중에는 시간이 흘러도 누적되지 않는다.
    expect(computeCurrentElapsedSeconds(state, t(500))).toBe(100);
  });

  it('정지 후 복귀하면 이탈 구간은 카운트하지 않고 재개한다', () => {
    let state = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(100) });
    state = applyLocationPing(state, { isPhysicallyInRange: false, now: t(130) }); // 100초 확정, 정지
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(500) }); // 복귀, 정지 구간 미카운트
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(520) });
    expect(state.elapsedSeconds).toBe(120); // 100 + 20
  });

  it('computeCurrentElapsedSeconds는 다음 핑 없이도 현재 시각 기준으로 계산된다', () => {
    let state = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(50) });
    expect(computeCurrentElapsedSeconds(state, t(80))).toBe(80);
  });

  it('canExit: 최소 체류 시간 경계값', () => {
    let state = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(3599) });
    expect(canExit(state, t(3599), 3600)).toBe(false);
    expect(canExit(state, t(3600), 3600)).toBe(true);
  });
});

describe('range-timer (grace=30, 팀장 앵커 모드)', () => {
  const grace = 30;

  it('유예 기간 안에 복귀하면 정지 없이 계속 누적된다', () => {
    let state = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(100) });
    // 10초간 이탈했지만 유예(30초) 이내
    state = applyLocationPing(state, {
      isPhysicallyInRange: false,
      now: t(110),
      gracePeriodSeconds: grace,
    });
    expect(state.isInRange).toBe(true); // 아직 유예 중
    state = applyLocationPing(state, {
      isPhysicallyInRange: true,
      now: t(115),
      gracePeriodSeconds: grace,
    });
    expect(state.isInRange).toBe(true);
    expect(state.elapsedSeconds).toBe(115); // 이탈 구간도 유예 내라 전부 인정
  });

  it('유예 기간을 넘기면 유예 만료 시점까지만 인정하고 정지된다', () => {
    let state = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(100) });
    // 이탈 시작
    state = applyLocationPing(state, {
      isPhysicallyInRange: false,
      now: t(110),
      gracePeriodSeconds: grace,
    });
    // 이탈 시작(t=110) 이후 40초 경과 시점(t=150) — 유예(30초) 초과
    state = applyLocationPing(state, {
      isPhysicallyInRange: false,
      now: t(150),
      gracePeriodSeconds: grace,
    });
    expect(state.isInRange).toBe(false);
    // 100(기존) + (110~140, 유예 만료 시점까지 30초) = 130
    expect(state.elapsedSeconds).toBe(130);
  });

  it('유예 만료로 정지된 뒤에도 계속 반경 밖이면 더 누적되지 않는다', () => {
    let state: RangeTimerState = createInitialRangeTimerState(t(0));
    state = applyLocationPing(state, { isPhysicallyInRange: true, now: t(100) });
    state = applyLocationPing(state, {
      isPhysicallyInRange: false,
      now: t(110),
      gracePeriodSeconds: grace,
    });
    state = applyLocationPing(state, {
      isPhysicallyInRange: false,
      now: t(150),
      gracePeriodSeconds: grace,
    }); // 정지, elapsed=130
    state = applyLocationPing(state, {
      isPhysicallyInRange: false,
      now: t(300),
      gracePeriodSeconds: grace,
    });
    expect(state.elapsedSeconds).toBe(130);
    expect(state.isInRange).toBe(false);
  });
});
