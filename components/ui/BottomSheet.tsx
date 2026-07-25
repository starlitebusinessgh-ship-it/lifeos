"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSheetKeyboardInset } from "@/lib/hooks/useSheetKeyboardInset";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  scrimClassName?: string;
  "aria-label"?: string;
};

export function BottomSheet({
  open,
  onClose,
  children,
  className = "ln-sheet",
  scrimClassName = "ln-scrim",
  "aria-label": ariaLabel,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [settled, setSettled] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useSheetKeyboardInset(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) setSettled(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const onFocus = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement) || !sheet.contains(target)) return;
      if (!target.matches("input, textarea, select")) return;
      window.setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 320);
    };

    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={scrimClassName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            className={className}
            role="dialog"
            aria-label={ariaLabel}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            onAnimationComplete={() => setSettled(true)}
            style={settled ? { transform: "none" } : undefined}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
