"use client";

import { LearnCollectionShelf } from "@/components/learn/LearnCollectionShelf";
import type { CategoryId } from "@/lib/learn/categories";

export function LearnCollectionShelfClient({ categoryId }: { categoryId: CategoryId }) {
  return (
    <div className="ln-in-shell">
      <LearnCollectionShelf categoryId={categoryId} />
    </div>
  );
}
