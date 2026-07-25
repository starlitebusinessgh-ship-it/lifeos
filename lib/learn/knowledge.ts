import { supabase } from "@/lib/supabase";

export type KnowledgeLinkType = "inbox" | "task" | "idea" | "build";

export interface KnowledgeLink {
  id: string;
  highlight_id: string;
  link_type: KnowledgeLinkType;
  target_id: string | null;
  idea_title: string | null;
  created_at: string;
}

export interface GraphActionNode {
  id: string;
  linkId: string;
  type: KnowledgeLinkType;
  label: string;
  href?: string;
}

export interface GraphHighlightNode {
  id: string;
  quote: string;
  note: string | null;
  page: number | null;
  color: string;
  actions: GraphActionNode[];
}

export interface GraphBookCluster {
  bookId: string;
  title: string;
  author: string | null;
  highlights: GraphHighlightNode[];
}

const LINK_SELECT = "id, highlight_id, link_type, target_id, idea_title, created_at";

export async function fetchAllKnowledgeLinks(): Promise<KnowledgeLink[]> {
  const { data, error } = await supabase
    .from("library_knowledge_links")
    .select(LINK_SELECT)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as KnowledgeLink[];
}

export async function fetchLinksForHighlight(highlightId: string): Promise<KnowledgeLink[]> {
  const { data, error } = await supabase
    .from("library_knowledge_links")
    .select(LINK_SELECT)
    .eq("highlight_id", highlightId);
  if (error || !data) return [];
  return data as KnowledgeLink[];
}

export async function createKnowledgeLink(
  highlightId: string,
  linkType: KnowledgeLinkType,
  opts?: { targetId?: string | number; ideaTitle?: string }
): Promise<KnowledgeLink | null> {
  const { data, error } = await supabase
    .from("library_knowledge_links")
    .insert({
      highlight_id: highlightId,
      link_type: linkType,
      target_id: opts?.targetId != null ? String(opts.targetId) : null,
      idea_title: opts?.ideaTitle?.trim() || null,
    })
    .select(LINK_SELECT)
    .single();
  if (error || !data) return null;
  return data as KnowledgeLink;
}

export async function deleteKnowledgeLink(id: string): Promise<boolean> {
  const { error } = await supabase.from("library_knowledge_links").delete().eq("id", id);
  return !error;
}

export function linkTypeLabel(type: KnowledgeLinkType): string {
  switch (type) {
    case "inbox":
      return "Inbox";
    case "task":
      return "Today";
    case "idea":
      return "Idea";
    case "build":
      return "Build";
  }
}

export function actionHref(type: KnowledgeLinkType, targetId: string | null): string | undefined {
  if (!targetId) return undefined;
  if (type === "inbox") return "/inbox";
  if (type === "task") return "/today";
  if (type === "build") return "/build";
  return undefined;
}

export function actionNodeFromLink(link: KnowledgeLink, resolvedLabel?: string): GraphActionNode {
  const label =
    resolvedLabel ??
    link.idea_title ??
    (link.target_id ? `${linkTypeLabel(link.link_type)} #${link.target_id}` : linkTypeLabel(link.link_type));

  return {
    id: `action-${link.id}`,
    linkId: link.id,
    type: link.link_type,
    label,
    href: actionHref(link.link_type, link.target_id),
  };
}
