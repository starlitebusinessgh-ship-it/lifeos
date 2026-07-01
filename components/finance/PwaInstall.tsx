"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

const HINT_KEY = "lifeos.pwa.hintDismissed";

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && webkit && notChrome;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Dev HMR + SW caching causes broken chunks and stale pages — production only.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

export function PwaInstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (!isIosSafari()) return;
    if (localStorage.getItem(HINT_KEY)) return;
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="rv-pwa-hint">
      <Share size={18} />
      <div>
        <strong>Add to Home Screen</strong>
        <p>Tap Share → Add to Home Screen to use LifeOS Finance like an app.</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(HINT_KEY, "1");
          setShow(false);
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
