-- Learn: real cover art URLs (Open Library / manual)

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS cover_url text;
