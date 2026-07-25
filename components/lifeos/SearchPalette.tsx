"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Search, Sun, Wallet, Home, Inbox, BookOpen, HeartPulse, GitBranch, Hammer } from "lucide-react";
import { haptic } from "@/lib/finance/haptics";

const QUICK = [
  { label: "Home briefing", href: "/", icon: Home },
  { label: "Today timeline", href: "/today", icon: Sun },
  { label: "Inbox captures", href: "/inbox", icon: Inbox },
  { label: "Learn shelf", href: "/learn", icon: BookOpen },
  { label: "All highlights", href: "/learn/highlights", icon: BookOpen },
  { label: "Mind map", href: "/learn/mind", icon: GitBranch },
  { label: "Build seeds", href: "/build", icon: Hammer },
  { label: "Vitality check-in", href: "/vitality", icon: HeartPulse },
  { label: "Finance overview", href: "/finance", icon: Wallet },
  { label: "Debts", href: "/finance/debts", icon: Wallet },
  { label: "Analytics", href: "/finance/analytics", icon: Wallet },
];

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = query.trim()
    ? QUICK.filter((q) => q.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK;

  if (!open) return null;

  return (
    <div className="lo-palette-backdrop" role="presentation" onClick={onClose}>
      <div
        className="lo-palette"
        role="dialog"
        aria-label="Search LifeOS"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lo-palette-head">
          <Search size={18} className="lo-palette-icon" />
          <input
            ref={inputRef}
            type="search"
            className="lo-palette-input"
            placeholder="Jump to a place…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="lo-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="lo-palette-hint">
          Full search across modules — coming soon. Jump anywhere below.
        </div>
        <ul className="lo-palette-list">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className="lo-palette-item"
                  onClick={() => {
                    haptic("light");
                    onClose();
                  }}
                >
                  <Icon size={17} strokeWidth={1.75} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
