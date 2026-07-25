-- Bible bookmarks, highlights, reading plans
create table if not exists public.bible_bookmarks (
  id           uuid        primary key default gen_random_uuid(),
  book_id      text        not null,
  chapter      integer     not null,
  verse        integer     not null,
  translation  text        not null default 'kjv',
  note         text,
  created_at   timestamptz not null default now()
);

create table if not exists public.bible_highlights (
  id           uuid        primary key default gen_random_uuid(),
  book_id      text        not null,
  chapter      integer     not null,
  verse_start  integer     not null,
  verse_end    integer     not null,
  color        text        not null default '#F6D860',
  note         text,
  translation  text        not null default 'kjv',
  created_at   timestamptz not null default now()
);

create table if not exists public.bible_reading_plans (
  id              uuid        primary key default gen_random_uuid(),
  plan_id         text        not null,
  start_date      date        not null default current_date,
  current_day     integer     not null default 1,
  completed_days  jsonb       not null default '[]'::jsonb,
  status          text        not null default 'active',
  created_at      timestamptz not null default now()
);

-- Reading goals
create table if not exists public.library_reading_goals (
  id            uuid        primary key default gen_random_uuid(),
  goal_type     text        not null,
  target_value  integer     not null,
  period        text        not null default 'daily',
  created_at    timestamptz not null default now()
);

-- Custom collections
create table if not exists public.library_collections (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  description   text,
  cover_color   text        not null default '#6366f1',
  book_ids      jsonb       not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

-- Book ratings and reviews
alter table public.library_books
  add column if not exists rating integer check (rating >= 1 and rating <= 5),
  add column if not exists review text;

alter table public.bible_bookmarks enable row level security;
alter table public.bible_highlights enable row level security;
alter table public.bible_reading_plans enable row level security;
alter table public.library_reading_goals enable row level security;
alter table public.library_collections enable row level security;

create policy "allow all" on public.bible_bookmarks for all using (true) with check (true);
create policy "allow all" on public.bible_highlights for all using (true) with check (true);
create policy "allow all" on public.bible_reading_plans for all using (true) with check (true);
create policy "allow all" on public.library_reading_goals for all using (true) with check (true);
create policy "allow all" on public.library_collections for all using (true) with check (true);
