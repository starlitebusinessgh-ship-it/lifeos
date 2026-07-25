import { supabase } from "@/lib/supabase";
import type { LibraryBook, LibraryHighlight } from "./types";

export interface HighlightDraft {
  quote: string;
  note?: string | null;
  page?: number | null;
  color?: string;
}

export interface HighlightWithBook extends LibraryHighlight {
  book_title: string;
  book_author: string | null;
}

const HIGHLIGHT_SELECT =
  "id, book_id, quote, note, page, color, created_at, library_books(title, author)";

function mapHighlightRow(row: Record<string, unknown>): HighlightWithBook {
  const book = row.library_books as { title: string; author: string | null } | null;
  return {
    id: row.id as string,
    book_id: row.book_id as string,
    quote: row.quote as string,
    note: (row.note as string | null) ?? null,
    page: (row.page as number | null) ?? null,
    color: row.color as string,
    created_at: row.created_at as string,
    book_title: book?.title ?? "Unknown",
    book_author: book?.author ?? null,
  };
}

export async function fetchBookHighlights(bookId: string): Promise<LibraryHighlight[]> {
  const { data, error } = await supabase
    .from("library_highlights")
    .select("id, book_id, quote, note, page, color, created_at")
    .eq("book_id", bookId)
    .order("page", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as LibraryHighlight[];
}

export async function fetchAllHighlights(): Promise<HighlightWithBook[]> {
  const { data, error } = await supabase
    .from("library_highlights")
    .select(HIGHLIGHT_SELECT)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapHighlightRow(row as Record<string, unknown>));
}

export async function createHighlight(
  bookId: string,
  draft: HighlightDraft
): Promise<LibraryHighlight | null> {
  const { data, error } = await supabase
    .from("library_highlights")
    .insert({
      book_id: bookId,
      quote: draft.quote.trim(),
      note: draft.note?.trim() || null,
      page: draft.page ?? null,
      color: draft.color ?? "#F6D860",
    })
    .select("id, book_id, quote, note, page, color, created_at")
    .single();
  if (error || !data) return null;
  return data as LibraryHighlight;
}

export async function deleteHighlight(id: string): Promise<boolean> {
  const { error } = await supabase.from("library_highlights").delete().eq("id", id);
  return !error;
}

export function formatHighlightForCapture(
  book: Pick<LibraryBook, "title" | "author">,
  quote: string,
  page?: number | null,
  note?: string | null
): { title: string; content: string } {
  const pageLabel = page ? `, p.${page}` : "";
  const title = `From ${book.title}${pageLabel}`;
  const lines = [`"${quote}"`];
  if (note?.trim()) lines.push("", note.trim());
  if (book.author) lines.push("", `— ${book.author}`);
  return { title, content: lines.join("\n") };
}

export async function sendQuoteToInbox(
  book: Pick<LibraryBook, "title" | "author">,
  quote: string,
  page?: number | null,
  note?: string | null
): Promise<number | null> {
  const { title, content } = formatHighlightForCapture(book, quote, page, note);
  const { data, error } = await supabase
    .from("lifeos_inbox_items")
    .insert({
      capture_type: "book_note",
      life_area: "Learning",
      title,
      content,
      raw_content: quote,
      tags: ["highlight"],
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as number;
}

export async function sendQuoteToToday(
  book: Pick<LibraryBook, "title" | "author">,
  quote: string,
  page?: number | null
): Promise<number | null> {
  const day = new Date().toISOString().slice(0, 10);
  const pageLabel = page ? ` (p.${page})` : "";
  const title =
    quote.length > 72 ? `${quote.slice(0, 69)}…${pageLabel}` : `${quote}${pageLabel}`;
  const { data, error } = await supabase
    .from("lifeos_today_tasks")
    .insert({
      day_date: day,
      title: `Read: ${title}`,
      hour: null,
      minute: null,
      duration_mins: 0,
      completed: false,
      is_focus: false,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id as number;
}
