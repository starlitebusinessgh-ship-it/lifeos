"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { AgentChatMessage } from "@/lib/finance/types";
import { BORDER, SURFACE, TEXT, TEXT_MUTED } from "@/lib/finance/theme";

type Props = {
  onSubmit: (text: string, options?: { forceCursor?: boolean; newSession?: boolean }) => Promise<void>;
  messages: AgentChatMessage[];
  loading: boolean;
  loadingLabel?: string;
  forceCursor: boolean;
  onForceCursorChange: (value: boolean) => void;
  hasCursorSession: boolean;
  onNewSession: () => void;
};

export function FinanceAgentPanel({
  onSubmit,
  messages,
  loading,
  loadingLabel = "Working…",
  forceCursor,
  onForceCursorChange,
  hasCursorSession,
  onNewSession,
}: Props) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function handleSend() {
    const t = text.trim();
    if (!t || loading) return;
    setText("");
    setOpen(true);
    await onSubmit(t, { forceCursor });
  }

  return (
    <div style={{ marginBottom: 0 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
          fontSize: 12,
          color: TEXT_MUTED,
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={forceCursor}
            onChange={(e) => onForceCursorChange(e.target.checked)}
            disabled={loading}
          />
          Use Cursor agent (code &amp; app changes)
        </label>
        {hasCursorSession && (
          <button
            type="button"
            onClick={onNewSession}
            disabled={loading}
            style={{
              border: "none",
              background: "transparent",
              color: TEXT,
              fontSize: 12,
              textDecoration: "underline",
              cursor: loading ? "not-allowed" : "pointer",
              padding: 0,
            }}
          >
            New Cursor session
          </button>
        )}
      </div>

      {open && messages.length > 0 && (
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            marginBottom: 10,
            padding: 12,
            maxHeight: 200,
            overflowY: "auto",
            backgroundColor: SURFACE,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "90%",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                backgroundColor: m.role === "user" ? TEXT : "#F9F9F9",
                color: m.role === "user" ? SURFACE : TEXT,
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: 13, color: TEXT_MUTED, display: "flex", gap: 6, alignItems: "center" }}>
              <Loader2 size={14} className="animate-spin" />
              {loadingLabel}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={
            forceCursor
              ? "Tell the Cursor agent what to build or change…"
              : "Log spending, ask for advice, or describe what we did in Cursor…"
          }
          disabled={loading}
          style={{
            flex: 1,
            padding: "11px 14px",
            borderRadius: 10,
            border: `1px solid ${BORDER}`,
            fontSize: 14,
            outline: "none",
            background: SURFACE,
            color: TEXT,
          }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!text.trim() || loading}
          aria-label="Send"
          style={{
            padding: "0 14px",
            borderRadius: 10,
            border: "none",
            background: text.trim() && !loading ? TEXT : BORDER,
            color: text.trim() && !loading ? SURFACE : TEXT_MUTED,
            cursor: text.trim() && !loading ? "pointer" : "not-allowed",
          }}
        >
          {loading ? <Loader2 size={18} /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
