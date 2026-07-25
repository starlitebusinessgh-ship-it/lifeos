"use client";

import { VerseDisplay } from "@/components/VerseDisplay";
import { useDisplaySocket } from "@/hooks/useDisplaySocket";

export default function DisplayPage() {
  const { message } = useDisplaySocket();

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950">
      <VerseDisplay message={message} variant="projector" />
    </main>
  );
}
