export const CAPTURE_TYPES = [
  { value: "note", label: "Note" },
  { value: "idea", label: "Idea" },
  { value: "journal", label: "Journal" },
  { value: "decision", label: "Decision" },
  { value: "lesson", label: "Lesson" },
  { value: "prayer", label: "Prayer" },
  { value: "reflection", label: "Reflection" },
  { value: "goal_update", label: "Goal" },
  { value: "book_note", label: "Book" },
  { value: "other", label: "Other" },
] as const;

export const LIFE_AREAS = [
  "General",
  "Finance",
  "Health",
  "Career",
  "Learning",
  "Spiritual",
  "Relationships",
] as const;

export type CaptureType = (typeof CAPTURE_TYPES)[number]["value"];
export type LifeArea = (typeof LIFE_AREAS)[number];
export type InboxStatus = "inbox" | "archived";

export interface InboxItem {
  id: number;
  capture_type: string;
  life_area: string;
  title: string | null;
  content: string;
  raw_content: string | null;
  tags: string[];
  status: InboxStatus;
  created_at: string;
}

export interface InboxDraft {
  id?: number;
  capture_type: CaptureType;
  life_area: LifeArea;
  title?: string | null;
  content: string;
  raw_content?: string | null;
  tags?: string[];
}

export function formatCaptureType(type: string): string {
  const found = CAPTURE_TYPES.find((t) => t.value === type);
  if (found) return found.label;
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatInboxTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
