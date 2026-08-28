const BLOCKED_WORDS = ["fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "piss", "cock", "whore", "slut"];

export function containsProfanity(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => new RegExp(`\\b${w}\\w*\\b`, "i").test(lower));
}
