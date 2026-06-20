/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { computeRunningBalance } from "@/lib/finance/agent";
import { FINANCE_ASSUMPTIONS } from "@/lib/finance/assumptions";

export type ToolAction =
  | { type: "navigate"; path: string }
  | { type: "saved"; title: string }
  | { type: "logged_finance"; description: string; amount: number; transactionType: string }
  | { type: "deleted_finance"; entryId: number }
  | { type: "deleted_entry"; entryId: string }
  | { type: "updated_principles" };

export type ToolResult = {
  data: unknown;
  action?: ToolAction;
};

type DB = ReturnType<typeof createClient<any, any, any>>;

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  supabase: DB
): Promise<ToolResult> {
  switch (name) {

    /* ── Save journal entry ── */
    case "save_journal_entry": {
      const { title, content, capture_type, life_area, tags } = args as {
        title: string;
        content: string;
        capture_type: string;
        life_area: string;
        tags?: string[];
      };

      const { error } = await supabase.from("entries").insert({
        title: (title ?? "").trim(),
        content,
        raw_content: content,
        capture_type,
        life_area,
        tags: Array.isArray(tags) && tags.length > 0 ? tags.join(", ") : null,
        created_at: new Date().toISOString(),
      });

      if (error) return { data: { success: false, error: (error as any).message } };

      return {
        data: { success: true, title },
        action: { type: "saved", title: title ?? "Entry" },
      };
    }

    /* ── Navigate ── */
    case "navigate_to": {
      const { path } = args as { path: string };
      return {
        data: { success: true, path },
        action: { type: "navigate", path },
      };
    }

    /* ── Search journal ── */
    case "search_journal": {
      const { query, life_area, capture_type, limit } = args as {
        query: string;
        life_area?: string;
        capture_type?: string;
        limit?: number;
      };

      let q = supabase
        .from("entries")
        .select("id, title, content, capture_type, life_area, tags, created_at")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order("created_at", { ascending: false })
        .limit(limit ?? 5);

      if (life_area) q = q.eq("life_area", life_area);
      if (capture_type) q = q.eq("capture_type", capture_type);

      const { data, error } = await q;
      if (error) return { data: { error: (error as any).message } };

      const rows = (data as any[]) ?? [];
      return {
        data: {
          entries: rows.map((e: any) => ({
            id: e.id,
            title: e.title,
            summary: String(e.content ?? "").slice(0, 200),
            capture_type: e.capture_type,
            life_area: e.life_area,
            tags: e.tags,
            date: String(e.created_at ?? "").slice(0, 10),
          })),
          count: rows.length,
        },
      };
    }

    /* ── Finance summary ── */
    case "get_finance_summary": {
      const { data: rows } = await supabase
        .from("finance_entries")
        .select("id, date, description, category, type, intent, amount, created_at")
        .order("date", { ascending: false });

      const entries = (rows as any[]) ?? [];
      const { bank, loan, netWorth } = computeRunningBalance(entries);
      const recent = entries.slice(0, 10).map((e: any) => ({
        id: e.id,
        date: e.date,
        description: e.description,
        category: e.category,
        type: e.type,
        amount: e.amount,
      }));

      return {
        data: {
          bankBalance: Math.round(bank),
          loanBalance: Math.round(loan),
          netWorth: Math.round(netWorth),
          savings: Math.round(FINANCE_ASSUMPTIONS.currentSavings),
          recentTransactions: recent,
        },
      };
    }

    /* ── Log finance entry ── */
    case "log_finance_entry": {
      const { description, amount, type, category, intent, date } = args as {
        description: string;
        amount: number;
        type: string;
        category: string;
        intent?: string;
        date?: string;
      };

      const resolvedIntent =
        intent ??
        (type === "Income"
          ? "Necessary"
          : type === "Savings"
          ? "Investment"
          : "Optional");

      const { error } = await supabase.from("finance_entries").insert({
        description,
        amount: Math.abs(amount),
        type,
        category,
        intent: resolvedIntent,
        date: date ?? new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
      });

      if (error) return { data: { success: false, error: (error as any).message } };

      return {
        data: { success: true },
        action: { type: "logged_finance", description, amount, transactionType: type },
      };
    }

    /* ── Delete finance entry ── */
    case "delete_finance_entry": {
      const { entry_id } = args as { entry_id: number };
      const { error } = await supabase
        .from("finance_entries")
        .delete()
        .eq("id", entry_id);

      if (error) return { data: { success: false, error: (error as any).message } };

      return {
        data: { success: true },
        action: { type: "deleted_finance", entryId: entry_id },
      };
    }

    /* ── Get principles ── */
    case "get_principles": {
      const { data, error } = await supabase
        .from("principles")
        .select("content, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { data: { error: (error as any).message } };
      return { data: { content: (data as any)?.content ?? null } };
    }

    /* ── Update principles ── */
    case "update_principles": {
      const { content } = args as { content: string };
      const { error } = await supabase
        .from("principles")
        .upsert({ content, updated_at: new Date().toISOString() });

      if (error) return { data: { success: false, error: (error as any).message } };

      return {
        data: { success: true },
        action: { type: "updated_principles" },
      };
    }

    /* ── Delete journal entry ── */
    case "delete_journal_entry": {
      const { entry_id } = args as { entry_id: string };
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", entry_id);

      if (error) return { data: { success: false, error: (error as any).message } };

      return {
        data: { success: true },
        action: { type: "deleted_entry", entryId: entry_id },
      };
    }

    default:
      return { data: { error: `Unknown tool: ${name}` } };
  }
}
