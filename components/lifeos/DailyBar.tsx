"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sun, Wallet, Search } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/today", label: "Today", icon: Sun, match: (p: string) => p.startsWith("/today") },
  { href: "/finance", label: "Finance", icon: Wallet, match: (p: string) => p.startsWith("/finance") },
];

interface DailyBarProps {
  onSearch: () => void;
  light?: boolean;
}

export function DailyBar({ onSearch, light = false }: DailyBarProps) {
  const pathname = usePathname();

  return (
    <nav className={`lo-daily-bar ${light ? "lo-daily-bar--light" : ""}`} aria-label="Daily navigation">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`lo-daily-tab ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => haptic("light")}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.6} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="lo-daily-tab lo-daily-search"
        aria-label="Search LifeOS"
        onClick={() => {
          haptic("light");
          onSearch();
        }}
      >
        <Search size={20} strokeWidth={1.6} />
        <span>Search</span>
      </button>
    </nav>
  );
}
