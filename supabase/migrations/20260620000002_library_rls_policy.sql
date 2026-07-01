-- Allow all operations on library_books (single-user app, no auth)
alter table public.library_books enable row level security;

drop policy if exists "allow all" on public.library_books;
create policy "allow all"
  on public.library_books
  for all
  using (true)
  with check (true);
