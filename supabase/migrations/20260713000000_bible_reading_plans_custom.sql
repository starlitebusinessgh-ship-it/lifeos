alter table public.bible_reading_plans
  add column if not exists title text,
  add column if not exists config jsonb,
  add column if not exists schedule jsonb;
