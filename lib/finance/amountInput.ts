/** Strip to digits + one decimal for input fields. */
export function sanitizeAmountInput(raw: string): string {
  const v = raw.replace(/[^0-9.]/g, "");
  const parts = v.split(".");
  if (parts.length <= 2) return v;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

/** Display GH₵ amounts with thousands separators in inputs/labels. */
export function formatAmountDisplay(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return n.toLocaleString("en-GH", { maximumFractionDigits: 2 });
}

export function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/,/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
