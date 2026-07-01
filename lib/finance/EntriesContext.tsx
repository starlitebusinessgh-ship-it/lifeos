"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { ENTRY_SELECT } from "./entrySelect";
import { readEntriesCache, writeEntriesCache } from "./entriesCache";
import type { EntryDraft, FinanceEntry } from "./types";

interface EntriesContextValue {
  entries: FinanceEntry[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveEntry: (draft: EntryDraft) => Promise<FinanceEntry | null>;
  deleteEntry: (id: number) => Promise<FinanceEntry | null>;
  clearError: () => void;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tempId() {
  return -Date.now();
}

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyEntries = useCallback((next: FinanceEntry[]) => {
    setEntries(next);
    writeEntriesCache(next);
  }, []);

  const reload = useCallback(async () => {
    setSyncing(true);
    setError(null);
    const { data, err } = await supabase
      .from("finance_entries")
      .select(ENTRY_SELECT)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .then((r) => ({ data: r.data, err: r.error }));

    if (err) {
      setError("Couldn't load transactions. Tap to retry.");
    } else if (data) {
      applyEntries(data as FinanceEntry[]);
    }
    setLoading(false);
    setSyncing(false);
  }, [applyEntries]);

  useEffect(() => {
    const cached = readEntriesCache();
    if (cached?.length) {
      setEntries(cached);
      setLoading(false);
    }
    void reload();
  }, [reload]);

  const saveEntry = useCallback(async (draft: EntryDraft): Promise<FinanceEntry | null> => {
    setError(null);
    const payload = {
      date: draft.date || todayISO(),
      description: draft.description,
      category: draft.category,
      type: draft.type,
      intent: draft.intent,
      amount: draft.amount,
    };

    if (typeof draft.id === "number" && draft.id > 0) {
      let prev: FinanceEntry | undefined;
      setEntries((cur) => {
        prev = cur.find((e) => e.id === draft.id);
        if (!prev) return cur;
        const optimistic: FinanceEntry = {
          ...prev,
          ...payload,
          debt_id: draft.debt_id ?? prev.debt_id ?? null,
        };
        const next = cur.map((e) => (e.id === draft.id ? optimistic : e));
        writeEntriesCache(next);
        return next;
      });

      const { data, error: err } = await supabase
        .from("finance_entries")
        .update(payload)
        .eq("id", draft.id)
        .select(ENTRY_SELECT)
        .single();

      if (err) {
        if (prev) {
          setEntries((cur) => {
            const next = cur.map((e) => (e.id === prev!.id ? prev! : e));
            writeEntriesCache(next);
            return next;
          });
        }
        setError("Couldn't save changes. Tap to retry.");
        return null;
      }
      const saved = data as FinanceEntry;
      setEntries((cur) => {
        const next = cur.map((e) => (e.id === saved.id ? saved : e));
        writeEntriesCache(next);
        return next;
      });
      return saved;
    }

    const temp = tempId();
    const optimistic: FinanceEntry = {
      id: temp,
      ...payload,
      debt_id: draft.debt_id ?? null,
      created_at: new Date().toISOString(),
    };
    setEntries((cur) => {
      const next = [optimistic, ...cur];
      writeEntriesCache(next);
      return next;
    });

    const { data, error: err } = await supabase
      .from("finance_entries")
      .insert(payload)
      .select(ENTRY_SELECT)
      .single();

    if (err) {
      setEntries((cur) => {
        const next = cur.filter((e) => e.id !== temp);
        writeEntriesCache(next);
        return next;
      });
      setError("Couldn't add transaction. Tap to retry.");
      return null;
    }
    const saved = data as FinanceEntry;
    setEntries((cur) => {
      const next = [saved, ...cur.filter((e) => e.id !== temp)];
      writeEntriesCache(next);
      return next;
    });
    return saved;
  }, []);

  const deleteEntry = useCallback(async (id: number): Promise<FinanceEntry | null> => {
    setError(null);
    let removed: FinanceEntry | undefined;
    setEntries((cur) => {
      removed = cur.find((e) => e.id === id);
      if (!removed) return cur;
      const next = cur.filter((e) => e.id !== id);
      writeEntriesCache(next);
      return next;
    });
    if (!removed) return null;

    const { error: err } = await supabase.from("finance_entries").delete().eq("id", id);
    if (err) {
      setEntries((cur) => {
        const next = [removed!, ...cur];
        writeEntriesCache(next);
        return next;
      });
      setError("Couldn't delete. Tap to retry.");
      return null;
    }
    return removed;
  }, []);

  const value = useMemo(
    () => ({
      entries,
      loading,
      syncing,
      error,
      reload,
      saveEntry,
      deleteEntry,
      clearError: () => setError(null),
    }),
    [entries, loading, syncing, error, reload, saveEntry, deleteEntry]
  );

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntriesContext() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntriesContext must be used within EntriesProvider");
  return ctx;
}
