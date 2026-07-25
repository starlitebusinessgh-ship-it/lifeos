import { supabase } from "@/lib/supabase";

export interface BibleBookmark {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
  translation: string;
  note: string | null;
  created_at: string;
}

export async function fetchBibleBookmarks(): Promise<BibleBookmark[]> {
  const { data, error } = await supabase
    .from("bible_bookmarks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as BibleBookmark[];
}

export async function createBibleBookmark(
  bookId: string,
  chapter: number,
  verse: number,
  translation: string,
  note?: string | null
): Promise<BibleBookmark | null> {
  const { data, error } = await supabase
    .from("bible_bookmarks")
    .insert({ book_id: bookId, chapter, verse, translation, note: note ?? null })
    .select()
    .single();
  if (error || !data) return null;
  return data as BibleBookmark;
}

export async function deleteBibleBookmark(id: string): Promise<boolean> {
  const { error } = await supabase.from("bible_bookmarks").delete().eq("id", id);
  return !error;
}

export async function isVerseBookmarked(
  bookId: string,
  chapter: number,
  verse: number,
  translation: string
): Promise<BibleBookmark | null> {
  const { data, error } = await supabase
    .from("bible_bookmarks")
    .select("*")
    .eq("book_id", bookId)
    .eq("chapter", chapter)
    .eq("verse", verse)
    .eq("translation", translation)
    .maybeSingle();
  if (error || !data) return null;
  return data as BibleBookmark;
}
