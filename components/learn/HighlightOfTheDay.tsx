"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { HighlightWithBook } from "@/lib/learn/highlightActions";
import { haptic } from "@/lib/finance/haptics";

const INTERVALS_DAYS = [1, 3, 7, 30];

function pickHighlightOfDay(highlights: HighlightWithBook[]): HighlightWithBook | null {
  if (!highlights.length) return null;
  const now = Date.now();
  const candidates = highlights.filter((h) => {
    const ageDays = (now - new Date(h.created_at).getTime()) / 86400000;
    return INTERVALS_DAYS.some((d) => ageDays >= d - 0.5 && ageDays <= d + 0.5);
  });
  const pool = candidates.length ? candidates : highlights;
  const dayIndex = Math.floor(now / 86400000) % pool.length;
  return pool[dayIndex] ?? null;
}

export function HighlightOfTheDay({ highlights }: { highlights: HighlightWithBook[] }) {
  const pick = useMemo(() => pickHighlightOfDay(highlights), [highlights]);
  if (!pick) return null;

  return (
    <section className="ln-highlight-day">
      <div className="ln-highlight-day-head">
        <Sparkles size={16} />
        <h2>Highlight of the day</h2>
      </div>
      <blockquote className="ln-highlight-day-quote">&ldquo;{pick.quote}&rdquo;</blockquote>
      {pick.note && <p className="ln-highlight-day-note">{pick.note}</p>}
      <Link
        href={`/learn/${pick.book_id}?page=${pick.page ?? 1}`}
        className="ln-highlight-day-link"
        onClick={() => haptic("light")}
      >
        {pick.book_title}
        {pick.page ? ` · p. ${pick.page}` : ""}
      </Link>
    </section>
  );
}
