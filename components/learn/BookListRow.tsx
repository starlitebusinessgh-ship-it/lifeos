"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, Check, Pencil } from "lucide-react";
import type { LibraryBook, ReadingState } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import {
  progressStateLabel,
  READING_STATES,
  READING_STATE_SHORT,
  readingStateLabel,
  resolveReadingState,
} from "@/lib/learn/readingState";
import { BookCover } from "./BookCover";
import { haptic } from "@/lib/finance/haptics";

export function BookListRow({
  book,
  onDelete,
  onStateChange,
  onEdit,
}: {
  book: LibraryBook;
  onDelete: (book: LibraryBook) => void;
  onStateChange?: (book: LibraryBook, state: ReadingState) => void;
  onEdit?: (book: LibraryBook) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = bookProgress(book);
  const state = resolveReadingState(book);

  return (
    <div className="ln-book-row">
      <Link href={`/learn/${book.id}`} className="ln-book-row-link" onClick={() => haptic("light")}>
        <div className="ln-book-row-cover">
          <BookCover book={book} size="carousel" />
        </div>
        <div className="ln-book-row-body">
          <div className="ln-book-row-head">
            <h3 className="ln-book-row-title">{book.title}</h3>
            <span className={`ln-book-row-status ln-book-row-status--${state}`}>
              {READING_STATE_SHORT[state]}
            </span>
          </div>
          {book.author && <p className="ln-book-row-author">{book.author}</p>}
          {(book.series || book.tags.length > 0) && (
            <div className="ln-book-row-meta">
              {book.series && (
                <span className="ln-book-row-series">
                  {book.series}
                  {book.series_index != null ? ` · #${book.series_index}` : ""}
                </span>
              )}
              {book.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="ln-book-row-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="ln-book-row-progress">
            <div className="ln-book-progress-track" aria-hidden>
              <div className="ln-book-progress-fill" style={{ width: `${Math.max(progress, 2)}%` }} />
            </div>
            <span className="ln-book-progress-label">{progressStateLabel(book)}</span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        className="ln-book-menu"
        aria-label={`Options for ${book.title}`}
        onClick={(e) => {
          e.preventDefault();
          haptic("light");
          setMenuOpen((v) => !v);
        }}
      >
        <MoreHorizontal size={17} />
      </button>
      {menuOpen && (
        <>
          <button
            type="button"
            className="ln-book-menu-backdrop"
            aria-label="Close"
            onClick={() => setMenuOpen(false)}
          />
          <div className="ln-book-menu-pop ln-book-menu-pop--wide">
            {onEdit && (
              <button
                type="button"
                className="ln-book-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(book);
                }}
              >
                <Pencil size={15} />
                Edit details
              </button>
            )}
            {onStateChange && (
              <div className="ln-book-menu-section">
                <p className="ln-book-menu-label">Reading status</p>
                {READING_STATES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`ln-book-menu-item ${state === s ? "active" : ""}`}
                    onClick={() => {
                      setMenuOpen(false);
                      onStateChange(book, s);
                    }}
                  >
                    {readingStateLabel(s)}
                    {state === s && <Check size={14} strokeWidth={2.5} />}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              className="ln-book-menu-item danger"
              onClick={() => {
                setMenuOpen(false);
                onDelete(book);
              }}
            >
              <Trash2 size={15} />
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}
