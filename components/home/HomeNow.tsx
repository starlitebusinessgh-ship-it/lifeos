"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import type { Alarm } from "@/lib/today/alarmLogic";
import {
  formatAlarmTime,
  formatCountdown,
  minutesUntil,
  nextAlarm,
} from "@/lib/today/alarmLogic";

export function HomeNow({ alarms }: { alarms: Alarm[] }) {
  const enabled = alarms.filter((a) => a.enabled);
  const next = nextAlarm(enabled);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!next) return;
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [next]);

  if (!next) {
    return (
      <motion.section
        className="lo-section"
        aria-label="Now"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lo-section-label">Now</div>
        <Link href="/today" className="lo-now-card empty lo-now-pulse">
          <div className="lo-now-top">
            <span className="lo-now-tag">Today</span>
          </div>
          <p className="lo-now-time lo-now-time-sm">—</p>
          <p className="lo-now-label">Set an alarm to anchor your day</p>
        </Link>
      </motion.section>
    );
  }

  const mins = minutesUntil(next.at);
  const urgent = mins < 60;

  return (
    <motion.section
      className="lo-section"
      aria-label="Now"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="lo-section-label">Now</div>
      <Link
        href="/today"
        className={`lo-now-card ${urgent ? "lo-now-urgent" : ""}`}
      >
        <div className="lo-now-glow" aria-hidden />
        <div className="lo-now-top">
          <span className="lo-now-tag">Next alarm</span>
          <span className="lo-now-countdown">{formatCountdown(mins)}</span>
        </div>
        <p className="lo-now-time">
          {formatAlarmTime(next.alarm.hour, next.alarm.minute)}
        </p>
        <p className="lo-now-label">{next.alarm.label || "Alarm"}</p>
      </Link>
    </motion.section>
  );
}
