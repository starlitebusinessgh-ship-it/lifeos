export { CATEGORY_IDS as BOOK_CATEGORIES, type CategoryId as BookCategory } from "./categories";

export type ReadingState = "want_to_read" | "reading" | "finished" | "paused";

export interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  file_path: string;
  file_name: string;
  total_pages: number | null;
  current_page: number;
  cover_color: string;
  cover_url: string | null;
  category: string;
  notes: string | null;
  reading_state: ReadingState;
  tags: string[];
  series: string | null;
  series_index: number | null;
  publisher: string | null;
  published_year: number | null;
  rating: number | null;
  review: string | null;
  last_read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryBookDraft {
  title: string;
  author?: string;
  category: string;
  cover_color: string;
  reading_state?: ReadingState;
  tags?: string[];
  series?: string;
  series_index?: number | null;
  publisher?: string;
  published_year?: number | null;
}

export interface LibraryBookMetaUpdate {
  title?: string;
  author?: string | null;
  category?: string;
  cover_url?: string | null;
  tags?: string[];
  series?: string | null;
  series_index?: number | null;
  publisher?: string | null;
  published_year?: number | null;
  rating?: number | null;
  review?: string | null;
}

export interface LibraryHighlight {
  id: string;
  book_id: string;
  quote: string;
  note: string | null;
  page: number | null;
  color: string;
  created_at: string;
}

export function bookProgress(book: LibraryBook): number {
  if (!book.total_pages || book.total_pages <= 0) return 0;
  return Math.min(100, Math.round((book.current_page / book.total_pages) * 100));
}

export function isInProgress(book: LibraryBook): boolean {
  return book.current_page > 0 && (!book.total_pages || book.current_page < book.total_pages);
}

export function progressLabel(book: LibraryBook): string {
  if (!book.total_pages) return book.current_page > 0 ? "Reading" : "Not started";
  const pct = bookProgress(book);
  if (pct >= 100) return "Finished";
  if (pct === 0) return "Not started";
  return `${pct}% read`;
}
