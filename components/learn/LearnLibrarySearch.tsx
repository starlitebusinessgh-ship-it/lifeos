"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { X, Search, BookOpen, Highlighter } from "lucide-react";
import { useLibrary } from "@/lib/learn/useLibrary";
import { useAllHighlights } from "@/lib/learn/useHighlights";
import { searchHighlights, searchLibraryBooks } from "@/lib/learn/librarySearch";
import { haptic } from "@/lib/finance/haptics";

export function LearnLibrarySearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { books } = useLibrary();
  const { highlights } = useAllHighlights();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const bookHits = useMemo(() => searchLibraryBooks(books, query), [books, query]);
  const hlHits = useMemo(
    () =>
      searchHighlights(
        highlights.map((h) => ({
          id: h.id,
          book_id: h.book_id,
          quote: h.quote,
          note: h.note,
          page: h.page,
          book_title: h.book_title,
          book_author: h.book_author,
        })),
        query
      ),
    [highlights, query]
  );

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div className="ln-lib-search-backdrop" role="presentation" onClick={onClose}>
      <div
        className="ln-lib-search"
        role="dialog"
        aria-label="Search library"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ln-lib-search-head">
          <Search size={18} strokeWidth={2} className="ln-lib-search-icon" />
          <input
            ref={inputRef}
            type="search"
            className="ln-lib-search-input"
            placeholder="Search books, authors, tags, highlights…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="ln-lib-search-close" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="ln-lib-search-body">
          {!hasQuery && (
            <p className="ln-lib-search-hint">Find books in your library or passages you highlighted.</p>
          )}

          {hasQuery && bookHits.length === 0 && hlHits.length === 0 && (
            <p className="ln-lib-search-empty">No results for &ldquo;{query}&rdquo;</p>
          )}

          {bookHits.length > 0 && (
            <section className="ln-lib-search-section">
              <h3>Books</h3>
              <ul>
                {bookHits.map((book) => (
                  <li key={book.id}>
                    <Link
                      href={`/learn/${book.id}`}
                      className="ln-lib-search-hit"
                      onClick={() => {
                        haptic("light");
                        onClose();
                      }}
                    >
                      <BookOpen size={16} strokeWidth={2} />
                      <div>
                        <strong>{book.title}</strong>
                        {book.author && <span>{book.author}</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hlHits.length > 0 && (
            <section className="ln-lib-search-section">
              <h3>Highlights</h3>
              <ul>
                {hlHits.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/learn/${h.book_id}`}
                      className="ln-lib-search-hit ln-lib-search-hit--hl"
                      onClick={() => {
                        haptic("light");
                        onClose();
                      }}
                    >
                      <Highlighter size={16} strokeWidth={2} />
                      <div>
                        <strong>{h.book_title}</strong>
                        <span>
                          {h.quote.length > 72 ? `${h.quote.slice(0, 69)}…` : h.quote}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
