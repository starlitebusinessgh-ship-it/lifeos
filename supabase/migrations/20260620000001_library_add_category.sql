alter table public.library_books
  add column if not exists category text not null default 'Other';
