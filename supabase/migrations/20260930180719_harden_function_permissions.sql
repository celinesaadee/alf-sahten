revoke execute
on function public.rls_auto_enable()
from public, anon, authenticated;

revoke execute
on function public.update_cook_follower_count()
from public, anon, authenticated;

alter function public.validate_service_request_date()
set search_path = pg_catalog;
