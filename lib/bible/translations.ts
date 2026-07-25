export type BibleTranslationId =
  | "kjv"
  | "nkjv"
  | "niv"
  | "nlt"
  | "nasb"
  | "msg";

export interface BibleTranslation {
  id: BibleTranslationId;
  label: string;
  short: string;
  /** Bolls.life translation slug for bulk download */
  bollsSlug: string;
}

export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  { id: "kjv", label: "King James Version", short: "KJV", bollsSlug: "KJV" },
  { id: "nkjv", label: "New King James Version", short: "NKJV", bollsSlug: "NKJV" },
  { id: "niv", label: "New International Version", short: "NIV", bollsSlug: "NIV" },
  { id: "nlt", label: "New Living Translation", short: "NLT", bollsSlug: "NLT" },
  { id: "nasb", label: "New American Standard Bible", short: "NASB", bollsSlug: "NASB" },
  { id: "msg", label: "The Message", short: "MSG", bollsSlug: "MSG" },
];

export function getTranslation(id: string): BibleTranslation {
  return BIBLE_TRANSLATIONS.find((t) => t.id === id) ?? BIBLE_TRANSLATIONS[0];
}

export const BIBLE_TRANSLATION_STORAGE_KEY = "lifeos-bible-translation";
