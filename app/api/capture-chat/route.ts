import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { CHAT_MODEL } from "@/lib/ai/models";
import { LIFEOS_TOOLS } from "@/lib/ai/tools";
import { executeTool } from "@/lib/ai/executor";
import type { ToolAction } from "@/lib/ai/executor";

export const runtime = "nodejs";
export const maxDuration = 120;

type ChatTurn = { role: "user" | "assistant"; content: string };

function buildSystemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  const hour = new Date().getHours();
  const period =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "night";

  return `You are the LifeOS AI agent for Chris — his personal life operating system assistant.
Today: ${today} (${period})

Chris's 9 life domains: Identity, Time, Knowledge, Health, Spirit, Wealth, Relationships, Work, Reflection.

App sections you can navigate to:
- /today — Daily dashboard
- /capture — AI journaling and thinking partner (current page)
- /entries — Journal history
- /principles — Personal constitution
- /finance — Financial workbook (bank balance, loan, budget, transactions in GHS)
- /spaces — All 9 life domains hub

TOOLS — use them proactively without asking permission when intent is clear:
- save_journal_entry → when Chris says "save this", "keep this", "journal that"
- navigate_to → when he says "take me to X", "open finance", "go to entries"
- search_journal → when he asks about past thoughts, decisions, or reflections
- get_finance_summary → when he asks about money, balance, or financial state
- log_finance_entry → when he mentions spending, receiving, or saving money (GHS)
- delete_finance_entry → when he says "delete that transaction" or "remove that entry"
- get_principles → when he asks about or wants to update his principles
- update_principles → when he dictates changes to his personal constitution
- delete_journal_entry → when he asks to delete a journal entry

BEHAVIOR:
- Be direct and warm. Match his energy — short messages get short replies.
- Use tools immediately when intent is clear. Never ask "should I save this?"
- After executing an action, confirm it briefly and move on.
- Finance amounts are always in GHS (Ghana cedis) unless otherwise noted.
- Do not output JSON. No emojis. Plain text only.`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const text =
    body && typeof body === "object" && "text" in body
      ? (body as { text: unknown }).text
      : undefined;

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Missing non-empty 'text' field." }, { status: 400 });
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const openai = new OpenAI({ apiKey, timeout: 60_000, maxRetries: 1 });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    ...history.slice(-16).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: text.trim() },
  ];

  try {
    const collectedActions: ToolAction[] = [];
    let iterations = 0;

    let response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      tools: LIFEOS_TOOLS,
      tool_choice: "auto",
    });

    /* ── Agentic loop: execute tool calls until model gives a final reply ── */
    while (response.choices[0]?.finish_reason === "tool_calls" && iterations < 6) {
      const assistantMsg = response.choices[0].message;
      messages.push(assistantMsg);

      const toolCalls = (assistantMsg.tool_calls ?? []) as Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;

      for (const tc of toolCalls) {
        if (!tc.function) continue;
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        } catch {
          args = {};
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await executeTool(tc.function.name, args, supabase as any);
        if (result.action) collectedActions.push(result.action);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result.data),
        });
      }

      iterations++;

      response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        tools: LIFEOS_TOOLS,
        tool_choice: "auto",
        });
    }

    const reply = response.choices[0]?.message?.content?.trim() ?? "";

    if (!reply) {
      return NextResponse.json({ error: "No response from model." }, { status: 502 });
    }

    return NextResponse.json({
      reply,
      actions: collectedActions.length > 0 ? collectedActions : undefined,
    });
  } catch (error) {
    console.error("[api/capture-chat] Error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    const isTimeout = /timeout|timed out/i.test(message);
    return NextResponse.json(
      {
        error: isTimeout
          ? "Response took too long. Try again."
          : `Chat failed: ${message}`,
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
