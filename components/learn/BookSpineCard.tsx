"use client";

import Link from "next/link";
import type { LibraryBook } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import { BookCover } from "./BookCover";
import { haptic } from "@/lib/finance/haptics";

export function BookSpineCard({ book }: { book: LibraryBook }) {
  const progress = bookProgress(book);

  return (
    <Link
      href={`/learn/${book.id}`}
      className="ln-book-card"
      onClick={() => haptic("light")}
    >
      <div className="ln-book-card-cover">
        <BookCover book={book} size="carousel" />
      </div>
      <h3 className="ln-book-card-title">{book.title}</h3>
      {book.author && <p className="ln-book-card-author">{book.author}</p>}
      {progress > 0 && (
        <p className="ln-book-card-progress">{progress}%</p>
      )}
    </Link>
  );
}
