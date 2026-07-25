import { supabase } from "@/lib/supabase";

export interface LibraryCollection {
  id: string;
  name: string;
  description: string | null;
  cover_color: string;
  book_ids: string[];
  created_at: string;
}

export async function fetchCollections(): Promise<LibraryCollection[]> {
  const { data, error } = await supabase
    .from("library_collections")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    ...(row as Omit<LibraryCollection, "book_ids">),
    book_ids: (row.book_ids as string[]) ?? [],
  }));
}

export async function createCollection(
  name: string,
  description?: string,
  coverColor = "#6366f1"
): Promise<LibraryCollection | null> {
  const { data, error } = await supabase
    .from("library_collections")
    .insert({ name, description: description ?? null, cover_color: coverColor, book_ids: [] })
    .select()
    .single();
  if (error || !data) return null;
  return { ...(data as LibraryCollection), book_ids: [] };
}

export async function updateCollectionBooks(
  id: string,
  bookIds: string[]
): Promise<boolean> {
  const { error } = await supabase
    .from("library_collections")
    .update({ book_ids: bookIds })
    .eq("id", id);
  return !error;
}

export async function deleteCollection(id: string): Promise<boolean> {
  const { error } = await supabase.from("library_collections").delete().eq("id", id);
  return !error;
}
