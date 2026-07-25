import path from "path";

export const BIBLE_DATA_DIR = path.join(process.cwd(), "data", "bible");
export const BIBLE_PUBLIC_DIR = path.join(process.cwd(), "public", "bible", "data");
export const BIBLE_CACHE_DIR = path.join(process.cwd(), "data", "bible", "cache");
export const BIBLE_STUDY_DIR = path.join(process.cwd(), "data", "bible", "study");
export const BIBLE_SEARCH_DIR = path.join(process.cwd(), "data", "bible", "search");

export function localBookPath(translationId: string, bookId: string): string {
  return path.join(BIBLE_DATA_DIR, translationId, `${bookId}.json`);
}

export function publicBookUrl(translationId: string, bookId: string): string {
  return `/bible/data/${translationId}/${bookId}.json`;
}
