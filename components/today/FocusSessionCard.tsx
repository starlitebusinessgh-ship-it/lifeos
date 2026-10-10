"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CirclePause, Play, RotateCcw, Timer } from "lucide-react";
import { motion } from "motion/react";
import type { DayTask } from "@/lib/today/taskTypes";
import {
  completeFocusSession,
  pauseFocusSession,
  readFocusSession,
  remainingSeconds,
  resumeFocusSession,
  writeFocusSession,
  type FocusSession,
} from "@/lib/today/focusSession";
import { haptic } from "@/lib/finance/haptics";

const DURATIONS = [15, 25, 45];

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function FocusSessionCard({ focusTask, onChooseFocus, isToday }: { focusTask: DayTask | null; onChooseFocus: () => void; isToday: boolean }) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    setSession(readFocusSession());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (!session) {
      writeFocusSession(null);
      setStorageWarning(false);
      return;
    }
    setStorageWarning(!writeFocusSession(session));
  }, [loaded, session]);

  useEffect(() => {
    if (!loaded || session?.status !== "running") return;
    const id = window.setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      setSession((current) => {
        if (current?.status !== "running" || current.endsAt === null || current.endsAt > tick) return current;
        return completeFocusSession(current, tick);
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [loaded, session?.status]);

  const secondsLeft = useMemo(() => session ? remainingSeconds(session, now) : 0, [session, now]);
  const elapsed = session ? Math.max(0, session.durationSeconds - secondsLeft) : 0;
  const percent = session ? Math.min(100, Math.round((elapsed / session.durationSeconds) * 100)) : 0;

  function startSession() {
    if (!focusTask) return;
    const startedAt = Date.now();
    setNow(startedAt);
    setSession({
      taskId: focusTask.id,
      taskTitle: focusTask.title,
      durationSeconds: durationMinutes * 60,
      elapsedSeconds: 0,
      status: "running",
      endsAt: startedAt + durationMinutes * 60_000,
      startedAt,
      completedAt: null,
    });
    haptic("success");
  }

  function pause() {
    if (!session) return;
    const paused = pauseFocusSession(session);
    setSession(paused);
    setNow(Date.now());
    haptic("light");
  }

  function resume() {
    if (!session) return;
    const resumed = resumeFocusSession(session);
    setSession(resumed);
    setNow(Date.now());
    haptic("light");
  }

  function finish() {
    if (!session) return;
    setSession(completeFocusSession(session));
    setNow(Date.now());
    haptic("success");
  }

  function clearSession() {
    setSession(null);
    setNow(Date.now());
    haptic("light");
  }

  if (!loaded) return null;

  return (
    <motion.section
      className="td-session-card"
      aria-label="Focus session"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 }}
    >
      <div className="td-session-head">
        <span className="td-session-icon"><Timer size={17} /></span>
        <div>
          <span className="td-session-kicker">FOCUS TIME</span>
          <h2 aria-live="polite" aria-atomic="true">{session?.status === "complete" ? (session.elapsedSeconds >= session.durationSeconds ? "Session complete" : "Session ended") : "Give it your full attention"}</h2>
        </div>
      </div>

      {session ? (
        <>
          <p className="td-session-task">{session.taskTitle}</p>
          <div className="td-session-clock" aria-live="off">{session.status === "complete" ? (session.elapsedSeconds < 60 ? "<1 min" : `${Math.floor(session.elapsedSeconds / 60)} min`) : formatClock(secondsLeft)}</div>
          <div className="td-session-track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
          <p className="td-session-caption">
            {session.status === "complete"
              ? "Your task is still open. Mark it done when the work is finished."
              : session.status === "paused"
                ? "Paused. Resume when you’re ready."
                : "One task, one focused block. You can pause whenever you need."}
          </p>
          <div className="td-session-actions">
            {session.status === "running" && (
              <button type="button" className="td-session-primary" onClick={pause}><CirclePause size={17} /> Pause</button>
            )}
            {session.status === "paused" && (
              <button type="button" className="td-session-primary" onClick={resume}><Play size={16} fill="currentColor" /> Resume</button>
            )}
            {session.status !== "complete" && (
              <button type="button" className="td-session-secondary" onClick={finish}>Finish session</button>
            )}
            {session.status === "complete" && (
              <button type="button" className="td-session-primary" onClick={clearSession}><RotateCcw size={16} /> Start another</button>
            )}
          </div>
        </>
      ) : (
        <>
          {!isToday ? (
            <p className="td-session-caption">Focus sessions are available for today’s plan.</p>
          ) : focusTask ? (
            <>
              <p className="td-session-task">{focusTask.title}</p>
              <p className="td-session-caption">Set a short timer to make starting easier. This session stays on this device.</p>
              <div className="td-session-presets" aria-label="Choose focus duration">
                {DURATIONS.map((minutes) => (
                  <button key={minutes} type="button" aria-pressed={durationMinutes === minutes} className={durationMinutes === minutes ? "selected" : ""} onClick={() => setDurationMinutes(minutes)}>{minutes} min</button>
                ))}
              </div>
              <button type="button" className="td-session-primary td-session-start" onClick={startSession}><Play size={16} fill="currentColor" /> Start focusing</button>
            </>
          ) : (
            <button type="button" className="td-session-no-focus" onClick={onChooseFocus}>
              <span><Check size={16} /> Choose your main priority first</span><span aria-hidden="true">→</span>
            </button>
          )}
        </>
      )}
      {storageWarning && <p className="td-session-warning" role="status">Your browser couldn’t save this timer. Keep this screen open until you finish.</p>}
    </motion.section>
  );
}
