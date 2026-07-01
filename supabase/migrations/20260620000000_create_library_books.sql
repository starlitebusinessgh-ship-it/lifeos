-- Library: books table
create table if not exists public.library_books (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  author       text,
  file_path    text        not null,
  file_name    text        not null,
  total_pages  integer,
  current_page integer     not null default 0,
  cover_color  text        not null default '#5b6ee8',
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists library_books_updated_at on public.library_books;
create trigger library_books_updated_at
  before update on public.library_books
  for each row execute function update_updated_at_column();
