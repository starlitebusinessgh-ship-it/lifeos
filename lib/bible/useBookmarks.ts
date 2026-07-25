"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createBibleBookmark,
  deleteBibleBookmark,
  fetchBibleBookmarks,
  type BibleBookmark,
} from "./bookmarkActions";

export function useBibleBookmarks() {
  const [bookmarks, setBookmarks] = useState<BibleBookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setBookmarks(await fetchBibleBookmarks());
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function add(
    bookId: string,
    chapter: number,
    verse: number,
    translation: string,
    note?: string | null
  ) {
    const row = await createBibleBookmark(bookId, chapter, verse, translation, note);
    if (row) await reload();
    return row;
  }

  async function remove(id: string) {
    const ok = await deleteBibleBookmark(id);
    if (ok) await reload();
    return ok;
  }

  return { bookmarks, loading, reload, add, remove };
}
