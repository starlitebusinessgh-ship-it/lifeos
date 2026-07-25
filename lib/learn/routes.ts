import type { CategoryId } from "./categories";
import { LEARN_CATEGORIES } from "./categories";

export function categoryToSlug(id: CategoryId): string {
  if (id === "All") return "all";
  return id.toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string): CategoryId {
  if (slug === "all") return "All";
  const normalized = slug.toLowerCase().replace(/-/g, " ");
  const found = LEARN_CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === slug.toLowerCase() ||
      c.id.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase() ||
      c.id.toLowerCase() === normalized
  );
  return (found?.id as CategoryId) ?? "Other";
}

export function collectionHref(id: CategoryId): string {
  return `/learn/c/${categoryToSlug(id)}`;
}

export function isBookId(param: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
}

export function isHubSlug(slug: string): boolean {
  const cat = slugToCategory(slug);
  const def = LEARN_CATEGORIES.find((c) => c.id === cat);
  return Boolean(def?.hub);
}
