/// 문서 9.2절에 명시된 고정 이모지 반응 목록.
export const ALLOWED_REACTION_EMOJIS = ['🔥', '👍', '😄', '👏', '🏆', '❤️', '💪', '😮'] as const;

export function isValidReactionEmoji(emoji: string): boolean {
  return (ALLOWED_REACTION_EMOJIS as readonly string[]).includes(emoji);
}
