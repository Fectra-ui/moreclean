-- ============================================================
-- MORE CLEAN — FASE 4: ADMINISTRATIE
-- Migration 006: Domain events + factuurextensies + boekhouding laag
-- ============================================================

-- ============================================================
-- DOMAIN EVENTS
-- Central event log — the single source of truth for
-- cross-module communication. Handlers subscribe per event_type.
-- ============================================================

create table public.domain_events (
  id             uuid primary key default uuid_generate_v4(),
  -- What happened
  type           text not null,        -- 'quote.accepted', 'invoice.paid', etc.
  aggregate_type text not null,        -- 'quote', 'invoice', 'appointment'
  aggregate_id   uuid not null,
  -- Context
  company_id     uuid references public.companies(id) on delete cascade,
  actor_id       uuid references public.profiles(id) on delete set null,
  -- Data snapshot at event time (immutable after insert)
  payload        jsonb not null default '{}',
  -- Processing state
  processed_at   timestamptz,
  error          text,                 -- if handler failed
  created_at     timestamptz not null default now()
);

create index idx_domain_events_type          on public.domain_events(type);
create index idx_domain_events_aggregate     on public.domain_events(aggregate_type, aggregate_id);
create index idx_domain_events_company       on public.domain_events(company_id);
create index idx_domain_events_unprocessed   on public.domain_events(created_at) where processed_at is null;

-- ============================================================
-- ACCOUNTING ABSTRACTION LAYER
-- Keeps the core model agnostic of external bookkeeping systems.
-- Add a row per integration when connected (Exact, Moneybird, etc.)
-- ============================================================

create type accounting_provider as enum ('exact', 'moneybird', 'snelstart', 'twinfield', 'manual');
create type accounting_sync_status as enum ('pending', 'synced', 'failed', 'skipped');

create table public.accounting_connections (
  id           uuid primary key default uuid_generate_v4(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  provider     accounting_provider not null,
  access_token text,
  refresh_token text,
  expires_at   timestamptz,
  settings     jsonb not null default '{}',   -- provider-specific config
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (company_id, provider)
);

create table public.accounting_sync_log (
  id             uuid primary key default uuid_generate_v4(),
  connection_id  uuid not null references public.accounting_connections(id) on delete cascade,
  entity_type    text not null,   -- 'invoice', 'credit_invoice', 'client'
  entity_id      uuid not null,
  external_id    text,            -- ID in the accounting system
  status         accounting_sync_status not null default 'pending',
  error          text,
  synced_at      timestamptz,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- INVOICE EXTENSIONS
-- Credit invoices + payment reference
-- ============================================================

-- Credit invoice type
alter table public.invoices
  add column if not exists type         text not null default 'invoice'
                                        check (type in ('invoice', 'credit')),
  add column if not exists credit_of    uuid references public.invoices(id) on delete set null,
  add column if not exists accounting_id text;  -- external ID when synced

-- Mollie payment details (already have mollie_payment_id + payment_url)
-- No schema change needed — fields exist in 001

-- ============================================================
-- RLS
-- ============================================================

alter table public.domain_events enable row level security;
alter table public.accounting_connections enable row level security;
alter table public.accounting_sync_log enable row level security;

-- Domain events: admin read-only (written by service_role / functions)
create policy "Admin: read domain events"
  on public.domain_events for select
  using (public.auth_role() = 'admin' and company_id = public.auth_company_id());

-- Accounting: admin only
create policy "Admin: full on accounting_connections"
  on public.accounting_connections
  using (public.auth_role() = 'admin' and company_id = public.auth_company_id())
  with check (public.auth_role() = 'admin' and company_id = public.auth_company_id());

create policy "Admin: full on accounting_sync_log"
  on public.accounting_sync_log for select
  using (
    public.auth_role() = 'admin'
    and exists (
      select 1 from public.accounting_connections ac
      where ac.id = accounting_sync_log.connection_id
        and ac.company_id = public.auth_company_id()
    )
  );
