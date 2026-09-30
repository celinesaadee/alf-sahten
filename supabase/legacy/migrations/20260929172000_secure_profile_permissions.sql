-- Users may edit normal profile fields,
-- but account roles and system fields must not be editable from the client.

revoke update on table public.profiles
from authenticated;

grant update (
  full_name,
  avatar_url,
  preferred_language
)
on table public.profiles
to authenticated;

revoke truncate, trigger, references
on table public.profiles
from anon, authenticated;