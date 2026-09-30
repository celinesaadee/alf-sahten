create table public.service_requests (
  id uuid primary key default gen_random_uuid(),

  customer_id uuid not null
    references auth.users(id)
    on delete cascade,

  cook_id uuid not null
    references public.cook_profiles(user_id)
    on delete restrict,

  service_id uuid not null
    references public.cook_services(id)
    on delete restrict,

  service_title text not null
    check (
      char_length(btrim(service_title)) >= 1
      and char_length(btrim(service_title)) <= 100
    ),

  customer_name text not null
    check (
      char_length(btrim(customer_name)) >= 1
      and char_length(btrim(customer_name)) <= 120
    ),

  customer_email text not null
    check (
      char_length(btrim(customer_email)) >= 3
      and char_length(btrim(customer_email)) <= 254
    ),

  customer_phone text
    check (
      customer_phone is null
      or char_length(btrim(customer_phone)) <= 40
    ),

  requested_date date not null,

  location text not null
    check (
      char_length(btrim(location)) >= 1
      and char_length(btrim(location)) <= 250
    ),

  budget numeric(12, 2),

  budget_currency text,

  message text not null default ''
    check (
      char_length(message) <= 1500
    ),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'accepted',
        'declined',
        'completed',
        'cancelled'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint service_requests_budget_check
    check (
      (
        budget is null
        and budget_currency is null
      )
      or
      (
        budget is not null
        and budget >= 0
        and budget_currency ~ '^[A-Z]{3}$'
      )
    )
);

create index service_requests_customer_id_idx
  on public.service_requests(customer_id);

create index service_requests_cook_id_idx
  on public.service_requests(cook_id);

create index service_requests_service_id_idx
  on public.service_requests(service_id);

create index service_requests_status_idx
  on public.service_requests(status);

create index service_requests_created_at_idx
  on public.service_requests(created_at desc);


/*
 * Automatically fill ownership and service snapshot fields.
 * The customer cannot choose another customer_id or fake
 * which cook owns the selected service.
 */
create or replace function public.prepare_service_request()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  selected_service public.cook_services%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into selected_service
  from public.cook_services
  where id = new.service_id
    and status = 'available';

  if not found then
    raise exception 'This service is not available for requests';
  end if;

  new.customer_id := auth.uid();
new.cook_id := selected_service.cook_id;
new.service_title := selected_service.title;

/*
 * New requests must always begin as pending.
 * Customers cannot create an already accepted,
 * declined, completed or cancelled request.
 */
new.status := 'pending';

/*
 * Prevent callers from supplying fake timestamps.
 */
new.created_at := now();
new.updated_at := now();

return new;
end;
$$;

create trigger service_requests_prepare
before insert on public.service_requests
for each row
execute function public.prepare_service_request();


create trigger service_requests_set_updated_at
before update on public.service_requests
for each row
execute function public.set_updated_at();


alter table public.service_requests
enable row level security;


/*
 * Customers can see only requests they created.
 * Cooks can see only requests sent to them.
 */
create policy "Customers and cooks view own service requests"
on public.service_requests
for select
to authenticated
using (
  customer_id = (select auth.uid())
  or cook_id = (select auth.uid())
);


/*
 * Any signed-in customer can create a request only for
 * an available service belonging to an approved cook.
 */
create policy "Customers create service requests"
on public.service_requests
for insert
to authenticated
with check (
  customer_id = (select auth.uid())
  and exists (
    select 1
    from public.cook_services cs
    join public.cook_profiles cp
      on cp.user_id = cs.cook_id
    where cs.id = service_requests.service_id
      and cs.cook_id = service_requests.cook_id
      and cs.status = 'available'
      and cp.is_approved = true
  )
);


/*
 * Step 3 intentionally has no UPDATE or DELETE policy.
 *
 * Cook accept/decline/complete permissions come in Step 5.
 * Customer cancellation permissions come in Step 6.
 */
revoke all
on public.service_requests
from anon, authenticated;

grant select, insert
on public.service_requests
to authenticated;