-- Applied via hosted migration personal_recipe_entries, version 20261005182206.
-- Source backup; CLI generation was unavailable in the restricted environment.
create table public.personal_recipe_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  notes text not null default '' check (char_length(notes) <= 5000),
  is_cooked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
create index personal_recipe_entries_recipe_idx on public.personal_recipe_entries(recipe_id);
alter table public.personal_recipe_entries enable row level security;
revoke all on public.personal_recipe_entries from public, anon, authenticated;
grant select on public.personal_recipe_entries to authenticated;
grant insert(user_id, recipe_id, notes, is_cooked), update(notes, is_cooked), delete
on public.personal_recipe_entries to authenticated;
grant all on public.personal_recipe_entries to service_role;
create policy "Read own personal recipe entries" on public.personal_recipe_entries
for select to authenticated using (user_id = (select auth.uid()));
create policy "Create own personal recipe entries" on public.personal_recipe_entries
for insert to authenticated with check (
  user_id = (select auth.uid()) and exists (
    select 1 from public.recipes r where r.id = recipe_id and r.status = 'approved'
  )
);
create policy "Update own personal recipe entries" on public.personal_recipe_entries
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "Delete own personal recipe entries" on public.personal_recipe_entries
for delete to authenticated using (user_id = (select auth.uid()));
create trigger personal_recipe_entries_updated_at before update on public.personal_recipe_entries
for each row execute function public.set_updated_at();

-- Merge only the field being saved. Marking cooked must never replace notes.
create function public.save_personal_recipe_entry(p_recipe_id uuid,
  p_is_cooked boolean default null, p_notes text default null)
returns setof public.personal_recipe_entries
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  return query
    insert into public.personal_recipe_entries(user_id, recipe_id, notes, is_cooked)
    values(auth.uid(), p_recipe_id, coalesce(p_notes, ''), coalesce(p_is_cooked, false))
    on conflict (user_id, recipe_id) do update set
      notes = coalesce(p_notes, personal_recipe_entries.notes),
      is_cooked = coalesce(p_is_cooked, personal_recipe_entries.is_cooked)
    returning *;
end;
$$;
revoke all on function public.save_personal_recipe_entry(uuid, boolean, text) from public, anon;
grant execute on function public.save_personal_recipe_entry(uuid, boolean, text) to authenticated;
