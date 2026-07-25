-- Learn Phase 1: explicit reading states (Goodreads / Kindle)

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS reading_state text NOT NULL DEFAULT 'want_to_read';

ALTER TABLE public.library_books
  DROP CONSTRAINT IF EXISTS library_books_reading_state_check;

ALTER TABLE public.library_books
  ADD CONSTRAINT library_books_reading_state_check
  CHECK (reading_state IN ('want_to_read', 'reading', 'finished', 'paused'));

-- Backfill from existing progress
UPDATE public.library_books
SET reading_state = 'finished'
WHERE total_pages IS NOT NULL
  AND total_pages > 0
  AND current_page >= total_pages;

UPDATE public.library_books
SET reading_state = 'reading'
WHERE reading_state = 'want_to_read'
  AND current_page > 0
  AND (total_pages IS NULL OR current_page < total_pages);
