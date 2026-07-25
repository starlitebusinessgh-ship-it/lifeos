"use client";

import { useEffect, useRef } from "react";
import type { Alarm } from "@/lib/today/alarmLogic";
import { nextOccurrence } from "@/lib/today/alarmLogic";
import { haptic } from "@/lib/finance/haptics";
import {
  dispatchAlarmRing,
  isNativeAlarmApp,
  requestSystemAlarmPermission,
} from "@/lib/today/systemAlarms";

const FIRED_KEY = "lifeos.alarm.fired";
const DISMISSED_KEY = "lifeos.alarm.dismissed";

function firedKey(alarmId: number, at: Date) {
  return `${alarmId}:${at.getFullYear()}-${at.getMonth()}-${at.getDate()}-${at.getHours()}-${at.getMinutes()}`;
}

function isDismissed(key: string): boolean {
  const raw = sessionStorage.getItem(DISMISSED_KEY);
  const dismissed: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  return dismissed.includes(key);
}

async function ensurePermission(): Promise<boolean> {
  if (isNativeAlarmApp()) {
    return requestSystemAlarmPermission();
  }
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

async function showSystemNotification(alarm: Alarm, at: Date, key: string) {
  const title = alarm.label || "Alarm";
  const body = `It's ${at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  const reg = await navigator.serviceWorker?.ready?.catch(() => undefined);
  if (reg) {
    const opts: NotificationOptions & { vibrate?: number[] } = {
      body,
      tag: key,
      requireInteraction: true,
      silent: false,
      vibrate: [500, 200, 500, 200, 500],
      data: { alarmId: alarm.id, key },
    };
    await reg.showNotification(title, opts);
    return;
  }

  new Notification(title, {
    body,
    tag: key,
    requireInteraction: true,
  });
}

function fireAlarm(alarm: Alarm, at: Date) {
  const key = firedKey(alarm.id, at);
  if (isDismissed(key)) return;

  const raw = sessionStorage.getItem(FIRED_KEY);
  const fired: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  const alreadyNotified = fired.includes(key);

  haptic("warning");
  dispatchAlarmRing(alarm, at);

  if (Notification.permission === "granted" && !alreadyNotified) {
    void showSystemNotification(alarm, at, key);
    fired.push(key);
    if (fired.length > 30) fired.shift();
    sessionStorage.setItem(FIRED_KEY, JSON.stringify(fired));
  }
}

/** Poll enabled alarms when web/PWA is active; native app uses OS-scheduled notifications. */
export function AlarmScheduler({ alarms }: { alarms: Alarm[] }) {
  const alarmsRef = useRef(alarms);
  alarmsRef.current = alarms;

  useEffect(() => {
    void ensurePermission();
    if (isNativeAlarmApp()) return;

    function tick() {
      const now = new Date();
      for (const alarm of alarmsRef.current) {
        if (!alarm.enabled) continue;
        const at = nextOccurrence(alarm, new Date(now.getTime() - 60000));
        if (!at) continue;
        const diff = Math.abs(now.getTime() - at.getTime());
        if (diff < 45000) fireAlarm(alarm, at);
      }
    }

    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  return null;
}

export function NotificationPrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNativeAlarmApp()) {
      void requestSystemAlarmPermission();
      return;
    }
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    const t = window.setTimeout(() => void ensurePermission(), 1200);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

/** Call when user taps Stop on the full-screen ring UI. */
export function dismissActiveAlarm(alarmId: number, at: Date) {
  const key = firedKey(alarmId, at);
  const raw = sessionStorage.getItem(DISMISSED_KEY);
  const dismissed: string[] = raw ? (JSON.parse(raw) as string[]) : [];
  if (!dismissed.includes(key)) {
    dismissed.push(key);
    if (dismissed.length > 30) dismissed.shift();
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}
