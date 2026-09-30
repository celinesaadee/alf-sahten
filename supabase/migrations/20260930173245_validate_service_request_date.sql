create or replace function public.validate_service_request_date()
returns trigger
language plpgsql
as $$
begin
  if new.requested_date < current_date then
    raise exception 'Requested date cannot be in the past.';
  end if;

  return new;
end;
$$;

drop trigger if exists service_requests_validate_date
on public.service_requests;

create trigger service_requests_validate_date
before insert or update of requested_date
on public.service_requests
for each row
execute function public.validate_service_request_date();
