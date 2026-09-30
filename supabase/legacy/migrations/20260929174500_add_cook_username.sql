alter table public.cook_profiles
add column username text;

alter table public.cook_profiles
add constraint cook_profiles_username_format
check (
  username is null
  or username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'
);

create unique index cook_profiles_username_unique
on public.cook_profiles (lower(username))
where username is not null;

grant insert (username)
on public.cook_profiles
to authenticated;

grant update (username)
on public.cook_profiles
to authenticated;