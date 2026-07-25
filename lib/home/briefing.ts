import type { Debt } from "@/lib/finance/debts";
import { daysUntil, remaining } from "@/lib/finance/debts";
import type { MonthSummary } from "@/lib/finance/logic";
import { formatMoney } from "@/lib/finance/logic";

export type DayPhase = "morning" | "afternoon" | "evening" | "night";

export interface HomeSignal {
  id: string;
  module: "finance" | "vitality";
  text: string;
  href: string;
  priority: number;
}

export interface HomeBriefing {
  phase: DayPhase;
  dateLabel: string;
  headline: string;
  subline: string;
  /** Urgent items only — shown below the finance card. */
  attention: HomeSignal[];
}

const ATTENTION_MIN = 35;
const MAX_ATTENTION = 2;

export function dayPhase(now = new Date()): DayPhase {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function phaseGreeting(phase: DayPhase): string {
  switch (phase) {
    case "morning":
      return "Good morning";
    case "afternoon":
      return "Good afternoon";
    case "evening":
      return "Good evening";
    case "night":
      return "Good night";
  }
}

function formatDateLabel(now = new Date()): string {
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function buildHomeBriefing(input: {
  debts: Debt[];
  month: MonthSummary;
  now?: Date;
}): HomeBriefing {
  const now = input.now ?? new Date();
  const phase = dayPhase(now);
  const greeting = phaseGreeting(phase);

  const attention: HomeSignal[] = [];

  const urgentDebts = input.debts
    .filter((d) => remaining(d) > 0 && d.due_date)
    .map((d) => {
      const days = daysUntil(d.due_date);
      const name = d.counterparty;
      const amt = formatMoney(remaining(d), false);
      let text: string;
      let priority: number;
      if (days !== null && days < 0) {
        text = `Pay ${name} ${amt} — overdue`;
        priority = 100;
      } else if (days === 0) {
        text = `Pay ${name} ${amt} today`;
        priority = 90;
      } else if (days !== null && days <= 7) {
        text = `Pay ${name} ${amt} in ${days}d`;
        priority = 70 - days;
      } else {
        return null;
      }
      return {
        id: `debt-${d.id}`,
        module: "finance" as const,
        text,
        href: "/finance/debts",
        priority,
      };
    })
    .filter((x) => x !== null)
    .sort((a, b) => b.priority - a.priority);

  for (const s of urgentDebts.slice(0, 1)) {
    attention.push(s);
  }

  if (input.month.expense > 0 && input.month.net < 0) {
    attention.push({
      id: "month-overspend",
      module: "finance",
      text: `Spending ahead of income · ${formatMoney(input.month.net, false)} this month`,
      href: "/finance/analytics",
      priority: 35,
    });
  }

  const filtered = attention
    .filter((s) => s.priority >= ATTENTION_MIN)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_ATTENTION);

  const topDebt = urgentDebts[0];
  let headline: string;
  let subline: string;

  if (topDebt && topDebt.priority >= 90) {
    headline =
      topDebt.priority >= 100 ? "Something needs you today." : "Due today.";
    subline = topDebt.text;
  } else if (topDebt && topDebt.priority >= ATTENTION_MIN) {
    headline = "One thing on your radar.";
    subline = topDebt.text;
  } else if (input.month.net > 0 && input.month.income > 0) {
    headline = "You're clear.";
    subline = `${greeting} — in the green by ${formatMoney(input.month.net, false)} this month.`;
  } else {
    headline = "You're clear.";
    subline = `${greeting} — nothing needs you right now.`;
  }

  return {
    phase,
    dateLabel: formatDateLabel(now),
    headline,
    subline,
    attention: filtered,
  };
}
