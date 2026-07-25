"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { LEARN_CATEGORIES } from "@/lib/learn/categories";
import { collectionHref } from "@/lib/learn/routes";
import { coverGradient } from "@/lib/learn/covers";
import type { LibraryBook } from "@/lib/learn/types";
import { haptic } from "@/lib/finance/haptics";

function ShelfSpines({ books }: { books: LibraryBook[] }) {
  if (books.length === 0) return null;

  return (
    <div className="ln-shelf-card-spines" aria-hidden>
      {books.slice(0, 4).map((book) => (
        <span
          key={book.id}
          className="ln-shelf-card-spine"
          style={{ background: coverGradient(book.cover_color) }}
        />
      ))}
    </div>
  );
}

function CollectionCard({
  cat,
  count,
  previewBooks,
  featured,
}: {
  cat: (typeof LEARN_CATEGORIES)[number];
  count: number;
  previewBooks: LibraryBook[];
  featured?: boolean;
}) {
  const Icon = cat.icon;
  const statLabel =
    count === 0 ? "Empty shelf" : `${count} ${count === 1 ? "book" : "books"}`;

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 480, damping: 32 }}
    >
      <Link
        href={collectionHref(cat.id)}
        className={`ln-shelf-card ln-shelf-card--${cat.pattern} ${featured ? "ln-shelf-card--featured" : ""}`}
        style={
          {
            "--cat-gradient": cat.gradient,
            "--cat-accent": cat.accent,
          } as CSSProperties
        }
        onClick={() => haptic("light")}
      >
        <div className="ln-shelf-card-accent" aria-hidden />
        <div className="ln-shelf-card-glow" aria-hidden />
        <div className="ln-shelf-card-main">
          <div className="ln-shelf-card-top">
            <span className="ln-shelf-card-icon-wrap">
              <Icon size={featured ? 20 : 17} strokeWidth={1.65} />
            </span>
            {!featured && (
              <ChevronRight className="ln-shelf-card-arrow" size={16} strokeWidth={2} />
            )}
          </div>
          <div className="ln-shelf-card-label-wrap">
            <h3 className="ln-shelf-card-label">{cat.label}</h3>
            <p className="ln-shelf-card-tagline">{cat.tagline}</p>
          </div>
        </div>
        <div className="ln-shelf-card-foot">
          <ShelfSpines books={previewBooks} />
          <span className="ln-shelf-card-stat">{statLabel}</span>
          {featured && <ChevronRight className="ln-shelf-card-arrow" size={18} strokeWidth={2} />}
        </div>
      </Link>
    </motion.div>
  );
}

export function CollectionGrid({
  counts,
  books,
}: {
  counts: Record<string, number>;
  books: LibraryBook[];
}) {
  const [featured, ...rest] = LEARN_CATEGORIES;

  const previews: Record<string, LibraryBook[]> = { all: books };
  for (const book of books) {
    if (!previews[book.category]) previews[book.category] = [];
    previews[book.category].push(book);
  }

  return (
    <section className="ln-shelves" aria-label="Browse shelves">
      <header className="ln-section-head">
        <h2 className="ln-section-title">Browse shelves</h2>
        <p className="ln-section-sub">Your library, organized by what you want to learn</p>
      </header>

      <CollectionCard
        cat={featured}
        count={counts.all ?? 0}
        previewBooks={previews.all ?? []}
        featured
      />

      <div className="ln-shelves-grid">
        {rest.map((cat) => (
          <CollectionCard
            key={cat.id}
            count={counts[cat.id] ?? 0}
            previewBooks={previews[cat.id] ?? []}
            cat={cat}
          />
        ))}
      </div>
    </section>
  );
}
