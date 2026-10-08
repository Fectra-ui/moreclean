-- Atomic, idempotent quote creation. Apply separately from migration history.
begin;

-- Fail before any schema change if legacy numbers cannot seed an unambiguous counter.
do $$
begin
  if exists (select 1 from public.quotes where company_id is null
    or quote_number !~ '^MC-OFF-[0-9]{4}-[0-9]{4}$'
    or split_part(quote_number, '-', 3)::integer = 0
    or split_part(quote_number, '-', 4)::integer = 0)
    or exists (
      select 1 from public.quotes group by company_id, quote_number having count(*) > 1
    ) then
    raise exception 'Existing quote numbers require manual review before migration 032';
  end if;
end;
$$;

create table public.quote_create_intents (
  quote_id uuid primary key,
  actor_id uuid not null references public.profiles(id),
  company_id uuid not null references public.companies(id),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create table public.quote_number_counters (
  company_id uuid not null references public.companies(id),
  year integer not null check (year between 1 and 9999),
  last_number integer not null check (last_number between 1 and 9999),
  primary key (company_id, year)
);

insert into public.quote_number_counters (company_id, year, last_number)
select company_id, split_part(quote_number, '-', 3)::integer,
  max(split_part(quote_number, '-', 4)::integer)
from public.quotes
group by company_id, split_part(quote_number, '-', 3)::integer;

alter table public.quote_create_intents enable row level security;
alter table public.quote_number_counters enable row level security;
revoke all on public.quote_create_intents, public.quote_number_counters from public, anon, authenticated, service_role;
alter table public.quote_create_intents owner to postgres;
alter table public.quote_number_counters owner to postgres;

-- Legacy rows are checked above. New rows are company-bound by the RPC.
alter table public.quotes add constraint quotes_company_quote_number_key unique (company_id, quote_number);

-- Existing read/update permissions and quote_items update functionality stay intact.
revoke insert on public.quotes from public, anon, authenticated;

create function public.create_quote_atomic(
  p_quote_id uuid, p_actor_id uuid, p_intent jsonb, p_request_hash text
) returns table (id uuid, quote_number text)
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles%rowtype;
  v_existing public.quote_create_intents%rowtype;
  v_new_id uuid;
  v_number integer;
  v_year integer;
  v_created_at timestamptz := pg_catalog.now();
  v_item jsonb;
  v_service_id uuid;
begin
  if p_quote_id is null or p_actor_id is null or p_intent is null
    or p_request_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid quote create request';
  end if;

  select * into v_profile from public.profiles p where p.id = p_actor_id;
  if not found or v_profile.role <> 'admin' or v_profile.active is not true
    or v_profile.company_id is null then
    raise exception 'Quote create is not authorized';
  end if;
  if p_intent->>'version' <> 'quote-create:v1'
    or (p_intent->>'quote_id')::uuid is distinct from p_quote_id
    or (p_intent->>'actor_id')::uuid is distinct from p_actor_id
    or (p_intent->>'company_id')::uuid is distinct from v_profile.company_id
    or pg_catalog.jsonb_typeof(p_intent->'items') <> 'array' then
    raise exception 'Invalid quote create request';
  end if;

  insert into public.quote_create_intents (quote_id, actor_id, company_id, request_hash)
  values (p_quote_id, p_actor_id, v_profile.company_id, p_request_hash)
  on conflict (quote_id) do nothing returning quote_id into v_new_id;

  if v_new_id is null then
    select * into v_existing from public.quote_create_intents ci
    where ci.quote_id = p_quote_id for update;
    if v_existing.actor_id is distinct from p_actor_id
      or v_existing.company_id is distinct from v_profile.company_id
      or v_existing.request_hash is distinct from p_request_hash then
      raise exception 'Quote create conflict';
    end if;
    return query select q.id, q.quote_number from public.quotes q
      where q.id = p_quote_id and q.company_id = v_profile.company_id
        and q.created_by = p_actor_id;
    if not found then raise exception 'Quote create intent has no quote'; end if;
    return;
  end if;

  if not exists (select 1 from public.clients c
    where c.id = (p_intent->>'client_id')::uuid
      and c.company_id = v_profile.company_id) then
    raise exception 'Client is not available for quote';
  end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_intent->'items') loop
    if v_item->>'description' is null or v_item->>'description' = '' then
      raise exception 'Invalid quote item';
    end if;
    v_service_id := (v_item->>'service_id')::uuid;
    if v_service_id is not null and not exists (
      select 1 from public.services s where s.id = v_service_id and s.active
        and (s.company_id = v_profile.company_id or s.company_id is null)
    ) then
      raise exception 'Service is not available for quote';
    end if;
  end loop;

  v_year := extract(year from v_created_at)::integer;
  insert into public.quote_number_counters as c (company_id, year, last_number)
  values (v_profile.company_id, v_year, 1)
  on conflict (company_id, year) do update set last_number = c.last_number + 1
  returning last_number into v_number;

  insert into public.quotes (
    id, company_id, client_id, quote_number, status, subject, intro_text, notes,
    internal_notes, valid_until, discount_pct, subtotal, vat_amount, total,
    created_by, created_at
  ) values (
    p_quote_id, v_profile.company_id, (p_intent->>'client_id')::uuid,
    'MC-OFF-' || v_year::text || '-' || pg_catalog.lpad(v_number::text, 4, '0'),
    'draft', p_intent->>'subject', p_intent->>'intro_text', p_intent->>'notes',
    p_intent->>'internal_notes', (p_intent->>'valid_until')::date,
    (p_intent->>'discount_pct')::numeric, (p_intent->>'subtotal')::numeric,
    (p_intent->>'vat_amount')::numeric, (p_intent->>'total')::numeric,
    p_actor_id, v_created_at
  );

  insert into public.quote_items (
    quote_id, service_id, description, quantity, unit_price, total_price, sort_order
  )
  select p_quote_id, (item.value->>'service_id')::uuid,
    item.value->>'description', (item.value->>'quantity')::numeric,
    (item.value->>'unit_price')::numeric, (item.value->>'total_price')::numeric,
    (item.value->>'sort_order')::integer
  from pg_catalog.jsonb_array_elements(p_intent->'items') as item(value);

  return query select q.id, q.quote_number from public.quotes q where q.id = p_quote_id;
end;
$$;

alter function public.create_quote_atomic(uuid, uuid, jsonb, text) owner to postgres;
revoke all on function public.create_quote_atomic(uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_quote_atomic(uuid, uuid, jsonb, text) to service_role;

commit;
