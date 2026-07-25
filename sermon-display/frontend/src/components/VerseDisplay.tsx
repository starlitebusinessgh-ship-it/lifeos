"use client";

import type { DisplayMessage } from "@/lib/types";

type VerseDisplayProps = {
  message: DisplayMessage | null;
  /** projector = large full-screen; preview = compact operator mirror */
  variant?: "projector" | "preview";
};

export function VerseDisplay({
  message,
  variant = "projector",
}: VerseDisplayProps) {
  const isPreview = variant === "preview";

  if (!message || message.type === "clear") {
    return (
      <div
        className={
          isPreview
            ? "flex h-full min-h-[180px] items-center justify-center bg-zinc-950 text-sm text-zinc-500"
            : "flex h-full min-h-screen items-center justify-center bg-zinc-950"
        }
      >
        {isPreview ? <span>Display cleared</span> : null}
      </div>
    );
  }

  if (message.type === "verse") {
    return (
      <div
        className={
          isPreview
            ? "flex h-full min-h-[180px] flex-col justify-center bg-zinc-950 px-5 py-4 text-zinc-50"
            : "flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-10 py-12 text-zinc-50 md:px-20"
        }
      >
        <p
          className={
            isPreview
              ? "mb-1 text-xs font-medium tracking-[0.18em] text-amber-200/80 uppercase"
              : "mb-4 text-lg font-medium tracking-[0.22em] text-amber-200/85 uppercase md:text-xl"
          }
        >
          {message.translation}
        </p>
        <h1
          className={
            isPreview
              ? "mb-3 font-serif text-xl font-semibold text-white"
              : "mb-8 text-center font-serif text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
          }
        >
          {message.book} {message.chapter}:{message.verse}
        </h1>
        <p
          className={
            isPreview
              ? "font-serif text-base leading-relaxed text-zinc-200"
              : "max-w-5xl text-center font-serif text-3xl leading-snug text-zinc-100 md:text-4xl lg:text-5xl lg:leading-snug"
          }
        >
          {message.text}
        </p>
      </div>
    );
  }

  // chapter
  return (
    <div
      className={
        isPreview
          ? "flex h-full min-h-[180px] flex-col bg-zinc-950 px-5 py-4 text-zinc-50"
          : "flex min-h-screen flex-col bg-zinc-950 px-10 py-10 text-zinc-50 md:px-16 lg:px-24"
      }
    >
      <header className={isPreview ? "mb-3 shrink-0" : "mb-8 shrink-0 text-center"}>
        <p
          className={
            isPreview
              ? "text-xs font-medium tracking-[0.18em] text-amber-200/80 uppercase"
              : "mb-2 text-lg font-medium tracking-[0.22em] text-amber-200/85 uppercase"
          }
        >
          {message.translation}
        </p>
        <h1
          className={
            isPreview
              ? "font-serif text-lg font-semibold text-white"
              : "font-serif text-4xl font-semibold text-white md:text-5xl"
          }
        >
          {message.book} {message.chapter}
        </h1>
      </header>
      <div
        className={
          isPreview
            ? "overflow-y-auto pr-1"
            : "mx-auto w-full max-w-4xl flex-1 overflow-y-auto"
        }
      >
        <div className={isPreview ? "space-y-2" : "space-y-5 pb-16"}>
          {message.verses.map((v) => (
            <p
              key={v.verse}
              className={
                isPreview
                  ? "font-serif text-sm leading-relaxed text-zinc-200"
                  : "font-serif text-2xl leading-relaxed text-zinc-100 md:text-3xl"
              }
            >
              <sup
                className={
                  isPreview
                    ? "mr-1 text-[10px] font-sans font-semibold text-amber-300/90"
                    : "mr-2 align-super text-sm font-sans font-semibold text-amber-300 md:text-base"
                }
              >
                {v.verse}
              </sup>
              {v.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
