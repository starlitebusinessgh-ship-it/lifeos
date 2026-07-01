create table if not exists public.library_highlights (
  id         uuid        primary key default gen_random_uuid(),
  book_id    uuid        not null references public.library_books(id) on delete cascade,
  quote      text        not null,
  note       text,
  page       integer,
  color      text        not null default '#F6D860',
  created_at timestamptz not null default now()
);

alter table public.library_highlights enable row level security;
create policy "allow all" on public.library_highlights for all using (true) with check (true);
