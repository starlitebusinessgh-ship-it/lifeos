"use client";

import type { LibraryBook } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import { coverGradient } from "@/lib/learn/covers";

export function OpenBookSpread({ book }: { book: LibraryBook }) {
  const progress = bookProgress(book);
  const hasCover = Boolean(book.cover_url);

  return (
    <div className="ln-open-book" aria-hidden>
      <div className="ln-open-book-shadow" />
      <div className="ln-open-book-spread">
        <div
          className="ln-open-book-page ln-open-book-page--left"
          style={hasCover ? undefined : { background: coverGradient(book.cover_color) }}
        >
          {hasCover ? (
            <div
              className="ln-open-book-cover-panel"
              style={{ backgroundImage: `url(${book.cover_url})` }}
            />
          ) : (
            <>
              <div className="ln-open-book-page-num">{(book.current_page || 1) - 1 || 1}</div>
              <div className="ln-open-book-text">
                <span className="ln-open-book-line ln-open-book-line--full" />
                <span className="ln-open-book-line ln-open-book-line--full" />
                <span className="ln-open-book-line ln-open-book-line--med" />
                <span className="ln-open-book-line ln-open-book-line--full" />
                <span className="ln-open-book-line ln-open-book-line--short" />
              </div>
            </>
          )}
        </div>
        <div className="ln-open-book-gutter" />
        <div className="ln-open-book-page ln-open-book-page--right">
          <div className="ln-open-book-illus">
            <svg viewBox="0 0 80 48" fill="none" aria-hidden>
              <path
                d="M8 38 L20 22 L32 30 L48 14 L72 38 Z"
                fill="currentColor"
                opacity="0.12"
              />
              <rect x="24" y="18" width="18" height="14" rx="1" fill="currentColor" opacity="0.08" />
              <path d="M12 38 H68" stroke="currentColor" strokeWidth="1.5" opacity="0.15" />
            </svg>
          </div>
          <div className="ln-open-book-text">
            <span className="ln-open-book-line ln-open-book-line--full" />
            <span className="ln-open-book-line ln-open-book-line--med" />
            <span className="ln-open-book-line ln-open-book-line--full" />
            <span className="ln-open-book-line ln-open-book-line--full" />
            <span className="ln-open-book-line ln-open-book-line--short" />
          </div>
          <div className="ln-open-book-page-num">{book.current_page || 1}</div>
        </div>
      </div>
      {progress > 0 && (
        <div className="ln-open-book-progress" style={{ width: `${progress}%` }} />
      )}
    </div>
  );
}
