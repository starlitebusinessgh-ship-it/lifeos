import type { GoalRow } from "./types";

export const FINANCE_ASSUMPTIONS = {
  startingBankBalance: 8372.47,
  currentLoanBalance: 0,
  plannedMonthlyNetSavings: 2000,
  monthlyEssentialSpending: 800,
  monthlyIncome: 2800,
  currentSavings: 8372.47,
  emergencyFundMonths: 6,
  emergencyFundBalance: 0,
  contractStart: "2026-01-01",
  contractEnd: "2026-11-30",
  fiMultiple: 25,
  usdToGhs: 11.6,
} as const;

export const GOALS: GoalRow[] = [
  {
    name: "Reach GH₵20,000 by end of 2026",
    target: 20000,
    current: 8372.47,
    targetDate: "2026-12-31",
    status: "In progress",
  },
  {
    name: "Build 6-month emergency fund",
    target: 4800,
    current: 0,
    targetDate: "2026-11-30",
    status: "In progress",
  },
];

export const WEEKLY_CHECKLIST = [
  "Check bank balances",
  "Review spending",
  "Update net worth",
  "Ensure bills are paid",
  "Invest any excess cash",
];

export const WEEKLY_QUESTIONS = [
  "Did I spend on things I value?",
  "Did I buy anything impulsively?",
  "Am I moving toward financial freedom?",
];

export const PRINCIPLES_CONTENT = {
  title: "Principles & Playbook",
  subtitle: "Timeless advice from investors who compounded for decades",
  formula: {
    title: "THE GREAT WEALTH FORMULA",
    equation: "Income × Savings Rate × Time × Good Decisions",
    note: "Not in the formula: perfect stock picking · getting rich quick",
  },
  columns: [
    {
      name: "Warren Buffett",
      bullets: [
        "Spend less than you earn",
        "Invest consistently",
        "Avoid debt",
        "Think long term",
      ],
    },
    {
      name: "John C. Bogle",
      bullets: [
        "Keep fees low",
        "Use broad index funds",
        "Stay invested for decades",
        "Ignore market noise",
      ],
    },
    {
      name: "Charlie Munger",
      bullets: [
        "Avoid stupid mistakes",
        "Be patient",
        "Read constantly",
        "Know your circle of competence",
      ],
    },
    {
      name: "Morgan Housel",
      bullets: [
        "Wealth is what you don't spend",
        "Success is behavior, not intelligence",
        "Room for error beats precision",
        "Freedom is the goal",
      ],
    },
    {
      name: "Benjamin Graham",
      bullets: [
        "Protect yourself from emotional decisions",
        "Invest systematically",
        "Margin of safety",
        "Mr. Market is your servant",
      ],
    },
    {
      name: "Simple Rules That Work",
      bullets: [
        "Save at least 20% of income",
        "Build a 6-month emergency fund",
        "Automate savings",
        "Track every transaction",
      ],
    },
  ],
  quote:
    "Do not save what is left after spending; spend what is left after saving.",
};

export function getEmergencyTargets(
  essential = FINANCE_ASSUMPTIONS.monthlyEssentialSpending
) {
  return [
    { months: 3, amount: essential * 3 },
    { months: 6, amount: essential * 6 },
    { months: 12, amount: essential * 12 },
  ];
}

export const PORTFOLIO = {
  cash: 0,
  tbills: 0,
  liquidity: 0,
} as const;

/** 2000 / 2800 ≈ 71.4% monthly savings target */
export const ANNUAL_SAVINGS_RATE_TARGET = 2000 / 2800;

export const FINANCIAL_MEMORY_SEED: {
  sortKey: string;
  month: string;
  text: string;
}[] = [];

export const CATEGORIES_REF = [
  "Salary",
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

export const TYPES_REF = ["Income", "Expense", "Transfer", "Investment", "Savings"];
