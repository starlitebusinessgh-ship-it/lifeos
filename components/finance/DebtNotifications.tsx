"use client";

import { useEffect, useMemo } from "react";
import { formatMoney } from "@/lib/finance/logic";
import { useDebts, dueSoonDebts, daysUntil, remaining } from "@/lib/finance/debts";

const NOTIFIED_KEY = "lifeos.finance.debtNotified";

function alertLabel(due: string | null): string {
  const days = daysUntil(due);
  if (days === null) return "";
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

/** Silent — fires browser notifications only, no on-screen panel. */
export function DebtNotifications() {
  const { debts, loading } = useDebts();
  const alerts = useMemo(() => dueSoonDebts(debts, 7), [debts]);

  useEffect(() => {
    if (loading || alerts.length === 0 || typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const today = new Date().toISOString().slice(0, 10);
    const notified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "{}") as Record<string, string>;
    const toNotify = alerts.filter((d) => notified[String(d.id)] !== today);
    if (toNotify.length === 0) return;

    const fire = () => {
      for (const d of toNotify) {
        const rem = remaining(d);
        const title = d.direction === "i_owe" ? `Pay ${d.counterparty}` : `${d.counterparty} owes you`;
        const body = `${formatMoney(rem, false)} · ${alertLabel(d.due_date)}`;
        new Notification(title, { body, tag: `debt-${d.id}` });
        notified[String(d.id)] = today;
      }
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified));
    };

    if (Notification.permission === "granted") fire();
    else if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") fire();
      });
    }
  }, [alerts, loading]);

  return null;
}
