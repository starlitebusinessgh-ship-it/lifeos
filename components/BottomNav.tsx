"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  List,
  PenLine,
  ScrollText,
} from "lucide-react";

const tabs = [
  { href: "/capture", label: "Capture", icon: PenLine },
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/entries", label: "Entries", icon: List },
  { href: "/principles", label: "Principles", icon: ScrollText },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95 dark:supports-[backdrop-filter]:bg-zinc-950/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon
                className={`h-6 w-6 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`}
                aria-hidden
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
