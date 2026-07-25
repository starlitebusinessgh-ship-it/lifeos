"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deletePdfFile, uploadPdfFile } from "./storage";
import type {
  LibraryBook,
  LibraryBookDraft,
  LibraryBookMetaUpdate,
  ReadingState,
} from "./types";
import { inferReadingStateFromProgress } from "./readingState";

const SELECT =
  "id, title, author, file_path, file_name, total_pages, current_page, cover_color, cover_url, category, notes, reading_state, tags, series, series_index, publisher, published_year, rating, review, last_read_at, created_at, updated_at";

async function fetchCoverUrl(title: string, author?: string | null): Promise<string | null> {
  const params = new URLSearchParams({ title: title.trim() });
  if (author?.trim()) params.set("author", author.trim());
  try {
    const res = await fetch(`/api/learn-cover?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string | null };
    return data.url ?? null;
  } catch {
    return null;
  }
}

async function backfillMissingCovers(
  bookList: LibraryBook[],
  onUpdate: (id: string, cover_url: string) => void
): Promise<void> {
  const missing = bookList.filter((b) => !b.cover_url).slice(0, 6);
  await Promise.all(
    missing.map(async (book) => {
      const url = await fetchCoverUrl(book.title, book.author);
      if (!url) return;
      const { error } = await supabase
        .from("library_books")
        .update({ cover_url: url })
        .eq("id", book.id);
      if (!error) onUpdate(book.id, url);
    })
  );
}

function normalizeBook(row: LibraryBook): LibraryBook {
  return {
    ...row,
    tags: row.tags ?? [],
    rating: row.rating ?? null,
    review: row.review ?? null,
  };
}

export function useLibrary() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("library_books")
      .select(SELECT)
      .order("last_read_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });
    if (!error && data) {
      const normalized = (data as LibraryBook[]).map(normalizeBook);
      setBooks(normalized);
      void backfillMissingCovers(normalized, (id, cover_url) => {
        setBooks((prev) =>
          prev.map((b) => (b.id === id ? { ...b, cover_url } : b))
        );
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function addBook(
    file: File,
    draft: LibraryBookDraft
  ): Promise<{ book: LibraryBook | null; error: string | null }> {
    const { data: row, error: insertError } = await supabase
      .from("library_books")
      .insert({
        title: draft.title.trim(),
        author: draft.author?.trim() || null,
        category: draft.category,
        cover_color: draft.cover_color,
        reading_state: draft.reading_state ?? "want_to_read",
        tags: draft.tags ?? [],
        series: draft.series?.trim() || null,
        series_index: draft.series_index ?? null,
        publisher: draft.publisher?.trim() || null,
        published_year: draft.published_year ?? null,
        file_path: "pending",
        file_name: file.name,
      })
      .select(SELECT)
      .single();

    if (insertError || !row) {
      return { book: null, error: insertError?.message ?? "Could not create book" };
    }

    const book = normalizeBook(row as LibraryBook);
    const { path, error: uploadError } = await uploadPdfFile(book.id, file);
    if (!path || uploadError) {
      await supabase.from("library_books").delete().eq("id", book.id);
      return { book: null, error: uploadError ?? "Upload failed" };
    }

    const { data: updated, error: updateError } = await supabase
      .from("library_books")
      .update({ file_path: path })
      .eq("id", book.id)
      .select(SELECT)
      .single();

    if (updateError || !updated) {
      return { book: null, error: updateError?.message ?? "Could not finalize upload" };
    }

    const finalBook = normalizeBook(updated as LibraryBook);
    const coverUrl = await fetchCoverUrl(finalBook.title, finalBook.author);
    if (coverUrl) {
      await supabase.from("library_books").update({ cover_url: coverUrl }).eq("id", finalBook.id);
      finalBook.cover_url = coverUrl;
    }

    await reload();
    return { book: finalBook, error: null };
  }

  async function updateBookMeta(id: string, meta: LibraryBookMetaUpdate): Promise<boolean> {
    const payload: Record<string, unknown> = {};
    if (meta.title !== undefined) payload.title = meta.title.trim();
    if (meta.author !== undefined) payload.author = meta.author?.trim() || null;
    if (meta.category !== undefined) payload.category = meta.category;
    if (meta.tags !== undefined) payload.tags = meta.tags;
    if (meta.series !== undefined) payload.series = meta.series?.trim() || null;
    if (meta.series_index !== undefined) payload.series_index = meta.series_index;
    if (meta.publisher !== undefined) payload.publisher = meta.publisher?.trim() || null;
    if (meta.published_year !== undefined) payload.published_year = meta.published_year;
    if (meta.cover_url !== undefined) payload.cover_url = meta.cover_url?.trim() || null;

    const { error } = await supabase.from("library_books").update(payload).eq("id", id);
    if (error) return false;
    await reload();
    return true;
  }

  async function updateProgress(
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

    await reload();
  }

  async function updateReadingState(id: string, reading_state: ReadingState): Promise<boolean> {
    const { error } = await supabase
      .from("library_books")
      .update({ reading_state })
      .eq("id", id);
    if (error) return false;
    await reload();
    return true;
  }

  async function deleteBook(book: LibraryBook): Promise<boolean> {
    if (book.file_path && book.file_path !== "pending") {
      await deletePdfFile(book.file_path);
    }
    const { error } = await supabase.from("library_books").delete().eq("id", book.id);
    if (error) return false;
    await reload();
    return true;
  }

  return {
    books,
    loading,
    reload,
    addBook,
    updateBookMeta,
    updateProgress,
    updateReadingState,
    deleteBook,
  };
}

export function useBook(id: string) {
  const [book, setBook] = useState<LibraryBook | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("library_books")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (!error && data) setBook(normalizeBook(data as LibraryBook));
    else setBook(null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  return { book, loading, reload };
}
