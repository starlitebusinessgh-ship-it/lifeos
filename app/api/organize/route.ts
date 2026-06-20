import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { STRUCTURED_MODEL } from "@/lib/ai/models";

const SYSTEM_PROMPT = `You are an assistant that helps organize personal journal entries from a conversation transcript. Given the conversation (user + assistant turns), produce a clean journal entry that captures the user's main thought.

(1) Write enhanced_content: a clear journal entry in the user's voice (2-6 sentences), preserving their meaning — not a transcript dump.
(2) Suggest a short title (max 8 words)
(3) capture_type from: decision, journal, lesson, idea, note, prayer, book_note, goal_update, reflection, other
(4) life_area from: Finance, Health, Career, Learning, Spiritual, Relationships, General
(5) 2-4 relevant tags as lowercase words

Respond ONLY with valid JSON: { "title": string, "enhanced_content": string, "capture_type": string, "life_area": string, "tags": string[] }`;

type OrganizeResult = {
  title: string;
  enhanced_content: string;
  capture_type: string;
  life_area: string;
  tags: string[];
};

function isOrganizeResult(value: unknown): value is OrganizeResult {
  if (!value || typeof value !== "object") return false;

  const result = value as Record<string, unknown>;

  return (
    typeof result.title === "string" &&
    typeof result.enhanced_content === "string" &&
    typeof result.capture_type === "string" &&
    typeof result.life_area === "string" &&
    Array.isArray(result.tags) &&
    result.tags.every((tag) => typeof tag === "string")
  );
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const text =
      body && typeof body === "object" && "text" in body
        ? (body as { text: unknown }).text
        : undefined;

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Request body must include a non-empty 'text' string." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(
        "[api/organize] OPENAI_API_KEY is missing from process.env (check .env.local is saved and dev server restarted)"
      );
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: STRUCTURED_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { error: "No response received from the model." },
        { status: 502 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON." },
        { status: 502 }
      );
    }

    if (!isOrganizeResult(parsed)) {
      return NextResponse.json(
        { error: "Model response is missing required fields." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[api/organize] Error:", error);
    if (error instanceof Error) {
      console.error("[api/organize] Message:", error.message);
      console.error("[api/organize] Stack:", error.stack);
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json(
      { error: `Failed to organize text: ${message}` },
      { status: 500 }
    );
  }
}
