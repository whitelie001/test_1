import '../../../core/constants/checkin_constants.dart';

/// 퇴장 체크인 시 지급하는 `pium_score_earned` 계산.
///
/// 백엔드 `checkin-exit-score-calculator.ts`와 동일한 잠정 공식 —
/// 문서 6.3절 응답 예시(90분→8점) 하나에 정확히 맞춘 `floor(분/10) - 1`.
/// 서버가 실제 신뢰 원천이며, 이 함수는 UI 미리보기용.
int computeCheckinScore(int elapsedSeconds) {
  if (elapsedSeconds < CheckinConstants.minimumStaySeconds) return 0;
  final minutes = elapsedSeconds ~/ 60;
  final score = (minutes ~/ 10) - 1;
  return score < 0 ? 0 : score;
}
