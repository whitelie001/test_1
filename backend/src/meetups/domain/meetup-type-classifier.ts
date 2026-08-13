/// 문서 1.2절 기준 모임 유형 분류. 15명 이하는 소모임, 16명 이상은 대모임.
export type MeetupType = 'small' | 'large';

export const SMALL_GROUP_MAX_MEMBERS = 15;

export function classifyMeetupType(maxMembers: number): MeetupType {
  return maxMembers <= SMALL_GROUP_MAX_MEMBERS ? 'small' : 'large';
}
