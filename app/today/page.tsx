"use client";

import "./today.css";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wallet, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { computeRunningBalance } from "@/lib/finance/agent";
import type { FinanceEntry } from "@/lib/finance/types";

/* ── Types ── */

type Entry = {
  id: string;
  capture_type: string;
  life_area: string;
  content: string;
  title: string | null;
  created_at: string;
};

/* ── Domain vitals ── */

type Vital = {
  shortName: string;
  color: string;
  stat: string;
  desc: string;
  sparkPoints: number[];
};

const VITALS: Vital[] = [
  { shortName: "IDENTITY", color: "#7B4FF0", stat: "Growth", desc: "Season 4",          sparkPoints: [3,5,4,6,5,7,6] },
  { shortName: "TIME",     color: "#2563EB", stat: "3",      desc: "priorities set",    sparkPoints: [5,4,6,4,5,3,4] },
  { shortName: "KNOWLEDG", color: "#166534", stat: "Ch.12",  desc: "Atomic Habits",     sparkPoints: [2,3,4,5,6,7,8] },
  { shortName: "HEALTH",   color: "#DC2626", stat: "7.2K",   desc: "steps",             sparkPoints: [6,8,5,9,7,8,7] },
  { shortName: "SPIRIT",   color: "#B45309", stat: "168",    desc: "Bible in a Year",   sparkPoints: [4,4,5,4,5,5,6] },
  { shortName: "WEALTH",   color: "#166534", stat: "34%",    desc: "savings rate",      sparkPoints: [3,4,3,5,4,5,5] },
  { shortName: "RELATION", color: "#7C3AED", stat: "2",      desc: "birthdays this wk", sparkPoints: [5,3,4,6,5,4,5] },
  { shortName: "WORK",     color: "#9A3412", stat: "2",      desc: "active projects",   sparkPoints: [4,5,4,5,6,5,6] },
  { shortName: "REFLECTI", color: "#0D9488", stat: "✓ Sun",  desc: "weekly review",     sparkPoints: [5,6,5,7,6,7,7] },
];

/* ── Helpers ── */

function getDayOfYear() {
  const now = new Date();
  return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86_400_000);
}

function todayBounds() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function fmtFullDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { italic: "Good morning,",   name: "CHRIS." };
  if (h >= 12 && h < 17) return { italic: "Good afternoon,", name: "CHRIS." };
  if (h >= 17 && h < 22) return { italic: "Good evening,",   name: "CHRIS." };
  return { italic: "Still up,", name: "CHRIS." };
}

/* ── Sparkline ── */

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 44, h = 18, pad = 2;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map((v) => h - pad - ((v - min) / range) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="now-sparkline" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Component ── */

export default function NowPage() {
  const { italic, name } = useMemo(() => getGreeting(), []);
  const dayOfYear = useMemo(() => getDayOfYear(), []);
  const yearPct   = useMemo(() => Math.round((dayOfYear / 365) * 100), [dayOfYear]);
  const fullDate  = useMemo(() => fmtFullDate(), []);

  const [recentEntry, setRecentEntry] = useState<Entry | null>(null);
  const [balance,     setBalance]     = useState<number | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const { start, end } = todayBounds();

      const [entryRes, finRes] = await Promise.all([
        supabase
          .from("entries")
          .select("id, capture_type, life_area, content, title, created_at")
          .gte("created_at", start)
          .lt("created_at", end)
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("finance_entries")
          .select("id, date, description, category, type, intent, amount, created_at")
          .order("date", { ascending: false }),
      ]);

      setRecentEntry(entryRes.data?.[0] ?? null);

      if (finRes.data && finRes.data.length > 0) {
        const { bank } = computeRunningBalance(finRes.data as FinanceEntry[]);
        setBalance(Math.round(bank));
      }

      setLoading(false);
    }
    void load();
  }, []);

  function timeAgo(iso: string) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ago`;
  }

  const balanceDisplay = balance !== null
    ? `GH₵${balance.toLocaleString()}`
    : "34%";
  const balanceSub = balance !== null ? "bank balance" : "savings rate";

  return (
    <div className="now-page">

      {/* ── Hero ── */}
      <header className="now-hero">
        <div className="now-masthead">
          <span className="now-brand">LIFE·OS</span>
          <span className="now-day-counter">DAY {dayOfYear}</span>
        </div>
        <div className="now-masthead-rule" />

        <p className="now-greeting-italic">{italic}</p>
        <h1 className="now-name">{name}</h1>
        <p className="now-date-line">{fullDate}</p>

        <div className="now-progress-row">
          <span className="now-progress-label">{new Date().getFullYear()} PROGRESS</span>
          <div className="now-progress-track">
            <div className="now-progress-fill" style={{ width: `${yearPct}%` }} />
          </div>
          <span className="now-progress-pct">{yearPct}%</span>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="now-content">

        {/* Life Vitals */}
        <div>
          <div className="now-section-header">
            <span className="now-section-label">LIFE VITALS</span>
            <span className="now-section-meta">9 domains</span>
          </div>
          <div className="now-vitals-card">
            {VITALS.map((v) => (
              <div key={v.shortName} className="now-vital-row">
                <div className="now-vital-dot" style={{ background: v.color }} />
                <span className="now-vital-name">{v.shortName}</span>
                <span className="now-vital-stat" style={{ color: v.color }}>{v.stat}</span>
                <span className="now-vital-desc">{v.desc}</span>
                <div className="now-vital-charts">
                  <Sparkline points={v.sparkPoints} color={v.color} />
                  <div className="now-trend-bar" style={{ background: v.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wealth featured */}
        <div className="now-wealth-card">
          <div className="now-wealth-header">
            <span className="now-wealth-tag">WEALTH · FEATURED TODAY</span>
            <div className="now-wealth-icon">
              <Wallet size={13} color="rgba(255,255,255,0.65)" strokeWidth={1.75} />
            </div>
          </div>
          <div className="now-wealth-big">
            {loading ? "—" : balanceDisplay}
          </div>
          <div className="now-wealth-sub">
            {balanceSub} · {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div className="now-wealth-divider" />
          <div className="now-wealth-stats">
            <div>
              <div className="now-wealth-stat-label">NET WORTH</div>
              <div className="now-wealth-stat-val">₦2.1M</div>
            </div>
            <div>
              <div className="now-wealth-stat-label">THIS MONTH</div>
              <div className="now-wealth-stat-val" style={{ color: "#86EFAC" }}>+₦180K</div>
            </div>
            <div>
              <div className="now-wealth-stat-label">EMERG. FUND</div>
              <div className="now-wealth-stat-val">85%</div>
            </div>
          </div>
          <div className="now-emerg-label">EMERGENCY FUND · 85% OF TARGET · ₦1.7M / ₦2M</div>
          <div className="now-emerg-track">
            <div className="now-emerg-fill" style={{ width: "85%" }} />
          </div>
        </div>

        {/* Recent capture */}
        {loading ? (
          <div className="now-skeleton" style={{ height: "88px" }} />
        ) : recentEntry ? (
          <div className="now-quote-card">
            <div className="now-quote-meta">
              <span className="now-quote-type">
                {recentEntry.capture_type.replace(/_/g, " ").toUpperCase()}
              </span>
              <div className="now-quote-sep" />
              <span className="now-quote-time">captured {timeAgo(recentEntry.created_at)}</span>
            </div>
            <p className="now-quote-text">
              &ldquo;{recentEntry.title ?? recentEntry.content.slice(0, 140)}&rdquo;
            </p>
          </div>
        ) : (
          <div className="now-quote-card">
            <div className="now-quote-meta">
              <span className="now-quote-type">LESSON</span>
              <div className="now-quote-sep" />
              <span className="now-quote-time">captured 2h ago</span>
            </div>
            <p className="now-quote-text">
              &ldquo;Consistency over intensity. One focused hour daily outperforms eight scattered hours weekly.&rdquo;
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="now-actions">
          <Link href="/entries" className="now-btn-primary">
            → Daily Review
          </Link>
          <button type="button" className="now-btn-secondary">
            <Sparkles size={13} strokeWidth={1.75} />
            AI Brief
          </button>
        </div>

        {/* Principle of the day */}
        <div className="now-principle-card">
          <div className="now-principle-label">PRINCIPLE OF THE DAY</div>
          <p className="now-principle-text">
            &ldquo;Build systems, not goals. Goals are about results you want to achieve. Systems are about the processes that lead to those results.&rdquo;
          </p>
        </div>

      </main>
    </div>
  );
}
