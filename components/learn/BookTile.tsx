"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, Trash2, Check, Pencil } from "lucide-react";
import type { LibraryBook, ReadingState } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import {
  READING_STATES,
  readingStateLabel,
  resolveReadingState,
} from "@/lib/learn/readingState";
import { BookCover } from "./BookCover";
import { haptic } from "@/lib/finance/haptics";

export function BookTile({
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
    <div className="ln-book">
      <Link href={`/learn/${book.id}`} className="ln-book-link" onClick={() => haptic("light")}>
        <div className="ln-book-cover-wrap">
          <BookCover book={book} size="tile" />
        </div>
        <h3 className="ln-book-title">{book.title}</h3>
        {book.author && <p className="ln-book-author">{book.author}</p>}
        {progress > 0 && <p className="ln-book-pct">{progress}%</p>}
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
