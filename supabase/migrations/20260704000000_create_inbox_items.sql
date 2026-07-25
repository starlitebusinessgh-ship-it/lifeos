-- Inbox: universal capture — thoughts, ideas, notes, prayers, etc.
CREATE TABLE IF NOT EXISTS public.lifeos_inbox_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  capture_type TEXT NOT NULL DEFAULT 'note',
  life_area TEXT NOT NULL DEFAULT 'General',
  title TEXT,
  content TEXT NOT NULL,
  raw_content TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lifeos_inbox_items_created_at_idx
  ON public.lifeos_inbox_items (created_at DESC);

CREATE INDEX IF NOT EXISTS lifeos_inbox_items_status_idx
  ON public.lifeos_inbox_items (status);

ALTER TABLE public.lifeos_inbox_items DISABLE ROW LEVEL SECURITY;
