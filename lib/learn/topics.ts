import type { LucideIcon } from "lucide-react";
import { Heart, Crown, MessageCircle, Brain } from "lucide-react";
import type { CategoryId } from "./categories";

export interface LearnTopicDef {
  id: string;
  slug: string;
  label: string;
  tagline: string;
  /** Tag applied to books in this subsection */
  topicTag: string;
  parentCategory: CategoryId;
  icon: LucideIcon;
  coverImage: string;
  gradient: string;
  accent: string;
  pattern: string;
}

export const SELF_HELP_TOPICS: LearnTopicDef[] = [
  {
    id: "marriage",
    slug: "marriage",
    label: "Marriage",
    tagline: "Covenant, intimacy & home",
    topicTag: "Marriage",
    parentCategory: "Self Help",
    icon: Heart,
    coverImage: "/learn/categories/marriage.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.48) 100%)",
    accent: "#be185d",
    pattern: "marriage",
  },
  {
    id: "leadership",
    slug: "leadership",
    label: "Leadership",
    tagline: "Influence, vision & teams",
    topicTag: "Leadership",
    parentCategory: "Self Help",
    icon: Crown,
    coverImage: "/learn/categories/leadership.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 100%)",
    accent: "#1e4976",
    pattern: "leadership",
  },
  {
    id: "communication",
    slug: "communication",
    label: "Communication",
    tagline: "Words, listening & clarity",
    topicTag: "Communication",
    parentCategory: "Self Help",
    icon: MessageCircle,
    coverImage: "/learn/categories/communication.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.48) 100%)",
    accent: "#0891b2",
    pattern: "communication",
  },
  {
    id: "psychology",
    slug: "psychology",
    label: "Psychology",
    tagline: "Mind, habits & behavior",
    topicTag: "Psychology",
    parentCategory: "Self Help",
    icon: Brain,
    coverImage: "/learn/categories/psychology.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.52) 100%)",
    accent: "#7c3aed",
    pattern: "psychology",
  },
];

export function getTopicDef(slug: string): LearnTopicDef | null {
  return SELF_HELP_TOPICS.find((t) => t.slug === slug) ?? null;
}

export function topicHref(parentSlug: string, topicSlug: string): string {
  return `/learn/c/${parentSlug}/${topicSlug}`;
}

export function bookMatchesTopic(
  book: { category: string; tags?: string[] },
  topic: LearnTopicDef
): boolean {
  if (book.category !== topic.parentCategory) return false;
  const tags = (book.tags ?? []).map((t) => t.toLowerCase());
  return tags.includes(topic.topicTag.toLowerCase());
}
