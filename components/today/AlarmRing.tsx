"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Alarm } from "@/lib/today/alarmLogic";
import { formatAlarmTime } from "@/lib/today/alarmLogic";
import { haptic } from "@/lib/finance/haptics";
import { dismissActiveAlarm } from "@/components/today/AlarmScheduler";

type RingDetail = { alarm: Alarm; at: Date };

function startAlarmTone(ctx: AudioContext, nodes: OscillatorNode[]) {
  const freqs = [880, 988, 1175];
  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    nodes.push(osc);
  }
}

/** Full-screen alarm ring with loud tone when LifeOS is open or opened from a notification. */
export function AlarmRing() {
  const [active, setActive] = useState<RingDetail | null>(null);
  const audioRef = useRef<{ ctx: AudioContext; nodes: OscillatorNode[] } | null>(null);
  const pulseRef = useRef<number | null>(null);

  const stopRing = useCallback(() => {
    if (pulseRef.current) {
      window.clearInterval(pulseRef.current);
      pulseRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      for (const node of audio.nodes) {
        try {
          node.stop();
        } catch {
          /* already stopped */
        }
      }
      void audio.ctx.close();
      audioRef.current = null;
    }
    setActive(null);
  }, []);

  const startRing = useCallback((detail: RingDetail) => {
    stopRing();
    setActive(detail);
    haptic("warning");

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      pulseRef.current = window.setInterval(() => {
        navigator.vibrate([400, 200, 400, 200, 600]);
      }, 2000);
      navigator.vibrate([400, 200, 400, 200, 600]);
    }

    try {
      const ctx = new AudioContext();
      const nodes: OscillatorNode[] = [];
      startAlarmTone(ctx, nodes);
      void ctx.resume();
      audioRef.current = { ctx, nodes };
    } catch {
      /* Web Audio unavailable */
    }
  }, [stopRing]);

  useEffect(() => {
    function onRing(e: Event) {
      const detail = (e as CustomEvent<RingDetail>).detail;
      if (detail?.alarm) startRing(detail);
    }
    window.addEventListener("lifeos:alarm", onRing);
    return () => window.removeEventListener("lifeos:alarm", onRing);
  }, [startRing]);

  useEffect(() => {
    if (!isNativeAlarmApp()) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];

    void import("@capacitor/local-notifications").then(({ LocalNotifications }) => {
      if (cancelled) return;

      void LocalNotifications.addListener("localNotificationReceived", (notification) => {
        const extra = notification.extra as
          | { alarmId?: number; hour?: number; minute?: number; label?: string }
          | undefined;
        const alarmId = extra?.alarmId;
        if (typeof alarmId !== "number") return;
        const at = new Date();
        if (typeof extra?.hour === "number") at.setHours(extra.hour);
        if (typeof extra?.minute === "number") at.setMinutes(extra.minute);
        startRing({
          alarm: {
            id: alarmId,
            label: extra?.label ?? notification.title ?? "Alarm",
            hour: extra?.hour ?? at.getHours(),
            minute: extra?.minute ?? at.getMinutes(),
            repeat_days: [],
            enabled: true,
            created_at: "",
          },
          at,
        });
      }).then((h) => cleanups.push(() => h.remove()));

      void LocalNotifications.addListener("localNotificationActionPerformed", () => {
        stopRing();
      }).then((h) => cleanups.push(() => h.remove()));
    });

    return () => {
      cancelled = true;
      for (const fn of cleanups) fn();
    };
  }, [startRing, stopRing]);

  if (!active) return null;

  return (
    <div className="td-ring" role="alertdialog" aria-labelledby="td-ring-title">
      <div className="td-ring-inner">
        <p className="td-ring-label" id="td-ring-title">
          {active.alarm.label || "Alarm"}
        </p>
        <p className="td-ring-time">
          {formatAlarmTime(active.alarm.hour, active.alarm.minute)}
        </p>
        <button
          type="button"
          className="td-ring-stop"
          onClick={() => {
            dismissActiveAlarm(active.alarm.id, active.at);
            stopRing();
          }}
        >
          Stop
        </button>
      </div>
    </div>
  );
}

function isNativeAlarmApp(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require("@capacitor/core") as typeof import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}
