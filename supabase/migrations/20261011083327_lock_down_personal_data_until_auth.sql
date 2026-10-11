alter table public.entries enable row level security;
alter table public.finance_budget enable row level security;
alter table public.finance_debts enable row level security;
alter table public.finance_entries enable row level security;
alter table public.finance_settings enable row level security;
alter table public.lifeos_alarms enable row level security;
alter table public.lifeos_habit_completions enable row level security;
alter table public.lifeos_habits enable row level security;
alter table public.lifeos_inbox_items enable row level security;
alter table public.lifeos_today_tasks enable row level security;
alter table public.lifeos_vitality_days enable row level security;
alter table public.principles enable row level security;

drop policy if exists "allow all" on public.bible_bookmarks;
drop policy if exists "allow all" on public.bible_highlights;
drop policy if exists "allow all" on public.bible_reading_plans;
drop policy if exists "allow all" on public.library_books;
drop policy if exists "allow all" on public.library_collections;
drop policy if exists "allow all" on public.library_highlights;
drop policy if exists "allow all" on public.library_knowledge_links;
drop policy if exists "allow all" on public.library_reading_goals;
drop policy if exists "allow all" on public.library_reading_log;

drop policy if exists "allow all" on storage.objects;
drop policy if exists "library pdfs delete" on storage.objects;
drop policy if exists "library pdfs insert" on storage.objects;
drop policy if exists "library pdfs public read" on storage.objects;
drop policy if exists "library pdfs update" on storage.objects;

update storage.buckets set public = false where id = 'library-pdfs';
