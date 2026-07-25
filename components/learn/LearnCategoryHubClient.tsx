"use client";

import { LearnCategoryHub } from "@/components/learn/LearnCategoryHub";
import { useLibrary } from "@/lib/learn/useLibrary";
import type { CategoryId } from "@/lib/learn/categories";

export function LearnCategoryHubClient({ categoryId }: { categoryId: CategoryId }) {
  const { books } = useLibrary();
  return (
    <div className="ln-in-shell">
      <LearnCategoryHub categoryId={categoryId} books={books} />
    </div>
  );
}
