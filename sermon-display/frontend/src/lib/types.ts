export type VersePayload = {
  type: "verse";
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

export type ChapterPayload = {
  type: "chapter";
  translation: string;
  book: string;
  chapter: number;
  verses: { verse: number; text: string }[];
};

export type ClearPayload = {
  type: "clear";
};

export type DisplayMessage = VersePayload | ChapterPayload | ClearPayload;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
