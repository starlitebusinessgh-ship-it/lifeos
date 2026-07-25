import type { LibraryBook } from "./types";
import { resolveReadingState } from "./readingState";

export function pickContinueBook(books: LibraryBook[]): LibraryBook | null {
  if (books.length === 0) return null;

  const reading = books.filter((b) => resolveReadingState(b) === "reading");
  const pool = reading.length > 0 ? reading : books.filter((b) => b.current_page > 0);

  if (pool.length === 0) return null;

  return [...pool].sort((a, b) => {
    const ta = a.last_read_at ?? a.updated_at;
    const tb = b.last_read_at ?? b.updated_at;
    return tb.localeCompare(ta);
  })[0];
}
