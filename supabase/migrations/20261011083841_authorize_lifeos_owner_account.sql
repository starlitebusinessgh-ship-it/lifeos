do $$
declare t text;
begin
  foreach t in array array[
    'entries','finance_budget','finance_debts','finance_entries','finance_settings',
    'lifeos_alarms','lifeos_habit_completions','lifeos_habits','lifeos_inbox_items',
    'lifeos_today_tasks','lifeos_vitality_days','principles',
    'bible_bookmarks','bible_highlights','bible_reading_plans',
    'library_books','library_collections','library_highlights',
    'library_knowledge_links','library_reading_goals','library_reading_log'
  ] loop
    execute format(
      'create policy "lifeos owner access" on public.%I for all to authenticated using ((select auth.jwt() ->> ''email'') = ''starlitebusinessgh@gmail.com'') with check ((select auth.jwt() ->> ''email'') = ''starlitebusinessgh@gmail.com'')',
      t
    );
  end loop;
end $$;

create policy "lifeos owner storage access" on storage.objects
for all to authenticated
using (
  bucket_id in ('library','library-pdfs')
  and (select auth.jwt() ->> 'email') = 'starlitebusinessgh@gmail.com'
)
with check (
  bucket_id in ('library','library-pdfs')
  and (select auth.jwt() ->> 'email') = 'starlitebusinessgh@gmail.com'
);
