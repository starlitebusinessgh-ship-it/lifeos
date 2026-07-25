const POS_LABELS: Record<string, string> = {
  N: "Noun",
  V: "Verb",
  A: "Adjective",
  P: "Preposition",
  C: "Conjunction",
  R: "Relative",
  D: "Adverb",
  T: "Particle",
  I: "Interjection",
  X: "Particle",
  RA: "Article",
  RD: "Demonstrative",
  RP: "Pronoun",
  RI: "Interrogative",
};

export function posLabel(code?: string): string | null {
  if (!code) return null;
  const key = code.toUpperCase();
  return POS_LABELS[key] ?? POS_LABELS[key.charAt(0)] ?? code;
}
