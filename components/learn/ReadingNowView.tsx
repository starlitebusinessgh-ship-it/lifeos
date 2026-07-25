"use client";

import { useMemo } from "react";
import { Menu } from "lucide-react";
import type { LibraryBook } from "@/lib/learn/types";
import { pickContinueBook } from "@/lib/learn/shelf";
import { readingNowShelf } from "@/lib/learn/readingState";
import { ReadingNowHero } from "./ReadingNowHero";
import { RecentlyOpenedRow } from "./RecentlyOpenedRow";
import { HighlightOfTheDay } from "./HighlightOfTheDay";
import { useAllHighlights } from "@/lib/learn/useHighlights";
import { haptic } from "@/lib/finance/haptics";

export function ReadingNowView({
  books,
  onRemove,
  onPause,
  onMarkFinished,
  onOpenMenu,
}: {
  books: LibraryBook[];
  onRemove?: (book: LibraryBook) => void;
  onPause?: (book: LibraryBook) => void;
  onMarkFinished?: (book: LibraryBook) => void;
  onOpenMenu?: () => void;
}) {
  const heroBook = useMemo(() => pickContinueBook(books), [books]);
  const { highlights } = useAllHighlights();
  const recent = useMemo(
    () => readingNowShelf(books, 12, heroBook?.id),
    [books, heroBook?.id]
  );

  return (
    <div className="ln-reading-now">
      <header className="ln-rn-page-head">
        <h1 className="ln-rn-page-title">Reading Now</h1>
        <button
          type="button"
          className="ln-rn-avatar"
          aria-label="Open menu"
          onClick={() => {
            haptic("light");
            onOpenMenu?.();
          }}
        >
          <span className="ln-rn-avatar-inner">
            <Menu size={18} strokeWidth={2} />
          </span>
        </button>
      </header>

      {heroBook ? (
        <ReadingNowHero
          book={heroBook}
          onRemove={onRemove ? () => onRemove(heroBook) : undefined}
          onPause={onPause ? () => onPause(heroBook) : undefined}
          onMarkFinished={onMarkFinished ? () => onMarkFinished(heroBook) : undefined}
        />
      ) : (
        <div className="ln-rn-empty-hero">
          <p>Open a book from your library to see it here.</p>
        </div>
      )}

      <HighlightOfTheDay highlights={highlights} />

      <RecentlyOpenedRow
        books={recent}
        onRemove={onRemove}
        onPause={onPause}
        onMarkFinished={onMarkFinished}
      />
    </div>
  );
}
