"use client";

import type { ReadingState } from "@/lib/learn/types";
import { READING_STATE_SHORT } from "@/lib/learn/readingState";

export function ReadingStateBadge({ state }: { state: ReadingState }) {
  return (
    <span className={`ln-state-badge ln-state-badge--${state}`}>
      {READING_STATE_SHORT[state]}
    </span>
  );
}
