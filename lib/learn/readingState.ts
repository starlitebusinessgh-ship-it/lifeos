import type { LibraryBook, ReadingState } from "./types";
import { bookProgress } from "./types";

export const READING_STATES: ReadingState[] = [
  "want_to_read",
  "reading",
  "finished",
  "paused",
];

export const READING_STATE_LABELS: Record<ReadingState, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  finished: "Finished",
  paused: "Paused",
};

export const READING_STATE_SHORT: Record<ReadingState, string> = {
  want_to_read: "Want",
  reading: "Reading",
  finished: "Done",
  paused: "Paused",
};

export function readingStateLabel(state: ReadingState): string {
  return READING_STATE_LABELS[state];
}

export function inferReadingStateFromProgress(
  currentPage: number,
  totalPages?: number | null
): ReadingState {
  if (totalPages && totalPages > 0 && currentPage >= totalPages) return "finished";
  if (currentPage > 0) return "reading";
  return "want_to_read";
}

export function resolveReadingState(book: LibraryBook): ReadingState {
  const inferred = inferReadingStateFromProgress(book.current_page, book.total_pages);
  if (book.reading_state === "paused" && inferred === "want_to_read") return "paused";
  if (book.reading_state === "finished" && inferred !== "finished") return inferred;
  if (inferred === "finished" || inferred === "reading") return inferred;
  return book.reading_state;
}

export function booksByState(books: LibraryBook[], state: ReadingState): LibraryBook[] {
  return books.filter((b) => resolveReadingState(b) === state);
}

export function recentlyAdded(books: LibraryBook[], limit = 8): LibraryBook[] {
  return [...books]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

/** Books opened recently, sorted by last_read_at (Apple Books “Recently Opened”). */
export function recentlyOpened(
  books: LibraryBook[],
  limit = 12,
  excludeId?: string
): LibraryBook[] {
  return [...books]
    .filter((b) => b.id !== excludeId)
    .filter((b) => b.current_page > 0 || b.last_read_at)
    .sort((a, b) => {
      const ta = a.last_read_at ?? a.updated_at;
      const tb = b.last_read_at ?? b.updated_at;
      return tb.localeCompare(ta);
    })
    .slice(0, limit);
}

/** Books for Reading Now shelf: recently opened first, then recently added. */
export function readingNowShelf(
  books: LibraryBook[],
  limit = 12,
  excludeId?: string
): LibraryBook[] {
  const opened = recentlyOpened(books, limit, excludeId);
  const seen = new Set(opened.map((b) => b.id));
  if (excludeId) seen.add(excludeId);

  const added = [...books]
    .filter((b) => !seen.has(b.id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, Math.max(0, limit - opened.length));

  return [...opened, ...added].slice(0, limit);
}

export function progressStateLabel(book: LibraryBook): string {
  const state = resolveReadingState(book);
  if (state === "finished") return "Finished";
  if (state === "paused") return "Paused";
  if (state === "want_to_read") return "Not started";
  const pct = bookProgress(book);
  if (pct > 0) return `${pct}% read`;
  return "Reading";
}
