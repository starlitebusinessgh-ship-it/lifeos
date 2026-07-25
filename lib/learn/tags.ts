export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(", ");
}

export function collectTagsFromBooks(books: { tags: string[] }[]): string[] {
  const set = new Set<string>();
  for (const b of books) {
    for (const t of b.tags ?? []) set.add(t);
  }
  return [...set].sort();
}
