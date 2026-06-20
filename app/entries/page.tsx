"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ── Types ── */

type Entry = {
  id: string;
  capture_type: string;
  life_area: string;
  content: string;
  title: string | null;
  created_at: string;
};

type DateGroup = {
  label: string;
  dateKey: string;
  entries: Entry[];
};

/* ── Constants ── */

const TYPE_COLORS: Record<string, string> = {
  decision:    "#2563EB",
  journal:     "#8B7355",
  lesson:      "#1B5E3B",
  idea:        "#B45309",
  note:        "#6B7280",
  prayer:      "#B45309",
  book_note:   "#1B5E3B",
  goal_update: "#166534",
  reflection:  "#7B4FF0",
  other:       "#9A9490",
};

const FILTER_TABS = ["All", "Lesson", "Decision", "Journal", "Prayer", "Book Note", "Idea", "Note"];

const TYPE_LABEL_MAP: Record<string, string> = {
  "Lesson": "lesson", "Decision": "decision", "Journal": "journal",
  "Prayer": "prayer", "Book Note": "book_note", "Idea": "idea", "Note": "note",
};

/* ── Helpers ── */

function fmtType(t: string) {
  return t.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").toUpperCase();
}

function formatGroupLabel(iso: string) {
  const date  = new Date(iso);
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((today.getTime() - d.getTime()) / 86_400_000);

  if (diff === 0) return "TODAY";
  if (diff === 1) return "YESTERDAY";

  /* e.g. MON · JUN 16 */
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month   = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${weekday} · ${month} ${date.getDate()}`;
}

function dateKey(iso: string) {
  return iso.slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function groupByDate(entries: Entry[]): DateGroup[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = dateKey(e.created_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([key, list]) => ({
    label:   formatGroupLabel(list[0].created_at),
    dateKey: key,
    entries: list,
  }));
}

/* ── Page ── */

export default function FeedPage() {
  const [entries,     setEntries]     = useState<Entry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [typeFilter,  setTypeFilter]  = useState("All");

  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from("entries")
      .select("id, capture_type, life_area, content, title, created_at")
      .order("created_at", { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void fetchEntries(); }, [fetchEntries]);

  const filtered = useMemo(() => {
    if (typeFilter === "All") return entries;
    const raw = TYPE_LABEL_MAP[typeFilter] ?? typeFilter.toLowerCase();
    return entries.filter((e) => e.capture_type === raw);
  }, [entries, typeFilter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div style={{ minHeight: "100%", background: "#EDE9E1", paddingBottom: "6rem" }}>

      {/* Masthead */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "1.125rem 1.25rem 0.75rem",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}>
        <span style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.5625rem", fontWeight: 700,
          letterSpacing: "0.16em", textTransform: "uppercase", color: "#9A9490",
        }}>LIFE·OS</span>
        <span style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.5rem", fontWeight: 500,
          letterSpacing: "0.08em", color: "#9A9490",
        }}>{dateStr}</span>
      </div>

      <div style={{ padding: "1.25rem 1.25rem 0", maxWidth: "32rem", margin: "0 auto", width: "100%" }}>

        {/* Header */}
        <h1 style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontStyle: "italic",
          fontSize: "clamp(2rem, 10vw, 2.75rem)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "#1A1A18",
          margin: "0 0 0.25rem",
          lineHeight: 1.1,
        }}>Feed.</h1>
        <p style={{
          fontFamily: "var(--font-body), system-ui, sans-serif",
          fontSize: "0.875rem", color: "#6B6860",
          margin: "0 0 1.125rem",
        }}>
          Your life, captured.{" "}
          {loading ? "" : `${entries.length} ${entries.length === 1 ? "entry" : "entries"} and counting.`}
        </p>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: "0.375rem", overflowX: "auto",
          scrollbarWidth: "none", paddingBottom: "2px",
          marginBottom: "1.25rem",
        }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTypeFilter(tab)}
              style={{
                flexShrink: 0,
                padding: "0.375rem 0.875rem",
                borderRadius: "3rem",
                border: "1.5px solid",
                borderColor: typeFilter === tab ? "#1A1A18" : "rgba(0,0,0,0.1)",
                background: typeFilter === tab ? "#1A1A18" : "transparent",
                fontFamily: "var(--font-body), system-ui, sans-serif",
                fontSize: "0.8125rem",
                fontWeight: typeFilter === tab ? 600 : 500,
                color: typeFilter === tab ? "#fff" : "#6B6860",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[100, 80, 110].map((h) => (
              <div key={h} style={{
                height: `${h}px`, borderRadius: "0.875rem",
                background: "linear-gradient(90deg, #E0D9CC 0%, #CCC5B8 50%, #E0D9CC 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s ease infinite",
              }} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <p style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontStyle: "italic",
            fontSize: "1rem", lineHeight: 1.75,
            color: "#9A9490", margin: "2rem 0",
          }}>
            {entries.length === 0
              ? "Nothing captured yet. Go write something."
              : "No entries match this filter."}
          </p>
        )}

        {/* Grouped entries */}
        {!loading && groups.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {groups.map((group) => (
              <section key={group.dateKey}>

                {/* Date group header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  marginBottom: "0.625rem",
                }}>
                  <span style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: "0.5rem", fontWeight: 700,
                    letterSpacing: "0.12em", color: "#9A9490",
                    whiteSpace: "nowrap",
                  }}>{group.label}</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }} />
                  <span style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: "0.4375rem", color: "#C4BFB9",
                    whiteSpace: "nowrap",
                  }}>{group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {group.entries.map((entry) => (
                    <FeedCard key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Feed card ── */

function FeedCard({ entry }: { entry: { id: string; capture_type: string; life_area: string; content: string; title: string | null; created_at: string } }) {
  const color = TYPE_COLORS[entry.capture_type] ?? TYPE_COLORS.other;

  return (
    <article style={{
      background: "#fff",
      borderRadius: "0.875rem",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ padding: "0.875rem 1rem" }}>

        {/* Meta */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: "0.5rem", fontWeight: 700,
              letterSpacing: "0.1em", color,
            }}>
              {fmtType(entry.capture_type)}
            </span>
            <div style={{ width: "1px", height: "9px", background: "#E0D9CC" }} />
            <span style={{
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontSize: "0.5625rem", color: "#9A9490",
            }}>{entry.life_area}</span>
          </div>
          <time style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: "0.4375rem", color: "#C4BFB9",
          }} dateTime={entry.created_at}>
            {formatTime(entry.created_at)}
          </time>
        </div>

        {/* Title */}
        {entry.title && (
          <h3 style={{
            fontFamily: "var(--font-body), system-ui, sans-serif",
            fontSize: "0.9375rem", fontWeight: 700,
            color: "#1A1A18", margin: "0 0 0.375rem",
            lineHeight: 1.3,
          }}>
            {entry.title}
          </h3>
        )}

        {/* Content */}
        <p style={{
          fontFamily: "var(--font-body), system-ui, sans-serif",
          fontSize: "0.875rem", lineHeight: 1.6,
          color: "#6B6860", margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {entry.content}
        </p>
      </div>
    </article>
  );
}
