export const HIGHLIGHT_COLORS = [
  { id: "yellow", value: "#F6D860", label: "Yellow" },
  { id: "green", value: "#86EFAC", label: "Green" },
  { id: "blue", value: "#93C5FD", label: "Blue" },
  { id: "pink", value: "#F9A8D4", label: "Pink" },
  { id: "purple", value: "#C4B5FD", label: "Purple" },
] as const;

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_COLORS[0].value;

export type HighlightColorId = (typeof HIGHLIGHT_COLORS)[number]["id"];
