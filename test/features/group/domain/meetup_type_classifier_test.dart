import 'package:flutter_test/flutter_test.dart';
import 'package:pium/features/group/domain/meetup_type_classifier.dart';

void main() {
  group('classifyMeetupType', () {
    test('2명이면 소모임', () {
      expect(classifyMeetupType(2), MeetupType.small);
    });

    test('15명이면 소모임 (경계)', () {
      expect(classifyMeetupType(15), MeetupType.small);
    });

    test('16명이면 대모임 (경계)', () {
      expect(classifyMeetupType(16), MeetupType.large);
    });

    test('100명이면 대모임', () {
      expect(classifyMeetupType(100), MeetupType.large);
    });
  });
}
