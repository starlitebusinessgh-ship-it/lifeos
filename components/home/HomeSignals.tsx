"use client";

import Link from "next/link";
import { ChevronRight, Wallet, Sun, HeartPulse } from "lucide-react";
import { motion } from "motion/react";
import type { HomeSignal } from "@/lib/home/briefing";

const MODULE_ICON = {
  finance: Wallet,
  today: Sun,
  vitality: HeartPulse,
};

export function HomeSignals({ signals }: { signals: HomeSignal[] }) {
  if (signals.length === 0) return null;

  return (
    <section className="lo-section" aria-label="Signals">
      <div className="lo-section-label">Signal</div>
      <div className="lo-signals">
        {signals.map((s, i) => {
          const Icon = MODULE_ICON[s.module];
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.12 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={s.href} className="lo-signal">
                <div className={`lo-signal-icon ${s.module}`}>
                  <Icon size={17} strokeWidth={1.75} />
                </div>
                <div className="lo-signal-body">
                  <div className="lo-signal-module">{s.module}</div>
                  <div className="lo-signal-text">{s.text}</div>
                </div>
                <ChevronRight size={16} className="lo-signal-chevron" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
