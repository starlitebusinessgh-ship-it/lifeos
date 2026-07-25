"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "@/lib/api";
import type { ConnectionStatus, DisplayMessage } from "@/lib/types";

function parseMessage(raw: string): DisplayMessage | null {
  try {
    const data = JSON.parse(raw) as DisplayMessage;
    if (!data || typeof data !== "object" || !("type" in data)) return null;
    if (data.type === "verse" || data.type === "chapter" || data.type === "clear") {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function useDisplaySocket() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [message, setMessage] = useState<DisplayMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!aliveRef.current) return;
    clearTimer();

    setStatus((prev) => (prev === "connected" ? prev : "connecting"));

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!aliveRef.current) {
        ws.close();
        return;
      }
      retryRef.current = 0;
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      const parsed = parseMessage(String(event.data));
      if (parsed) setMessage(parsed);
    };

    ws.onerror = () => {
      // onclose will handle reconnect
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      if (!aliveRef.current) return;

      setStatus("disconnected");
      const attempt = retryRef.current;
      retryRef.current = attempt + 1;
      const delay = Math.min(1000 * 2 ** attempt, 15000);
      timerRef.current = setTimeout(connect, delay);
    };
  }, [clearTimer]);

  useEffect(() => {
    aliveRef.current = true;
    connect();
    return () => {
      aliveRef.current = false;
      clearTimer();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearTimer]);

  return { status, message };
}
