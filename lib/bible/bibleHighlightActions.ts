import { supabase } from "@/lib/supabase";

export interface BibleHighlight {
  id: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  color: string;
  note: string | null;
  translation: string;
  created_at: string;
}

export async function fetchChapterHighlights(
  bookId: string,
  chapter: number,
  translation: string
): Promise<BibleHighlight[]> {
  const { data, error } = await supabase
    .from("bible_highlights")
    .select("*")
    .eq("book_id", bookId)
    .eq("chapter", chapter)
    .eq("translation", translation);
  if (error || !data) return [];
  return data as BibleHighlight[];
}

export async function createBibleHighlight(
  bookId: string,
  chapter: number,
  verseStart: number,
  verseEnd: number,
  translation: string,
  color: string,
  note?: string | null
): Promise<BibleHighlight | null> {
  const { data, error } = await supabase
    .from("bible_highlights")
    .insert({
      book_id: bookId,
      chapter,
      verse_start: verseStart,
      verse_end: verseEnd,
      translation,
      color,
      note: note ?? null,
    })
    .select()
    .single();
  if (error || !data) return null;
  return data as BibleHighlight;
}

export async function deleteBibleHighlight(id: string): Promise<boolean> {
  const { error } = await supabase.from("bible_highlights").delete().eq("id", id);
  return !error;
}

export function verseHighlightColor(
  highlights: BibleHighlight[],
  verse: number
): string | null {
  const hit = highlights.find((h) => verse >= h.verse_start && verse <= h.verse_end);
  return hit?.color ?? null;
}
