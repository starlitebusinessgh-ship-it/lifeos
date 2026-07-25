-- Learn Phase 5: knowledge graph links (highlight → inbox / task / idea / build)

CREATE TABLE IF NOT EXISTS public.library_knowledge_links (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id uuid        NOT NULL REFERENCES public.library_highlights(id) ON DELETE CASCADE,
  link_type    text        NOT NULL CHECK (link_type IN ('inbox', 'task', 'idea', 'build')),
  target_id    text,
  idea_title   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_knowledge_links_highlight_idx
  ON public.library_knowledge_links (highlight_id);

ALTER TABLE public.library_knowledge_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all" ON public.library_knowledge_links;
CREATE POLICY "allow all" ON public.library_knowledge_links
  FOR ALL USING (true) WITH CHECK (true);
