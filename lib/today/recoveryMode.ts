const STORAGE_KEY = "lifeos:recovery-day:v1";

export function isRecoveryDay(day: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === day;
  } catch {
    return false;
  }
}

export function setRecoveryDay(day: string | null): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (day) window.localStorage.setItem(STORAGE_KEY, day);
    else window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
