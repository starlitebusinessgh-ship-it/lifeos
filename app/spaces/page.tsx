"use client";

import Link from "next/link";
import {
  Fingerprint, Clock, BookMarked, Heart, Sparkles,
  TrendingUp, Users, Briefcase, Compass, Wallet,
  BookOpen, ScrollText, ChevronRight,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

type LucideIcon = ComponentType<LucideProps>;

/* ── Domain tile data ── */

type DomainTile = {
  icon: LucideIcon;
  color: string;
  bg: string;
  stat: string;
  name: string;
  sparkPoints: number[];
};

const DOMAIN_TILES: DomainTile[] = [
  { icon: Fingerprint, color: "#fff", bg: "#7B4FF0", stat: "Growth",  name: "Identity",  sparkPoints: [3,5,4,6,5,7,6] },
  { icon: Clock,       color: "#fff", bg: "#2563EB", stat: "3",       name: "Time",      sparkPoints: [5,4,6,4,5,3,4] },
  { icon: BookMarked,  color: "#fff", bg: "#166534", stat: "Ch.12",   name: "Knowledge", sparkPoints: [2,3,4,5,6,7,8] },
  { icon: Heart,       color: "#fff", bg: "#DB2777", stat: "7.2K",    name: "Health",    sparkPoints: [6,8,5,9,7,8,7] },
  { icon: Sparkles,    color: "#fff", bg: "#B45309", stat: "168",     name: "Spirit",    sparkPoints: [4,4,5,4,5,5,6] },
  { icon: TrendingUp,  color: "#fff", bg: "#166534", stat: "34%",     name: "Wealth",    sparkPoints: [3,4,3,5,4,5,5] },
];

/* ── Active systems ── */

type System = {
  href: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  desc: string;
};

const ACTIVE_SYSTEMS: System[] = [
  { href: "/finance",    Icon: Wallet,     iconBg: "#DCFCE7", iconColor: "#166534", label: "Finance",    desc: "Transactions · Budget · Net Worth" },
  { href: "/entries",    Icon: BookOpen,   iconBg: "#EDE9FF", iconColor: "#7B4FF0", label: "Journal",    desc: "All your captures and entries" },
  { href: "/principles", Icon: ScrollText, iconBg: "#FEF3C7", iconColor: "#B45309", label: "Principles", desc: "Your personal constitution" },
];

/* ── Coming soon ── */

type ComingSoon = {
  num: string;
  Icon: LucideIcon;
  iconColor: string;
  label: string;
  desc: string;
};

const COMING_SOON: ComingSoon[] = [
  { num: "04", Icon: TrendingUp, iconColor: "#DC2626", label: "Decisions",  desc: "Journal · track decision quality" },
  { num: "05", Icon: BookMarked, iconColor: "#166534", label: "Knowledge",  desc: "Books · Quotes · Knowledge graph"  },
  { num: "06", Icon: Sparkles,   iconColor: "#B45309", label: "Spiritual",  desc: "Bible · Prayer · Reading plans"    },
  { num: "07", Icon: Heart,      iconColor: "#DB2777", label: "Health",     desc: "Workouts · Sleep · Nutrition"      },
  { num: "08", Icon: Clock,      iconColor: "#2563EB", label: "Timeline",   desc: "Your life, chronologically"        },
  { num: "09", Icon: Briefcase,  iconColor: "#9A3412", label: "Career",     desc: "Skills · Portfolio · Applications" },
];

/* ── Sparkline ── */

function Sparkline({ points }: { points: number[] }) {
  const w = 40, h = 22, pad = 3;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map((v) => h - pad - ((v - min) / range) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Page ── */

export default function LifePage() {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();

  return (
    <div style={{ minHeight: "100%", background: "#EDE9E1", paddingBottom: "6rem" }}>

      {/* ── Masthead ── */}
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

      <div style={{ padding: "1.375rem 1.25rem 0", maxWidth: "32rem", margin: "0 auto" }}>

        {/* ── Header ── */}
        <h1 style={{
          fontFamily: "var(--font-display), Georgia, serif",
          fontStyle: "italic",
          fontSize: "clamp(2.25rem, 10vw, 3rem)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "#1A1A18",
          margin: "0 0 0.25rem",
          lineHeight: 1.1,
        }}>
          Domains.
        </h1>
        <p style={{
          fontFamily: "var(--font-body), system-ui, sans-serif",
          fontSize: "0.875rem", color: "#6B6860",
          margin: "0 0 1.5rem", lineHeight: 1.5,
        }}>
          The 9 areas of your life, always in view.
        </p>

        {/* ── Section label ── */}
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.5rem", fontWeight: 700,
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "#9A9490", margin: "0 0 0.75rem",
        }}>THE 9 DOMAINS</p>

        {/* ── Domain grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.625rem",
          marginBottom: "1.5rem",
        }}>
          {DOMAIN_TILES.map((d) => (
            <div
              key={d.name}
              style={{
                background: d.bg,
                borderRadius: "0.875rem",
                padding: "0.875rem",
                minHeight: "130px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* subtle glow */}
              <div style={{
                position: "absolute", width: "100px", height: "100px",
                borderRadius: "50%", background: "rgba(255,255,255,0.07)",
                top: "-30px", right: "-20px", pointerEvents: "none",
              }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "auto" }}>
                <div style={{
                  width: "2rem", height: "2rem", borderRadius: "0.5rem",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <d.icon size={16} color="#fff" strokeWidth={1.75} />
                </div>
                <Sparkline points={d.sparkPoints} />
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <div style={{
                  fontFamily: "var(--font-condensed), 'Barlow Condensed', sans-serif",
                  fontSize: "1.375rem", fontWeight: 900, color: "#fff",
                  lineHeight: 1, marginBottom: "0.1875rem",
                }}>
                  {d.stat}
                </div>
                <div style={{
                  fontFamily: "var(--font-body), system-ui, sans-serif",
                  fontSize: "0.6875rem", fontWeight: 500, color: "rgba(255,255,255,0.7)",
                }}>
                  {d.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Active Systems ── */}
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.5rem", fontWeight: 700,
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "#9A9490", margin: "0 0 0.625rem",
        }}>ACTIVE SYSTEMS</p>

        <div style={{
          background: "#fff", borderRadius: "1rem",
          overflow: "hidden", marginBottom: "1.25rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {ACTIVE_SYSTEMS.map((s, i) => (
            <Link key={s.href} href={s.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "0.875rem 1rem",
                borderBottom: i < ACTIVE_SYSTEMS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
              }}>
                <div style={{
                  width: "2.375rem", height: "2.375rem", borderRadius: "0.75rem",
                  background: s.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <s.Icon size={17} color={s.iconColor} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: "var(--font-body), system-ui, sans-serif",
                    fontSize: "0.9375rem", fontWeight: 600,
                    color: "#1A1A18", margin: "0 0 0.125rem",
                  }}>{s.label}</p>
                  <p style={{
                    fontFamily: "var(--font-body), system-ui, sans-serif",
                    fontSize: "0.6875rem", color: "#9A9490", margin: 0,
                  }}>{s.desc}</p>
                </div>
                <ChevronRight size={16} color="#C4BFB9" strokeWidth={1.75} />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Coming Soon ── */}
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.5rem", fontWeight: 700,
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "#9A9490", margin: "0 0 0.625rem",
        }}>COMING SOON</p>

        <div style={{
          background: "#fff", borderRadius: "1rem",
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          {COMING_SOON.map((s, i) => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: "0.875rem",
              padding: "0.8125rem 1rem",
              borderBottom: i < COMING_SOON.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
            }}>
              <span style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "0.5625rem", fontWeight: 600,
                color: "#C4BFB9", width: "1.25rem", flexShrink: 0,
              }}>{s.num}</span>
              <s.Icon size={15} color={s.iconColor} strokeWidth={1.75} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "var(--font-body), system-ui, sans-serif",
                  fontSize: "0.875rem", fontWeight: 600,
                  color: "#3D3935", margin: "0 0 0.0625rem",
                }}>{s.label}</p>
                <p style={{
                  fontFamily: "var(--font-body), system-ui, sans-serif",
                  fontSize: "0.625rem", color: "#9A9490", margin: 0,
                }}>{s.desc}</p>
              </div>
              <span style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "0.4375rem", fontWeight: 700,
                letterSpacing: "0.1em", color: "#C4BFB9",
              }}>SOON</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
