-- ============================================================
-- 012 BUSINESS UNITS
-- ============================================================
-- Elke business unit is een zelfstandige bedrijfstak binnen
-- één juridische entiteit (More Clean BV). Denk: Schoonmaak,
-- Media, Zonnepanelen. Ze delen hetzelfde CRM, dezelfde
-- medewerkers en dezelfde boekhouding, maar hebben eigen:
--   * factuurprefix (MC-, MM-)
--   * branding op PDF (logo, kleur, contactgegevens)
--   * diensten en planning
--   * kwartaaloverzicht in boekhouding
-- ============================================================

create table public.business_units (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  name            text not null,
  short_code      text not null,          -- MC, MM — gebruikt in factuurnummer
  description     text,
  icon            text,                   -- emoji, bv. 🪟 🎥 ☀️
  primary_color   text not null default '#4D7EBA',
  logo_path       text,                   -- Supabase Storage path (optioneel afwijkend logo)
  email           text,
  phone           text,
  vat_text        text,                   -- afwijkende BTW-tekst op factuur (indien van toepassing)
  payment_terms   int not null default 14,-- standaard betaaltermijn in dagen
  active          boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  unique (company_id, short_code)
);

create index on public.business_units (company_id);

alter table public.business_units enable row level security;

create policy "bu_select" on public.business_units for select
  using (company_id = public.auth_company_id());

create policy "bu_admin" on public.business_units for all
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- ============================================================
-- Business unit koppelen aan bestaande entiteiten
-- ============================================================

alter table public.services
  add column if not exists business_unit_id uuid references public.business_units(id) on delete set null;

alter table public.appointments
  add column if not exists business_unit_id uuid references public.business_units(id) on delete set null;

alter table public.quotes
  add column if not exists business_unit_id uuid references public.business_units(id) on delete set null;

alter table public.invoices
  add column if not exists business_unit_id uuid references public.business_units(id) on delete set null;

alter table public.receipts
  add column if not exists business_unit_id uuid references public.business_units(id) on delete set null;

create index if not exists on public.appointments (business_unit_id);
create index if not exists on public.invoices (business_unit_id);

-- ============================================================
-- Uitgebreide service-categorieën voor media
-- ============================================================

alter type public.service_category
  add value if not exists 'videografie';
alter type public.service_category
  add value if not exists 'fotografie';
alter type public.service_category
  add value if not exists 'social_media';
alter type public.service_category
  add value if not exists 'podcast';

-- ============================================================
-- Omzetoverzicht per business unit (dashboard + export)
-- ============================================================

create or replace view public.v_bu_revenue with (security_invoker = on) as
select
  bu.id           as business_unit_id,
  bu.name         as business_unit_name,
  bu.icon,
  bu.short_code,
  bu.company_id,
  extract(year from i.issue_date)::int    as year,
  extract(quarter from i.issue_date)::int as quarter,
  count(i.id)                             as invoice_count,
  coalesce(sum(i.total) filter (where i.status != 'cancelled'), 0) as revenue,
  coalesce(sum(i.vat_amount) filter (where i.status != 'cancelled'), 0) as vat_collected,
  coalesce(sum(i.total) filter (where i.status = 'paid'), 0) as revenue_paid,
  coalesce(sum(r.amount), 0)              as costs,
  count(distinct a.id)                    as appointment_count
from public.business_units bu
left join public.invoices i
  on i.business_unit_id = bu.id
  and i.status not in ('draft', 'cancelled')
left join public.receipts r
  on r.business_unit_id = bu.id
left join public.appointments a
  on a.business_unit_id = bu.id
group by bu.id, bu.name, bu.icon, bu.short_code, bu.company_id,
         extract(year from i.issue_date), extract(quarter from i.issue_date);

-- ============================================================
-- Seed: Schoonmaak + Media
-- ============================================================

insert into public.business_units
  (id, company_id, name, short_code, description, icon, primary_color, email, sort_order)
values
  (
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Schoonmaak',
    'MC',
    'Professionele glasbewassing, schoonmaak en zonnepanelen',
    '🪟',
    '#4D7EBA',
    'schoonmaak@moreclean.nl',
    0
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Media',
    'MM',
    'Videografie, fotografie en social media content',
    '🎥',
    '#7C3AED',
    'media@moreclean.nl',
    1
  )
on conflict (company_id, short_code) do nothing;

-- Wijs bestaande schoonmaak-diensten toe aan Schoonmaak BU
update public.services
  set business_unit_id = 'c1000000-0000-0000-0000-000000000001'
where company_id = 'a1000000-0000-0000-0000-000000000001'
  and category in ('glasbewassing', 'zonnepanelen', 'schoonmaak', 'gevelreiniging', 'overig')
  and business_unit_id is null;
