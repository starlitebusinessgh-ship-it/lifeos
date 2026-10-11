export const FOCUS_SESSION_KEY = "lifeos:focus-session:v1";

export interface FocusSession {
  taskId: number;
  taskTitle: string;
  durationSeconds: number;
  elapsedSeconds: number;
  status: "running" | "paused" | "complete";
  endsAt: number | null;
  startedAt: number;
  completedAt: number | null;
}

export function remainingSeconds(session: FocusSession, now = Date.now()): number {
  if (session.status === "running" && session.endsAt !== null) {
    return Math.max(0, Math.ceil((session.endsAt - now) / 1000));
  }
  return Math.max(0, session.durationSeconds - session.elapsedSeconds);
}

export function readFocusSession(now = Date.now()): FocusSession | null {
  try {
    const raw = window.localStorage.getItem(FOCUS_SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as FocusSession;
    if (
      !Number.isFinite(value.taskId) ||
      typeof value.taskTitle !== "string" || value.taskTitle.length === 0 ||
      !Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0 ||
      !Number.isFinite(value.elapsedSeconds) || value.elapsedSeconds < 0 || value.elapsedSeconds > value.durationSeconds ||
      !Number.isFinite(value.startedAt) ||
      !["running", "paused", "complete"].includes(value.status) ||
      (value.status === "running" && !Number.isFinite(value.endsAt))
    ) return null;

    if (value.status === "running" && value.endsAt !== null && value.endsAt <= now) {
      return { ...value, status: "complete", elapsedSeconds: value.durationSeconds, endsAt: null, completedAt: value.endsAt };
    }
    return value;
  } catch {
    return null;
  }
}

export function writeFocusSession(session: FocusSession | null): boolean {
  try {
    if (session) window.localStorage.setItem(FOCUS_SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(FOCUS_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}

export function pauseFocusSession(session: FocusSession, now = Date.now()): FocusSession {
  const remaining = remainingSeconds(session, now);
  return {
    ...session,
    status: "paused",
    elapsedSeconds: session.durationSeconds - remaining,
    endsAt: null,
  };
}

export function resumeFocusSession(session: FocusSession, now = Date.now()): FocusSession {
  const remaining = remainingSeconds(session, now);
  return { ...session, status: "running", endsAt: now + remaining * 1000 };
}

export function completeFocusSession(session: FocusSession, now = Date.now()): FocusSession {
  const remaining = remainingSeconds(session, now);
  return {
    ...session,
    status: "complete",
    elapsedSeconds: session.durationSeconds - remaining,
    endsAt: null,
    completedAt: now,
  };
}
