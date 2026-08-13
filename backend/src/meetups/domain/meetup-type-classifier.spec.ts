import { classifyMeetupType } from './meetup-type-classifier';

describe('classifyMeetupType', () => {
  it('2명이면 소모임', () => {
    expect(classifyMeetupType(2)).toBe('small');
  });

  it('15명이면 소모임 (경계)', () => {
    expect(classifyMeetupType(15)).toBe('small');
  });

  it('16명이면 대모임 (경계)', () => {
    expect(classifyMeetupType(16)).toBe('large');
  });

  it('100명이면 대모임', () => {
    expect(classifyMeetupType(100)).toBe('large');
  });
});
