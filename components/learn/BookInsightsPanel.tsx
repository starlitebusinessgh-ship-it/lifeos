"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Lightbulb, ListOrdered, Sparkles } from "lucide-react";
import { useLibrary } from "@/lib/learn/useLibrary";
import { bookProgress } from "@/lib/learn/types";
import type { LibraryBook } from "@/lib/learn/types";
import type { LibraryHighlight } from "@/lib/learn/types";
import { similarBooks, similarReason, suggestNextRead } from "@/lib/learn/recommendations";
import { BookSpineCard } from "./BookSpineCard";
import { haptic } from "@/lib/finance/haptics";

type AiAction = "summarize" | "key_ideas" | "suggest_next";

export function BookInsightsPanel({
  book,
  highlights,
}: {
  book: LibraryBook;
  highlights: LibraryHighlight[];
}) {
  const { books } = useLibrary();
  const [loading, setLoading] = useState<AiAction | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [aiPicks, setAiPicks] = useState<{ id: string; reason: string }[]>([]);

  const similar = similarBooks(book, books, 4);
  const heuristicNext = suggestNextRead(books, book, 3);

  async function runAi(action: AiAction) {
    setLoading(action);
    haptic("light");
    try {
      const res = await fetch("/api/learn-book-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          book: {
            title: book.title,
            author: book.author,
            category: book.category,
            progress: bookProgress(book),
            tags: book.tags,
            series: book.series,
            current_page: book.current_page,
            total_pages: book.total_pages,
          },
          highlights: highlights.map((h) => ({
            quote: h.quote,
            note: h.note,
            page: h.page,
          })),
          library: books.map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            category: b.category,
            tags: b.tags,
            reading_state: b.reading_state,
          })),
        }),
      });
      const data = await res.json();
      if (action === "summarize" && data.text) setSummary(data.text);
      if (action === "key_ideas" && data.ideas) setIdeas(data.ideas);
      if (action === "suggest_next" && data.picks) setAiPicks(data.picks);
    } finally {
      setLoading(null);
    }
  }

  const nextBooks =
    aiPicks.length > 0
      ? aiPicks
          .map((p) => {
            const b = books.find((x) => x.id === p.id);
            return b ? { book: b, reason: p.reason } : null;
          })
          .filter((x): x is { book: LibraryBook; reason: string } => x != null)
      : heuristicNext.map((b) => ({ book: b, reason: similarReason(book, b) }));

  return (
    <div className="ln-book-insights">
      <section className="ln-insight-section">
        <h3 className="ln-insight-label">AI assistant</h3>
        <div className="ln-ai-actions">
          <button
            type="button"
            className="ln-ai-action"
            disabled={!!loading}
            onClick={() => void runAi("summarize")}
          >
            <Sparkles size={15} />
            {loading === "summarize" ? "Thinking…" : "Summarize progress"}
          </button>
          <button
            type="button"
            className="ln-ai-action"
            disabled={!!loading}
            onClick={() => void runAi("key_ideas")}
          >
            <Lightbulb size={15} />
            {loading === "key_ideas" ? "Thinking…" : "Key ideas"}
          </button>
          <button
            type="button"
            className="ln-ai-action"
            disabled={!!loading}
            onClick={() => void runAi("suggest_next")}
          >
            <ListOrdered size={15} />
            {loading === "suggest_next" ? "Thinking…" : "What to read next"}
          </button>
        </div>

        {summary && (
          <div className="ln-ai-result">
            <p>{summary}</p>
          </div>
        )}
        {ideas.length > 0 && (
          <ul className="ln-ai-ideas">
            {ideas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        )}
      </section>

      {similar.length > 0 && (
        <section className="ln-insight-section">
          <h3 className="ln-insight-label">Similar on your shelf</h3>
          <div className="ln-row-track">
            {similar.map((b) => (
              <div key={b.id} className="ln-similar-wrap">
                <BookSpineCard book={b} />
                <span className="ln-similar-reason">{similarReason(book, b)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {nextBooks.length > 0 && (
        <section className="ln-insight-section">
          <h3 className="ln-insight-label">Up next from your library</h3>
          <ul className="ln-next-list">
            {nextBooks.map(({ book: b, reason }) => (
              <li key={b.id}>
                <Link href={`/learn/${b.id}`} className="ln-next-item" onClick={() => haptic("light")}>
                  <BookOpen size={16} strokeWidth={1.75} />
                  <div>
                    <strong>{b.title}</strong>
                    <span>{reason}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
