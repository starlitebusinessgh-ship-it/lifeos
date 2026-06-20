import { FINANCE_ASSUMPTIONS, GOALS } from "./assumptions";
import { validateActions } from "./agent-actions";
import type { AgentAction, FinanceAgentResponse, FinanceEntry } from "./types";

export const USD_TO_GHS = FINANCE_ASSUMPTIONS.usdToGhs;

export type AgentTransaction = {
  description: string;
  category: string;
  type: "Income" | "Expense" | "Savings" | string;
  intent: string;
  amount: number;
  date: string;
  note?: string;
};

export type FinanceAgentContext = {
  loanBalance: number;
  usdToGhs: number;
  today: string;
  categories: string[];
};

export function buildAgentContext(
  entries: FinanceEntry[],
  today = new Date().toISOString().slice(0, 10)
): FinanceAgentContext {
  return {
    loanBalance: computeRemainingLoan(entries),
    usdToGhs: USD_TO_GHS,
    today,
    categories: [
      "Salary",
      "Other Income",
      "Family Support",
      "Tithe",
      "Personal Spending",
      "Transport",
      "Food",
      "Health",
      "Gifts",
      "Loan Payment",
      "Savings Transfer",
      "Other",
    ],
  };
}

export function computeRemainingLoan(entries: FinanceEntry[]) {
  const paid = entries
    .filter((e) => e.category === "Loan Payment")
    .reduce((s, e) => s + Math.abs(Number(e.amount)), 0);
  return Math.max(0, FINANCE_ASSUMPTIONS.currentLoanBalance - paid);
}

export function computeRunningBalance(entries: FinanceEntry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let bank = FINANCE_ASSUMPTIONS.startingBankBalance;
  let loan: number = FINANCE_ASSUMPTIONS.currentLoanBalance;

  for (const e of sorted) {
    const amt = Math.abs(Number(e.amount));
    const t = e.type.trim().toLowerCase();
    if (t === "income") bank += amt;
    else if (t === "expense") {
      bank -= amt;
      if (e.category === "Loan Payment") loan = Math.max(0, loan - amt);
    } else if (t === "savings") bank -= amt;
  }

  return {
    bank,
    loan,
    netWorth: bank - loan,
    savings: FINANCE_ASSUMPTIONS.currentSavings,
  };
}

export function buildAccountSnapshot(entries: FinanceEntry[]) {
  const { bank, loan, netWorth } = computeRunningBalance(entries);
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15)
    .map(
      (e) =>
        `id=${e.id} | ${e.date} | ${e.description} | ${e.category} | ${e.type} | GH₵${Math.round(Math.abs(Number(e.amount)))}`
    );

  const loanPayments = entries
    .filter((e) => e.category === "Loan Payment")
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    loanBalanceRemaining: loan,
    bankBalance: bank,
    netWorth,
    loanPaymentCount: loanPayments.length,
    lastLoanPayment: loanPayments[0]
      ? `id=${loanPayments[0].id} ${loanPayments[0].date} GH₵${Math.round(Math.abs(Number(loanPayments[0].amount)))} - ${loanPayments[0].description}`
      : "none logged",
    recentTransactions: recent.length > 0 ? recent.join("\n") : "none",
  };
}

export function buildAgentSystemPrompt(
  ctx: FinanceAgentContext,
  snapshot: ReturnType<typeof buildAccountSnapshot>
) {
  const goalsText = GOALS.map(
    (g) => `- ${g.name}: GH₵${Math.round(g.current)} / GH₵${Math.round(g.target)} (${g.status})`
  ).join("\n");

  return `You are a personal finance coach inside a GH₵ (Ghana Cedi) workbook. Talk like ChatGPT: warm, clear, and helpful. You can log transactions AND give real financial advice.

PERSONAL FINANCIAL PLAN (use this for advice — do not invent numbers):
- Monthly salary: GH₵${FINANCE_ASSUMPTIONS.monthlyIncome}
- Monthly savings target: GH₵${FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings} (~${Math.round((FINANCE_ASSUMPTIONS.plannedMonthlyNetSavings / FINANCE_ASSUMPTIONS.monthlyIncome) * 100)}% savings rate)
- Monthly essentials budget: Family GH₵400, Tithe GH₵300, Personal GH₵100
- Contract salary through: ${FINANCE_ASSUMPTIONS.contractEnd} (no December salary)
- Starting bank balance: GH₵${Math.round(FINANCE_ASSUMPTIONS.startingBankBalance)}
- Goals:
${goalsText}

CURRENT ACCOUNT DATA (live from database):
- Loan remaining: GH₵${snapshot.loanBalanceRemaining}
- Bank balance: GH₵${Math.round(snapshot.bankBalance)}
- Net worth: GH₵${Math.round(snapshot.netWorth)}
- Loan payments logged: ${snapshot.loanPaymentCount}
- Last loan payment: ${snapshot.lastLoanPayment}
- Recent transactions (use id= for delete actions):
${snapshot.recentTransactions}

HOW TO RESPOND:
- Advice / strategy / "what should I do" questions: give 2-4 specific, personalized recommendations using their plan and numbers above. Explain why. Do NOT reply with only a balance dump.
- Balance / status questions: answer with the relevant numbers, briefly.
- Logging requests: parse and return log actions immediately — never ask for confirmation.
- Open conversation: be natural; you are a coach, not a receipt printer.

WHAT YOU CAN DO (return actions to execute):
1. Log transactions — split multi-step messages into separate entries
2. Answer questions and give financial guidance
3. Delete entries — use entryId from recent transactions list
4. Switch tabs: executive, budget, monthly, networth, weekly, principles, transactions, contract, goals
5. Set month filter (YYYY-MM) or year (YYYY)

RULES FOR LOGGING:
- All amounts in GH₵ (round to whole cedi)
- USD x ${ctx.usdToGhs} (e.g. $5 -> GH₵${5 * ctx.usdToGhs})
- Loan payments -> category "Loan Payment", type "Expense"
- If user says "paid the loan" without amount -> use GH₵${ctx.loanBalance}
- Default date: ${ctx.today}

Categories: ${ctx.categories.join(", ")}
Types: Income, Expense, Savings
Intents: Necessary, Optional, Wasteful, Investment, Giving

After logging or answering about loan/net worth, switch to networth tab when helpful.
Use plain text only. No emojis. Use dashes for lists in reply text.

Respond ONLY with valid JSON:
{
  "reply": "conversational message shown in chat",
  "actions": [
    { "type": "log", "transactions": [{ "description", "category", "type", "intent", "amount", "date", "note" }] },
    { "type": "delete", "entryId": 123 },
    { "type": "switch_tab", "tab": "networth" },
    { "type": "set_month", "month": "2026-06" },
    { "type": "set_year", "year": "2026" }
  ]
}

Use empty actions [] for pure Q&A with no side effects.`;
}

const VALID_TYPES = new Set(["income", "expense", "savings"]);
const VALID_INTENTS = new Set([
  "necessary",
  "optional",
  "wasteful",
  "investment",
  "giving",
]);

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function normalizeCategory(cat: string) {
  const known = [
    "Salary",
    "Other Income",
    "Family Support",
    "Tithe",
    "Personal Spending",
    "Transport",
    "Food",
    "Health",
    "Gifts",
    "Loan Payment",
    "Savings Transfer",
    "Other",
  ];
  const match = known.find(
    (k) => k.toLowerCase() === cat.trim().toLowerCase()
  );
  return match ?? "Other";
}

function parseTransactions(
  rawList: unknown[],
  ctx: FinanceAgentContext
): AgentTransaction[] {
  const transactions: AgentTransaction[] = [];
  for (const raw of rawList) {
    if (!raw || typeof raw !== "object") continue;
    const t = raw as Record<string, unknown>;
    if (
      typeof t.description !== "string" ||
      typeof t.category !== "string" ||
      typeof t.type !== "string" ||
      typeof t.intent !== "string" ||
      typeof t.amount !== "number" ||
      typeof t.date !== "string"
    ) {
      continue;
    }
    const typeNorm = t.type.trim().toLowerCase();
    if (!VALID_TYPES.has(typeNorm)) continue;

    let amount = Math.round(Math.abs(Number(t.amount)));
    if (amount <= 0) continue;

    const category = normalizeCategory(t.category);
    if (
      category === "Loan Payment" &&
      t.description.toLowerCase().includes("loan") &&
      amount > ctx.loanBalance &&
      ctx.loanBalance > 0
    ) {
      amount = ctx.loanBalance;
    }

    transactions.push({
      description: t.description.trim().slice(0, 80),
      category,
      type: capitalize(typeNorm) as AgentTransaction["type"],
      intent: VALID_INTENTS.has(t.intent.trim().toLowerCase())
        ? capitalize(t.intent.trim())
        : "Necessary",
      amount,
      date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : ctx.today,
      note: typeof t.note === "string" ? t.note : undefined,
    });
  }
  return transactions;
}

function enrichLogActions(
  actions: AgentAction[],
  ctx: FinanceAgentContext
): AgentAction[] {
  return actions.map((action) => {
    if (action.type !== "log") return action;
    const txs = parseTransactions(action.transactions as unknown[], ctx);
    return { type: "log", transactions: txs };
  });
}

export function validateAgentResponse(
  value: unknown,
  ctx: FinanceAgentContext
): FinanceAgentResponse | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;

  const reply =
    typeof obj.reply === "string"
      ? obj.reply
      : typeof obj.summary === "string"
        ? obj.summary
        : null;
  if (!reply?.trim()) return null;

  if (Array.isArray(obj.actions)) {
    const parsed = enrichLogActions(validateActions(obj.actions), ctx);
    return { reply, actions: parsed };
  }

  if (Array.isArray(obj.transactions)) {
    const txs = parseTransactions(obj.transactions, ctx);
    if (txs.length > 0) {
      return {
        reply,
        actions: [{ type: "log", transactions: txs }],
      };
    }
    if (obj.mode === "query") {
      return { reply, actions: [] };
    }
  }

  if (obj.mode === "query") {
    return { reply, actions: [] };
  }

  return null;
}

/** Fallback: detect USD amounts in user text and ensure conversion */
export function postProcessFromUserText(
  text: string,
  result: FinanceAgentResponse,
  ctx: FinanceAgentContext
): FinanceAgentResponse {
  const usdMatches = [
    ...text.matchAll(/\$\s*(\d+(?:\.\d+)?)/gi),
    ...text.matchAll(/(\d+(?:\.\d+)?)\s*(?:usd|dollars?)/gi),
  ];

  if (usdMatches.length === 0) return result;

  const usdAmounts = usdMatches.map((m) => parseFloat(m[1]));
  const actions = result.actions.map((action) => {
    if (action.type !== "log") return action;
    const txs = [...action.transactions];
    for (let i = 0; i < usdAmounts.length && i < txs.length; i++) {
      const expected = Math.round(usdAmounts[i] * ctx.usdToGhs);
      const tx = txs[i];
      if (Math.abs(tx.amount - expected) > 2) {
        txs[i] = {
          ...tx,
          amount: expected,
          note: `Converted $${usdAmounts[i]} USD to GH₵${expected} (rate ${ctx.usdToGhs})`,
        };
      }
    }
    return { type: "log" as const, transactions: txs };
  });

  return { ...result, actions };
}
