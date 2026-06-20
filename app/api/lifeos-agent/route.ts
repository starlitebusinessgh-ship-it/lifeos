import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { STRUCTURED_MODEL } from "@/lib/ai/models";
import { createClient } from "@supabase/supabase-js";
import { CursorAgentError } from "@cursor/sdk";
import { tryLocalCommand } from "@/lib/finance/agent-actions";
import {
  buildAccountSnapshot,
  buildAgentContext,
  buildAgentSystemPrompt,
  postProcessFromUserText,
  validateAgentResponse,
  USD_TO_GHS,
} from "@/lib/finance/agent";
import { runCursorAgent } from "@/lib/cursor/agent-service";
import { isFinanceFastPath, shouldUseCursor } from "@/lib/lifeos/agent-router";
import type { FinanceEntry } from "@/lib/finance/types";

export const runtime = "nodejs";
export const maxDuration = 300;

type ChatTurn = { role: "user" | "assistant"; content: string };

async function loadEntries(): Promise<FinanceEntry[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("finance_entries")
    .select("id, date, description, category, type, intent, amount, created_at")
    .order("date", { ascending: false });
  return data ?? [];
}

async function runFinanceAgent(
  text: string,
  history: ChatTurn[],
  entries: FinanceEntry[]
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key is not configured." },
      { status: 500 }
    );
  }

  const ctx = buildAgentContext(entries, new Date().toISOString().slice(0, 10));
  const snapshot = buildAccountSnapshot(entries);

  const openai = new OpenAI({ apiKey });
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildAgentSystemPrompt(ctx, snapshot) },
    ...history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: text.trim() },
  ];

  const completion = await openai.chat.completions.create({
    model: STRUCTURED_MODEL,
    messages,
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

  let result = validateAgentResponse(parsed, ctx);
  if (!result) {
    return NextResponse.json(
      {
        error:
          "I couldn't process that. Try rephrasing, or say something like 'paid my loan' or 'show net worth'.",
      },
      { status: 502 }
    );
  }

  const hasLog = result.actions.some((a) => a.type === "log");
  if (hasLog) {
    result = postProcessFromUserText(text, result, ctx);
  }

  return NextResponse.json({
    ...result,
    source: "finance" as const,
    meta: { usdToGhs: USD_TO_GHS, loanBalance: ctx.loanBalance },
  });
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

    const history: ChatTurn[] =
      body &&
      typeof body === "object" &&
      "history" in body &&
      Array.isArray((body as { history: unknown }).history)
        ? (body as { history: ChatTurn[] }).history.filter(
            (m) =>
              m &&
              typeof m === "object" &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
        : [];

    const cursorAgentId =
      body &&
      typeof body === "object" &&
      "cursorAgentId" in body &&
      typeof (body as { cursorAgentId: unknown }).cursorAgentId === "string"
        ? (body as { cursorAgentId: string }).cursorAgentId
        : undefined;

    const forceCursor = Boolean(
      body &&
        typeof body === "object" &&
        "forceCursor" in body &&
        (body as { forceCursor: unknown }).forceCursor === true
    );

    const newSession = Boolean(
      body &&
        typeof body === "object" &&
        "newSession" in body &&
        (body as { newSession: unknown }).newSession === true
    );

    const entries = await loadEntries();
    const ctx = buildAgentContext(entries, new Date().toISOString().slice(0, 10));

    const local = tryLocalCommand(text, entries);
    if (local) {
      return NextResponse.json({
        ...local,
        source: "local" as const,
        meta: { usdToGhs: USD_TO_GHS, loanBalance: ctx.loanBalance },
      });
    }

    if (isFinanceFastPath(text) && !forceCursor) {
      return runFinanceAgent(text, history, entries);
    }

    if (shouldUseCursor(text, { forceCursor })) {
      if (!process.env.CURSOR_API_KEY?.trim()) {
        return NextResponse.json(
          {
            error:
              "Add CURSOR_API_KEY to .env.local to use the Cursor agent (Dashboard → Integrations). Finance logging still works without it.",
          },
          { status: 500 }
        );
      }

      const cursor = await runCursorAgent({
        message: text,
        cursorAgentId,
        newSession,
        entries,
      });

      return NextResponse.json({
        reply: cursor.reply,
        actions: [],
        source: "cursor" as const,
        cursorAgentId: cursor.cursorAgentId,
        meta: { runId: cursor.runId, status: cursor.status },
      });
    }

    return runFinanceAgent(text, history, entries);
  } catch (error) {
    console.error("[api/lifeos-agent] Error:", error);
    if (error instanceof CursorAgentError) {
      const hint =
        /invalid user api key/i.test(error.message)
          ? " Get a new User API key: cursor.com/dashboard → API Keys → Create. Paste the full key into .env.local as CURSOR_API_KEY=... then restart npm run dev."
          : "";
      return NextResponse.json(
        {
          error: `Cursor agent: ${error.message}${hint}`,
          retryable: error.isRetryable,
        },
        { status: error.isRetryable ? 503 : 500 }
      );
    }
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      { error: `LifeOS agent failed: ${message}` },
      { status: 500 }
    );
  }
}
