"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { BIBLE_MODULE, LEARN_CATEGORIES } from "@/lib/learn/categories";
import { collectionHref } from "@/lib/learn/routes";
import { coverGradient } from "@/lib/learn/covers";
import type { LibraryBook } from "@/lib/learn/types";
import { haptic } from "@/lib/finance/haptics";

function ShelfSpines({ books }: { books: LibraryBook[] }) {
  if (books.length === 0) return null;
  return (
    <div className="ln-col-spines" aria-hidden>
      {books.slice(0, 5).map((book) => (
        <span
          key={book.id}
          className="ln-col-spine"
          style={{ background: coverGradient(book.cover_color) }}
        />
      ))}
    </div>
  );
}

function CategoryTile({
  cat,
  count,
  previewBooks,
  featured,
  href,
  statOverride,
}: {
  cat: (typeof LEARN_CATEGORIES)[number] | typeof BIBLE_MODULE;
  count: number;
  previewBooks: LibraryBook[];
  featured?: boolean;
  href?: string;
  statOverride?: string;
}) {
  const Icon = cat.icon;
  const stat =
    statOverride ??
    (count === 0 ? "Empty" : `${count} ${count === 1 ? "book" : "books"}`);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 480, damping: 32 }}
      className={featured ? "ln-col-tile-wrap ln-col-tile-wrap--featured" : "ln-col-tile-wrap"}
    >
      <Link
        href={href ?? ("id" in cat ? collectionHref(cat.id) : BIBLE_MODULE.href)}
        className={`ln-col-tile ln-col-tile--${cat.pattern} ${featured ? "ln-col-tile--featured" : ""}`}
        style={
          {
            "--cat-gradient": cat.gradient,
            "--cat-accent": cat.accent,
          } as CSSProperties
        }
        onClick={() => haptic("light")}
      >
        <img
          src={cat.coverImage}
          alt=""
          className="ln-col-tile-photo"
          loading="lazy"
          decoding="async"
        />
        <div className="ln-col-tile-overlay" aria-hidden />
        <div className="ln-col-tile-shine" aria-hidden />
        <div className="ln-col-tile-body">
          <div className="ln-col-tile-top">
            <span className="ln-col-tile-icon">
              <Icon size={featured ? 22 : 18} strokeWidth={1.65} />
            </span>
            <ChevronRight size={featured ? 20 : 16} strokeWidth={2.25} className="ln-col-tile-chevron" />
          </div>
          <h3 className="ln-col-tile-label">{cat.label}</h3>
          <p className="ln-col-tile-tagline">{cat.tagline}</p>
          <div className="ln-col-tile-foot">
            <ShelfSpines books={previewBooks} />
            <span className="ln-col-tile-stat">{stat}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function CollectionCategoryGrid({
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
    <section className="ln-collections" aria-label="Browse collections">
      <header className="ln-collections-head">
        <h2 className="ln-collections-title">Collections</h2>
        <p className="ln-collections-sub">Browse by topic</p>
      </header>

      <CategoryTile
        cat={featured}
        count={counts.all ?? 0}
        previewBooks={previews.all ?? []}
        featured
      />

      <div className="ln-collections-grid ln-collections-grid--with-bible">
        <CategoryTile
          cat={BIBLE_MODULE}
          count={66}
          previewBooks={[]}
          href={BIBLE_MODULE.href}
          statOverride="66 books"
        />
        {rest.map((cat) => (
          <CategoryTile
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
