"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { InboxDraft, InboxItem, InboxStatus } from "./types";

const SELECT =
  "id, capture_type, life_area, title, content, raw_content, tags, status, created_at";

export function useInbox(status: InboxStatus = "inbox") {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("lifeos_inbox_items")
      .select(SELECT)
      .eq("status", status)
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as InboxItem[]);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  async function saveItem(draft: InboxDraft): Promise<boolean> {
    const payload = {
      capture_type: draft.capture_type,
      life_area: draft.life_area,
      title: draft.title?.trim() || null,
      content: draft.content.trim(),
      raw_content: draft.raw_content?.trim() || null,
      tags: draft.tags ?? [],
    };

    if (typeof draft.id === "number") {
      const { error } = await supabase
        .from("lifeos_inbox_items")
        .update(payload)
        .eq("id", draft.id);
      if (error) return false;
    } else {
      const { error } = await supabase.from("lifeos_inbox_items").insert(payload);
      if (error) return false;
    }
    await reload();
    return true;
  }

  async function archiveItem(id: number): Promise<void> {
    await supabase.from("lifeos_inbox_items").update({ status: "archived" }).eq("id", id);
    await reload();
  }

  async function restoreItem(id: number): Promise<void> {
    await supabase.from("lifeos_inbox_items").update({ status: "inbox" }).eq("id", id);
    await reload();
  }

  async function deleteItem(id: number): Promise<void> {
    await supabase.from("lifeos_inbox_items").delete().eq("id", id);
    await reload();
  }

  return { items, loading, reload, saveItem, archiveItem, restoreItem, deleteItem };
}
