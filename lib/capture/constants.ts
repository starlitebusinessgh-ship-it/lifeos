export const CAPTURE_TYPES = [
  { value: "decision", label: "Decision" },
  { value: "journal", label: "Journal" },
  { value: "lesson", label: "Lesson" },
  { value: "idea", label: "Idea" },
  { value: "note", label: "Note" },
  { value: "prayer", label: "Prayer" },
  { value: "book_note", label: "Book Note" },
  { value: "goal_update", label: "Goal Update" },
  { value: "reflection", label: "Reflection" },
  { value: "other", label: "Other" },
] as const;

export const LIFE_AREAS = [
  "Finance",
  "Health",
  "Career",
  "Learning",
  "Spiritual",
  "Relationships",
  "General",
] as const;

export const CAPTURE_TYPE_VALUES = new Set<string>(
  CAPTURE_TYPES.map((t) => t.value)
);
export const LIFE_AREA_VALUES = new Set<string>(LIFE_AREAS);

export type CaptureChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};
