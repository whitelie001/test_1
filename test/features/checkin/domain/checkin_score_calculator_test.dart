import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/checkin/domain/checkin_score_calculator.dart';

void main() {
  group('computeCheckinScore', () {
    test('최소 체류(1시간) 미만이면 0점', () {
      expect(computeCheckinScore(3599), 0);
    });

    test('정확히 1시간이면 5점', () {
      expect(computeCheckinScore(3600), 5);
    });

    test('90분이면 8점 — 문서 예시와 일치', () {
      expect(computeCheckinScore(5400), 8);
    });
  });
}
