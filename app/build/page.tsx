"use client";

import Link from "next/link";
import { Hammer, GitBranch } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/lifeos/AppShell";
import { haptic } from "@/lib/finance/haptics";
import "@/app/os/os.css";

interface BuildSeed {
  id: string;
  idea_title: string | null;
  created_at: string;
  highlight: { quote: string; book_id: string } | null;
}

export default function BuildPage() {
  const [seeds, setSeeds] = useState<BuildSeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("library_knowledge_links")
        .select("id, idea_title, created_at, library_highlights(quote, book_id)")
        .eq("link_type", "build")
        .order("created_at", { ascending: false });
      setSeeds(
        (data ?? []).map((row) => {
          const raw = row.library_highlights;
          const hl = (Array.isArray(raw) ? raw[0] : raw) as
            | { quote: string; book_id: string }
            | null
            | undefined;
          return {
            id: row.id as string,
            idea_title: row.idea_title as string | null,
            created_at: row.created_at as string,
            highlight: hl ?? null,
          };
        })
      );
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <AppShell tone="module" title="Build">
      <div className="ln-in-shell">
        <div className="ln-shell">
          <header className="ln-masthead ln-masthead--compact">
            <p className="ln-masthead-kicker">LifeOS</p>
            <h1 className="ln-masthead-title">Build</h1>
            <p className="ln-masthead-sub">Projects seeded from what you learn</p>
          </header>

          {loading ? (
            <p className="ln-mind-loading">Loading…</p>
          ) : seeds.length === 0 ? (
            <div className="ln-mind-empty">
              <Hammer size={32} strokeWidth={1.4} className="ln-mind-empty-icon" />
              <h2>No build seeds yet</h2>
              <p>
                While reading, pin a highlight as a Build project from the Mind map or highlight
                actions. Full Build module coming soon.
              </p>
              <Link href="/learn/mind" className="ln-mind-empty-btn" onClick={() => haptic("light")}>
                <GitBranch size={16} />
                Open mind map
              </Link>
            </div>
          ) : (
            <ul className="ln-build-seeds">
              {seeds.map((seed) => (
                <li key={seed.id} className="ln-build-seed">
                  <Hammer size={16} strokeWidth={1.75} />
                  <div>
                    <strong>{seed.idea_title ?? "Untitled project"}</strong>
                    {seed.highlight && (
                      <p className="ln-build-seed-quote">&ldquo;{seed.highlight.quote}&rdquo;</p>
                    )}
                    {seed.highlight && (
                      <Link
                        href={`/learn/${seed.highlight.book_id}`}
                        className="ln-build-seed-link"
                        onClick={() => haptic("light")}
                      >
                        View source book
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
