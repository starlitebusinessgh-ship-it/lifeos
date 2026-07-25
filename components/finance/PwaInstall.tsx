"use client";

import { useEffect, useRef, useState } from "react";
import { X, Share, Download, MoreVertical } from "lucide-react";

const IOS_HINT_KEY = "lifeos.pwa.hintDismissed.ios";
const ANDROID_HINT_KEY = "lifeos.pwa.hintDismissed.android";
const LEGACY_HINT_KEY = "lifeos.pwa.hintDismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS|EdgiOS/.test(ua);
  return ios && webkit && notChrome;
}

function isAndroid() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
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

type HintMode = "ios" | "android-prompt" | "android-manual";

export function PwaInstallHint() {
  const [mode, setMode] = useState<HintMode | null>(null);
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const onInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      if (!localStorage.getItem(ANDROID_HINT_KEY) && !localStorage.getItem(LEGACY_HINT_KEY)) {
        setMode("android-prompt");
      }
    };

    const onInstalled = () => {
      setMode(null);
      localStorage.setItem(ANDROID_HINT_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isIosSafari() && !localStorage.getItem(IOS_HINT_KEY) && !localStorage.getItem(LEGACY_HINT_KEY)) {
      setMode("ios");
    } else if (isAndroid() && !localStorage.getItem(ANDROID_HINT_KEY) && !localStorage.getItem(LEGACY_HINT_KEY)) {
      const timer = window.setTimeout(() => {
        setMode((current) => (current === null ? "android-manual" : current));
      }, 2500);
      return () => {
        window.removeEventListener("beforeinstallprompt", onInstallPrompt);
        window.removeEventListener("appinstalled", onInstalled);
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    if (mode === "ios") localStorage.setItem(IOS_HINT_KEY, "1");
    else localStorage.setItem(ANDROID_HINT_KEY, "1");
    setMode(null);
  }

  async function handleInstall() {
    const ev = deferredRef.current;
    if (!ev) return;
    await ev.prompt();
    await ev.userChoice;
    deferredRef.current = null;
    localStorage.setItem(ANDROID_HINT_KEY, "1");
    setMode(null);
  }

  if (!mode) return null;

  if (mode === "ios") {
    return (
      <div className="rv-pwa-hint">
        <Share size={18} />
        <div>
          <strong>Install LifeOS on your iPhone</strong>
          <p>
            Tap Share, then &quot;Add to Home Screen&quot;. It opens full-screen from your home
            screen — no Safari bars — and updates automatically.
          </p>
        </div>
        <button type="button" aria-label="Dismiss" onClick={dismiss}>
          <X size={16} />
        </button>
      </div>
    );
  }

  if (mode === "android-prompt") {
    return (
      <div className="rv-pwa-hint">
        <Download size={18} />
        <div>
          <strong>Install LifeOS on your phone</strong>
          <p>Add the app to your home screen for full-screen use and quick access.</p>
          <button type="button" className="rv-pwa-hint__install" onClick={() => void handleInstall()}>
            Install app
          </button>
        </div>
        <button type="button" aria-label="Dismiss" onClick={dismiss}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="rv-pwa-hint">
      <MoreVertical size={18} />
      <div>
        <strong>Install LifeOS on Android</strong>
        <p>
          Tap the menu (⋮) in Chrome, then &quot;Install app&quot; or &quot;Add to Home screen&quot;.
          Opens like a normal app — free, no Play Store needed.
        </p>
      </div>
      <button type="button" aria-label="Dismiss" onClick={dismiss}>
        <X size={16} />
      </button>
    </div>
  );
}
