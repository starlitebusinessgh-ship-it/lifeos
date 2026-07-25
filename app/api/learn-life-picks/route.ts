import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export interface LifeContext {
  phase: string;
  todayTasksTotal: number;
  todayTasksDone: number;
  todayFocus?: string | null;
  inboxOpen: number;
  pagesThisWeek: number;
  streakDays: number;
  inProgress: number;
  highlightsThisWeek: number;
  todayDate?: string;
  todayLabel?: string;
}

export interface LibraryBookPick {
  id: string;
  title: string;
  author?: string | null;
  category?: string;
  reading_state?: string;
}

export interface LifePick {
  bookId: string;
  reason: string;
}

export interface ExternalSuggestion {
  title: string;
  author: string;
  reason: string;
}

export interface LifePicksResponse {
  picks: LifePick[];
  suggestions?: ExternalSuggestion[];
}

function fallbackPicks(
  books: LibraryBookPick[],
  ctx: LifeContext
): LifePicksResponse {
  const pool = books.filter(
    (b) => b.reading_state === "want_to_read" || b.reading_state === "paused"
  );
  const picks = pool.slice(0, 3).map((b) => ({
    bookId: b.id,
    reason:
      ctx.pagesThisWeek === 0
        ? "A calm reset — good when life feels full"
        : "Waiting on your shelf",
  }));
  return { picks };
}

export async function POST(req: Request) {
  let body: { books?: LibraryBookPick[]; life?: LifeContext };
  try {
    body = (await req.json()) as { books?: LibraryBookPick[]; life?: LifeContext };
  } catch {
    return NextResponse.json({ picks: [] });
  }

  const books = body.books ?? [];
  const life = body.life;
  if (!life || books.length === 0) {
    return NextResponse.json({ picks: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackPicks(books, life));
  }

  const client = new OpenAI({ apiKey });
  const system = `You are a personal reading coach in LifeOS. Pick books for "Want to Read" based on how the user's LIFE is going — not random shelf order.
Today is ${life.todayLabel ?? life.todayDate ?? "unknown"} — use this calendar date, not January 1 or a generic new year.

Use life signals: time of day (phase), Today task load, inbox pressure, reading streak, what's in progress.
- Heavy task day → shorter, practical, or calming reads
- Low reading week → re-engage with one high-interest book from their shelf
- Strong streak → stretch with something ambitious from want_to_read
- Evening/night → fiction or reflective titles welcome

Return ONLY JSON:
{"picks":[{"bookId":"uuid-from-list","reason":"one specific sentence tied to their life"}],"suggestions":[{"title":"...","author":"...","reason":"optional 1-2 books NOT in library to consider adding"}]}

Rules:
- picks: 2-4 items, bookId MUST exist in the library list, prefer want_to_read/paused/not started
- suggestions: 0-2 external famous books (real titles) only if library is thin or life context strongly suggests a gap
- reasons must feel personal, not generic marketing copy`;

  const libList = books
    .map(
      (b) =>
        `id:${b.id} | "${b.title}"${b.author ? ` by ${b.author}` : ""} | ${b.category ?? "Other"} | ${b.reading_state ?? "want_to_read"}`
    )
    .join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Life context:\n${JSON.stringify(life, null, 2)}\n\nLibrary:\n${libList}`,
        },
      ],
      max_tokens: 900,
      temperature: 0.55,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as LifePicksResponse;
    const validIds = new Set(books.map((b) => b.id));
    const picks = (parsed.picks ?? [])
      .filter((p) => p.bookId && validIds.has(p.bookId) && p.reason)
      .slice(0, 4);

    const suggestions = (parsed.suggestions ?? [])
      .filter((s) => s.title && s.author && s.reason)
      .slice(0, 2);

    if (picks.length === 0) {
      return NextResponse.json(fallbackPicks(books, life));
    }
    return NextResponse.json({ picks, suggestions });
  } catch {
    return NextResponse.json(fallbackPicks(books, life));
  }
}
