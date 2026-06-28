-- ============================================================
-- 008 KILOMETERREGISTRATIE + VOERTUIGEN
-- ============================================================
-- Sectie 1 — Security fix: RLS-helpers definitief naar SECURITY INVOKER
-- (Migratie 004 had dit al, maar als de DB nog de originele functies heeft
--  zorgt dit CREATE OR REPLACE ervoor dat ze alsnog correct worden.)
-- ============================================================

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security invoker
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_company_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_client_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select id from public.clients where profile_id = auth.uid() limit 1;
$$;

-- ============================================================
-- Sectie 2 — Voertuigenmodule
-- ============================================================

create type public.fuel_type as enum (
  'benzine',
  'diesel',
  'elektrisch',
  'hybride',
  'lpg',
  'waterstof'
);

create table public.vehicles (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  name              text not null,
  license_plate     text not null,
  brand             text,
  model             text,
  year              smallint,
  fuel_type         public.fuel_type not null default 'diesel',
  current_odometer  integer not null default 0 check (current_odometer >= 0),
  service_due_km    integer,         -- km-stand waarbij onderhoud gepland is
  service_due_at    date,            -- datum grens (waarvoor het eerst geldt)
  apk_expiry        date,
  insurance_expiry  date,
  active            boolean not null default true,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on public.vehicles (company_id);

alter table public.vehicles enable row level security;

create policy "vehicles_select" on public.vehicles for select
  using (
    company_id = public.auth_company_id()
    and (public.auth_role() = 'admin' or public.auth_role() = 'employee')
  );

create policy "vehicles_admin" on public.vehicles for all
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- ============================================================
-- Sectie 3 — Kilometerregistratie
-- ============================================================

create type public.mileage_purpose as enum (
  'woon_werk',     -- woon-werkverkeer (niet aftrekbaar)
  'zakelijk',      -- zakelijk (opdracht gerelateerd)
  'privé'          -- privégebruik bedrijfsauto
);

create table public.mileage_logs (
  id                uuid primary key default gen_random_uuid(),
  appointment_id    uuid references public.appointments(id) on delete set null,
  employee_id       uuid not null references public.profiles(id),
  vehicle_id        uuid references public.vehicles(id) on delete set null,
  company_id        uuid not null references public.companies(id) on delete cascade,

  date              date not null,
  purpose           public.mileage_purpose not null default 'zakelijk',

  -- Kilometerstanden (optioneel — medewerker kan alleen km invullen)
  start_odometer    integer check (start_odometer >= 0),
  end_odometer      integer check (end_odometer >= 0),

  -- Berekend veld: aantal km
  business_km       numeric(8,1) not null check (business_km >= 0),

  -- Reistijd in minuten
  travel_time_min   integer check (travel_time_min >= 0),

  -- Locatievelden (optioneel, voor boekhouding)
  start_location    text,
  end_location      text,

  -- Aanvangstijdstip van de rit (voor dagregister)
  departed_at       timestamptz,
  arrived_at        timestamptz,

  notes             text,

  -- Status voor goedkeuring
  approved          boolean not null default false,
  approved_by       uuid references public.profiles(id),
  approved_at       timestamptz,

  created_at        timestamptz not null default now(),

  constraint end_gte_start check (
    end_odometer is null or start_odometer is null or end_odometer >= start_odometer
  )
);

create index on public.mileage_logs (company_id, date desc);
create index on public.mileage_logs (employee_id, date desc);
create index on public.mileage_logs (appointment_id);
create index on public.mileage_logs (vehicle_id);

alter table public.mileage_logs enable row level security;

-- Medewerker: eigen logs lezen + aanmaken
create policy "mileage_select_own" on public.mileage_logs for select
  using (
    company_id = public.auth_company_id()
    and (public.auth_role() = 'admin' or employee_id = auth.uid())
  );

create policy "mileage_insert" on public.mileage_logs for insert
  with check (
    company_id = public.auth_company_id()
    and employee_id = auth.uid()
  );

create policy "mileage_update_own" on public.mileage_logs for update
  using (
    company_id = public.auth_company_id()
    and (public.auth_role() = 'admin' or (employee_id = auth.uid() and approved = false))
  );

create policy "mileage_delete_admin" on public.mileage_logs for delete
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- ============================================================
-- Sectie 4 — Voertuigonderhoud meldingen via domain events
-- (Trigger: als odometer bijgewerkt wordt en service_due_km nadert)
-- ============================================================

create or replace function public.check_vehicle_maintenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Bijwerken odometer op voertuig na goedkeuring van kilometerlog
  if new.approved = true and new.vehicle_id is not null then
    update public.vehicles
    set
      current_odometer = greatest(current_odometer, coalesce(new.end_odometer, current_odometer)),
      updated_at = now()
    where id = new.vehicle_id;
  end if;
  return new;
end;
$$;

revoke execute on function public.check_vehicle_maintenance() from public;

create trigger trg_vehicle_odometer
  after update on public.mileage_logs
  for each row
  when (new.approved = true and old.approved = false)
  execute function public.check_vehicle_maintenance();

-- ============================================================
-- Sectie 5 — Views
-- ============================================================

-- Dagregistratie per medewerker
create or replace view public.v_employee_day_summary with (security_invoker = on) as
select
  ml.employee_id,
  ml.date,
  ml.company_id,
  count(distinct ml.appointment_id)    as appointment_count,
  sum(ml.business_km)                  as total_km,
  sum(ml.travel_time_min)              as total_travel_min,
  coalesce((
    select sum(tl.duration_min)
    from public.appointment_time_logs tl
    join public.appointments a on a.id = tl.appointment_id
    where tl.employee_id = ml.employee_id
      and a.scheduled_date = ml.date
      and tl.type = 'work'
  ), 0)                                as total_work_min
from public.mileage_logs ml
group by ml.employee_id, ml.date, ml.company_id;

-- Maandoverzicht per medewerker (voor admin dashboard)
create or replace view public.v_mileage_monthly with (security_invoker = on) as
select
  ml.company_id,
  ml.employee_id,
  p.first_name,
  p.last_name,
  date_trunc('month', ml.date)         as month,
  sum(ml.business_km)                  as total_km,
  sum(ml.travel_time_min)              as total_travel_min,
  count(*)                             as trip_count,
  count(*) filter (where ml.approved)  as approved_count
from public.mileage_logs ml
join public.profiles p on p.id = ml.employee_id
group by ml.company_id, ml.employee_id, p.first_name, p.last_name, date_trunc('month', ml.date);

-- ============================================================
-- Sectie 6 — Seed: één voertuig voor development
-- ============================================================

insert into public.vehicles (
  company_id, name, license_plate, brand, model, year, fuel_type, current_odometer
) values (
  'a1000000-0000-0000-0000-000000000001',
  'Bedrijfsbus 1',
  'NL-001-B',
  'Volkswagen',
  'Crafter',
  2022,
  'diesel',
  47500
) on conflict do nothing;
