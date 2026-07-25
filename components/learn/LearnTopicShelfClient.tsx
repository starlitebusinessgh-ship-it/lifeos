"use client";

import { LearnCollectionShelf } from "@/components/learn/LearnCollectionShelf";
import type { CategoryId } from "@/lib/learn/categories";
import { getTopicDef } from "@/lib/learn/topics";

export function LearnTopicShelfClient({
  categoryId,
  topicSlug,
}: {
  categoryId: CategoryId;
  topicSlug: string;
}) {
  const topic = getTopicDef(topicSlug);
  if (!topic) return null;

  return (
    <div className="ln-in-shell">
      <LearnCollectionShelf
        categoryId={categoryId}
        topicTag={topic.topicTag}
        titleOverride={topic.label}
        taglineOverride={topic.tagline}
        bannerImage={topic.coverImage}
        patternOverride={topic.pattern}
        backHref={`/learn/c/self-help`}
      />
    </div>
  );
}
