import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

// Covers profanity, slurs, and hateful language — not just a hand-typed
// swear-word list. englishDataset is a maintained, actively-updated corpus,
// and the recommended transformers catch common evasion tricks (leetspeak,
// added spacing/punctuation, repeated letters, etc.).
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export function containsProfanity(text) {
  if (!text) return false;
  return matcher.hasMatch(text);
}
