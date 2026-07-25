/**
 * Resolve book cover art via Open Library (no API key required).
 */

export async function lookupCoverUrl(
  title: string,
  author?: string | null
): Promise<string | null> {
  const params = new URLSearchParams({ title: title.trim(), limit: "1" });
  if (author?.trim()) params.set("author", author.trim());

  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      docs?: { cover_i?: number; cover_edition_key?: string }[];
    };
    const doc = data.docs?.[0];
    if (!doc) return null;

    if (doc.cover_i) {
      return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    }
    if (doc.cover_edition_key) {
      return `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg`;
    }
    return null;
  } catch {
    return null;
  }
}
