"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createHighlight,
  deleteHighlight,
  fetchAllHighlights,
  fetchBookHighlights,
  type HighlightDraft,
  type HighlightWithBook,
} from "./highlightActions";
import type { LibraryHighlight } from "./types";

export function useBookHighlights(bookId: string) {
  const [highlights, setHighlights] = useState<LibraryHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await fetchBookHighlights(bookId);
    setHighlights(data);
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function addHighlight(draft: HighlightDraft): Promise<LibraryHighlight | null> {
    const row = await createHighlight(bookId, draft);
    if (row) await reload();
    return row;
  }

  async function removeHighlight(id: string): Promise<boolean> {
    const ok = await deleteHighlight(id);
    if (ok) await reload();
    return ok;
  }

  return { highlights, loading, reload, addHighlight, removeHighlight };
}

export function useAllHighlights() {
  const [highlights, setHighlights] = useState<HighlightWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const data = await fetchAllHighlights();
    setHighlights(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function removeHighlight(id: string): Promise<boolean> {
    const ok = await deleteHighlight(id);
    if (ok) await reload();
    return ok;
  }

  return { highlights, loading, reload, removeHighlight };
}
