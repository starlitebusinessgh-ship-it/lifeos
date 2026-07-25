import type { LibraryBook, ReadingState } from "./types";
import { bookProgress } from "./types";
import { resolveReadingState } from "./readingState";

export type ShelfViewMode = "grid" | "list";

export type ShelfSortKey =
  | "recently_read"
  | "recently_added"
  | "title_az"
  | "author_az"
  | "progress"
  | "series"
  | "rating";

export const SHELF_SORT_OPTIONS: { key: ShelfSortKey; label: string }[] = [
  { key: "recently_read", label: "Recently read" },
  { key: "recently_added", label: "Recently added" },
  { key: "title_az", label: "Title A–Z" },
  { key: "author_az", label: "Author A–Z" },
  { key: "progress", label: "Progress" },
  { key: "series", label: "Series order" },
  { key: "rating", label: "Highest rated" },
];

export interface ShelfFilters {
  query: string;
  status: ReadingState | "all";
  tag: string | "all";
  series: string | "all";
}

export const DEFAULT_SHELF_FILTERS: ShelfFilters = {
  query: "",
  status: "all",
  tag: "all",
  series: "all",
};

export function collectSeriesFromBooks(books: LibraryBook[]): string[] {
  const set = new Set<string>();
  for (const b of books) {
    if (b.series?.trim()) set.add(b.series.trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function filterBooks(books: LibraryBook[], filters: ShelfFilters): LibraryBook[] {
  const q = filters.query.trim().toLowerCase();

  return books.filter((book) => {
    if (filters.status !== "all" && resolveReadingState(book) !== filters.status) {
      return false;
    }
    if (filters.tag !== "all" && !(book.tags ?? []).includes(filters.tag)) {
      return false;
    }
    if (filters.series !== "all" && (book.series?.trim() ?? "") !== filters.series) {
      return false;
    }
    if (!q) return true;

    const haystack = [
      book.title,
      book.author ?? "",
      book.series ?? "",
      book.publisher ?? "",
      ...(book.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function sortBooks(books: LibraryBook[], sort: ShelfSortKey): LibraryBook[] {
  const list = [...books];

  switch (sort) {
    case "recently_added":
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case "title_az":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case "author_az":
      return list.sort((a, b) => (a.author ?? "zzz").localeCompare(b.author ?? "zzz"));
    case "progress":
      return list.sort((a, b) => bookProgress(b) - bookProgress(a));
    case "series":
      return list.sort((a, b) => {
        const sa = a.series?.trim() ?? "";
        const sb = b.series?.trim() ?? "";
        if (sa !== sb) {
          if (!sa) return 1;
          if (!sb) return -1;
          return sa.localeCompare(sb);
        }
        const ia = a.series_index ?? 9999;
        const ib = b.series_index ?? 9999;
        if (ia !== ib) return ia - ib;
        return a.title.localeCompare(b.title);
      });
    case "rating":
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "recently_read":
    default:
      return list.sort((a, b) => {
        const ta = a.last_read_at ?? a.updated_at;
        const tb = b.last_read_at ?? b.updated_at;
        return tb.localeCompare(ta);
      });
  }
}

export function applyShelfQuery(
  books: LibraryBook[],
  filters: ShelfFilters,
  sort: ShelfSortKey
): LibraryBook[] {
  return sortBooks(filterBooks(books, filters), sort);
}
