import fs from "fs";
import path from "path";
import { BIBLE_BOOKS, getBibleBook } from "./books";
import { localBookPath } from "./paths";
import type { BibleChapterPayload, BibleSearchHit, BibleVerse } from "./fetch";
import type { BibleTranslationId } from "./translations";
import { getTranslation } from "./translations";

export interface LocalBookFile {
  bookId: string;
  book: string;
  translation: string;
  chapters: Record<string, BibleVerse[]>;
}

function readBookFile(translationId: string, bookId: string): LocalBookFile | null {
  const filePath = localBookPath(translationId, bookId);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as LocalBookFile;
  } catch {
    return null;
  }
}

export function hasLocalTranslation(translationId: string): boolean {
  const dir = path.join(process.cwd(), "data", "bible", translationId);
  return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith(".json"));
}

export function loadLocalChapter(
  bookId: string,
  chapter: number,
  translationId: BibleTranslationId
): BibleChapterPayload | { error: string } {
  const book = getBibleBook(bookId);
  if (!book) return { error: "Unknown book" };
  if (chapter < 1 || chapter > book.chapters) return { error: "Invalid chapter" };

  const translation = getTranslation(translationId);
  const file = readBookFile(translationId, bookId);
  if (!file) {
    return {
      error: `Offline text not installed for ${translation.short}. Run: npm run bible:build`,
    };
  }

  const verses = file.chapters[String(chapter)];
  if (!verses?.length) return { error: "Chapter not found" };

  return {
    book: book.name,
    bookId: book.id,
    chapter,
    translation: translation.short,
    reference: `${book.name} ${chapter}`,
    verses,
  };
}

const searchIndexCache: Partial<Record<BibleTranslationId, BibleSearchHit[]>> = {};

export function searchLocalBible(
  query: string,
  translationId: BibleTranslationId,
  limit = 40
): BibleSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];

  const indexPath = path.join(process.cwd(), "data", "bible", "search", `${translationId}.json`);
  if (!fs.existsSync(indexPath)) return [];

  if (!searchIndexCache[translationId]) {
    try {
      searchIndexCache[translationId] = JSON.parse(
        fs.readFileSync(indexPath, "utf8")
      ) as BibleSearchHit[];
    } catch {
      return [];
    }
  }

  const index = searchIndexCache[translationId] ?? [];
  return index.filter((h) => h.text.toLowerCase().includes(q)).slice(0, limit);
}
