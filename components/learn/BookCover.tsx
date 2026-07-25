"use client";

import { useState } from "react";
import type { LibraryBook } from "@/lib/learn/types";
import { bookProgress } from "@/lib/learn/types";
import { coverGradient, coverPatternIndex } from "@/lib/learn/covers";

export type BookCoverSize = "tile" | "hero" | "hero-lg" | "compact" | "carousel";

const FLAT_SIZES = new Set<BookCoverSize>(["tile", "compact", "carousel"]);

export function BookCover({
  book,
  size = "tile",
  onClick,
}: {
  book: LibraryBook;
  size?: BookCoverSize;
  onClick?: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const progress = bookProgress(book);
  const pattern = coverPatternIndex(book.id || book.title);
  const flat = FLAT_SIZES.has(size);
  const showProgress = progress > 0 && flat;
  const showCoverArt = Boolean(book.cover_url) && !imgFailed;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`ln-vol ln-vol--${size}${flat ? " ln-vol--flat" : ""}${showCoverArt ? " ln-vol--has-cover" : ""}`}
      onClick={onClick}
    >
      <div
        className={`ln-vol-face ln-vol-face--pattern-${pattern}`}
        style={{ background: showCoverArt ? undefined : coverGradient(book.cover_color) }}
      >
        {showCoverArt && (
          <img
            src={book.cover_url!}
            alt=""
            className="ln-vol-cover-img"
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        )}
        {!showCoverArt && <div className="ln-vol-pattern" aria-hidden />}
        {!flat && !showCoverArt && <div className="ln-vol-shine" aria-hidden />}
        {!flat && <div className="ln-vol-spine" aria-hidden />}
        {!flat && <div className="ln-vol-edge" aria-hidden />}
        {!flat && !showCoverArt && (
          <div className="ln-vol-text">
            <span className="ln-vol-title">{book.title}</span>
            {book.author && <span className="ln-vol-author">{book.author}</span>}
          </div>
        )}
        {flat && !showCoverArt && (
          <div className="ln-vol-art" aria-hidden>
            <span className="ln-vol-art-initial">{book.title.charAt(0)}</span>
          </div>
        )}
        {showProgress && (
          <div className="ln-vol-progress" aria-hidden>
            <div className="ln-vol-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </Tag>
  );
}
