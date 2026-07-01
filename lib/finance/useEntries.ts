"use client";

import { useEntriesContext } from "./EntriesContext";

export function useEntries() {
  return useEntriesContext();
}
