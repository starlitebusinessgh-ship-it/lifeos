"use client";

import Link from "next/link";
import type { LibraryBook } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import { OpenBookSpread } from "./OpenBookSpread";
import { BookQuickMenu } from "./BookQuickMenu";
import { haptic } from "@/lib/finance/haptics";

export function ReadingNowHero({
  book,
  onRemove,
  onPause,
  onMarkFinished,
}: {
  book: LibraryBook;
  onRemove?: () => void;
  onPause?: () => void;
  onMarkFinished?: () => void;
}) {
  const progress = bookProgress(book);

  return (
    <article className="ln-rn-hero">
      <Link
        href={`/learn/${book.id}`}
        className="ln-rn-hero-spread-link"
        onClick={() => haptic("light")}
      >
        <OpenBookSpread book={book} />
      </Link>
      <div className="ln-rn-hero-foot">
        <Link
          href={`/learn/${book.id}`}
          className="ln-rn-hero-title-link"
          onClick={() => haptic("light")}
        >
          <h2 className="ln-rn-hero-title">{book.title}</h2>
        </Link>
        <div className="ln-rn-hero-meta">
          <span className="ln-rn-hero-pct">{progress > 0 ? `${progress}%` : "Start"}</span>
          <BookQuickMenu
            book={book}
            onRemove={onRemove}
            onPause={onPause}
            onMarkFinished={onMarkFinished}
          />
        </div>
      </div>
    </article>
  );
}
