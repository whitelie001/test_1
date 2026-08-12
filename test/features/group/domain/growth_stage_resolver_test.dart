import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/group/domain/growth_stage_config.dart';
import 'package:pium/features/group/domain/growth_stage_resolver.dart';

void main() {
  group('GrowthStageResolver', () {
    // thresholds: [100, 300, 600, 1000] => stage 1~5
    final config = GrowthStageConfig.placeholder;

    test('첫 임계값 미만이면 stage 1', () {
      expect(GrowthStageResolver.resolve(0, config), 1);
      expect(GrowthStageResolver.resolve(99.99, config), 1);
    });

    test('첫 임계값과 정확히 같으면 stage 2로 승급 (경계값 포함)', () {
      expect(GrowthStageResolver.resolve(100, config), 2);
    });

    test('중간 임계값 사이면 해당 단계 유지', () {
      expect(GrowthStageResolver.resolve(299, config), 2);
      expect(GrowthStageResolver.resolve(300, config), 3);
      expect(GrowthStageResolver.resolve(599, config), 3);
      expect(GrowthStageResolver.resolve(600, config), 4);
    });

    test('마지막 임계값 이상이면 stage 5로 승급', () {
      expect(GrowthStageResolver.resolve(1000, config), 5);
    });

    test('최대 임계값을 훨씬 초과해도 stage 5로 clamp된다', () {
      expect(GrowthStageResolver.resolve(999999, config), 5);
    });
  });
}
