import { isAnchorDisconnected } from './anchor-failover-resolver';

describe('isAnchorDisconnected', () => {
  const lastPing = new Date('2026-01-01T00:00:00Z');

  it('핑 주기(10초)의 3배(30초) 미만이면 연결 유지로 판단', () => {
    const now = new Date(lastPing.getTime() + 29_000);
    expect(isAnchorDisconnected(lastPing, now)).toBe(false);
  });

  it('30초 이상 핑이 없으면 연결 끊김으로 판단', () => {
    const now = new Date(lastPing.getTime() + 30_000);
    expect(isAnchorDisconnected(lastPing, now)).toBe(true);
  });

  it('커스텀 핑 주기를 지정할 수 있다', () => {
    const now = new Date(lastPing.getTime() + 20_000);
    expect(isAnchorDisconnected(lastPing, now, 5)).toBe(true); // 5*3=15 < 20
    expect(isAnchorDisconnected(lastPing, now, 10)).toBe(false); // 10*3=30 > 20
  });
});
