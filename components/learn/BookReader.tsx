"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Highlighter, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useBook } from "@/lib/learn/useLibrary";
import { useBookHighlights } from "@/lib/learn/useHighlights";
import { saveReadingProgress } from "@/lib/learn/progress";
import { pdfPublicUrl } from "@/lib/learn/storage";
import { DEFAULT_HIGHLIGHT_COLOR } from "@/lib/learn/highlightColors";
import {
  sendHighlightToInbox,
  sendHighlightToToday,
} from "@/lib/learn/linkActions";
import { bookProgress } from "@/lib/learn/types";
import type { TextSelectionPayload, ReaderTheme } from "@/components/learn/PdfReader";
import { SelectionToolbar } from "@/components/learn/SelectionToolbar";
import { HighlightNoteSheet } from "@/components/learn/HighlightNoteSheet";
import { BookHighlightsPanel } from "@/components/learn/BookHighlightsPanel";
import { BookInsightsPanel } from "@/components/learn/BookInsightsPanel";
import { haptic } from "@/lib/finance/haptics";
import { useToast } from "@/components/finance/ToastProvider";

const PdfReader = dynamic(
  () => import("@/components/learn/PdfReader").then((m) => m.PdfReader),
  { ssr: false, loading: () => <div className="ln-reader-loading">Preparing reader…</div> }
);

type ReaderTab = "read" | "highlights" | "insights";

export function BookReader({ bookId }: { bookId: string }) {
  const router = useRouter();
  const { book, loading } = useBook(bookId);
  const { highlights, addHighlight } = useBookHighlights(bookId);
  const { showToast } = useToast();

  const [tab, setTab] = useState<ReaderTab>("read");
  const [selection, setSelection] = useState<TextSelectionPayload | null>(null);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [savingHighlight, setSavingHighlight] = useState(false);
  const [jumpToPage, setJumpToPage] = useState<number | null>(null);
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>("light");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const savedTheme = localStorage.getItem("lifeos-reader-theme") as ReaderTheme | null;
    if (savedTheme === "light" || savedTheme === "sepia" || savedTheme === "dark") {
      setReaderTheme(savedTheme);
    }
    const savedZoom = localStorage.getItem(`lifeos-reader-zoom-${bookId}`);
    if (savedZoom) setZoom(Number(savedZoom) || 1);
  }, [bookId]);

  const url = useMemo(
    () => (book?.file_path && book.file_path !== "pending" ? pdfPublicUrl(book.file_path) : null),
    [book]
  );

  const onPageChange = useCallback(
    (page: number, total: number) => {
      void saveReadingProgress(bookId, page, total);
    },
    [bookId]
  );

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }, []);

  async function saveHighlight(quote: string, page: number, note: string, color: string) {
    setSavingHighlight(true);
    const row = await addHighlight({ quote, page, note: note || null, color });
    setSavingHighlight(false);
    if (row) {
      haptic("success");
      showToast("Highlight saved");
      clearSelection();
      setNoteSheetOpen(false);
    } else {
      showToast("Could not save highlight");
    }
  }

  async function quickHighlight() {
    if (!selection || !book) return;
    await saveHighlight(selection.text, selection.page, "", DEFAULT_HIGHLIGHT_COLOR);
  }

  async function handleInbox() {
    if (!selection || !book) return;
    const row = await addHighlight({
      quote: selection.text,
      page: selection.page,
      color: DEFAULT_HIGHLIGHT_COLOR,
    });
    if (!row) {
      showToast("Could not save highlight");
      return;
    }
    const ok = await sendHighlightToInbox(row.id, book, selection.text, selection.page);
    if (ok) {
      haptic("success");
      showToast("Sent to Inbox");
      clearSelection();
    } else {
      showToast("Could not send to Inbox");
    }
  }

  async function handleToday() {
    if (!selection || !book) return;
    const row = await addHighlight({
      quote: selection.text,
      page: selection.page,
      color: DEFAULT_HIGHLIGHT_COLOR,
    });
    if (!row) {
      showToast("Could not save highlight");
      return;
    }
    const ok = await sendHighlightToToday(row.id, book, selection.text, selection.page);
    if (ok) {
      haptic("success");
      showToast("Added to Today");
      clearSelection();
    } else {
      showToast("Could not add to Today");
    }
  }

  function handleJumpToPage(page: number) {
    setTab("read");
    setJumpToPage(page);
    window.setTimeout(() => setJumpToPage(null), 300);
  }

  if (loading) {
    return (
      <div className="ln-reader-shell">
        <div className="ln-reader-loading full">Opening…</div>
      </div>
    );
  }

  if (!book || !url) {
    return (
      <div className="ln-reader-shell">
        <header className="ln-reader-top">
          <button type="button" className="ln-reader-back" onClick={() => router.push("/learn")}>
            <ArrowLeft size={20} />
          </button>
        </header>
        <p className="ln-reader-missing">Book not found or file missing.</p>
      </div>
    );
  }

  const progress = bookProgress(book);
  const toolbarPos = selection
    ? {
        top: Math.max(72, selection.rect.top - 52),
        left: Math.max(12, Math.min(selection.rect.left, window.innerWidth - 280)),
      }
    : null;

  return (
    <div className="ln-reader-shell">
      <header className="ln-reader-top">
        <button
          type="button"
          className="ln-reader-back"
          aria-label="Back to library"
          onClick={() => {
            haptic("light");
            router.push("/learn");
          }}
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
        </button>
        <div className="ln-reader-top-meta">
          <Link href="/learn" className="ln-reader-top-title">
            {book.title}
          </Link>
          {book.author && <span className="ln-reader-top-author">{book.author}</span>}
        </div>
      </header>

      <div className="ln-reader-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "read"}
          className={`ln-reader-tab ${tab === "read" ? "active" : ""}`}
          onClick={() => {
            haptic("light");
            setTab("read");
            clearSelection();
          }}
        >
          Read
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "highlights"}
          className={`ln-reader-tab ${tab === "highlights" ? "active" : ""}`}
          onClick={() => {
            haptic("light");
            setTab("highlights");
            clearSelection();
          }}
        >
          <Highlighter size={14} strokeWidth={2} />
          Highlights
          {highlights.length > 0 && (
            <span className="ln-reader-tab-count">{highlights.length}</span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "insights"}
          className={`ln-reader-tab ${tab === "insights" ? "active" : ""}`}
          onClick={() => {
            haptic("light");
            setTab("insights");
            clearSelection();
          }}
        >
          <Sparkles size={14} strokeWidth={2} />
          Insights
        </button>
      </div>

      {tab === "read" ? (
        <>
          <div className="ln-reader-toolbar">
            <div className="ln-reader-theme-btns">
              {(["light", "sepia", "dark"] as ReaderTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`ln-reader-theme-btn${readerTheme === t ? " active" : ""}`}
                  onClick={() => {
                    setReaderTheme(t);
                    localStorage.setItem("lifeos-reader-theme", t);
                    haptic("light");
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="ln-reader-zoom-btns">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => {
                  const next = Math.max(0.75, zoom - 0.15);
                  setZoom(next);
                  localStorage.setItem(`lifeos-reader-zoom-${bookId}`, String(next));
                }}
              >
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => {
                  const next = Math.min(2, zoom + 0.15);
                  setZoom(next);
                  localStorage.setItem(`lifeos-reader-zoom-${bookId}`, String(next));
                }}
              >
                +
              </button>
            </div>
          </div>
          <div className="ln-reader-progress-strip" aria-hidden>
            <div className="ln-reader-progress-fill" style={{ width: `${Math.max(progress, 1)}%` }} />
          </div>
          <PdfReader
            url={url}
            initialPage={Math.max(1, book.current_page || 1)}
            jumpToPage={jumpToPage}
            theme={readerTheme}
            zoom={zoom}
            onPageChange={onPageChange}
            onSelectionChange={setSelection}
          />
          <div className="ln-reader-footer">
            <span className="ln-reader-footer-label">{progress}% complete</span>
          </div>
        </>
      ) : tab === "highlights" ? (
        <div className="ln-reader-hl-panel">
          <BookHighlightsPanel book={book} onJumpToPage={handleJumpToPage} />
        </div>
      ) : (
        <div className="ln-reader-hl-panel">
          <BookInsightsPanel book={book} highlights={highlights} />
        </div>
      )}

      {selection && toolbarPos && tab === "read" && (
        <SelectionToolbar
          top={toolbarPos.top}
          left={toolbarPos.left}
          onHighlight={() => void quickHighlight()}
          onNote={() => setNoteSheetOpen(true)}
          onInbox={() => void handleInbox()}
          onToday={() => void handleToday()}
          onDismiss={clearSelection}
        />
      )}

      <HighlightNoteSheet
        open={noteSheetOpen}
        quote={selection?.text ?? ""}
        saving={savingHighlight}
        onClose={() => setNoteSheetOpen(false)}
        onSave={(note, color) => {
          if (!selection) return;
          void saveHighlight(selection.text, selection.page, note, color);
        }}
      />
    </div>
  );
}
