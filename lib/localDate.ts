/** Calendar date in the user's local timezone (YYYY-MM-DD). */
export function localDateIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDateIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatLocalDateLabel(iso: string, opts?: { today?: string }): string {
  const today = opts?.today ?? localDateIso();
  if (iso === today) return "Today";
  const d = parseLocalDateIso(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
