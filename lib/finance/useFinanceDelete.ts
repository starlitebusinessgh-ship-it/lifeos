"use client";

import { useCallback } from "react";
import type { FinanceEntry } from "./types";
import { useEntries } from "./useEntries";
import { haptic } from "./haptics";
import { useToast } from "@/components/finance/ToastProvider";

export function useFinanceDelete() {
  const { deleteEntry, restoreEntry } = useEntries();
  const { showToast } = useToast();

  const removeById = useCallback(
    async (id: number, onDone?: () => void) => {
      const removed = await deleteEntry(id);
      if (!removed) return false;

      haptic("warning");
      onDone?.();
      showToast("Transaction deleted", {
        label: "Undo",
        onClick: () => {
          void restoreEntry(removed);
        },
      });
      return true;
    },
    [deleteEntry, restoreEntry, showToast]
  );

  const removeEntry = useCallback(
    async (entry: FinanceEntry, onDone?: () => void) => removeById(entry.id, onDone),
    [removeById]
  );

  return { removeById, removeEntry };
}
