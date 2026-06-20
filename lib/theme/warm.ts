/** Warm atmospheric palette — reflection, not productivity */

export const warm = {
  stone: "#E6DDD1",
  parchment: "#DDD3C7",
  taupe: "#D8CEC2",
  surface: "#F0EAE2",
  surfaceLift: "#F5F0E9",
  ink: "#1E1E1C",
  inkSoft: "#3D3935",
  muted: "#6F6A63",
  whisper: "#8A8278",
  rule: "rgba(30, 30, 28, 0.1)",
} as const;

export type TimeMood = "morning" | "afternoon" | "evening";

export type MoodPalette = {
  period: TimeMood;
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceEdge: string;
  glow: string;
  glowSecondary: string;
  ink: string;
  muted: string;
};

export function getTimeMood(): MoodPalette {
  const h = new Date().getHours();
  if (h < 12) {
    return {
      period: "morning",
      bg: "#E8E0D4",
      bgDeep: "#DDD4C6",
      surface: "#F2EBE2",
      surfaceEdge: "rgba(180, 160, 130, 0.18)",
      glow: "rgba(210, 175, 120, 0.22)",
      glowSecondary: "rgba(230, 200, 150, 0.12)",
      ink: "#1E1E1C",
      muted: "#6B6358",
    };
  }
  if (h < 17) {
    return {
      period: "afternoon",
      bg: "#E3DAD0",
      bgDeep: "#D8CEC2",
      surface: "#EDE6DC",
      surfaceEdge: "rgba(150, 140, 125, 0.2)",
      glow: "rgba(180, 165, 140, 0.2)",
      glowSecondary: "rgba(200, 185, 165, 0.1)",
      ink: "#1E1E1C",
      muted: "#6F6A63",
    };
  }
  return {
    period: "evening",
    bg: "#D5CCC2",
    bgDeep: "#C9BFB4",
    surface: "#E4DDD4",
    surfaceEdge: "rgba(120, 110, 100, 0.22)",
    glow: "rgba(140, 125, 110, 0.25)",
    glowSecondary: "rgba(160, 145, 130, 0.12)",
    ink: "#1A1918",
    muted: "#5C5650",
  };
}

export function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}

export const REFLECTIVE_PROMPTS = [
  "What are you thinking through?",
  "What's asking for your attention?",
  "What feels unresolved?",
  "What do you not want to lose?",
  "What needs clarity?",
  "What are you carrying today?",
] as const;

export function getReflectivePrompt() {
  const day = new Date().getDate();
  return REFLECTIVE_PROMPTS[day % REFLECTIVE_PROMPTS.length];
}

export const MEMORY_FRAGMENTS = [
  "Decision",
  "Idea",
  "Possibility",
  "Question",
  "Clarity",
  "Realization",
  "Concern",
] as const;

export function formatCaptureDate() {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
