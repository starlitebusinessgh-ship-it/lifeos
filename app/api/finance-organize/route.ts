import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { STRUCTURED_MODEL } from "@/lib/ai/models";
import { createClient } from "@supabase/supabase-js";
import { tryLocalCommand } from "@/lib/finance/agent-actions";
import {
  buildAccountSnapshot,
  buildAgentContext,
  buildAgentSystemPrompt,
  postProcessFromUserText,
  validateAgentResponse,
  USD_TO_GHS,
} from "@/lib/finance/agent";
import type { FinanceEntry } from "@/lib/finance/types";

type ChatTurn = { role: "user" | "assistant"; content: string };

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    let entries: FinanceEntry[] = [];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("finance_entries")
        .select("id, date, description, category, type, intent, amount, created_at")
        .order("date", { ascending: false });
      if (data) entries = data;
    }

    const ctx = buildAgentContext(entries, new Date().toISOString().slice(0, 10));
    const snapshot = buildAccountSnapshot(entries);

    const local = tryLocalCommand(text, entries);
    if (local) {
      return NextResponse.json({
        ...local,
        meta: { usdToGhs: USD_TO_GHS, loanBalance: ctx.loanBalance },
      });
    }

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
      meta: { usdToGhs: USD_TO_GHS, loanBalance: ctx.loanBalance },
    });
  } catch (error) {
    console.error("[api/finance-organize] Error:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      { error: `Finance agent failed: ${message}` },
      { status: 500 }
    );
  }
}
