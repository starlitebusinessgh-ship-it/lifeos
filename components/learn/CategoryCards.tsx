"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import type { CategoryId } from "@/lib/learn/categories";
import { LEARN_CATEGORIES } from "@/lib/learn/categories";
import { haptic } from "@/lib/finance/haptics";

export function CategoryRail({
  selected,
  counts,
  onSelect,
}: {
  selected: CategoryId;
  counts: Record<string, number>;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <section className="ln-cat-section" aria-label="Browse by topic">
      <div className="ln-cat-section-head">
        <h2 className="ln-cat-section-title">Collections</h2>
        <p className="ln-cat-section-sub">Tap a topic to filter your shelf</p>
      </div>
      <div className="ln-cat-rail" role="tablist">
        {LEARN_CATEGORIES.map((cat) => {
          const active = selected === cat.id;
          const count = cat.id === "All" ? counts.all ?? 0 : counts[cat.id] ?? 0;
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`ln-cat-card ln-cat-card--${cat.pattern} ${active ? "active" : ""}`}
              style={
                {
                  "--cat-gradient": cat.gradient,
                  "--cat-accent": cat.accent,
                } as CSSProperties
              }
              onClick={() => {
                haptic("light");
                onSelect(cat.id);
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            >
              <img src={cat.coverImage} alt="" className="ln-cat-card-photo" loading="lazy" decoding="async" />
              <div className="ln-cat-card-pattern" aria-hidden />
              <Icon className="ln-cat-card-icon" size={22} strokeWidth={1.6} />
              <span className="ln-cat-card-label">{cat.label}</span>
              <span className="ln-cat-card-tagline">{cat.tagline}</span>
              {count > 0 && (
                <span className="ln-cat-card-count" aria-label={`${count} books`}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export function CategoryPicker({
  selected,
  onSelect,
  variant = "grid",
}: {
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
  variant?: "grid" | "rail";
}) {
  const items = LEARN_CATEGORIES.filter((c) => c.id !== "All");

  return (
    <div
      className={variant === "grid" ? "ln-cat-picker-grid" : "ln-cat-rail ln-cat-rail-compact"}
      role="listbox"
      aria-label="Book category"
    >
      {items.map((cat) => {
        const active = selected === cat.id;
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            type="button"
            role="option"
            aria-selected={active}
            className={`ln-cat-card ln-cat-card--pick ln-cat-card--${cat.pattern} ${active ? "active" : ""}`}
            style={
              {
                "--cat-gradient": cat.gradient,
                "--cat-accent": cat.accent,
              } as CSSProperties
            }
            onClick={() => {
              haptic("light");
              onSelect(cat.id);
            }}
          >
            <img src={cat.coverImage} alt="" className="ln-cat-card-photo" loading="lazy" decoding="async" />
            <div className="ln-cat-card-pattern" aria-hidden />
            <Icon className="ln-cat-card-icon" size={18} strokeWidth={1.6} />
            <span className="ln-cat-card-label">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function CategorySectionHeader({
  categoryId,
  count,
}: {
  categoryId: CategoryId;
  count: number;
}) {
  const cat = LEARN_CATEGORIES.find((c) => c.id === categoryId) ?? LEARN_CATEGORIES[0];
  if (categoryId === "All") {
    return (
      <header className="ln-shelf-head">
        <h2 className="ln-shelf-title">Your shelf</h2>
        <p className="ln-shelf-sub">
          {count === 0 ? "No books yet" : `${count} ${count === 1 ? "book" : "books"}`}
        </p>
      </header>
    );
  }

  return (
    <header
      className="ln-shelf-head ln-shelf-head-themed"
      style={{ "--cat-accent": cat.accent } as CSSProperties}
    >
      <div className="ln-shelf-stripe" aria-hidden />
      <div>
        <h2 className="ln-shelf-title">{cat.label}</h2>
        <p className="ln-shelf-sub">{cat.tagline}</p>
      </div>
      <span className="ln-shelf-count">{count}</span>
    </header>
  );
}
