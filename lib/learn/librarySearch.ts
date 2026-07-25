import type { LibraryBook } from "./types";

export interface HighlightSearchHit {
  id: string;
  book_id: string;
  quote: string;
  note: string | null;
  page: number | null;
  book_title: string;
  book_author: string | null;
}

export function searchLibraryBooks(books: LibraryBook[], query: string): LibraryBook[] {
  const q = query.trim().toLowerCase();
  if (!q) return books.slice(0, 12);
  return books
    .filter((b) => {
      const hay = [
        b.title,
        b.author ?? "",
        b.category,
        b.series ?? "",
        ...(b.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 20);
}

export function searchHighlights(hits: HighlightSearchHit[], query: string): HighlightSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return hits.slice(0, 12);
  return hits
    .filter(
      (h) =>
        h.quote.toLowerCase().includes(q) ||
        (h.note?.toLowerCase().includes(q) ?? false) ||
        h.book_title.toLowerCase().includes(q) ||
        (h.book_author?.toLowerCase().includes(q) ?? false)
    )
    .slice(0, 20);
}
