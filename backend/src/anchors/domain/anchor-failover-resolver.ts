import { ANCHOR_PING_INTERVAL_SECONDS } from './anchor-constants';

/// 팀장 위치 핑(10초 주기)이 일정 횟수 이상 끊기면 "연결 끊김"으로 판정한다.
/// 문서에 정확한 임계값이 없어 핑 주기의 3배(30초)를 기본값으로 잠정 채택.
export function isAnchorDisconnected(
  lastPingAt: Date,
  now: Date,
  pingIntervalSeconds: number = ANCHOR_PING_INTERVAL_SECONDS,
): boolean {
  const elapsedSeconds = (now.getTime() - lastPingAt.getTime()) / 1000;
  return elapsedSeconds >= pingIntervalSeconds * 3;
}
