alter table public.cook_follows
enable row level security;

drop policy if exists "Users can follow approved cooks"
on public.cook_follows;

create policy "Users can follow approved cooks"
on public.cook_follows
for insert
to authenticated
with check (
  follower_id = auth.uid()
  and follower_id <> cook_id
  and exists (
    select 1
    from public.cook_profiles
    where cook_profiles.user_id = cook_follows.cook_id
      and cook_profiles.is_approved = true
  )
);

drop policy if exists "Users can unfollow cooks"
on public.cook_follows;

create policy "Users can unfollow cooks"
on public.cook_follows
for delete
to authenticated
using (
  follower_id = auth.uid()
);

drop policy if exists "Users can view own follows"
on public.cook_follows;

create policy "Users can view own follows"
on public.cook_follows
for select
to authenticated
using (
  follower_id = auth.uid()
);

grant select, insert, delete
on table public.cook_follows
to authenticated;