-- ============================================================
-- 010 KILOMETERREGISTRATIE — Vereenvoudigd (100% zakelijk)
-- ============================================================
-- Alle voertuigen zijn 100% zakelijk. Er is geen privé/zakelijk
-- onderscheid nodig. Kilometers worden altijd afgeleid van de
-- kilometerstand bij vertrek en aankomst.
-- ============================================================

-- 0. Drop views die afhankelijk zijn van business_km (worden verderop opnieuw aangemaakt)
drop view if exists public.v_employee_day_summary;
drop view if exists public.v_mileage_monthly;

-- 1. Verwijder purpose-kolom en enum (privé/zakelijk-split niet nodig)
alter table public.mileage_logs drop column if exists purpose;
drop type if exists public.mileage_purpose;

-- 2. Odometers zijn nu verplicht (waren optioneel)
alter table public.mileage_logs alter column start_odometer set not null;
alter table public.mileage_logs alter column end_odometer set not null;

-- 3. Vervang handmatige business_km door generated column km
alter table public.mileage_logs drop column if exists business_km;
alter table public.mileage_logs
  add column km integer generated always as (end_odometer - start_odometer) stored;

-- 4. Route-veld (auto-gevuld door systeem: "Depot → Klant → Depot")
alter table public.mileage_logs add column if not exists route text;

-- 5. Update constraint (odometers zijn nu not null, vereenvoudig check)
alter table public.mileage_logs drop constraint if exists end_gte_start;
alter table public.mileage_logs
  add constraint end_gte_start check (end_odometer >= start_odometer);

-- 6. Hermaak views met nieuwe kolomnamen
create or replace view public.v_employee_day_summary with (security_invoker = on) as
select
  ml.employee_id,
  ml.date,
  ml.company_id,
  count(distinct ml.appointment_id)    as appointment_count,
  sum(ml.km)                           as total_km,
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

create or replace view public.v_mileage_monthly with (security_invoker = on) as
select
  ml.company_id,
  ml.employee_id,
  p.first_name,
  p.last_name,
  date_trunc('month', ml.date)         as month,
  sum(ml.km)                           as total_km,
  sum(ml.travel_time_min)              as total_travel_min,
  count(*)                             as trip_count
from public.mileage_logs ml
join public.profiles p on p.id = ml.employee_id
where ml.approved = true
group by ml.company_id, ml.employee_id, p.first_name, p.last_name, date_trunc('month', ml.date);