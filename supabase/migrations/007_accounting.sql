-- ============================================================
-- 007 ACCOUNTING — bonnetjes, kwartaaloverzicht, auto-archivering
-- ============================================================

-- ---- Enums ----

create type public.receipt_category as enum (
  'brandstof',
  'materiaal',
  'gereedschap',
  'parkeren',
  'reiskosten',
  'overig'
);

create type public.quarter_status as enum (
  'open',
  'closed',
  'exported'
);

-- ---- Receipts ----

create table public.receipts (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  uploaded_by     uuid not null references public.profiles(id),
  appointment_id  uuid references public.appointments(id) on delete set null,
  category        public.receipt_category not null default 'overig',
  supplier        text,
  receipt_date    date not null,
  amount          numeric(10,2) not null check (amount >= 0),
  vat_pct         numeric(5,2) not null default 21,
  vat_amount      numeric(10,2) generated always as (
                    round(amount * vat_pct / (100 + vat_pct), 2)
                  ) stored,
  amount_excl_vat numeric(10,2) generated always as (
                    round(amount - (amount * vat_pct / (100 + vat_pct)), 2)
                  ) stored,
  notes           text,
  file_path       text,           -- Supabase Storage path
  file_name       text,           -- originele bestandsnaam voor weergave
  year            smallint not null generated always as (
                    extract(year from receipt_date)::smallint
                  ) stored,
  quarter         smallint not null generated always as (
                    extract(quarter from receipt_date)::smallint
                  ) stored,
  processed       boolean not null default false,
  processed_at    timestamptz,
  created_at      timestamptz not null default now()
);

-- ---- Accounting quarters (handmatige afsluiting per kwartaal) ----

create table public.accounting_quarters (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  year            smallint not null,
  quarter         smallint not null check (quarter between 1 and 4),
  status          public.quarter_status not null default 'open',
  export_path     text,           -- Supabase Storage path naar de ZIP
  exported_at     timestamptz,
  closed_by       uuid references public.profiles(id),
  notes           text,
  created_at      timestamptz not null default now(),
  unique (company_id, year, quarter)
);

-- ---- Invoice archive (koppeltabel: factuur → kwartaalmap in Storage) ----

create table public.invoice_archive (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references public.invoices(id) on delete cascade,
  company_id      uuid not null references public.companies(id) on delete cascade,
  year            smallint not null,
  quarter         smallint not null,
  file_path       text not null,   -- pad in Supabase Storage
  archived_at     timestamptz not null default now(),
  unique (invoice_id)
);

-- ---- Indexes ----

create index on public.receipts (company_id, year, quarter);
create index on public.receipts (uploaded_by);
create index on public.receipts (appointment_id);
create index on public.invoice_archive (company_id, year, quarter);

-- ---- RLS ----

alter table public.receipts enable row level security;
alter table public.accounting_quarters enable row level security;
alter table public.invoice_archive enable row level security;

-- Receipts: medewerker kan eigen bonnetjes zien; admin ziet alles
create policy "receipts_select" on public.receipts for select
  using (
    company_id = public.auth_company_id()
    and (public.auth_role() = 'admin' or uploaded_by = auth.uid())
  );

create policy "receipts_insert" on public.receipts for insert
  with check (
    company_id = public.auth_company_id()
    and uploaded_by = auth.uid()
  );

create policy "receipts_update_admin" on public.receipts for update
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

create policy "receipts_delete_admin" on public.receipts for delete
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- Accounting quarters: admin only
create policy "aq_admin" on public.accounting_quarters for all
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- Invoice archive: admin only
create policy "ia_admin" on public.invoice_archive for all
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- ---- Storage bucket: boekhouding ----
-- Maak de bucket aan in Supabase Dashboard → Storage → New Bucket
-- Naam: 'boekhouding', private
-- Pad-structuur: {company_id}/{year}/Q{quarter}/{facturen|bonnetjes}/bestandsnaam
-- Bonnetjes mogen door medewerkers geüpload worden; facturen alleen door service_role

-- ---- Kwartaaloverzicht view ----

create or replace view public.v_quarter_overview with (security_invoker = on) as
select
  q.company_id,
  q.year,
  q.quarter,
  q.status,
  coalesce(inv.invoice_count, 0)          as invoice_count,
  coalesce(inv.revenue_excl_vat, 0)       as revenue_excl_vat,
  coalesce(inv.vat_collected, 0)          as vat_collected,
  coalesce(inv.revenue_incl_vat, 0)       as revenue_incl_vat,
  coalesce(inv.paid_count, 0)             as paid_count,
  coalesce(rec.receipt_count, 0)          as receipt_count,
  coalesce(rec.costs_excl_vat, 0)         as costs_excl_vat,
  coalesce(rec.vat_paid, 0)              as vat_paid,
  coalesce(inv.vat_collected, 0)
    - coalesce(rec.vat_paid, 0)           as vat_to_pay,
  coalesce(inv.revenue_excl_vat, 0)
    - coalesce(rec.costs_excl_vat, 0)     as profit_excl_vat
from
  public.accounting_quarters q
  left join (
    select
      company_id,
      extract(year from issue_date)::smallint    as year,
      extract(quarter from issue_date)::smallint as quarter,
      count(*)                                   as invoice_count,
      sum(subtotal)                              as revenue_excl_vat,
      sum(vat_amount)                            as vat_collected,
      sum(total)                                 as revenue_incl_vat,
      count(*) filter (where status = 'paid')    as paid_count
    from public.invoices
    where type = 'invoice'
    group by 1, 2, 3
  ) inv using (company_id, year, quarter)
  left join (
    select
      company_id,
      year,
      quarter,
      count(*)               as receipt_count,
      sum(amount_excl_vat)   as costs_excl_vat,
      sum(vat_amount)        as vat_paid
    from public.receipts
    group by 1, 2, 3
  ) rec using (company_id, year, quarter);
