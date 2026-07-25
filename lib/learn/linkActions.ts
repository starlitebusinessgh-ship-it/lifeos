import {
  createKnowledgeLink,
  type KnowledgeLinkType,
} from "./knowledge";
import type { LibraryBook } from "./types";
import { sendQuoteToInbox, sendQuoteToToday } from "./highlightActions";

export async function sendHighlightToInbox(
  highlightId: string,
  book: Pick<LibraryBook, "title" | "author">,
  quote: string,
  page?: number | null,
  note?: string | null
): Promise<boolean> {
  const inboxId = await sendQuoteToInbox(book, quote, page, note);
  if (!inboxId) return false;
  const link = await createKnowledgeLink(highlightId, "inbox", { targetId: inboxId });
  return !!link;
}

export async function sendHighlightToToday(
  highlightId: string,
  book: Pick<LibraryBook, "title" | "author">,
  quote: string,
  page?: number | null
): Promise<boolean> {
  const taskId = await sendQuoteToToday(book, quote, page);
  if (!taskId) return false;
  const link = await createKnowledgeLink(highlightId, "task", { targetId: taskId });
  return !!link;
}

export async function pinHighlightIdea(
  highlightId: string,
  title: string,
  asBuild = false
): Promise<boolean> {
  const type: KnowledgeLinkType = asBuild ? "build" : "idea";
  const link = await createKnowledgeLink(highlightId, type, { ideaTitle: title });
  return !!link;
}
