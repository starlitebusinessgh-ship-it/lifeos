import type { LibraryBook } from "./types";
import { resolveReadingState } from "./readingState";

function tagOverlap(a: string[], b: string[]): number {
  const set = new Set(a);
  return b.filter((t) => set.has(t)).length;
}

function similarityScore(target: LibraryBook, candidate: LibraryBook): number {
  if (target.id === candidate.id) return -1;

  let score = 0;
  if (target.category === candidate.category) score += 3;
  if (target.author && candidate.author && target.author === candidate.author) score += 5;
  if (target.series && candidate.series && target.series === candidate.series) score += 8;
  score += tagOverlap(target.tags ?? [], candidate.tags ?? []) * 4;
  return score;
}

export function similarBooks(
  target: LibraryBook,
  books: LibraryBook[],
  limit = 4
): LibraryBook[] {
  return books
    .map((b) => ({ b, score: similarityScore(target, b) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.b);
}

export function suggestNextRead(
  books: LibraryBook[],
  anchor?: LibraryBook,
  limit = 3
): LibraryBook[] {
  const pool = books.filter((b) => resolveReadingState(b) === "want_to_read");
  if (pool.length === 0) return [];

  if (!anchor) {
    return [...pool]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  return pool
    .map((b) => ({ b, score: similarityScore(anchor, b) }))
    .sort((a, b) => b.score - a.score || b.b.created_at.localeCompare(a.b.created_at))
    .slice(0, limit)
    .map((x) => x.b);
}

export function similarReason(target: LibraryBook, candidate: LibraryBook): string {
  if (target.series && candidate.series === target.series) {
    return `Same series · #${candidate.series_index ?? "?"}`;
  }
  if (target.author && candidate.author === target.author) return "Same author";
  const shared = tagOverlap(target.tags ?? [], candidate.tags ?? []);
  if (shared > 0) return `Shared tags · ${shared} match${shared === 1 ? "" : "es"}`;
  if (target.category === candidate.category) return `Also in ${target.category}`;
  return "On your shelf";
}
