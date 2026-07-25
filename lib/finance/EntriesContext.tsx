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
import { normalizeTxnType } from "./types";
import { applyDebtForEntry, notifyFinanceChanged, reverseDebtForEntry } from "./debtEntrySync";

function normalizeEntry(row: FinanceEntry): FinanceEntry {
  return {
    ...row,
    type: normalizeTxnType(row.type),
    amount: Math.abs(Number(row.amount)) || 0,
  };
}

interface EntriesContextValue {
  entries: FinanceEntry[];
  loading: boolean;
  syncing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveEntry: (draft: EntryDraft) => Promise<FinanceEntry | null>;
  deleteEntry: (id: number) => Promise<FinanceEntry | null>;
  restoreEntry: (entry: FinanceEntry) => Promise<FinanceEntry | null>;
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
    setEntries(next.map(normalizeEntry));
    writeEntriesCache(next.map(normalizeEntry));
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
      applyEntries((data as FinanceEntry[]).map(normalizeEntry));
    }
    setLoading(false);
    setSyncing(false);
  }, [applyEntries]);

  useEffect(() => {
    const cached = readEntriesCache();
    if (cached?.length) {
      setEntries(cached.map(normalizeEntry));
      setLoading(false);
    }
    void reload();
  }, [reload]);

  useEffect(() => {
    const onChange = () => {
      void reload();
    };
    window.addEventListener("lifeos:finance-changed", onChange);
    return () => window.removeEventListener("lifeos:finance-changed", onChange);
  }, [reload]);

  const saveEntry = useCallback(async (draft: EntryDraft): Promise<FinanceEntry | null> => {
    setError(null);
    const payload = {
      date: draft.date || todayISO(),
      description: draft.description,
      category: draft.category,
      type: normalizeTxnType(draft.type),
      intent: draft.intent,
      amount: Math.abs(draft.amount),
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
      const saved = normalizeEntry(data as FinanceEntry);
      setEntries((cur) => {
        const next = cur.map((e) => (e.id === saved.id ? saved : e));
        writeEntriesCache(next);
        return next;
      });
      notifyFinanceChanged();
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
    const saved = normalizeEntry(data as FinanceEntry);
    setEntries((cur) => {
      const next = [saved, ...cur.filter((e) => e.id !== temp)];
      writeEntriesCache(next);
      return next;
    });
    notifyFinanceChanged();
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

    await reverseDebtForEntry(removed);
    notifyFinanceChanged();
    return normalizeEntry(removed);
  }, []);

  const restoreEntry = useCallback(async (entry: FinanceEntry): Promise<FinanceEntry | null> => {
    setError(null);
    const payload = {
      date: entry.date,
      description: entry.description,
      category: entry.category,
      type: normalizeTxnType(entry.type),
      intent: entry.intent,
      amount: Math.abs(Number(entry.amount)) || 0,
      debt_id: entry.debt_id,
    };

    const { data, error: err } = await supabase
      .from("finance_entries")
      .insert(payload)
      .select(ENTRY_SELECT)
      .single();

    if (err || !data) {
      setError("Couldn't restore transaction.");
      return null;
    }

    const saved = normalizeEntry(data as FinanceEntry);
    await applyDebtForEntry(saved);

    setEntries((cur) => {
      const next = [saved, ...cur.filter((e) => e.id !== saved.id)];
      writeEntriesCache(next);
      return next;
    });
    notifyFinanceChanged();
    return saved;
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
      restoreEntry,
      clearError: () => setError(null),
    }),
    [entries, loading, syncing, error, reload, saveEntry, deleteEntry, restoreEntry]
  );

  return <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>;
}

export function useEntriesContext() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntriesContext must be used within EntriesProvider");
  return ctx;
}
