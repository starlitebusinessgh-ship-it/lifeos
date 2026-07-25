-- Learn Phase 3: tags, series, optional metadata (Calibre / Notion)

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS series text;

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS series_index integer;

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS publisher text;

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS published_year integer;
