import { BIBLE_BOOKS } from "./books";
import type { ReadingPlanDay, ReadingPlanDefinition } from "./readingPlans";

export type PlanScope = "whole" | "ot" | "nt" | "custom";
export type PlanSplitMode = "days" | "chapters_per_day";

export interface PlanBuilderConfig {
  title: string;
  scope: PlanScope;
  bookIds?: string[];
  splitMode: PlanSplitMode;
  /** Finish entire selection in this many days */
  totalDays?: number;
  /** Read this many chapters each day */
  chaptersPerDay?: number;
}

export interface PlanChapterRef {
  bookId: string;
  chapter: number;
}

export function chaptersForScope(scope: PlanScope, bookIds?: string[]): PlanChapterRef[] {
  let books = BIBLE_BOOKS;
  if (scope === "ot") books = books.filter((b) => b.testament === "OT");
  else if (scope === "nt") books = books.filter((b) => b.testament === "NT");
  else if (scope === "custom" && bookIds?.length) {
    const set = new Set(bookIds);
    books = books.filter((b) => set.has(b.id));
  }

  const refs: PlanChapterRef[] = [];
  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      refs.push({ bookId: book.id, chapter: ch });
    }
  }
  return refs;
}

export function previewPlan(config: PlanBuilderConfig): {
  totalChapters: number;
  totalDays: number;
  chaptersPerDay: number;
} {
  const chapters = chaptersForScope(config.scope, config.bookIds);
  const totalChapters = chapters.length;
  if (!totalChapters) return { totalChapters: 0, totalDays: 0, chaptersPerDay: 0 };

  if (config.splitMode === "chapters_per_day") {
    const cpd = Math.max(1, config.chaptersPerDay ?? 1);
    return {
      totalChapters,
      totalDays: Math.ceil(totalChapters / cpd),
      chaptersPerDay: cpd,
    };
  }

  const days = Math.max(1, config.totalDays ?? 365);
  return {
    totalChapters,
    totalDays: days,
    chaptersPerDay: Math.ceil(totalChapters / days),
  };
}

export function buildScheduleFromConfig(config: PlanBuilderConfig): ReadingPlanDefinition {
  const chapters = chaptersForScope(config.scope, config.bookIds);
  const preview = previewPlan(config);
  const days: ReadingPlanDay[] = [];

  if (config.splitMode === "chapters_per_day") {
    const cpd = Math.max(1, config.chaptersPerDay ?? 1);
    for (let d = 0; d < preview.totalDays; d++) {
      const slice = chapters.slice(d * cpd, (d + 1) * cpd);
      if (!slice.length) break;
      days.push({
        day: d + 1,
        label: `Day ${d + 1}`,
        readings: slice.map((r) => ({ bookId: r.bookId, chapter: r.chapter })),
      });
    }
  } else {
    const totalDays = Math.max(1, config.totalDays ?? 365);
    const perDay = Math.ceil(chapters.length / totalDays);
    for (let d = 0; d < totalDays; d++) {
      const slice = chapters.slice(d * perDay, (d + 1) * perDay);
      if (!slice.length) break;
      days.push({
        day: d + 1,
        label: `Day ${d + 1}`,
        readings: slice.map((r) => ({ bookId: r.bookId, chapter: r.chapter })),
      });
    }
  }

  const id = `custom-${Date.now()}`;
  return {
    id,
    title: config.title.trim() || "My reading plan",
    description: `${preview.totalChapters} chapters · ${days.length} days · ~${preview.chaptersPerDay} ch/day`,
    days: days.length,
    schedule: days,
    config,
  };
}

export const PLAN_PRESETS: { label: string; description: string; config: PlanBuilderConfig }[] = [
  {
    label: "Whole Bible in 365 days",
    description: "One pass through all 66 books in a year",
    config: {
      title: "Bible in a Year",
      scope: "whole",
      splitMode: "days",
      totalDays: 365,
    },
  },
  {
    label: "New Testament in 90 days",
    description: "NT only, evenly split",
    config: {
      title: "NT in 90 Days",
      scope: "nt",
      splitMode: "days",
      totalDays: 90,
    },
  },
  {
    label: "Old Testament in 180 days",
    description: "OT only",
    config: {
      title: "OT in 180 Days",
      scope: "ot",
      splitMode: "days",
      totalDays: 180,
    },
  },
  {
    label: "3 chapters per day (whole Bible)",
    description: "Flexible pace — ~397 days",
    config: {
      title: "3 Chapters Daily",
      scope: "whole",
      splitMode: "chapters_per_day",
      chaptersPerDay: 3,
    },
  },
  {
    label: "Psalms + Proverbs daily",
    description: "1 Proverbs chapter + 5 Psalms per day for 31 days",
    config: {
      title: "Psalms & Proverbs",
      scope: "custom",
      bookIds: ["psalms", "proverbs"],
      splitMode: "chapters_per_day",
      chaptersPerDay: 6,
    },
  },
];
