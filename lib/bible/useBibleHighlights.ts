"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createBibleHighlight,
  deleteBibleHighlight,
  fetchChapterHighlights,
  type BibleHighlight,
} from "./bibleHighlightActions";

export function useBibleChapterHighlights(
  bookId: string,
  chapter: number,
  translation: string
) {
  const [highlights, setHighlights] = useState<BibleHighlight[]>([]);

  const reload = useCallback(async () => {
    setHighlights(await fetchChapterHighlights(bookId, chapter, translation));
  }, [bookId, chapter, translation]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function add(
    verseStart: number,
    verseEnd: number,
    color: string,
    note?: string | null
  ) {
    const row = await createBibleHighlight(
      bookId,
      chapter,
      verseStart,
      verseEnd,
      translation,
      color,
      note
    );
    if (row) await reload();
    return row;
  }

  async function remove(id: string) {
    const ok = await deleteBibleHighlight(id);
    if (ok) await reload();
    return ok;
  }

  return { highlights, reload, add, remove };
}
