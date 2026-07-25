import { notFound } from "next/navigation";
import { LearnCategoryHubClient } from "@/components/learn/LearnCategoryHubClient";
import { LearnCollectionShelfClient } from "@/components/learn/LearnCollectionShelfClient";
import { isHubCategory, LEARN_CATEGORIES } from "@/lib/learn/categories";
import { categoryToSlug, slugToCategory } from "@/lib/learn/routes";

function isValidCategorySlug(slug: string): boolean {
  if (slug === "all") return true;
  return LEARN_CATEGORIES.some((c) => categoryToSlug(c.id) === slug);
}

export default async function LearnCollectionPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  if (!isValidCategorySlug(slug)) notFound();

  const categoryId = slugToCategory(slug);
  if (isHubCategory(categoryId)) {
    return <LearnCategoryHubClient categoryId={categoryId} />;
  }

  return <LearnCollectionShelfClient categoryId={categoryId} />;
}

export async function generateStaticParams() {
  return LEARN_CATEGORIES.filter((c) => c.id !== "All").map((c) => ({
    category: categoryToSlug(c.id),
  }));
}
