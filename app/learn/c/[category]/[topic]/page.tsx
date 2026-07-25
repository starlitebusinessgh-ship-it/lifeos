import { notFound } from "next/navigation";
import { LearnCollectionShelfClient } from "@/components/learn/LearnCollectionShelfClient";
import { LearnTopicShelfClient } from "@/components/learn/LearnTopicShelfClient";
import { slugToCategory } from "@/lib/learn/routes";
import { getTopicDef } from "@/lib/learn/topics";

export default async function LearnTopicPage({
  params,
}: {
  params: Promise<{ category: string; topic: string }>;
}) {
  const { category: catSlug, topic } = await params;
  const categoryId = slugToCategory(catSlug);

  if (categoryId !== "Self Help") notFound();

  if (topic === "all") {
    return <LearnCollectionShelfClient categoryId={categoryId} />;
  }

  const topicDef = getTopicDef(topic);
  if (!topicDef) notFound();

  return <LearnTopicShelfClient categoryId={categoryId} topicSlug={topic} />;
}
