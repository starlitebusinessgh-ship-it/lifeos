import type { HighlightWithBook } from "./highlightActions";

export function highlightsToMarkdown(highlights: HighlightWithBook[]): string {
  const lines = ["# Highlights", ""];
  let lastBook = "";
  for (const h of highlights) {
    if (h.book_title !== lastBook) {
      lines.push(`## ${h.book_title}${h.book_author ? ` — ${h.book_author}` : ""}`, "");
      lastBook = h.book_title;
    }
    lines.push(`> ${h.quote}`);
    if (h.note) lines.push(`*${h.note}*`);
    if (h.page) lines.push(`— p. ${h.page}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function highlightsToPlainText(highlights: HighlightWithBook[]): string {
  return highlights
    .map((h) => {
      const parts = [`${h.book_title}: "${h.quote}"`];
      if (h.note) parts.push(`Note: ${h.note}`);
      if (h.page) parts.push(`Page ${h.page}`);
      return parts.join("\n");
    })
    .join("\n\n---\n\n");
}

export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyHighlights(highlights: HighlightWithBook[]): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(highlightsToPlainText(highlights));
    return true;
  } catch {
    return false;
  }
}

export function shareHighlights(highlights: HighlightWithBook[]) {
  const text = highlightsToPlainText(highlights);
  if (navigator.share) {
    void navigator.share({ title: "My highlights", text });
    return;
  }
  void copyHighlights(highlights);
}
