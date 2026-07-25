"use client";

import Link from "next/link";
import type { LibraryBook } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import { BookCover } from "./BookCover";
import { BookQuickMenu } from "./BookQuickMenu";
import { haptic } from "@/lib/finance/haptics";

export function RecentlyOpenedRow({
  books,
  onRemove,
  onPause,
  onMarkFinished,
}: {
  books: LibraryBook[];
  onRemove?: (book: LibraryBook) => void;
  onPause?: (book: LibraryBook) => void;
  onMarkFinished?: (book: LibraryBook) => void;
}) {
  if (books.length === 0) return null;

  return (
    <section className="ln-rn-recent" aria-label="Recently opened">
      <h3 className="ln-rn-section-label">Recently Opened</h3>
      <div className="ln-rn-recent-track">
        {books.map((book) => {
          const progress = bookProgress(book);
          return (
            <div key={book.id} className="ln-rn-recent-item">
              <Link
                href={`/learn/${book.id}`}
                className="ln-rn-recent-cover"
                onClick={() => haptic("light")}
              >
                <BookCover book={book} size="carousel" />
              </Link>
              <div className="ln-rn-recent-meta">
                <span className="ln-rn-recent-pct">
                  {progress > 0 ? `${progress}%` : "Start"}
                </span>
                <BookQuickMenu
                  book={book}
                  compact
                  onRemove={onRemove ? () => onRemove(book) : undefined}
                  onPause={onPause ? () => onPause(book) : undefined}
                  onMarkFinished={onMarkFinished ? () => onMarkFinished(book) : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
