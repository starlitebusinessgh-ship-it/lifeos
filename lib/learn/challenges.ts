import type { LibraryBook } from "./types";

export interface ReadingChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  metric: "books_year" | "books_month" | "genres";
}

export const READING_CHALLENGES: ReadingChallenge[] = [
  {
    id: "12-books",
    title: "12 Books This Year",
    description: "Finish one book per month",
    target: 12,
    metric: "books_year",
  },
  {
    id: "52-books",
    title: "52 Books This Year",
    description: "One book every week",
    target: 52,
    metric: "books_year",
  },
  {
    id: "5-genres",
    title: "5 Genres Explorer",
    description: "Read from five different categories",
    target: 5,
    metric: "genres",
  },
];

export function challengeProgress(
  challenge: ReadingChallenge,
  books: LibraryBook[]
): { current: number; percent: number; done: boolean } {
  const year = new Date().getFullYear();
  let current = 0;

  if (challenge.metric === "books_year") {
    current = books.filter(
      (b) =>
        b.reading_state === "finished" &&
        b.last_read_at &&
        new Date(b.last_read_at).getFullYear() === year
    ).length;
  } else if (challenge.metric === "books_month") {
    const now = new Date();
    current = books.filter(
      (b) =>
        b.reading_state === "finished" &&
        b.last_read_at &&
        new Date(b.last_read_at).getMonth() === now.getMonth() &&
        new Date(b.last_read_at).getFullYear() === now.getFullYear()
    ).length;
  } else if (challenge.metric === "genres") {
    const genres = new Set(
      books.filter((b) => b.reading_state === "finished").map((b) => b.category)
    );
    current = genres.size;
  }

  const percent = Math.min(100, Math.round((current / challenge.target) * 100));
  return { current, percent, done: current >= challenge.target };
}
