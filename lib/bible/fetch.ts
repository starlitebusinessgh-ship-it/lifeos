import { BIBLE_BOOKS, getBibleBook } from "./books";
import { loadLocalChapter, searchLocalBible } from "./local";
import type { BibleTranslationId } from "./translations";

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapterPayload {
  book: string;
  bookId: string;
  chapter: number;
  translation: string;
  verses: BibleVerse[];
  reference: string;
}

export interface BibleSearchHit {
  reference: string;
  text: string;
  bookId?: string;
  chapter?: number;
  verse?: number;
}

export async function fetchBibleChapter(
  bookId: string,
  chapter: number,
  translationId: BibleTranslationId = "kjv"
): Promise<BibleChapterPayload | { error: string }> {
  return loadLocalChapter(bookId, chapter, translationId);
}

export async function searchBible(
  query: string,
  translationId: BibleTranslationId = "kjv"
): Promise<BibleSearchHit[] | { error: string }> {
  const q = query.trim();
  if (q.length < 3) return [];

  const ref = parseReferenceQuery(q);
  if (ref) {
    const result = loadLocalChapter(ref.bookId, ref.chapter, translationId);
    if ("error" in result) return { error: result.error };
    const book = getBibleBook(ref.bookId);
    const verses = ref.verse
      ? result.verses.filter((v) => v.verse === ref.verse)
      : result.verses;
    return verses.map((v) => ({
      reference: `${book?.name ?? ref.bookId} ${ref.chapter}:${v.verse}`,
      text: v.text,
      bookId: ref.bookId,
      chapter: ref.chapter,
      verse: v.verse,
    }));
  }

  return searchLocalBible(q, translationId);
}

function parseReferenceQuery(
  query: string
): { bookId: string; chapter: number; verse?: number } | null {
  const q = query.trim().toLowerCase();
  const m = q.match(/^(\d?\s*[a-z][a-z\s]*?)\s+(\d+)(?::(\d+))?$/);
  if (!m) return null;

  const bookName = m[1].replace(/\s+/g, " ").trim();
  const chapter = Number(m[2]);
  const verse = m[3] ? Number(m[3]) : undefined;
  if (!Number.isFinite(chapter)) return null;

  const book = BIBLE_BOOKS.find(
    (b) =>
      b.name.toLowerCase() === bookName ||
      b.name.toLowerCase().replace(/\s+/g, "") === bookName.replace(/\s+/g, "")
  );
  if (!book) return null;
  return { bookId: book.id, chapter, verse };
}
