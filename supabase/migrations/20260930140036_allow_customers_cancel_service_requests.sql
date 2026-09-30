create or replace function public.enforce_service_request_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if auth.uid() = old.cook_id then
    if old.status = 'pending'
       and new.status in ('accepted', 'declined') then
      return new;
    end if;

    if old.status = 'accepted'
       and new.status = 'completed' then
      return new;
    end if;
  end if;

  if auth.uid() = old.customer_id then
    if old.status in ('pending', 'accepted')
       and new.status = 'cancelled' then
      return new;
    end if;
  end if;

  raise exception
    'Invalid service request status transition';
end;
$$;

drop trigger if exists
  service_requests_enforce_status_transition
on public.service_requests;

create trigger
  service_requests_enforce_status_transition
before update of status
on public.service_requests
for each row
execute function
  public.enforce_service_request_status_transition();

drop policy if exists
  "Customers cancel own service requests"
on public.service_requests;

create policy
  "Customers cancel own service requests"
on public.service_requests
for update
to authenticated
using (
  customer_id = (select auth.uid())
)
with check (
  customer_id = (select auth.uid())
  and status = 'cancelled'
);