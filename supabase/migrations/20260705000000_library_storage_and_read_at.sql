-- Learn: reading metadata + PDF storage bucket

ALTER TABLE public.library_books
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library-pdfs',
  'library-pdfs',
  true,
  52428800,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "library pdfs public read" ON storage.objects;
CREATE POLICY "library pdfs public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'library-pdfs');

DROP POLICY IF EXISTS "library pdfs insert" ON storage.objects;
CREATE POLICY "library pdfs insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'library-pdfs');

DROP POLICY IF EXISTS "library pdfs update" ON storage.objects;
CREATE POLICY "library pdfs update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'library-pdfs');

DROP POLICY IF EXISTS "library pdfs delete" ON storage.objects;
CREATE POLICY "library pdfs delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'library-pdfs');
