import type {
  AgentAction,
  FinanceAgentResponse,
  FinanceEntry,
  FinanceTabId,
  PendingTransaction,
} from "./types";
import { FINANCE_TABS } from "./theme";
import {
  computeRemainingLoan,
  computeRunningBalance,
  type AgentTransaction,
} from "./agent";

const TAB_ALIASES: { pattern: RegExp; tab: FinanceTabId }[] = [
  { pattern: /executive/, tab: "executive" },
  { pattern: /budget dashboard|^budget\b/, tab: "budget" },
  { pattern: /monthly budget/, tab: "monthly" },
  { pattern: /net worth|networth/, tab: "networth" },
  { pattern: /weekly/, tab: "weekly" },
  { pattern: /principle/, tab: "principles" },
  { pattern: /transaction/, tab: "transactions" },
  { pattern: /contract|runway/, tab: "contract" },
  { pattern: /goal|fire/, tab: "goals" },
];

const MONTH_NAMES: Record<string, string> = {
  january: "01",
  february: "02",
  march: "03",
  april: "04",
  may: "05",
  june: "06",
  july: "07",
  august: "08",
  september: "09",
  october: "10",
  november: "11",
  december: "12",
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

const VALID_TABS = new Set(FINANCE_TABS.map((t) => t.id));

export function validateActions(raw: unknown): AgentAction[] {
  if (!Array.isArray(raw)) return [];
  const actions: AgentAction[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const a = item as Record<string, unknown>;
    const type = a.type;

    if (type === "switch_tab" && typeof a.tab === "string" && VALID_TABS.has(a.tab as FinanceTabId)) {
      actions.push({ type: "switch_tab", tab: a.tab as FinanceTabId });
    } else if (type === "set_month" && typeof a.month === "string" && /^\d{4}-\d{2}$/.test(a.month)) {
      actions.push({ type: "set_month", month: a.month });
    } else if (type === "set_year" && typeof a.year === "string" && /^\d{4}$/.test(a.year)) {
      actions.push({ type: "set_year", year: a.year });
    } else if (type === "delete" && typeof a.entryId === "number") {
      actions.push({ type: "delete", entryId: a.entryId });
    } else if (type === "log" && Array.isArray(a.transactions)) {
      const txs = a.transactions as PendingTransaction[];
      if (txs.length > 0) actions.push({ type: "log", transactions: txs });
    }
  }
  return actions;
}

export function tryLocalCommand(
  text: string,
  entries: FinanceEntry[]
): FinanceAgentResponse | null {
  const lower = text.toLowerCase().trim();

  if (/^(go to|open|show|switch to|take me to)/i.test(text)) {
    for (const { pattern, tab } of TAB_ALIASES) {
      if (pattern.test(lower)) {
        const label = FINANCE_TABS.find((t) => t.id === tab)?.label ?? tab;
        return { reply: `Opening ${label}.`, actions: [{ type: "switch_tab", tab }] };
      }
    }
  }

  if (/(show|switch|go to|open|set|view)\s/i.test(text)) {
    for (const [name, num] of Object.entries(MONTH_NAMES)) {
      if (lower.includes(name)) {
        const yearMatch = lower.match(/20\d{2}/);
        const year = yearMatch ? yearMatch[0] : "2026";
        return {
          reply: `Switched to ${name.charAt(0).toUpperCase() + name.slice(1)} ${year}.`,
          actions: [
            { type: "set_year", year },
            { type: "set_month", month: `${year}-${num}` },
          ],
        };
      }
    }
  }

  if (/delete|remove/i.test(lower)) {
    const loan = entries.filter((e) => e.category === "Loan Payment");
    const last = entries[0];
    if (/loan/i.test(lower) && loan.length > 0) {
      const target = loan.sort((a, b) => b.date.localeCompare(a.date))[0];
      return {
        reply: `Deleting loan payment: ${target.description} (GH₵${Math.round(Math.abs(Number(target.amount)))}).`,
        actions: [{ type: "delete", entryId: target.id }],
      };
    }
    if (/last|recent/i.test(lower) && last) {
      return {
        reply: `Deleting most recent entry: ${last.description}.`,
        actions: [{ type: "delete", entryId: last.id }],
      };
    }
  }

  const query = tryLocalQuery(text, entries);
  if (query) return { reply: query.reply, actions: query.actions };

  return null;
}

function isAdviceOrOpenEnded(lower: string): boolean {
  if (
    /advice|recommend|suggest|tips|strategy|coach|guidance|opinion|priorit|improve|optimize|help me|how can i|ways to|best way|on track|should i|what should|explain|why should|am i doing|financial plan|save more|invest|grow wealth|build wealth|playbook|principle/i.test(
      lower
    )
  ) {
    return true;
  }
  if (/^what\b/.test(lower) && !/what (is|are) my|what('s| is) (my |the )?(balance|net worth|loan|bank)/i.test(lower)) {
    return true;
  }
  if (/^how\b/.test(lower) && !/how much/i.test(lower)) {
    return true;
  }
  if (/^tell me\b/.test(lower) && !/tell me (my |the )?(balance|net worth|loan|bank|transactions)/i.test(lower)) {
    return true;
  }
  return false;
}

function isFactualQuery(lower: string): boolean {
  return (
    /\?/.test(lower) ||
    /how much|balance|net worth|loan|logged|transaction|reflect|remaining|still owe|did it|does it|list (my )?transactions|show me (my )?(balance|net worth|loan|transactions)|what (is|are) my|what('s| is) (my |the )?(balance|net worth|loan|bank)/i.test(
      lower
    )
  );
}

function tryLocalQuery(text: string, entries: FinanceEntry[]): FinanceAgentResponse | null {
  const lower = text.toLowerCase().trim();

  if (isAdviceOrOpenEnded(lower)) return null;
  if (!isFactualQuery(lower)) return null;

  const loanPayments = entries
    .filter((e) => e.category === "Loan Payment")
    .sort((a, b) => b.date.localeCompare(a.date));
  const loanBalance = computeRemainingLoan(entries);
  const { netWorth, bank } = computeRunningBalance(entries);
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const actions: AgentAction[] = [];
  if (/net worth|loan|tab|reflect|showing/i.test(lower)) {
    actions.push({ type: "switch_tab", tab: "networth" });
  }

  if (/still show|net worth tab|doesn|tab|written|showing/i.test(lower)) {
    return {
      reply: `Net Worth tab uses live data. Loan remaining: GH₵${loanBalance}. Bank: GH₵${Math.round(bank)}, Net worth: GH₵${Math.round(netWorth)}. Opening Net Worth tab now.`,
      actions,
    };
  }

  if (/loan/i.test(lower)) {
    if (loanPayments.length === 0) {
      return {
        reply: `No loan payment logged yet. Remaining loan: GH₵${loanBalance}. Say "paid my loan" to log it.`,
        actions,
      };
    }
    const last = loanPayments[0];
    const totalPaid = loanPayments.reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
    const cleared = loanBalance === 0;
    return {
      reply: cleared
        ? `Yes, it reflected. Loan is fully paid (GH₵${totalPaid} total). Last entry: ${last.description} on ${last.date}. Net worth is GH₵${Math.round(netWorth)}.`
        : `Loan payment is saved. Last: ${last.description} on ${last.date} for GH₵${Math.round(Math.abs(Number(last.amount)))}. Total paid: GH₵${totalPaid}. Remaining: GH₵${loanBalance}. Net worth: GH₵${Math.round(netWorth)}.`,
      actions,
    };
  }

  if (/reflect|logged|recent|transaction|save|list/i.test(lower)) {
    if (recent.length === 0) {
      return {
        reply: "No transactions yet. Tell me what you spent or earned and I will log it.",
        actions: [{ type: "switch_tab", tab: "transactions" }],
      };
    }
    const lines = recent
      .map(
        (e) =>
          `- ${e.date} ${e.description} GH₵${Math.round(Math.abs(Number(e.amount)))} (${e.category})`
      )
      .join("\n");
    return {
      reply: `Latest transactions:\n${lines}\n\nLoan remaining: GH₵${loanBalance}. Net worth: GH₵${Math.round(netWorth)}.`,
      actions: [{ type: "switch_tab", tab: "transactions" }],
    };
  }

  if (/balance|net worth|status|summary|account/i.test(lower)) {
    return {
      reply: `Bank: GH₵${Math.round(bank)}, Loan remaining: GH₵${loanBalance}, Net worth: GH₵${Math.round(netWorth)}. ${entries.length} transaction(s) on record.`,
      actions,
    };
  }

  return null;
}

export function agentTransactionsToPending(txs: AgentTransaction[]): PendingTransaction[] {
  return txs.map((t) => ({
    description: t.description,
    category: t.category,
    type: t.type,
    intent: t.intent,
    amount: t.amount,
    date: t.date,
    note: t.note,
  }));
}
