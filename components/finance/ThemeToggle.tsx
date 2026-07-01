"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Repeat, Eye, ChevronRight } from "lucide-react";
import Link from "next/link";

const THEME_KEY = "lifeos.finance.theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const theme =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
  }, []);
  return children;
}

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as "light" | "dark") || "light";
    setThemeState(t);
  }, []);

  function setTheme(next: "light" | "dark") {
    document.documentElement.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    setThemeState(next);
  }

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button type="button" className="rv-more-row" onClick={toggle}>
      <span className="ico">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</span>
      <span className="lbl">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      <ChevronRight size={16} className="chev" />
    </button>
  );
}

export function MoreLinks() {
  return (
    <div className="rv-more-list">
      <Link href="/finance/recurring" className="rv-more-row">
        <span className="ico"><Repeat size={18} /></span>
        <span className="lbl">Recurring</span>
        <ChevronRight size={16} className="chev" />
      </Link>
      <Link href="/glance" className="rv-more-row">
        <span className="ico"><Eye size={18} /></span>
        <span className="lbl">Balance glance</span>
        <ChevronRight size={16} className="chev" />
      </Link>
      <ThemeToggle />
    </div>
  );
}
