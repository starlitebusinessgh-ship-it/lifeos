import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export interface LearnInsightPayload {
  pagesThisWeek: number;
  pagesLastWeek: number;
  activeDaysThisWeek: number;
  streakDays: number;
  booksTouchedThisWeek: number;
  finishedThisMonth: number;
  highlightsThisWeek: number;
  inProgress: number;
  topBooks: { title: string; pages: number }[];
  phase?: string;
  todayTasksTotal?: number;
  todayTasksDone?: number;
  inboxOpen?: number;
  todayDate?: string;
  todayLabel?: string;
}

export interface LearnInsightItem {
  title: string;
  body: string;
  tone: "positive" | "neutral" | "nudge";
}

function fallbackInsights(p: LearnInsightPayload): LearnInsightItem[] {
  const items: LearnInsightItem[] = [];

  if (p.pagesThisWeek > 0) {
    const vs =
      p.pagesLastWeek > 0
        ? p.pagesThisWeek >= p.pagesLastWeek
          ? `up from ${p.pagesLastWeek} last week`
          : `down from ${p.pagesLastWeek} last week`
        : "a solid start";
    items.push({
      title: "This week's reading",
      body: `You turned ${p.pagesThisWeek} page${p.pagesThisWeek === 1 ? "" : "s"} across ${p.booksTouchedThisWeek} book${p.booksTouchedThisWeek === 1 ? "" : "s"} — ${vs}. ${p.streakDays > 1 ? `You're on a ${p.streakDays}-day streak.` : "Try reading a little tomorrow to build momentum."}`,
      tone: p.pagesThisWeek >= p.pagesLastWeek ? "positive" : "neutral",
    });
  } else if (p.inProgress > 0) {
    items.push({
      title: "Books waiting",
      body: `You have ${p.inProgress} book${p.inProgress === 1 ? "" : "s"} in progress. Even 10 pages today keeps the habit alive.`,
      tone: "nudge",
    });
  }

  if (p.finishedThisMonth > 0) {
    items.push({
      title: "Finished this month",
      body: `You completed ${p.finishedThisMonth} book${p.finishedThisMonth === 1 ? "" : "s"} this month. Capture one key idea from each in your highlights.`,
      tone: "positive",
    });
  }

  if (p.highlightsThisWeek > 0) {
    items.push({
      title: "Ideas captured",
      body: `${p.highlightsThisWeek} highlight${p.highlightsThisWeek === 1 ? "" : "s"} this week — send the best ones to Inbox or Today while they're fresh.`,
      tone: "positive",
    });
  }

  if (items.length === 0) {
    items.push({
      title: "Your library is ready",
      body: "Open a book and read a few pages. Your stats and insights will build from real progress.",
      tone: "neutral",
    });
  }

  return items.slice(0, 3);
}

export async function POST(req: Request) {
  let payload: LearnInsightPayload;
  try {
    payload = (await req.json()) as LearnInsightPayload;
  } catch {
    return NextResponse.json({ insights: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ insights: fallbackInsights(payload) });
  }

  const client = new OpenAI({ apiKey });
  const system = `You are a personal reading coach inside LifeOS Learn — a private digital library.
Today is ${payload.todayLabel ?? payload.todayDate ?? "unknown"} — always anchor advice to this date, never January 1 or a generic new year.
Be concise, warm, and specific. Use the user's real numbers and life context (time of day, task load, inbox).
No markdown.
Return ONLY valid JSON: {"insights":[{"title":"short headline","body":"2-3 sentences with one clear nudge","tone":"positive"|"neutral"|"nudge"}]}
Give 2-3 insights about their reading week, habits, and what fits their life right now. Never invent books not in topBooks.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(payload) },
      ],
      max_tokens: 700,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { insights?: LearnInsightItem[] };
    const insights = (parsed.insights ?? []).filter((i) => i.title && i.body).slice(0, 3);
    if (insights.length === 0) {
      return NextResponse.json({ insights: fallbackInsights(payload) });
    }
    return NextResponse.json({ insights });
  } catch {
    return NextResponse.json({ insights: fallbackInsights(payload) });
  }
}
