import 'growth_stage_config.dart';

/// 모임의 누적 성장 포인트로부터 현재 성장 단계(1~5)를 판정하는 순수 로직.
class GrowthStageResolver {
  GrowthStageResolver._();

  /// 누적 포인트가 임계값 이상이면 다음 단계로 승급한다(경계값 포함, `>=`).
  static int resolve(double cumulativePoints, GrowthStageConfig config) {
    var stage = 1;
    for (final threshold in config.stageThresholds) {
      if (cumulativePoints >= threshold) {
        stage++;
      } else {
        break;
      }
    }
    return stage.clamp(1, config.stageThresholds.length + 1);
  }
}
