import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type BookAiAction = "summarize" | "key_ideas" | "suggest_next";

interface BookAiRequest {
  action: BookAiAction;
  book: {
    title: string;
    author?: string | null;
    category?: string;
    progress?: number;
    tags?: string[];
    series?: string | null;
    current_page?: number;
    total_pages?: number | null;
  };
  highlights?: { quote: string; note?: string | null; page?: number | null }[];
  library?: {
    id: string;
    title: string;
    author?: string | null;
    category?: string;
    tags?: string[];
    reading_state?: string;
  }[];
}

function fallbackResponse(body: BookAiRequest): { text?: string; ideas?: string[]; picks?: { id: string; reason: string }[] } {
  const { action, book, highlights = [], library = [] } = body;
  const hl = highlights.slice(0, 5);

  if (action === "summarize") {
    const pageNote =
      book.total_pages && book.current_page
        ? `You're on page ${book.current_page} of ${book.total_pages} (${book.progress ?? 0}% through).`
        : "";
    const text =
      hl.length > 0
        ? `${pageNote} From your highlights in "${book.title}": you've marked ${highlights.length} passage${highlights.length === 1 ? "" : "s"} so far. Key thread: "${hl[0].quote.slice(0, 120)}${hl[0].quote.length > 120 ? "…" : ""}"`
        : `${pageNote} Keep reading "${book.title}"${book.author ? ` by ${book.author}` : ""} — highlights you save will power richer summaries.`;
    return { text };
  }

  if (action === "key_ideas") {
    const ideas =
      hl.length > 0
        ? hl.slice(0, 4).map((h, i) => {
            const note = h.note ? ` — ${h.note}` : "";
            return `Idea ${i + 1}: "${h.quote.slice(0, 100)}${h.quote.length > 100 ? "…" : ""}"${note}`;
          })
        : [
            "Highlight passages as you read — AI will extract ideas from your own notes.",
            `Focus on one chapter of "${book.title}" and mark what surprises you.`,
          ];
    return { ideas };
  }

  const want = library.filter((b) => b.reading_state === "want_to_read");
  const picks = want.slice(0, 3).map((b) => ({
    id: b.id,
    reason:
      b.category === book.category
        ? `Also in ${book.category}`
        : b.tags?.some((t) => book.tags?.includes(t))
          ? "Shares your interests"
          : "Waiting on your shelf",
  }));
  return { picks };
}

export async function POST(req: Request) {
  let body: BookAiRequest;
  try {
    body = (await req.json()) as BookAiRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.action || !body.book?.title) {
    return NextResponse.json({ error: "Missing action or book" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackResponse(body));
  }

  const client = new OpenAI({ apiKey });
  const hlText = (body.highlights ?? [])
    .slice(0, 12)
    .map((h) => `[p.${h.page ?? "?"}] "${h.quote}"${h.note ? ` Note: ${h.note}` : ""}`)
    .join("\n");

  const libText = (body.library ?? [])
    .slice(0, 20)
    .map((b) => `- id:${b.id} "${b.title}" (${b.reading_state}, ${b.category}) tags:${(b.tags ?? []).join(",")}`)
    .join("\n");

  const prompts: Record<BookAiAction, string> = {
    summarize: `Summarize what the reader has engaged with so far in "${body.book.title}". Use highlights if present; otherwise describe progress. 2-4 sentences, no markdown. Return JSON: {"text":"..."}`,
    key_ideas: `Extract 3-5 key ideas from the highlights below for "${body.book.title}". Short bullet phrases in the reader's voice. Return JSON: {"ideas":["..."]}`,
    suggest_next: `Pick up to 3 books from the library list to read after "${body.book.title}". Only use ids from the list with reading_state want_to_read. Return JSON: {"picks":[{"id":"uuid","reason":"one short line"}]}`,
  };

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a reading assistant in LifeOS. Be specific to the user's library. No markdown in strings.`,
        },
        {
          role: "user",
          content: `${prompts[body.action]}\n\nBook: ${JSON.stringify(body.book)}\n\nHighlights:\n${hlText || "(none)"}\n\nLibrary:\n${libText || "(none)"}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.45,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (body.action === "summarize" && typeof parsed.text === "string") {
      return NextResponse.json({ text: parsed.text });
    }
    if (body.action === "key_ideas" && Array.isArray(parsed.ideas)) {
      return NextResponse.json({ ideas: parsed.ideas.filter((x) => typeof x === "string").slice(0, 6) });
    }
    if (body.action === "suggest_next" && Array.isArray(parsed.picks)) {
      const validIds = new Set((body.library ?? []).map((b) => b.id));
      const picks = parsed.picks
        .filter((p): p is { id: string; reason: string } => {
          return (
            typeof p === "object" &&
            p !== null &&
            typeof (p as { id?: string }).id === "string" &&
            validIds.has((p as { id: string }).id)
          );
        })
        .slice(0, 3);
      if (picks.length > 0) return NextResponse.json({ picks });
    }
    return NextResponse.json(fallbackResponse(body));
  } catch {
    return NextResponse.json(fallbackResponse(body));
  }
}
