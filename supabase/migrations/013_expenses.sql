-- ============================================================
-- 013 EXPENSES — Centrale kostenregistratie
-- ============================================================
-- Alle kosten (bonnetjes, voertuigonderhoud, materialen, reis)
-- komen samen in één tabel. Bonnetjes worden automatisch gespiegeld
-- als expense bij upload. Handmatige invoer is ook mogelijk.
-- ============================================================

create type public.expense_type as enum (
  'fuel',         -- brandstof
  'maintenance',  -- voertuigonderhoud
  'tools',        -- gereedschap
  'supplies',     -- schoonmaakmateriaal / verbruiksartikelen
  'parking',      -- parkeren
  'toll',         -- tol / vignetten
  'travel',       -- overige reiskosten
  'equipment',    -- apparatuur (media, etc.)
  'subscription', -- software / abonnementen
  'other'
);

create type public.expense_status as enum ('draft', 'approved', 'exported');

create table public.expenses (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  business_unit_id  uuid references public.business_units(id) on delete set null,

  type              public.expense_type not null default 'other',
  status            public.expense_status not null default 'draft',

  -- Verwijzingen (optioneel — kunnen gecombineerd worden)
  receipt_id        uuid references public.receipts(id) on delete set null,
  vehicle_id        uuid references public.vehicles(id) on delete set null,
  appointment_id    uuid references public.appointments(id) on delete set null,
  employee_id       uuid references public.profiles(id) on delete set null,

  -- Inhoud
  supplier          text,
  description       text,
  date              date not null,

  -- Financieel
  amount_excl_vat   numeric(10,2) not null default 0,
  vat_amount        numeric(10,2) not null default 0,
  amount_incl_vat   numeric(10,2) not null default 0,

  -- Boekhouding
  year              smallint not null generated always as (extract(year from date)::smallint) stored,
  quarter           smallint not null generated always as (extract(quarter from date)::smallint) stored,

  approved_by       uuid references public.profiles(id),
  approved_at       timestamptz,
  exported_at       timestamptz,

  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on public.expenses (company_id, date desc);
create index on public.expenses (vehicle_id);
create index on public.expenses (appointment_id);
create index on public.expenses (employee_id);
create index on public.expenses (business_unit_id);
create index on public.expenses (receipt_id);

alter table public.expenses enable row level security;

create policy "expenses_select" on public.expenses for select
  using (
    company_id = public.auth_company_id()
    and (public.auth_role() = 'admin'
      or (public.auth_role() = 'employee' and employee_id = auth.uid()))
  );

create policy "expenses_insert" on public.expenses for insert
  with check (
    company_id = public.auth_company_id()
    and (public.auth_role() = 'admin'
      or (public.auth_role() = 'employee' and employee_id = auth.uid()))
  );

create policy "expenses_update_admin" on public.expenses for update
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

create policy "expenses_delete_admin" on public.expenses for delete
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- ============================================================
-- Auto-sync: bonnetje → expense via trigger
-- ============================================================

create or replace function public.sync_receipt_to_expense()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.expenses (
      company_id, business_unit_id, type, status,
      receipt_id, vehicle_id, appointment_id, employee_id,
      supplier, description, date,
      amount_excl_vat, vat_amount, amount_incl_vat,
      created_by
    ) values (
      new.company_id,
      new.business_unit_id,
      case new.category
        when 'brandstof'   then 'fuel'::public.expense_type
        when 'gereedschap' then 'tools'::public.expense_type
        when 'materiaal'   then 'supplies'::public.expense_type
        when 'parkeren'    then 'parking'::public.expense_type
        when 'reiskosten'  then 'travel'::public.expense_type
        else 'other'::public.expense_type
      end,
      'draft'::public.expense_status,
      new.id, new.vehicle_id, new.appointment_id, new.uploaded_by,
      new.supplier, null, new.receipt_date,
      new.amount_excl_vat, new.vat_amount, new.amount,
      new.uploaded_by
    );
  end if;

  if TG_OP = 'UPDATE' then
    update public.expenses
      set
        vehicle_id      = new.vehicle_id,
        appointment_id  = new.appointment_id,
        supplier        = new.supplier,
        date            = new.receipt_date,
        amount_excl_vat = new.amount_excl_vat,
        vat_amount      = new.vat_amount,
        amount_incl_vat = new.amount,
        updated_at      = now()
      where receipt_id = new.id;
  end if;

  return new;
end;
$$;

revoke execute on function public.sync_receipt_to_expense() from public;
revoke execute on function public.sync_receipt_to_expense() from anon;
revoke execute on function public.sync_receipt_to_expense() from authenticated;

create trigger trg_receipt_to_expense
  after insert or update on public.receipts
  for each row
  execute function public.sync_receipt_to_expense();

-- ============================================================
-- Views voor analyses
-- ============================================================

-- Kosten per voertuig (dashboard + detailpagina)
create or replace view public.v_vehicle_costs with (security_invoker = on) as
select
  v.id              as vehicle_id,
  v.name,
  v.license_plate,
  v.company_id,
  e.year,
  e.quarter,
  sum(e.amount_incl_vat)                                    as total_costs,
  sum(e.amount_incl_vat) filter (where e.type = 'fuel')     as fuel_costs,
  sum(e.amount_incl_vat) filter (where e.type = 'maintenance') as maintenance_costs,
  coalesce(sum(ml.km), 0)                                   as total_km,
  case
    when coalesce(sum(ml.km), 0) > 0
    then round(sum(e.amount_incl_vat) / sum(ml.km), 4)
    else null
  end                                                       as cost_per_km
from public.vehicles v
left join public.expenses e on e.vehicle_id = v.id
left join public.mileage_logs ml on ml.vehicle_id = v.id
  and ml.approved = true
  and extract(year from ml.date) = e.year
  and extract(quarter from ml.date) = e.quarter
group by v.id, v.name, v.license_plate, v.company_id, e.year, e.quarter;

-- Winstgevendheid per klant
create or replace view public.v_client_profitability with (security_invoker = on) as
select
  c.id              as client_id,
  c.contact_name,
  c.company_name,
  c.company_id,
  extract(year from i.issue_date)::int as year,
  coalesce(sum(i.total) filter (where i.status not in ('draft','cancelled')), 0) as revenue,
  coalesce(sum(e.amount_incl_vat), 0)                        as total_costs,
  coalesce(sum(e.amount_incl_vat) filter (where e.type = 'supplies'), 0)   as material_costs,
  coalesce(sum(e.amount_incl_vat) filter (where e.type in ('fuel','travel','toll','parking')), 0) as travel_costs,
  coalesce(sum(i.total) filter (where i.status not in ('draft','cancelled')), 0)
    - coalesce(sum(e.amount_incl_vat), 0)                    as gross_profit,
  count(distinct a.id)                                       as appointment_count
from public.clients c
left join public.invoices i on i.client_id = c.id
left join public.appointments a on a.client_id = c.id
left join public.expenses e on e.appointment_id = a.id
group by c.id, c.contact_name, c.company_name, c.company_id, extract(year from i.issue_date);

-- Bedrijfsgezondheid (maandelijkse samenvatting voor dashboard)
create or replace view public.v_business_health with (security_invoker = on) as
select
  company_id,
  date_trunc('month', date)::date           as month,
  sum(amount_incl_vat)                      as total_costs,
  sum(amount_incl_vat) filter (where type = 'fuel')        as fuel_costs,
  sum(amount_incl_vat) filter (where type = 'maintenance') as maintenance_costs,
  sum(amount_incl_vat) filter (where type in ('supplies','tools')) as material_costs,
  sum(amount_incl_vat) filter (where type in ('travel','toll','parking')) as travel_costs,
  count(*)                                  as expense_count
from public.expenses
group by company_id, date_trunc('month', date);
