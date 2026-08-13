import { isValidReactionEmoji } from './reaction-emojis';

describe('isValidReactionEmoji', () => {
  it('허용된 이모지는 true', () => {
    expect(isValidReactionEmoji('🔥')).toBe(true);
    expect(isValidReactionEmoji('❤️')).toBe(true);
  });

  it('허용되지 않은 이모지는 false', () => {
    expect(isValidReactionEmoji('😂')).toBe(false);
  });
});
