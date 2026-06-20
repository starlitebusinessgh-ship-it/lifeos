import path from "path";
import { Agent, CursorAgentError, type SDKMessage } from "@cursor/sdk";
import { FINANCE_ASSUMPTIONS, GOALS } from "@/lib/finance/assumptions";
import type { FinanceEntry } from "@/lib/finance/types";
import { buildAccountSnapshot } from "@/lib/finance/agent";

const REPO_ROOT = path.resolve(process.cwd());

function buildCursorContext(entries: FinanceEntry[]) {
  const snapshot = buildAccountSnapshot(entries);
  const goals = GOALS.map(
    (g) => `- ${g.name}: GH₵${Math.round(g.current)} / GH₵${Math.round(g.target)}`
  ).join("\n");

  return `You are the LifeOS agent embedded in a Next.js app (repo: ${REPO_ROOT}).

The user may reference work done in Cursor IDE chat. Apply those changes here in the codebase when asked.

Finance context (Supabase-backed workbook at /finance):
- Bank: GH₵${Math.round(snapshot.bankBalance)}, Loan: GH₵${snapshot.loanBalanceRemaining}, Net worth: GH₵${Math.round(snapshot.netWorth)}
- Monthly salary: GH₵${FINANCE_ASSUMPTIONS.monthlyIncome}, savings target: GH₵${FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings}
- Contract ends: ${FINANCE_ASSUMPTIONS.contractEnd}
- Goals:\n${goals}
- Recent transactions: ${entries.length} on record

You can edit files, run npm scripts, and fix the app directly. Key paths:
- components/finance/FinanceWorkbook.tsx — main finance UI
- lib/finance/assumptions.ts — baseline numbers
- app/api/finance-organize/route.ts — finance agent API
- scripts/clear-finance-data.mjs, scripts/seed-finance-baseline.mjs

When the user asks to log transactions, prefer telling them the exact phrase for the fast finance logger, OR run the seed/clear scripts if they want data resets.

Reply in plain text. No emojis. Be concise but complete about what you changed.`;
}

async function extractAssistantText(
  events: AsyncGenerator<SDKMessage, void>
): Promise<string> {
  let text = "";
  for await (const event of events) {
    if (event.type === "assistant" && "message" in event) {
      const msg = event.message;
      if (msg && typeof msg === "object" && "content" in msg && Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (
            block &&
            typeof block === "object" &&
            "type" in block &&
            block.type === "text" &&
            "text" in block &&
            typeof block.text === "string"
          ) {
            text += block.text;
          }
        }
      }
    }
  }
  return text.trim();
}

export type CursorAgentResult = {
  reply: string;
  cursorAgentId: string;
  runId: string;
  status: string;
};

export function validateCursorApiKeyFormat(apiKey: string): string | null {
  const key = apiKey.trim();
  if (!key) return "CURSOR_API_KEY is empty.";
  if (/^[0-9a-f]{32,}$/i.test(key)) {
    return "That looks like a token ID, not a User API key. Create one at cursor.com/dashboard → API Keys (it is shown once when created).";
  }
  if (!key.startsWith("cursor_") && !key.startsWith("crsr_")) {
    return "CURSOR_API_KEY format looks wrong. Use a User API key from cursor.com/dashboard → API Keys.";
  }
  return null;
}

export async function runCursorAgent(options: {
  message: string;
  cursorAgentId?: string;
  newSession?: boolean;
  entries: FinanceEntry[];
}): Promise<CursorAgentResult> {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey?.trim()) {
    throw new CursorAgentError("CURSOR_API_KEY is not configured.", {
      isRetryable: false,
    });
  }

  const formatError = validateCursorApiKeyFormat(apiKey);
  if (formatError) {
    throw new CursorAgentError(formatError, { isRetryable: false });
  }

  const context = buildCursorContext(options.entries);
  const prompt = `${context}\n\nUser request:\n${options.message.trim()}`;

  let agent: Awaited<ReturnType<typeof Agent.create>>;
  const useResume =
    options.cursorAgentId &&
    !options.newSession &&
    !options.cursorAgentId.startsWith("bc-");

  if (useResume) {
    try {
      agent = await Agent.resume(options.cursorAgentId!, {
        apiKey: apiKey.trim(),
        model: { id: "composer-2.5" },
        local: { cwd: REPO_ROOT, settingSources: [] },
      });
    } catch {
      agent = await Agent.create({
        apiKey: apiKey.trim(),
        model: { id: "composer-2.5" },
        local: { cwd: REPO_ROOT, settingSources: [] },
      });
    }
  } else {
    agent = await Agent.create({
      apiKey: apiKey.trim(),
      model: { id: "composer-2.5" },
      local: { cwd: REPO_ROOT, settingSources: [] },
    });
  }

  try {
    const run = await agent.send(prompt);
    let reply = "";

    if (run.supports("stream")) {
      reply = await extractAssistantText(run.stream());
    }

    const result = await run.wait();

    if (result.status === "error") {
      throw new CursorAgentError(`Cursor run failed (${result.id}).`, {
        isRetryable: true,
      });
    }

    if (!reply && result.result) reply = result.result;
    if (!reply) reply = "Done. Refresh the page if you changed the UI.";

    return {
      reply,
      cursorAgentId: agent.agentId,
      runId: result.id,
      status: result.status,
    };
  } catch (err) {
    if (err instanceof CursorAgentError) throw err;
    const message = err instanceof Error ? err.message : "Cursor agent failed.";
    throw new CursorAgentError(message, { isRetryable: true });
  }
}
