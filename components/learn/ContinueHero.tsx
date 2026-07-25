"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, MoreHorizontal, Trash2 } from "lucide-react";
import type { LibraryBook } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import { BookCover } from "./BookCover";
import { haptic } from "@/lib/finance/haptics";

export function ContinueHero({
  book,
  onRemove,
}: {
  book: LibraryBook;
  onRemove?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = bookProgress(book);
  const pageLabel =
    book.total_pages && book.current_page > 0
      ? `Page ${book.current_page} of ${book.total_pages}`
      : "Start reading";

  return (
    <div className="ln-continue-wrap">
      <Link
        href={`/learn/${book.id}`}
        className="ln-continue"
        onClick={() => haptic("light")}
      >
        <div className="ln-continue-mesh" aria-hidden />
        <div className="ln-continue-inner">
          <div className="ln-continue-cover-col">
            <div className="ln-continue-cover-stack">
              <BookCover book={book} size="carousel" />
            </div>
            <div className="ln-continue-ring" aria-hidden>
              <svg viewBox="0 0 36 36">
                <circle className="ln-continue-ring-bg" cx="18" cy="18" r="15.5" />
                <circle
                  className="ln-continue-ring-fill"
                  cx="18"
                  cy="18"
                  r="15.5"
                  pathLength={100}
                  strokeDasharray={`${progress} ${100 - progress}`}
                />
              </svg>
              <span className="ln-continue-pct">{progress}%</span>
            </div>
          </div>
          <div className="ln-continue-body">
            <span className="ln-continue-kicker">Continue learning</span>
            <h2 className="ln-continue-title">{book.title}</h2>
            {book.author && <p className="ln-continue-author">{book.author}</p>}
            <p className="ln-continue-meta">{pageLabel}</p>
            <span className="ln-continue-cta">
              <Play size={15} fill="currentColor" strokeWidth={0} />
              Continue
            </span>
          </div>
        </div>
      </Link>
      {onRemove && (
        <>
          <button
            type="button"
            className="ln-continue-menu"
            aria-label={`Options for ${book.title}`}
            onClick={() => {
              haptic("light");
              setMenuOpen((v) => !v);
            }}
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="ln-continue-menu-backdrop"
                aria-label="Close"
                onClick={() => setMenuOpen(false)}
              />
              <div className="ln-continue-menu-pop">
                <button
                  type="button"
                  className="ln-continue-menu-item danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove();
                  }}
                >
                  <Trash2 size={15} />
                  Remove from library
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

