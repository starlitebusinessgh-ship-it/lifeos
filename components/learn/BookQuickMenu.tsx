"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, Pause, CheckCircle2 } from "lucide-react";
import type { LibraryBook } from "@/lib/learn/types";
import { haptic } from "@/lib/finance/haptics";

export function BookQuickMenu({
  book,
  onRemove,
  onPause,
  onMarkFinished,
  compact = false,
}: {
  book: LibraryBook;
  onRemove?: () => void;
  onPause?: () => void;
  onMarkFinished?: () => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`ln-book-menu${compact ? " ln-book-menu--compact" : ""}`}>
      <button
        type="button"
        className="ln-book-menu-btn"
        aria-label={`Options for ${book.title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          haptic("light");
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal size={compact ? 18 : 20} strokeWidth={2} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="ln-book-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="ln-book-menu-pop" role="menu">
            {onPause && (
              <button
                type="button"
                className="ln-book-menu-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onPause();
                }}
              >
                <Pause size={15} />
                Mark as paused
              </button>
            )}
            {onMarkFinished && (
              <button
                type="button"
                className="ln-book-menu-item"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onMarkFinished();
                }}
              >
                <CheckCircle2 size={15} />
                Mark as finished
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                className="ln-book-menu-item danger"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onRemove();
                }}
              >
                <Trash2 size={15} />
                Remove from library
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
