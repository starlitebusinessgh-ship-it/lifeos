"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import {
  sendHighlightToInbox,
  sendHighlightToToday,
  pinHighlightIdea,
} from "@/lib/learn/linkActions";
import {
  copyHighlights,
  downloadText,
  highlightsToMarkdown,
  shareHighlights,
} from "@/lib/learn/exportHighlights";
import { useAllHighlights } from "@/lib/learn/useHighlights";
import { useHighlightLinks } from "@/lib/learn/useKnowledgeGraph";
import { HighlightCard } from "./HighlightCard";
import { PinIdeaSheet } from "./PinIdeaSheet";
import { haptic } from "@/lib/finance/haptics";
import { useToast } from "@/components/finance/ToastProvider";

export function GlobalHighlights() {
  const { highlights, loading, removeHighlight } = useAllHighlights();
  const highlightIds = useMemo(() => highlights.map((h) => h.id), [highlights]);
  const { byHighlight, reload: reloadLinks } = useHighlightLinks(highlightIds);
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [pinTarget, setPinTarget] = useState<(typeof highlights)[number] | null>(null);
  const [pinSaving, setPinSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return highlights;
    return highlights.filter(
      (h) =>
        h.quote.toLowerCase().includes(q) ||
        (h.note?.toLowerCase().includes(q) ?? false) ||
        h.book_title.toLowerCase().includes(q)
    );
  }, [highlights, query]);

  async function handleInbox(h: (typeof highlights)[number]) {
    const ok = await sendHighlightToInbox(
      h.id,
      { title: h.book_title, author: h.book_author },
      h.quote,
      h.page,
      h.note
    );
    showToast(ok ? "Linked to Inbox" : "Could not send to Inbox");
    if (ok) {
      haptic("success");
      void reloadLinks();
    }
  }

  async function handleToday(h: (typeof highlights)[number]) {
    const ok = await sendHighlightToToday(
      h.id,
      { title: h.book_title, author: h.book_author },
      h.quote,
      h.page
    );
    showToast(ok ? "Linked to Today" : "Could not add to Today");
    if (ok) {
      haptic("success");
      void reloadLinks();
    }
  }

  async function handlePin(title: string, asBuild: boolean) {
    if (!pinTarget) return;
    setPinSaving(true);
    const ok = await pinHighlightIdea(pinTarget.id, title, asBuild);
    setPinSaving(false);
    if (ok) {
      haptic("success");
      showToast(asBuild ? "Build seed pinned" : "Idea pinned");
      setPinTarget(null);
      void reloadLinks();
    } else {
      showToast("Could not pin idea");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this highlight?")) return;
    const ok = await removeHighlight(id);
    showToast(ok ? "Highlight removed" : "Could not delete");
  }

  return (
    <div className="ln-hl-global">
      <div className="ln-hl-search-wrap">
        <Search size={17} className="ln-hl-search-icon" />
        <input
          type="search"
          className="ln-hl-search"
          placeholder="Search highlights…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Link href="/learn/mind" className="ln-hl-mind-link" onClick={() => haptic("light")}>
        View mind map →
      </Link>

      {filtered.length > 0 && (
        <div className="ln-hl-export-row">
          <button type="button" onClick={() => void copyHighlights(filtered).then((ok) => showToast(ok ? "Copied" : "Copy failed"))}>
            Copy
          </button>
          <button
            type="button"
            onClick={() => downloadText("highlights.md", highlightsToMarkdown(filtered), "text/markdown")}
          >
            Export MD
          </button>
          <button type="button" onClick={() => shareHighlights(filtered)}>
            Share
          </button>
        </div>
      )}

      {loading ? (
        <div className="ln-hl-loading">Loading highlights…</div>
      ) : filtered.length === 0 ? (
        <div className="ln-hl-empty">
          <p className="ln-hl-empty-title">
            {highlights.length === 0 ? "No highlights yet" : "No matches"}
          </p>
          <p className="ln-hl-empty-sub">
            {highlights.length === 0
              ? "Highlight passages while reading — they'll show up here across your library."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="ln-hl-list">
          {filtered.map((h) => (
            <HighlightCard
              key={h.id}
              highlight={h}
              links={byHighlight[h.id] ?? []}
              onPin={() => setPinTarget(h)}
              onInbox={() => void handleInbox(h)}
              onToday={() => void handleToday(h)}
              onDelete={() => void handleDelete(h.id)}
            />
          ))}
        </div>
      )}

      <PinIdeaSheet
        open={!!pinTarget}
        quote={pinTarget?.quote ?? ""}
        saving={pinSaving}
        onClose={() => setPinTarget(null)}
        onSave={handlePin}
      />
    </div>
  );
}
