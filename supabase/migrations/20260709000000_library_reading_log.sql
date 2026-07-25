-- Learn Phase 4: reading log for analytics (pages per week, streaks)

CREATE TABLE IF NOT EXISTS public.library_reading_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     uuid        NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  pages_delta integer     NOT NULL CHECK (pages_delta > 0),
  page_end    integer,
  logged_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS library_reading_log_logged_at_idx
  ON public.library_reading_log (logged_at DESC);

ALTER TABLE public.library_reading_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow all" ON public.library_reading_log;
CREATE POLICY "allow all" ON public.library_reading_log
  FOR ALL USING (true) WITH CHECK (true);
