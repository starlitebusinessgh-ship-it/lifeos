"use client";

import { AlarmClock } from "lucide-react";
import type { Alarm } from "@/lib/today/alarmLogic";
import {
  formatAlarmTime,
  repeatSummary,
  nextOccurrence,
  minutesUntil,
  formatCountdown,
} from "@/lib/today/alarmLogic";

export function NextAlarmCard({
  alarm,
  at,
}: {
  alarm: Alarm | null;
  at: Date | null;
}) {
  if (!alarm || !at) {
    return (
      <div className="td-hero td-hero-empty">
        <div className="td-hero-icon">
          <AlarmClock size={26} strokeWidth={1.5} />
        </div>
        <strong>No alarm set</strong>
        <p>Tap + to add a wake-up time.</p>
      </div>
    );
  }

  const mins = minutesUntil(at);
  const dayLabel =
    at.toDateString() === new Date().toDateString()
      ? "Today"
      : at.toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="td-hero td-hero-live">
      <div className="td-hero-countdown">In {formatCountdown(mins)}</div>
      <div className="td-hero-time">{formatAlarmTime(alarm.hour, alarm.minute)}</div>
      <div className="td-hero-label">{alarm.label}</div>
      <div className="td-hero-sub">
        {dayLabel} · {repeatSummary(alarm.repeat_days)}
      </div>
    </div>
  );
}

export function AlarmList({
  alarms,
  onSelect,
  onToggle,
}: {
  alarms: Alarm[];
  onSelect: (a: Alarm) => void;
  onToggle: (a: Alarm) => void;
}) {
  if (alarms.length === 0) {
    return <div className="td-empty">No alarms — tap + below.</div>;
  }

  return (
    <div className="td-alarm-list">
      {alarms.map((a) => {
        const next = nextOccurrence(a);
        return (
          <div key={a.id} className={`td-alarm-row ${a.enabled ? "" : "off"}`}>
            <button type="button" className="td-alarm-main" onClick={() => onSelect(a)}>
              <div className="td-alarm-time">{formatAlarmTime(a.hour, a.minute)}</div>
              <div className="td-alarm-meta">
                {a.label}
                {next && a.enabled && (
                  <> · {next.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}</>
                )}
                {!a.enabled && " · Off"}
              </div>
            </button>
            <button
              type="button"
              className={`td-switch ${a.enabled ? "on" : ""}`}
              onClick={() => onToggle(a)}
              aria-label={a.enabled ? "Turn off" : "Turn on"}
              aria-pressed={a.enabled}
            >
              <span className="knob" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
