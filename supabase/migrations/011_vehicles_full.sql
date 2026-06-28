-- ============================================================
-- 011 VOERTUIGENMODULE — Volledig uitgebouwd
-- ============================================================

-- 1. Status enum (vervangt boolean active)
create type public.vehicle_status as enum ('active', 'maintenance', 'inactive');

-- 2. Vehicles: nieuwe kolommen + status migratie
alter table public.vehicles
  add column status       public.vehicle_status not null default 'active',
  add column purchase_date date,
  add column next_service_km   integer,
  add column next_service_date date;

-- Bestaande active boolean → status
update public.vehicles
  set status = case when active then 'active'::public.vehicle_status else 'inactive'::public.vehicle_status end;

-- Verwijder verouderde kolommen
alter table public.vehicles
  drop column if exists active,
  drop column if exists service_due_km,
  drop column if exists service_due_at;

-- 3. Voertuigtoewijzing per medewerker per dag
create table public.employee_vehicle_assignments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.profiles(id),
  vehicle_id  uuid not null references public.vehicles(id),
  date        date not null,
  created_at  timestamptz not null default now(),
  unique (employee_id, date),     -- één voertuig per medewerker per dag
  unique (vehicle_id, date)       -- één medewerker per voertuig per dag
);

create index on public.employee_vehicle_assignments (company_id, date);
create index on public.employee_vehicle_assignments (employee_id);
create index on public.employee_vehicle_assignments (vehicle_id);

alter table public.employee_vehicle_assignments enable row level security;

create policy "eva_select" on public.employee_vehicle_assignments for select
  using (
    company_id = public.auth_company_id()
    and (public.auth_role() = 'admin' or employee_id = auth.uid())
  );

create policy "eva_admin" on public.employee_vehicle_assignments for all
  using (company_id = public.auth_company_id() and public.auth_role() = 'admin');

-- 4. Voertuig op afspraken
alter table public.appointments
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

create index if not exists idx_appointments_vehicle_id on public.appointments (vehicle_id);

-- 5. Voertuig op bonnetjes (brandstof, onderhoud, etc.)
alter table public.receipts
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

create index if not exists idx_receipts_vehicle_id on public.receipts (vehicle_id);

-- 6. Herdefinieer trigger met updated kolom-naam
create or replace function public.check_vehicle_maintenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
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
revoke execute on function public.check_vehicle_maintenance() from anon;
revoke execute on function public.check_vehicle_maintenance() from authenticated;

-- 7. Voertuigstatistieken view (dag + kwartaal)
create or replace view public.v_vehicle_stats with (security_invoker = on) as
select
  v.id                  as vehicle_id,
  v.company_id,
  v.name,
  v.license_plate,
  v.brand,
  v.model,
  v.current_odometer,
  v.status,
  v.apk_expiry,
  v.insurance_expiry,
  v.next_service_km,
  v.next_service_date,
  coalesce(sum(ml.km)
    filter (where ml.date = current_date and ml.approved = true), 0)
    as today_km,
  coalesce(count(distinct ml.appointment_id)
    filter (where ml.date = current_date and ml.approved = true), 0)
    as today_trips,
  coalesce(sum(ml.km)
    filter (where ml.approved = true
      and extract(year from ml.date) = extract(year from now())
      and extract(quarter from ml.date) = extract(quarter from now())), 0)
    as quarter_km,
  coalesce(sum(r.amount)
    filter (where
      extract(year from r.receipt_date) = extract(year from now())
      and extract(quarter from r.receipt_date) = extract(quarter from now())), 0)
    as quarter_costs
from public.vehicles v
left join public.mileage_logs ml on ml.vehicle_id = v.id
left join public.receipts r on r.vehicle_id = v.id
group by
  v.id, v.company_id, v.name, v.license_plate, v.brand, v.model,
  v.current_odometer, v.status, v.apk_expiry, v.insurance_expiry,
  v.next_service_km, v.next_service_date;