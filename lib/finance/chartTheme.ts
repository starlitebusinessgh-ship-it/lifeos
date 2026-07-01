/** Chart palette — tuned for light Revolut-style UI. */
export const CHART = {
  income: "#10b981",
  incomeDim: "rgba(16, 185, 129, 0.2)",
  expense: "#f43f5e",
  expenseDim: "rgba(244, 63, 94, 0.18)",
  savings: "#6366f1",
  savingsDim: "rgba(99, 102, 241, 0.18)",
  net: "#f59e0b",
  netDim: "rgba(245, 158, 11, 0.15)",
  grid: "rgba(15, 23, 42, 0.06)",
  axis: "#94a3b8",
  cursor: "rgba(73, 79, 223, 0.06)",
  tooltipBg: "#ffffff",
  tooltipBorder: "rgba(15, 23, 42, 0.08)",
} as const;

export const SERIES_LABELS: Record<string, string> = {
  income: "Income",
  expense: "Expenses",
  savings: "Savings",
  net: "Net",
  total: "Amount",
};

export const CATEGORY_PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#a855f7",
  "#0ea5e9",
  "#f97316",
  "#ec4899",
  "#84cc16",
  "#64748b",
];
