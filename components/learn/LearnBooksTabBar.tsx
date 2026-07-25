"use client";

import { BookOpen, Library, Sparkles, Search } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

export type LearnBooksTab = "reading" | "library" | "insights";

const TABS: { id: LearnBooksTab; label: string; icon: typeof BookOpen }[] = [
  { id: "reading", label: "Reading Now", icon: BookOpen },
  { id: "library", label: "Library", icon: Library },
  { id: "insights", label: "Insights", icon: Sparkles },
];

export function LearnBooksTabBar({
  active,
  onChange,
  onSearch,
}: {
  active: LearnBooksTab;
  onChange: (tab: LearnBooksTab) => void;
  onSearch: () => void;
}) {
  return (
    <nav className="ln-books-tabbar" aria-label="Books">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            className={`ln-books-tab${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              haptic("light");
              onChange(tab.id);
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} fill={isActive ? "currentColor" : "none"} />
            <span>{tab.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="ln-books-tab ln-books-tab--search"
        aria-label="Search library"
        onClick={() => {
          haptic("light");
          onSearch();
        }}
      >
        <Search size={22} strokeWidth={1.75} />
        <span>Search</span>
      </button>
    </nav>
  );
}
