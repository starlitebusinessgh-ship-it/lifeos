"use client";

import { motion } from "motion/react";
import type { HomeBriefing } from "@/lib/home/briefing";

export function HomeHero({ briefing }: { briefing: HomeBriefing }) {
  return (
    <motion.section
      className="lo-hero"
      aria-label="Briefing"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="lo-hero-date">{briefing.dateLabel}</p>
      <h1 className="lo-hero-headline">{briefing.headline}</h1>
      {briefing.subline && <p className="lo-hero-sub">{briefing.subline}</p>}
    </motion.section>
  );
}
