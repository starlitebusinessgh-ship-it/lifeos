"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllHighlights, type HighlightWithBook } from "./highlightActions";
import {
  actionNodeFromLink,
  fetchAllKnowledgeLinks,
  type GraphBookCluster,
  type KnowledgeLink,
} from "./knowledge";

export function useKnowledgeGraph() {
  const [highlights, setHighlights] = useState<HighlightWithBook[]>([]);
  const [links, setLinks] = useState<KnowledgeLink[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [hl, ln] = await Promise.all([fetchAllHighlights(), fetchAllKnowledgeLinks()]);
    setHighlights(hl);
    setLinks(ln);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  const clusters = useMemo(() => buildClusters(highlights, links), [highlights, links]);

  const stats = useMemo(
    () => ({
      books: clusters.length,
      highlights: highlights.length,
      links: links.length,
      ideas: links.filter((l) => l.link_type === "idea" || l.link_type === "build").length,
    }),
    [clusters.length, highlights.length, links]
  );

  return { clusters, links, loading, stats, reload };
}

function buildClusters(
  highlights: HighlightWithBook[],
  links: KnowledgeLink[]
): GraphBookCluster[] {
  const byBook = new Map<string, GraphBookCluster>();

  for (const h of highlights) {
    if (!byBook.has(h.book_id)) {
      byBook.set(h.book_id, {
        bookId: h.book_id,
        title: h.book_title,
        author: h.book_author,
        highlights: [],
      });
    }

    const hlLinks = links.filter((l) => l.highlight_id === h.id);
    byBook.get(h.book_id)!.highlights.push({
      id: h.id,
      quote: h.quote,
      note: h.note,
      page: h.page,
      color: h.color,
      actions: hlLinks.map((l) => actionNodeFromLink(l)),
    });
  }

  return [...byBook.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export function useHighlightLinks(highlightIds: string[]) {
  const [byHighlight, setByHighlight] = useState<Record<string, KnowledgeLink[]>>({});
  const idsKey = highlightIds.join(",");

  const reload = useCallback(async () => {
    if (highlightIds.length === 0) {
      setByHighlight({});
      return;
    }
    const { data } = await supabase
      .from("library_knowledge_links")
      .select("id, highlight_id, link_type, target_id, idea_title, created_at")
      .in("highlight_id", highlightIds);
    const map: Record<string, KnowledgeLink[]> = {};
    for (const row of (data ?? []) as KnowledgeLink[]) {
      if (!map[row.highlight_id]) map[row.highlight_id] = [];
      map[row.highlight_id].push(row);
    }
    setByHighlight(map);
  }, [idsKey, highlightIds]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { byHighlight, reload };
}
