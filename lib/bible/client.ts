import type { BibleChapterPayload, BibleVerse } from "./fetch";
import type { BibleTranslationId } from "./translations";
import { getTranslation } from "./translations";
import { publicBookUrl } from "./paths";

interface LocalBookFile {
  bookId: string;
  book: string;
  translation: string;
  chapters: Record<string, BibleVerse[]>;
}

const bookCache = new Map<string, LocalBookFile>();

function cacheKey(translationId: string, bookId: string) {
  return `${translationId}:${bookId}`;
}

async function loadBookFile(
  translationId: BibleTranslationId,
  bookId: string
): Promise<LocalBookFile | null> {
  const key = cacheKey(translationId, bookId);
  if (bookCache.has(key)) return bookCache.get(key)!;

  const url = publicBookUrl(translationId, bookId);
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const data = (await res.json()) as LocalBookFile;
    bookCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

export function prefetchBook(translationId: BibleTranslationId, bookId: string) {
  void loadBookFile(translationId, bookId);
}

export async function loadChapterClient(
  bookId: string,
  chapter: number,
  translationId: BibleTranslationId
): Promise<BibleChapterPayload | { error: string }> {
  const translation = getTranslation(translationId);
  const file = await loadBookFile(translationId, bookId);

  if (!file) {
    return {
      error: `Offline ${translation.short} not installed. Run: npm run bible:build`,
    };
  }

  const verses = file.chapters[String(chapter)];
  if (!verses?.length) return { error: "Chapter not found" };

  return {
    book: file.book,
    bookId: file.bookId,
    chapter,
    translation: translation.short,
    reference: `${file.book} ${chapter}`,
    verses,
  };
}
