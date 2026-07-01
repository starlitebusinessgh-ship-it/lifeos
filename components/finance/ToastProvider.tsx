"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { haptic } from "@/lib/finance/haptics";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastState {
  message: string;
  action?: ToastAction;
}

const ToastContext = createContext<{
  showToast: (message: string, action?: ToastAction) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, action?: ToastAction) => {
    haptic("light");
    setToast({ message, action });
    window.setTimeout(() => setToast(null), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="rv-toast" role="status">
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" onClick={() => { toast.action!.onClick(); setToast(null); }}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
