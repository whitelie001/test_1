/// 문서 1.2절 기준 모임 유형 분류. 백엔드
/// (`backend/src/meetups/domain/meetup-type-classifier.ts`)와 동일한 규칙을
/// 미러링한다 — 15명 이하는 소모임, 16명 이상은 대모임.
enum MeetupType { small, large }

const smallGroupMaxMembers = 15;

MeetupType classifyMeetupType(int maxMembers) {
  return maxMembers <= smallGroupMaxMembers ? MeetupType.small : MeetupType.large;
}
