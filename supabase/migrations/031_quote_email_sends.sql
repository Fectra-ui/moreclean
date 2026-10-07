-- One durable send claim per quote. Applied separately from migration history.
create table public.quote_email_sends (
  quote_id uuid primary key references public.quotes(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  recipient_email text not null check (recipient_email = lower(btrim(recipient_email)) and recipient_email <> ''),
  idempotency_key text not null unique,
  request_body text not null check (length(request_body) > 0),
  source_snapshot jsonb not null,
  state text not null default 'reserved' check (state in ('reserved','sending','rejected','uncertain','accepted','complete')),
  provider_email_id text unique check (
    provider_email_id is null or provider_email_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ),
  reserved_at timestamptz not null default now(),
  started_at timestamptz,
  last_attempt_at timestamptz,
  accepted_at timestamptz,
  completed_at timestamptz,
  check (state not in ('accepted','complete') or (provider_email_id is not null and accepted_at is not null)),
  check (state <> 'complete' or completed_at is not null),
  check (started_at is not null or last_attempt_at is null)
);

alter table public.quote_email_sends enable row level security;
revoke all on public.quote_email_sends from public, anon, authenticated;
revoke all on public.quote_email_sends from service_role;
grant select on public.quote_email_sends to service_role;
alter table public.quote_email_sends owner to postgres;

-- The route obtains the actor from auth.getUser; this function rechecks it before creating a privileged claim.
create function public.reserve_quote_email_send(
  p_quote_id uuid, p_actor_id uuid, p_request_body text
) returns public.quote_email_sends
language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes%rowtype;
  v_client public.clients%rowtype;
  v_claim public.quote_email_sends%rowtype;
  v_email text;
  v_snapshot jsonb;
begin
  select * into v_quote from public.quotes where id = p_quote_id for update;
  if not found or v_quote.company_id is null then raise exception 'Quote unavailable'; end if;
  if not exists (select 1 from public.profiles where id = p_actor_id and role = 'admin' and active and company_id = v_quote.company_id) then
    raise exception 'Forbidden';
  end if;
  select * into v_client from public.clients where id = v_quote.client_id and company_id = v_quote.company_id;
  if not found then raise exception 'Client unavailable'; end if;
  select * into v_claim from public.quote_email_sends where quote_id = p_quote_id;
  if found then return v_claim; end if;
  if v_quote.workflow_state <> 'concept' or v_quote.status <> 'draft' or v_quote.sent_at is not null then
    raise exception 'Quote is not a draft';
  end if;
  v_email := lower(btrim(v_client.email));
  if v_email is null or v_email = '' then raise exception 'Recipient unavailable'; end if;
  if p_request_body is null or (p_request_body::jsonb->>'to') is distinct from v_email then
    raise exception 'Invalid request';
  end if;
  v_snapshot := pg_catalog.jsonb_build_object(
    'quote_number', v_quote.quote_number, 'total', v_quote.total,
    'subject', v_quote.subject, 'intro_text', v_quote.intro_text,
    'notes', v_quote.notes, 'valid_until', v_quote.valid_until,
    'subtotal', v_quote.subtotal, 'discount_pct', v_quote.discount_pct,
    'vat_amount', v_quote.vat_amount, 'client_id', v_quote.client_id,
    'client_name', v_client.contact_name, 'recipient_email', v_email,
    'items', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id', i.id, 'description', i.description,
        'quantity', i.quantity, 'unit_price', i.unit_price,
        'total_price', i.total_price, 'sort_order', i.sort_order)
      order by i.sort_order, i.id)
      from public.quote_items i where i.quote_id = p_quote_id), '[]'::jsonb)
  );
  insert into public.quote_email_sends
    (quote_id, company_id, recipient_email, idempotency_key, request_body, source_snapshot)
  values
    (p_quote_id, v_quote.company_id, v_email, 'quote-send/' || p_quote_id::text, p_request_body, v_snapshot)
  returning * into v_claim;
  return v_claim;
end;
$$;

-- A short DB lease prevents parallel providers; started_at always remains the first attempt time.
create function public.claim_quote_email_send(p_quote_id uuid)
returns public.quote_email_sends
language plpgsql security definer set search_path = '' as $$
declare
  v_claim public.quote_email_sends%rowtype;
  v_quote public.quotes%rowtype;
  v_client public.clients%rowtype;
  v_snapshot jsonb;
begin
  select * into v_claim from public.quote_email_sends where quote_id = p_quote_id for update;
  if not found then raise exception 'Claim unavailable'; end if;
  if v_claim.state in ('accepted','complete') then return v_claim; end if;
  if v_claim.started_at is not null and pg_catalog.now() >= v_claim.started_at + interval '23 hours' then
    raise exception 'Send outcome requires manual review';
  end if;
  if v_claim.state in ('sending','uncertain') and v_claim.last_attempt_at > pg_catalog.now() - interval '2 minutes' then
    raise exception 'Send already in progress';
  end if;
  select * into v_quote from public.quotes where id = p_quote_id and company_id = v_claim.company_id;
  if not found then raise exception 'Quote unavailable'; end if;
  select * into v_client from public.clients where id = v_quote.client_id and company_id = v_claim.company_id;
  if not found then raise exception 'Client unavailable'; end if;
  v_snapshot := pg_catalog.jsonb_build_object(
    'quote_number', v_quote.quote_number, 'total', v_quote.total,
    'subject', v_quote.subject, 'intro_text', v_quote.intro_text,
    'notes', v_quote.notes, 'valid_until', v_quote.valid_until,
    'subtotal', v_quote.subtotal, 'discount_pct', v_quote.discount_pct,
    'vat_amount', v_quote.vat_amount, 'client_id', v_quote.client_id,
    'client_name', v_client.contact_name, 'recipient_email', lower(btrim(v_client.email)),
    'items', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id', i.id, 'description', i.description,
        'quantity', i.quantity, 'unit_price', i.unit_price,
        'total_price', i.total_price, 'sort_order', i.sort_order)
      order by i.sort_order, i.id)
      from public.quote_items i where i.quote_id = p_quote_id), '[]'::jsonb)
  );
  if v_quote.workflow_state <> 'concept' or v_quote.status <> 'draft'
     or v_snapshot is distinct from v_claim.source_snapshot then
    raise exception 'Quote changed; manual review required';
  end if;
  update public.quote_email_sends set state = 'sending',
    started_at = coalesce(started_at, pg_catalog.now()), last_attempt_at = pg_catalog.now()
  where quote_id = p_quote_id returning * into v_claim;
  return v_claim;
end;
$$;

create function public.record_quote_email_outcome(
  p_quote_id uuid, p_state text, p_attempt_at timestamptz, p_provider_email_id text default null
) returns public.quote_email_sends
language plpgsql security definer set search_path = '' as $$
declare v_claim public.quote_email_sends%rowtype;
begin
  select * into v_claim from public.quote_email_sends where quote_id = p_quote_id for update;
  if not found then raise exception 'Claim unavailable'; end if;
  if v_claim.state in ('accepted','complete') then
    if p_state = 'accepted' and v_claim.provider_email_id = p_provider_email_id then return v_claim; end if;
    raise exception 'Outcome already recorded';
  end if;
  if v_claim.state not in ('sending','uncertain') or p_state not in ('rejected','uncertain','accepted') then
    raise exception 'Invalid outcome transition';
  end if;
  if v_claim.last_attempt_at is distinct from p_attempt_at then
    raise exception 'A newer send attempt owns the claim';
  end if;
  if p_state = 'accepted' and (p_provider_email_id is null or btrim(p_provider_email_id) = '') then
    raise exception 'Provider ID required';
  end if;
  if p_state <> 'accepted' and p_provider_email_id is not null then raise exception 'Invalid provider ID'; end if;
  update public.quote_email_sends set state = p_state,
    provider_email_id = case when p_state = 'accepted' then p_provider_email_id else null end,
    accepted_at = case when p_state = 'accepted' then pg_catalog.now() else null end
  where quote_id = p_quote_id returning * into v_claim;
  return v_claim;
end;
$$;

create function public.finalize_quote_email_send(p_quote_id uuid)
returns public.quote_email_sends
language plpgsql security definer set search_path = '' as $$
declare
  v_claim public.quote_email_sends%rowtype;
  v_quote public.quotes%rowtype;
  v_client public.clients%rowtype;
  v_snapshot jsonb;
  v_updated uuid;
begin
  select * into v_claim from public.quote_email_sends where quote_id = p_quote_id for update;
  if not found then raise exception 'Claim unavailable'; end if;
  if v_claim.state = 'complete' then return v_claim; end if;
  if v_claim.state <> 'accepted' or v_claim.provider_email_id is null or v_claim.accepted_at is null then
    raise exception 'Provider acceptance not proven';
  end if;
  select * into v_quote from public.quotes where id = p_quote_id and company_id = v_claim.company_id;
  if not found then raise exception 'Quote unavailable'; end if;
  select * into v_client from public.clients where id = v_quote.client_id and company_id = v_claim.company_id;
  if not found then raise exception 'Client unavailable'; end if;
  v_snapshot := pg_catalog.jsonb_build_object(
    'quote_number', v_quote.quote_number, 'total', v_quote.total,
    'subject', v_quote.subject, 'intro_text', v_quote.intro_text,
    'notes', v_quote.notes, 'valid_until', v_quote.valid_until,
    'subtotal', v_quote.subtotal, 'discount_pct', v_quote.discount_pct,
    'vat_amount', v_quote.vat_amount, 'client_id', v_quote.client_id,
    'client_name', v_client.contact_name, 'recipient_email', lower(btrim(v_client.email)),
    'items', coalesce((select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('id', i.id, 'description', i.description,
        'quantity', i.quantity, 'unit_price', i.unit_price,
        'total_price', i.total_price, 'sort_order', i.sort_order)
      order by i.sort_order, i.id)
      from public.quote_items i where i.quote_id = p_quote_id), '[]'::jsonb)
  );
  if v_snapshot is distinct from v_claim.source_snapshot then
    raise exception 'Quote changed after acceptance; manual review required';
  end if;
  update public.quotes set status = 'sent', workflow_state = 'verzonden', sent_at = v_claim.accepted_at
  where id = p_quote_id and company_id = v_claim.company_id
    and workflow_state = 'concept' and status = 'draft' and sent_at is null
  returning id into v_updated;
  if v_updated is null then raise exception 'Quote changed; no finalization'; end if;
  update public.quote_email_sends set state = 'complete', completed_at = pg_catalog.now()
  where quote_id = p_quote_id returning * into v_claim;
  return v_claim;
end;
$$;

create function public.require_quote_email_proof() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_needs_proof boolean;
begin
  if TG_OP = 'INSERT' then
    v_needs_proof := new.status = 'sent' or new.workflow_state = 'verzonden' or new.sent_at is not null;
  else
    v_needs_proof := (new.status = 'sent' and old.status is distinct from 'sent')
      or (new.workflow_state = 'verzonden' and old.workflow_state is distinct from 'verzonden')
      or (old.sent_at is null and new.sent_at is not null);
  end if;
  if v_needs_proof and not exists (
    select 1 from public.quote_email_sends
    where quote_id = new.id and company_id = new.company_id
      and state in ('accepted','complete') and provider_email_id is not null and accepted_at is not null
  ) then
    raise exception 'Quote email acceptance not proven';
  end if;
  return new;
end;
$$;

create trigger trg_require_quote_email_proof before insert or update on public.quotes
for each row execute function public.require_quote_email_proof();

alter function public.reserve_quote_email_send(uuid,uuid,text) owner to postgres;
alter function public.claim_quote_email_send(uuid) owner to postgres;
alter function public.record_quote_email_outcome(uuid,text,timestamptz,text) owner to postgres;
alter function public.finalize_quote_email_send(uuid) owner to postgres;
alter function public.require_quote_email_proof() owner to postgres;
revoke all on function public.reserve_quote_email_send(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.claim_quote_email_send(uuid) from public, anon, authenticated;
revoke all on function public.record_quote_email_outcome(uuid,text,timestamptz,text) from public, anon, authenticated;
revoke all on function public.finalize_quote_email_send(uuid) from public, anon, authenticated;
revoke all on function public.require_quote_email_proof() from public, anon, authenticated;
grant execute on function public.reserve_quote_email_send(uuid,uuid,text) to service_role;
grant execute on function public.claim_quote_email_send(uuid) to service_role;
grant execute on function public.record_quote_email_outcome(uuid,text,timestamptz,text) to service_role;
grant execute on function public.finalize_quote_email_send(uuid) to service_role;
