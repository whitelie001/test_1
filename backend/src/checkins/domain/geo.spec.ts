import { haversineMeters, isWithinRadius } from './geo';

describe('haversineMeters', () => {
  it('같은 좌표면 거리 0', () => {
    expect(haversineMeters(37.5665, 126.978, 37.5665, 126.978)).toBeCloseTo(0, 3);
  });

  it('서울-부산 거리는 대략 320km대', () => {
    const d = haversineMeters(37.5665, 126.978, 35.1796, 129.0756);
    expect(d).toBeGreaterThan(300_000);
    expect(d).toBeLessThan(340_000);
  });

  it('위도 0.001도 차이(약 111m)를 대략적으로 반영한다', () => {
    const d = haversineMeters(37.5665, 126.978, 37.5675, 126.978);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });
});

describe('isWithinRadius', () => {
  it('경계값 포함', () => {
    expect(isWithinRadius(100, 100)).toBe(true);
    expect(isWithinRadius(100.01, 100)).toBe(false);
  });
});
