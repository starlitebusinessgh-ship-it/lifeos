import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

import type { FinanceMetrics, InsightItem } from "@/lib/finance/insights";

function fallbackInsights(m: FinanceMetrics): InsightItem[] {
  const items: InsightItem[] = [];
  const pace = m.savingsMonthsLeft && m.savingsMonthsLeft > 0
    ? Math.ceil((m.savingsGoal - m.savingsTotal) / m.savingsMonthsLeft)
    : m.monthlySavingsTarget;

  if (m.savingsGoal > 0) {
    const gap = m.savingsGoal - m.savingsTotal;
    items.push({
      title: "Savings runway",
      body: `You need about ${m.currency}${pace.toLocaleString()} per month for the next ${m.savingsMonthsLeft ?? 5} months to reach your ${m.currency}${m.savingsGoal.toLocaleString()} goal before national service ends. You've saved ${m.currency}${m.savingsTotal.toLocaleString()} so far — ${gap > 0 ? `${m.currency}${gap.toLocaleString()} still to go` : "goal already met"}.`,
      tone: gap > pace * (m.savingsMonthsLeft ?? 1) ? "warning" : "neutral",
    });
  }

  if (m.debtsIOwe > 0) {
    items.push({
      title: "Outstanding promises & loans",
      body: `You currently owe ${m.currency}${m.debtsIOwe.toLocaleString()} in total. ${m.debtsDueSoon.length > 0 ? `${m.debtsDueSoon.length} payment(s) are due within a week — plan these before discretionary spending.` : "No urgent due dates this week, but keep these in your monthly plan."}`,
      tone: m.debtsDueSoon.some((d) => d.daysUntil <= 3) ? "critical" : "warning",
    });
  }

  const over = m.budgets.filter((b) => b.budget > 0 && b.spent > b.budget);
  if (over.length > 0) {
    items.push({
      title: "Budget pressure",
      body: `You're over budget on ${over.map((b) => b.category).join(", ")}. With a typical salary around ${m.currency}${m.salaryTypical.toLocaleString()} and fixed giving commitments, trim optional spending in these categories for the rest of the month.`,
      tone: "warning",
    });
  } else if (m.net >= 0) {
    items.push({
      title: "Month is holding",
      body: `Net this month is +${m.currency}${m.net.toLocaleString()} with ${m.currency}${m.income.toLocaleString()} in and ${m.currency}${(m.expense + m.savings).toLocaleString()} out. If this holds, you're on track — prioritise moving ${m.currency}${pace.toLocaleString()} to savings as soon as salary lands.`,
      tone: "positive",
    });
  }

  return items.slice(0, 4);
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  let m: FinanceMetrics;
  try {
    m = (await req.json()) as FinanceMetrics;
  } catch {
    return NextResponse.json({ insights: [] });
  }

  if (!apiKey) {
    return NextResponse.json({ insights: fallbackInsights(m) });
  }

  const client = new OpenAI({ apiKey });

  const overBudget = m.budgets.filter((b) => b.budget > 0 && b.spent > b.budget);
  const underBudget = m.budgets.filter((b) => b.budget > 0 && b.spent <= b.budget * 0.5);

  const system = `You are a trusted personal finance advisor for Chris, a young professional in Ghana (currency: ${m.currency}).
He is in national service with ~5 months left (ends ${m.nationalServiceEnds}). Typical salary ~${m.currency}${m.salaryTypical}. After service he must find work or build a business.
He tithes, supports family/grandma, tracks mom's cash allowance separately, and has a ${m.currency}${m.savingsGoal} savings goal.
Be honest, specific, and actionable. Use real numbers from the data. No generic advice. No markdown.
Return ONLY valid JSON: {"insights":[{"title":"short headline","body":"2-4 sentences with numbers and a clear next step","tone":"positive"|"warning"|"neutral"|"critical"}]}
Give 3-4 insights. Prioritise: savings pace vs deadline, debts due soon, budget overruns, and whether he can afford upcoming promises.`;

  const user = JSON.stringify({
    month: m.month,
    balance: m.balance,
    income: m.income,
    expense: m.expense,
    savingsThisMonth: m.savings,
    net: m.net,
    topSpending: m.topCategories,
    overBudget: overBudget.map((b) => ({ ...b, overBy: b.spent - b.budget })),
    underBudget,
    savingsTotal: m.savingsTotal,
    savingsGoal: m.savingsGoal,
    savingsDeadline: m.savingsDeadline,
    monthsLeft: m.savingsMonthsLeft,
    monthlySavingsNeeded: m.monthlySavingsTarget,
    owedToMe: m.debtsOwedToMe,
    iOwe: m.debtsIOwe,
    dueSoon: m.debtsDueSoon,
  });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1200,
      temperature: 0.45,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { insights?: InsightItem[] };
    const insights = (parsed.insights ?? []).filter((i) => i.title && i.body).slice(0, 4);
    if (insights.length === 0) return NextResponse.json({ insights: fallbackInsights(m) });
    return NextResponse.json({ insights });
  } catch {
    return NextResponse.json({ insights: fallbackInsights(m) });
  }
}
