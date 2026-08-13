import { MINIMUM_STAY_SECONDS } from './checkin-constants';

/// 퇴장 체크인 시 지급하는 `pium_score_earned` 계산.
///
/// 문서에는 정확한 공식이 없고, 6.3절 응답 예시에 "total_seconds: 5400
/// (90분) → pium_score_earned: 8" 딱 한 건만 주어져 있다. 이 예시와 정확히
/// 맞아떨어지는 가장 단순한 공식을 채택했다: `floor(분/10) - 1`
/// (60분=최소 체류 기준 5점, 이후 10분마다 +1점). 90분 → floor(9)-1 = 8로
/// 문서 예시와 일치한다. 실제 서비스 반영 전 기획팀 확인 필요 — 잠정 공식.
export function computeCheckinScore(elapsedSeconds: number): number {
  if (elapsedSeconds < MINIMUM_STAY_SECONDS) return 0;
  const minutes = Math.floor(elapsedSeconds / 60);
  return Math.max(0, Math.floor(minutes / 10) - 1);
}
