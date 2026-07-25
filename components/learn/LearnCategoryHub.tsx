"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { CategoryId } from "@/lib/learn/categories";
import { getCategoryDef } from "@/lib/learn/categories";
import { SELF_HELP_TOPICS, topicHref } from "@/lib/learn/topics";
import { categoryToSlug } from "@/lib/learn/routes";
import type { LibraryBook } from "@/lib/learn/types";
import { haptic } from "@/lib/finance/haptics";

function countTopicBooks(books: LibraryBook[], tag: string, category: CategoryId): number {
  return books.filter(
    (b) =>
      b.category === category &&
      (b.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase())
  ).length;
}

export function LearnCategoryHub({
  categoryId,
  books,
}: {
  categoryId: CategoryId;
  books: LibraryBook[];
}) {
  const cat = getCategoryDef(categoryId);
  const parentSlug = categoryToSlug(categoryId);
  const categoryBooks = books.filter((b) => b.category === categoryId);

  return (
    <div className="ln-shell ln-shell-shelf">
      <header className="ln-shelf-page-head">
        <Link href="/learn" className="ln-shelf-back-link" onClick={() => haptic("light")}>
          Library
        </Link>
        <h1 className="ln-rn-page-title">{cat.label}</h1>
        <p className="ln-shelf-page-sub">{cat.tagline}</p>
      </header>

      <div className={`ln-shelf-banner ln-shelf-banner--${cat.pattern}`}>
        <img src={cat.coverImage} alt="" className="ln-shelf-banner-photo" loading="lazy" />
        <div className="ln-shelf-banner-overlay" aria-hidden />
        <span className="ln-shelf-stat-pill">
          {categoryBooks.length} {categoryBooks.length === 1 ? "book" : "books"}
        </span>
      </div>

      <section className="ln-topic-hub" aria-label={`${cat.label} sections`}>
        <h2 className="ln-topic-hub-title">Sections</h2>
        <div className="ln-collections-grid">
          {SELF_HELP_TOPICS.map((topic) => {
            const count = countTopicBooks(books, topic.topicTag, categoryId);
            const Icon = topic.icon;
            return (
              <motion.div
                key={topic.id}
                whileTap={{ scale: 0.97 }}
                className="ln-col-tile-wrap"
              >
                <Link
                  href={topicHref(parentSlug, topic.slug)}
                  className={`ln-col-tile ln-col-tile--${topic.pattern}`}
                  style={
                    {
                      "--cat-gradient": topic.gradient,
                      "--cat-accent": topic.accent,
                    } as CSSProperties
                  }
                  onClick={() => haptic("light")}
                >
                  <img src={topic.coverImage} alt="" className="ln-col-tile-photo" loading="lazy" />
                  <div className="ln-col-tile-overlay" aria-hidden />
                  <div className="ln-col-tile-shine" aria-hidden />
                  <div className="ln-col-tile-body">
                    <div className="ln-col-tile-top">
                      <span className="ln-col-tile-icon">
                        <Icon size={18} strokeWidth={1.65} />
                      </span>
                      <ChevronRight size={16} strokeWidth={2.25} className="ln-col-tile-chevron" />
                    </div>
                    <h3 className="ln-col-tile-label">{topic.label}</h3>
                    <p className="ln-col-tile-tagline">{topic.tagline}</p>
                    <div className="ln-col-tile-foot">
                      <span className="ln-col-tile-stat">
                        {count === 0 ? "Empty" : `${count} ${count === 1 ? "book" : "books"}`}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {categoryBooks.length > 0 && (
        <section className="ln-topic-hub-all">
          <Link
            href={topicHref(parentSlug, "all")}
            className="ln-topic-hub-all-link"
            onClick={() => haptic("light")}
          >
            View all {cat.label} books
            <ChevronRight size={16} />
          </Link>
        </section>
      )}
    </div>
  );
}
