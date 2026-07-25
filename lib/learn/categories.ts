import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  Sun,
  Briefcase,
  Leaf,
  Atom,
  Feather,
  Layers,
  Wallet,
  Heart,
  Brain,
  BookMarked,
} from "lucide-react";

export type CategoryId =
  | "All"
  | "Faith"
  | "Finance"
  | "Relationship"
  | "Self Help"
  | "Business"
  | "Health"
  | "Science"
  | "Fiction"
  | "Other";

export interface LearnCategoryDef {
  id: CategoryId;
  label: string;
  tagline: string;
  icon: LucideIcon;
  coverImage: string;
  gradient: string;
  accent: string;
  pattern: string;
  /** Opens subsection hub instead of flat shelf */
  hub?: boolean;
}

/** Standalone Bible study module (not a PDF shelf category) */
export const BIBLE_MODULE = {
  label: "Bible",
  tagline: "Read, search & study scripture",
  icon: BookMarked,
  coverImage: "/learn/categories/bible.png",
  gradient: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.52) 100%)",
  accent: "#8b6914",
  pattern: "bible",
  href: "/learn/bible",
} as const;

export const LEARN_CATEGORIES: LearnCategoryDef[] = [
  {
    id: "All",
    label: "All",
    tagline: "Everything",
    icon: LayoutGrid,
    coverImage: "/learn/categories/all.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
    accent: "#1c1c1e",
    pattern: "all",
  },
  {
    id: "Faith",
    label: "Faith",
    tagline: "Spirit & scripture",
    icon: Sun,
    coverImage: "/learn/categories/faith.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)",
    accent: "#a16207",
    pattern: "faith",
  },
  {
    id: "Finance",
    label: "Finance",
    tagline: "Money & stewardship",
    icon: Wallet,
    coverImage: "/learn/categories/finance.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.52) 100%)",
    accent: "#0f766e",
    pattern: "finance",
  },
  {
    id: "Relationship",
    label: "Relationship",
    tagline: "Love, family & people",
    icon: Heart,
    coverImage: "/learn/categories/relationship.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.48) 100%)",
    accent: "#be185d",
    pattern: "relationship",
  },
  {
    id: "Self Help",
    label: "Self Help",
    tagline: "Growth & productivity",
    icon: Brain,
    coverImage: "/learn/categories/selfhelp.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 100%)",
    accent: "#4f46e5",
    pattern: "selfhelp",
    hub: true,
  },
  {
    id: "Business",
    label: "Business",
    tagline: "Build & lead",
    icon: Briefcase,
    coverImage: "/learn/categories/business.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
    accent: "#1e4976",
    pattern: "business",
  },
  {
    id: "Health",
    label: "Health",
    tagline: "Body & mind",
    icon: Leaf,
    coverImage: "/learn/categories/health.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.48) 100%)",
    accent: "#0f766e",
    pattern: "health",
  },
  {
    id: "Science",
    label: "Science",
    tagline: "Discover & learn",
    icon: Atom,
    coverImage: "/learn/categories/science.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.52) 100%)",
    accent: "#2563eb",
    pattern: "science",
  },
  {
    id: "Fiction",
    label: "Fiction",
    tagline: "Stories & worlds",
    icon: Feather,
    coverImage: "/learn/categories/fiction.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.52) 100%)",
    accent: "#6d28d9",
    pattern: "fiction",
  },
  {
    id: "Other",
    label: "Other",
    tagline: "Everything else",
    icon: Layers,
    coverImage: "/learn/categories/other.png",
    gradient: "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.5) 100%)",
    accent: "#4b5563",
    pattern: "other",
  },
];

export const CATEGORY_IDS = LEARN_CATEGORIES.map((c) => c.id);

export function getCategoryDef(id: string): LearnCategoryDef {
  return LEARN_CATEGORIES.find((c) => c.id === id) ?? LEARN_CATEGORIES[LEARN_CATEGORIES.length - 1];
}

export function isHubCategory(id: CategoryId): boolean {
  return Boolean(getCategoryDef(id).hub);
}

export const SHELF_CATEGORIES = LEARN_CATEGORIES;
export const PICK_CATEGORIES = LEARN_CATEGORIES.filter((c) => c.id !== "All");
