"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { InboxDraft } from "@/lib/inbox/types";

interface CaptureContextValue {
  openCapture: (draft?: InboxDraft | null) => void;
  closeCapture: () => void;
  captureOpen: boolean;
  captureDraft: InboxDraft | null;
}

const CaptureContext = createContext<CaptureContextValue | null>(null);

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureDraft, setCaptureDraft] = useState<InboxDraft | null>(null);

  const openCapture = useCallback((draft?: InboxDraft | null) => {
    setCaptureDraft(draft ?? null);
    setCaptureOpen(true);
  }, []);

  const closeCapture = useCallback(() => {
    setCaptureOpen(false);
    setCaptureDraft(null);
  }, []);

  return (
    <CaptureContext.Provider value={{ openCapture, closeCapture, captureOpen, captureDraft }}>
      {children}
    </CaptureContext.Provider>
  );
}

export function useCapture() {
  const ctx = useContext(CaptureContext);
  if (!ctx) throw new Error("useCapture must be used within CaptureProvider");
  return ctx;
}

export function useCaptureOptional() {
  return useContext(CaptureContext);
}
