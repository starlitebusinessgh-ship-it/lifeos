"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Menu, Plus, ChevronRight, AlertCircle } from "lucide-react";
import { useShell } from "@/components/lifeos/ShellContext";
import { useHomeData } from "@/lib/home/useHomeData";
import { formatMoney } from "@/lib/finance/logic";
import { BalanceCard } from "@/components/finance/BalanceCard";
import type { HomeSignal } from "@/lib/home/briefing";
import { haptic } from "@/lib/finance/haptics";

function AttentionRow({ signal }: { signal: HomeSignal }) {
  const urgent = signal.priority >= 70;
  return (
    <Link
      href={signal.href}
      className={`hm-attention ${urgent ? "hm-attention-urgent" : ""}`}
      onClick={() => haptic("light")}
    >
      <AlertCircle size={18} strokeWidth={1.75} className="hm-attention-icon" />
      <span className="hm-attention-text">{signal.text}</span>
      <ChevronRight size={16} className="hm-attention-arrow" />
    </Link>
  );
}

function HomeSkeleton() {
  return (
    <div className="hm-page">
      <div className="hm-nav">
        <div className="hm-nav-btn" style={{ opacity: 0.35 }} />
        <span className="hm-brand">LifeOS</span>
        <div className="hm-nav-btn" style={{ opacity: 0.35 }} />
      </div>
      <div className="hm-skel-line hm-skel-date" />
      <div className="hm-skel-line hm-skel-headline" />
      <div className="hm-skel-line hm-skel-sub" />
      <div className="hm-skel-card" />
    </div>
  );
}

export function HomeCanvas() {
  const { openDrawer, openCapture } = useShell();
  const { briefing, balance, month, loading, reload } = useHomeData();
  const [synced, setSynced] = useState(false);
  const startY = useRef(0);

  const onRefresh = useCallback(async () => {
    haptic("light");
    await reload();
    setSynced(true);
    window.setTimeout(() => setSynced(false), 1200);
  }, [reload]);

  return (
    <>
      <div className={`hm-sync ${synced ? "show" : ""}`} aria-hidden />
      {loading ? (
        <HomeSkeleton />
      ) : (
        <motion.div
          className="hm-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          onTouchStart={(e) => {
            if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            if (window.scrollY > 0) return;
            const dy = e.changedTouches[0].clientY - startY.current;
            if (dy > 80) void onRefresh();
          }}
        >
          <nav className="hm-nav" aria-label="Home navigation">
            <button type="button" className="hm-nav-btn" aria-label="Menu" onClick={openDrawer}>
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <span className="hm-brand">LifeOS</span>
            <button
              type="button"
              className="hm-nav-btn hm-nav-btn-accent"
              aria-label="Capture"
              onClick={openCapture}
            >
              <Plus size={20} strokeWidth={2} />
            </button>
          </nav>

          <motion.header
            className="hm-hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="hm-date">{briefing.dateLabel}</p>
            <h1 className="hm-headline">{briefing.headline}</h1>
            <p className="hm-subline">{briefing.subline}</p>
          </motion.header>

          <motion.section
            className="hm-finance-block"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/finance" className="hm-finance-link" onClick={() => haptic("light")}>
              <BalanceCard balance={balance} />
            </Link>
            <div className="hm-month-row">
              <span className="hm-month-label">This month</span>
              <span className={`hm-month-value ${month.net >= 0 ? "pos" : "neg"}`}>
                {month.net >= 0 ? "+" : ""}
                {formatMoney(month.net, false)}
              </span>
              <Link href="/finance/analytics" className="hm-month-link">
                Charts →
              </Link>
            </div>
          </motion.section>

          {briefing.attention.length > 0 && (
            <motion.section
              className="hm-attention-block"
              aria-label="Needs attention"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 }}
            >
              <h2 className="hm-section-label">Attention</h2>
              <div className="hm-attention-list">
                {briefing.attention.map((s) => (
                  <AttentionRow key={s.id} signal={s} />
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
      )}
    </>
  );
}
