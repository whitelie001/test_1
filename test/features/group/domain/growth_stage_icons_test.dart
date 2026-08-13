import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/group/domain/growth_stage_icons.dart';

void main() {
  test('레벨별 아이콘을 올바르게 반환한다', () {
    expect(iconForGrowthLevel(0), '🌱');
    expect(iconForGrowthLevel(6), '🌳🌲🌳');
  });

  test('정의되지 않은 레벨은 씨앗 아이콘으로 대체한다', () {
    expect(iconForGrowthLevel(99), '🌱');
  });
}
