/** Conversational chat (Capture). Override with OPENAI_CHAT_MODEL in .env.local */
export const CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-5-mini";

/** Structured JSON outputs (organize, finance agent). Override with OPENAI_STRUCTURED_MODEL in .env.local */
export const STRUCTURED_MODEL =
  process.env.OPENAI_STRUCTURED_MODEL?.trim() || "gpt-5-mini";
