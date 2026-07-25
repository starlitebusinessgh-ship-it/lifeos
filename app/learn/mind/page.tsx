"use client";

import { KnowledgeGraph } from "@/components/learn/KnowledgeGraph";
import { useKnowledgeGraph } from "@/lib/learn/useKnowledgeGraph";

export default function LearnMindPage() {
  const { clusters, stats, loading } = useKnowledgeGraph();

  return (
    <div className="ln-in-shell">
      <div className="ln-shell ln-shell-mind">
        <header className="ln-rn-page-head ln-rn-page-head--library">
          <h1 className="ln-rn-page-title">Mind Map</h1>
        </header>
        <p className="ln-page-lead">Books → ideas → actions across your life</p>
        {loading ? (
          <div className="ln-mind-loading">Mapping your knowledge…</div>
        ) : (
          <KnowledgeGraph clusters={clusters} stats={stats} />
        )}
      </div>
    </div>
  );
}
