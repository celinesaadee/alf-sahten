-- Preserve translations already live at migration time as legacy approvals.
-- reviewed_at/by remain NULL, distinguishing them from human-reviewed versions.
alter table public.recipe_translations
  add column review_status text not null default 'pending'
    check (review_status in ('pending', 'approved')),
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references auth.users(id) on delete set null;

update public.recipe_translations t set review_status = 'approved'
where exists (select 1 from public.recipes r where r.id = t.recipe_id and r.status = 'approved');

drop policy "Anyone can view translations of approved recipes" on public.recipe_translations;
create policy "Anyone can view translations of approved recipes"
on public.recipe_translations for select to anon, authenticated
using (review_status = 'approved' and exists (
  select 1 from public.recipes r where r.id = recipe_id and r.status = 'approved'
    and r.updated_at = source_updated_at
));

grant update (title, description, ingredients, instructions, review_status)
on public.recipe_translations to authenticated;

create policy "Cooks and admins can review translations"
on public.recipe_translations for update to authenticated
using (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.status = 'approved' and r.creator_id = (select auth.uid()))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
)
with check (
  exists (select 1 from public.recipes r where r.id = recipe_id and r.status = 'approved' and r.creator_id = (select auth.uid()))
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create function public.stamp_translation_review() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  -- Service-generated content always requires a new review, including retries.
  if current_user = 'service_role' then
    new.review_status := 'pending';
  end if;
  if new.review_status = 'approved' then
    if not exists (select 1 from public.recipes r where r.id = new.recipe_id
      and r.status = 'approved' and r.updated_at = new.source_updated_at) then
      raise exception 'Source recipe changed. Regenerate translations before approval.';
    end if;
    if trim(new.title) = '' or jsonb_typeof(new.ingredients) <> 'array'
      or jsonb_typeof(new.instructions) <> 'array' then
      raise exception 'Invalid translation content';
    end if;
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  else
    new.reviewed_at := null;
    new.reviewed_by := null;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.stamp_translation_review() from public, anon, authenticated;
create trigger stamp_translation_review before insert or update on public.recipe_translations
for each row execute function public.stamp_translation_review();
