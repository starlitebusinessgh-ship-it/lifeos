"use client";

import { useMemo, useState } from "react";
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
import type { HighlightWithBook } from "@/lib/learn/highlightActions";
import { useBookHighlights } from "@/lib/learn/useHighlights";
import { useHighlightLinks } from "@/lib/learn/useKnowledgeGraph";
import type { LibraryBook } from "@/lib/learn/types";
import { HighlightCard } from "./HighlightCard";
import { PinIdeaSheet } from "./PinIdeaSheet";
import { haptic } from "@/lib/finance/haptics";
import { useToast } from "@/components/finance/ToastProvider";

export function BookHighlightsPanel({
  book,
  onJumpToPage,
}: {
  book: LibraryBook;
  onJumpToPage?: (page: number) => void;
}) {
  const { highlights, loading, removeHighlight } = useBookHighlights(book.id);
  const highlightIds = useMemo(() => highlights.map((h) => h.id), [highlights]);
  const { byHighlight, reload: reloadLinks } = useHighlightLinks(highlightIds);
  const { showToast } = useToast();
  const [pinTarget, setPinTarget] = useState<(typeof highlights)[number] | null>(null);
  const [pinSaving, setPinSaving] = useState(false);

  async function handleInbox(h: (typeof highlights)[number]) {
    const ok = await sendHighlightToInbox(h.id, book, h.quote, h.page, h.note);
    showToast(ok ? "Linked to Inbox" : "Could not send to Inbox");
    if (ok) {
      haptic("success");
      void reloadLinks();
    }
  }

  async function handleToday(h: (typeof highlights)[number]) {
    const ok = await sendHighlightToToday(h.id, book, h.quote, h.page);
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

  if (loading) {
    return <div className="ln-hl-loading">Loading highlights…</div>;
  }

  if (highlights.length === 0) {
    return (
      <div className="ln-hl-empty">
        <p className="ln-hl-empty-title">No highlights yet</p>
        <p className="ln-hl-empty-sub">
          Select text while reading to highlight, add a note, or send to Inbox or Today.
        </p>
      </div>
    );
  }

  const exportRows: HighlightWithBook[] = highlights.map((h) => ({
    ...h,
    book_title: book.title,
    book_author: book.author,
  }));

  return (
    <>
      <div className="ln-hl-export-row">
        <button type="button" onClick={() => void copyHighlights(exportRows).then((ok) => showToast(ok ? "Copied" : "Copy failed"))}>
          Copy
        </button>
        <button
          type="button"
          onClick={() => downloadText(`${book.title}-highlights.md`, highlightsToMarkdown(exportRows), "text/markdown")}
        >
          Export MD
        </button>
        <button type="button" onClick={() => shareHighlights(exportRows)}>
          Share
        </button>
      </div>
      <div className="ln-hl-list">
        {highlights.map((h) => (
          <HighlightCard
            key={h.id}
            highlight={h}
            bookId={book.id}
            links={byHighlight[h.id] ?? []}
            onJumpToPage={onJumpToPage}
            onPin={() => setPinTarget(h)}
            onInbox={() => void handleInbox(h)}
            onToday={() => void handleToday(h)}
            onDelete={() => void handleDelete(h.id)}
          />
        ))}
      </div>
      <PinIdeaSheet
        open={!!pinTarget}
        quote={pinTarget?.quote ?? ""}
        saving={pinSaving}
        onClose={() => setPinTarget(null)}
        onSave={handlePin}
      />
    </>
  );
}
