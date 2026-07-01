"use client";

import { useEntriesContext } from "@/lib/finance/EntriesContext";

export function ErrorBanner() {
  const { error, reload, clearError } = useEntriesContext();
  if (!error) return null;

  return (
    <button
      type="button"
      className="rv-error-banner"
      onClick={() => {
        clearError();
        void reload();
      }}
    >
      {error}
    </button>
  );
}
