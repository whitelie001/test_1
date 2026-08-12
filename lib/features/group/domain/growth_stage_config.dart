/// 모임 성장 단계의 임계값 설정.
///
/// 5단계(stage 1~5)를 만들기 위해 threshold 4개가 필요하다. 누적 포인트가
/// `stageThresholds[i]` 이상이면 stage가 i+2가 된다.
///
/// 주의: 여기 값과 단계별 이모지/캐릭터 디자인은 별도 후속 작업에서
/// 확정하기로 사용자와 합의했다. 지금은 값만 바꿔 끼울 수 있는 형태로만
/// 준비해두고, [placeholder]는 실제 서비스에 쓰기 전 반드시 교체해야 한다.
class GrowthStageConfig {
  GrowthStageConfig({required this.stageThresholds})
      : assert(
          stageThresholds.length == 4,
          '5단계 구성을 위해 threshold는 정확히 4개여야 합니다.',
        );

  final List<double> stageThresholds;

  /// TODO: 후속 작업에서 실제 임계값으로 교체.
  static final placeholder = GrowthStageConfig(
    stageThresholds: [100, 300, 600, 1000],
  );
}
