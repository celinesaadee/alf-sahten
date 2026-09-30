grant update (status)
on table public.service_requests
to authenticated;

drop policy if exists
  "Cooks update own service request status"
on public.service_requests;

create policy
  "Cooks update own service request status"
on public.service_requests
for update
to authenticated
using (
  cook_id = (select auth.uid())
)
with check (
  cook_id = (select auth.uid())
  and status in (
    'accepted',
    'declined',
    'completed'
  )
);