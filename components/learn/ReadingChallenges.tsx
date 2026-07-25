"use client";

import { READING_CHALLENGES, challengeProgress } from "@/lib/learn/challenges";
import type { LibraryBook } from "@/lib/learn/types";

export function ReadingChallenges({ books }: { books: LibraryBook[] }) {
  return (
    <section className="ln-challenges" aria-label="Reading challenges">
      <h3 className="ln-challenges-title">Challenges</h3>
      <div className="ln-challenges-grid">
        {READING_CHALLENGES.map((c) => {
          const { current, percent, done } = challengeProgress(c, books);
          return (
            <article key={c.id} className={`ln-challenge-card${done ? " ln-challenge-card--done" : ""}`}>
              <h4>{c.title}</h4>
              <p>{c.description}</p>
              <div className="ln-challenge-bar">
                <div className="ln-challenge-bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="ln-challenge-meta">
                {current}/{c.target} {done ? "✓" : ""}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
