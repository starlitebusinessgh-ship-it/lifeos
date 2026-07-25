import { supabase } from "@/lib/supabase";
import { inferReadingStateFromProgress } from "./readingState";

export async function saveReadingProgress(
  id: string,
  currentPage: number,
  totalPages?: number
): Promise<void> {
  const { data: existing } = await supabase
    .from("library_books")
    .select("current_page")
    .eq("id", id)
    .maybeSingle();

  const prevPage = (existing?.current_page as number | undefined) ?? 0;
  const reading_state = inferReadingStateFromProgress(currentPage, totalPages);
  const payload: Record<string, unknown> = {
    current_page: currentPage,
    last_read_at: new Date().toISOString(),
    reading_state,
  };
  if (totalPages && totalPages > 0) payload.total_pages = totalPages;

  await supabase.from("library_books").update(payload).eq("id", id);

  const delta = currentPage - prevPage;
  if (delta > 0) {
    await supabase.from("library_reading_log").insert({
      book_id: id,
      pages_delta: delta,
      page_end: currentPage,
    });
  }
}
