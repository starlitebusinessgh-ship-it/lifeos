import type { LibraryBook } from "./types";
import { resolveReadingState } from "./readingState";
import { localDateIso } from "@/lib/localDate";

export interface ReadingLogEntry {
  id: string;
  book_id: string;
  pages_delta: number;
  page_end: number | null;
  logged_at: string;
}

export interface ReadingStats {
  pagesThisWeek: number;
  pagesLastWeek: number;
  activeDaysThisWeek: number;
  streakDays: number;
  booksTouchedThisWeek: number;
  finishedThisMonth: number;
  highlightsThisWeek: number;
  inProgress: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function isInRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

export function computeReadingStats(
  books: LibraryBook[],
  log: ReadingLogEntry[],
  highlightsThisWeek: number
): ReadingStats {
  const now = new Date();
  const weekStart = daysAgo(7);
  const lastWeekStart = daysAgo(14);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let pagesThisWeek = 0;
  let pagesLastWeek = 0;
  const daysThisWeek = new Set<string>();
  const booksThisWeek = new Set<string>();

  for (const entry of log) {
    const at = new Date(entry.logged_at);
    if (isInRange(entry.logged_at, weekStart, now)) {
      pagesThisWeek += entry.pages_delta;
      daysThisWeek.add(localDateIso(at));
      booksThisWeek.add(entry.book_id);
    } else if (isInRange(entry.logged_at, lastWeekStart, weekStart)) {
      pagesLastWeek += entry.pages_delta;
    }
  }

  let streakDays = 0;
  for (let i = 0; i < 365; i++) {
    const day = daysAgo(i);
    const next = daysAgo(i - 1);
    const hadActivity = log.some((e) => isInRange(e.logged_at, day, next));
    if (!hadActivity) break;
    streakDays++;
  }

  const finishedThisMonth = books.filter((b) => {
    if (resolveReadingState(b) !== "finished") return false;
    return new Date(b.updated_at) >= monthStart;
  }).length;

  const inProgress = books.filter((b) => resolveReadingState(b) === "reading").length;

  return {
    pagesThisWeek,
    pagesLastWeek,
    activeDaysThisWeek: daysThisWeek.size,
    streakDays,
    booksTouchedThisWeek: booksThisWeek.size,
    finishedThisMonth,
    highlightsThisWeek,
    inProgress,
  };
}

export function topBooksThisWeek(
  log: ReadingLogEntry[],
  books: LibraryBook[],
  limit = 3
): { book: LibraryBook; pages: number }[] {
  const weekStart = daysAgo(7);
  const now = new Date();
  const byBook = new Map<string, number>();

  for (const entry of log) {
    if (!isInRange(entry.logged_at, weekStart, now)) continue;
    byBook.set(entry.book_id, (byBook.get(entry.book_id) ?? 0) + entry.pages_delta);
  }

  return [...byBook.entries()]
    .map(([id, pages]) => {
      const book = books.find((b) => b.id === id);
      return book ? { book, pages } : null;
    })
    .filter((x): x is { book: LibraryBook; pages: number } => x != null)
    .sort((a, b) => b.pages - a.pages)
    .slice(0, limit);
}

export function statsHeadline(stats: ReadingStats): string {
  if (stats.pagesThisWeek > 0) {
    return `You read ${stats.pagesThisWeek} page${stats.pagesThisWeek === 1 ? "" : "s"} this week`;
  }
  if (stats.inProgress > 0) {
    return `${stats.inProgress} book${stats.inProgress === 1 ? "" : "s"} in progress`;
  }
  return "Your reading story starts here";
}
