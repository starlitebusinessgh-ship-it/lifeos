"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "lifeos.finance.firstRunDismissed";

export function FirstRunHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="rv-first-run">
      <div>
        <strong>Logging from July 2026</strong>
        <p>Your GH₵6,400 opening balance is set for 1 Jul. Add new spending from this month onward.</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(KEY, "1");
          setShow(false);
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
