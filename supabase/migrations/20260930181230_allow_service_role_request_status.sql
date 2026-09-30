create or replace function public.enforce_service_request_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if auth.role() = 'service_role' then
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

  raise exception 'Invalid service request status transition';
end;
$$;
