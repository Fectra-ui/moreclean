-- ============================================================
-- MORE CLEAN — PLATFORM FOUNDATION
-- Migration 001: Core schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('admin', 'employee', 'customer');
create type quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
create type appointment_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type invoice_reminder_type as enum ('reminder_1', 'reminder_2', 'final');
create type file_owner_type as enum ('client', 'appointment', 'quote', 'invoice', 'employee', 'asset');
create type file_type as enum ('photo_before', 'photo_during', 'photo_after', 'signature', 'quote_pdf', 'invoice_pdf', 'contract', 'certificate', 'other');
create type service_unit as enum ('per_raam', 'per_uur', 'vast', 'per_m2', 'per_paneel');
create type service_category as enum ('glasbewassing', 'zonnepanelen', 'schoonmaak', 'gevelreiniging', 'overig');
create type asset_status as enum ('available', 'in_use', 'maintenance', 'retired');
create type asset_type as enum ('voertuig', 'machine', 'gereedschap', 'overig');
create type appointment_role as enum ('lead', 'assistant');
create type message_direction as enum ('inbound', 'outbound', 'internal');
create type notification_type as enum (
  'appointment_scheduled', 'appointment_reminder', 'appointment_completed',
  'quote_sent', 'quote_accepted', 'quote_rejected',
  'invoice_sent', 'invoice_paid', 'invoice_overdue',
  'message_received', 'employee_assigned', 'maintenance_due'
);

-- ============================================================
-- COMPANIES & BRANCHES (multi-location ready)
-- ============================================================

create table companies (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  kvk         text,
  vat_number  text,
  logo_path   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table branches (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references companies(id) on delete cascade,
  name        text not null,
  address     text not null,
  postal_code text not null,
  city        text not null,
  phone       text,
  email       text,
  timezone    text not null default 'Europe/Amsterdam',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'customer',
  company_id  uuid references companies(id),
  branch_id   uuid references branches(id),
  first_name  text,
  last_name   text,
  email       text,
  phone       text,
  avatar_path text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Employee-specific details
create table employee_profiles (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null unique references profiles(id) on delete cascade,
  branch_id       uuid references branches(id),
  function        text,
  hourly_rate     numeric(10,2),
  calendar_color  text default '#4D7EBA',
  iban            text,
  emergency_contact text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table employee_availability (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references profiles(id) on delete cascade,
  date          date not null,
  available     boolean not null default true,
  note          text,
  created_at    timestamptz not null default now(),
  unique (employee_id, date)
);

-- ============================================================
-- SERVICES (diensten)
-- ============================================================

create table services (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid references companies(id),
  name            text not null,
  description     text,
  category        service_category not null default 'glasbewassing',
  default_price   numeric(10,2),
  unit            service_unit not null default 'vast',
  vat_rate        numeric(5,2) not null default 21.00,
  active          boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- CLIENTS (CRM)
-- ============================================================

create table clients (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid unique references profiles(id) on delete set null, -- nullable: client may not have login
  company_id      uuid references companies(id),
  branch_id       uuid references branches(id),
  -- Contact
  is_company      boolean not null default false,
  company_name    text,
  contact_name    text not null,
  email           text,
  phone           text,
  phone_secondary text,
  -- Address
  address         text,
  postal_code     text,
  city            text,
  country         text not null default 'NL',
  -- Financial
  vat_number      text,
  payment_terms   int not null default 14, -- days
  -- Meta
  notes           text,
  internal_notes  text,
  source          text, -- hoe klant gevonden (website, referral, etc.)
  active          boolean not null default true,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table maintenance_schedules (
  id              uuid primary key default uuid_generate_v4(),
  client_id       uuid not null references clients(id) on delete cascade,
  service_id      uuid not null references services(id),
  frequency_weeks int not null default 6,
  next_due_at     date,
  last_done_at    date,
  notes           text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- ASSETS / MATERIEEL
-- ============================================================

create table assets (
  id                  uuid primary key default uuid_generate_v4(),
  company_id          uuid references companies(id),
  name                text not null,
  type                asset_type not null default 'overig',
  serial_number       text,
  license_plate       text,
  purchase_date       date,
  last_maintenance    date,
  next_maintenance    date,
  status              asset_status not null default 'available',
  assigned_employee   uuid references profiles(id) on delete set null,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- QUOTES (offertes)
-- ============================================================

create table quotes (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid references companies(id),
  client_id       uuid not null references clients(id) on delete restrict,
  quote_number    text not null,               -- MC-OFF-2026-0001
  status          quote_status not null default 'draft',
  -- Dates
  valid_until     date,
  sent_at         timestamptz,
  accepted_at     timestamptz,
  rejected_at     timestamptz,
  -- Content
  subject         text,
  intro_text      text,
  notes           text,
  internal_notes  text,
  -- Financial
  subtotal        numeric(10,2) not null default 0,
  discount_pct    numeric(5,2) not null default 0,
  vat_amount      numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  -- Meta
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table quote_items (
  id            uuid primary key default uuid_generate_v4(),
  quote_id      uuid not null references quotes(id) on delete cascade,
  service_id    uuid references services(id) on delete set null,
  description   text not null,
  quantity      numeric(10,2) not null default 1,
  unit_price    numeric(10,2) not null,
  total_price   numeric(10,2) not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- APPOINTMENTS (afspraken)
-- ============================================================

create table appointments (
  id                  uuid primary key default uuid_generate_v4(),
  company_id          uuid references companies(id),
  branch_id           uuid references branches(id),
  client_id           uuid not null references clients(id) on delete restrict,
  quote_id            uuid references quotes(id) on delete set null,
  -- Status
  status              appointment_status not null default 'scheduled',
  -- Scheduling
  scheduled_date      date not null,
  scheduled_start     time not null,
  scheduled_end       time not null,
  estimated_duration  int,   -- minutes
  -- Location
  address             text,
  postal_code         text,
  city                text,
  latitude            numeric(10,7),
  longitude           numeric(10,7),
  -- Routing
  travel_duration     int,   -- minutes, calculated
  route_order         int,   -- position in day's route
  -- Execution
  started_at          timestamptz,
  completed_at        timestamptz,
  -- Notes
  notes               text,
  internal_notes      text,
  -- Meta
  created_by          uuid references profiles(id),
  updated_by          uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table appointment_employees (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references appointments(id) on delete cascade,
  employee_id     uuid not null references profiles(id) on delete cascade,
  role            appointment_role not null default 'lead',
  created_at      timestamptz not null default now(),
  unique (appointment_id, employee_id)
);

create table appointment_services (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references appointments(id) on delete cascade,
  service_id      uuid references services(id) on delete set null,
  description     text,
  quantity        numeric(10,2) not null default 1,
  unit_price      numeric(10,2),
  notes           text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create table appointment_status_history (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references appointments(id) on delete cascade,
  old_status      appointment_status,
  new_status      appointment_status not null,
  changed_by      uuid references profiles(id),
  note            text,
  changed_at      timestamptz not null default now()
);

create table appointment_signatures (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null unique references appointments(id) on delete cascade,
  signature_data  text not null,  -- base64 SVG/PNG
  signed_at       timestamptz not null default now(),
  signed_by_name  text not null
);

-- ============================================================
-- FILES (universal — photos, PDFs, contracts, etc.)
-- ============================================================

create table files (
  id            uuid primary key default uuid_generate_v4(),
  owner_type    file_owner_type not null,
  owner_id      uuid not null,
  type          file_type not null default 'other',
  storage_path  text not null,
  file_name     text not null,
  mime_type     text not null,
  size_bytes    bigint,
  caption       text,
  sort_order    int not null default 0,
  uploaded_by   uuid references profiles(id),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INVOICES (facturen)
-- ============================================================

create table invoices (
  id                  uuid primary key default uuid_generate_v4(),
  company_id          uuid references companies(id),
  client_id           uuid not null references clients(id) on delete restrict,
  appointment_id      uuid references appointments(id) on delete set null,
  quote_id            uuid references quotes(id) on delete set null,
  -- Identity
  invoice_number      text not null,            -- MC-2026-0001
  status              invoice_status not null default 'draft',
  -- Dates
  issue_date          date not null default current_date,
  due_date            date not null,
  sent_at             timestamptz,
  paid_at             timestamptz,
  -- Financial
  subtotal            numeric(10,2) not null default 0,
  discount_pct        numeric(5,2) not null default 0,
  vat_rate            numeric(5,2) not null default 21,
  vat_amount          numeric(10,2) not null default 0,
  total               numeric(10,2) not null default 0,
  -- Payment
  mollie_payment_id   text,
  payment_url         text,
  -- Notes
  notes               text,
  -- Meta
  created_by          uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table invoice_items (
  id              uuid primary key default uuid_generate_v4(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  service_id      uuid references services(id) on delete set null,
  description     text not null,
  quantity        numeric(10,2) not null default 1,
  unit_price      numeric(10,2) not null,
  total_price     numeric(10,2) not null,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create table invoice_reminders (
  id          uuid primary key default uuid_generate_v4(),
  invoice_id  uuid not null references invoices(id) on delete cascade,
  type        invoice_reminder_type not null,
  sent_at     timestamptz not null default now()
);

-- ============================================================
-- MESSAGES & CONVERSATIONS
-- ============================================================

create table conversations (
  id              uuid primary key default uuid_generate_v4(),
  company_id      uuid references companies(id),
  client_id       uuid not null references clients(id) on delete cascade,
  subject         text,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

create table messages (
  id                uuid primary key default uuid_generate_v4(),
  conversation_id   uuid not null references conversations(id) on delete cascade,
  sender_id         uuid references profiles(id) on delete set null,
  direction         message_direction not null default 'inbound',
  body              text not null,
  read_at           timestamptz,
  created_at        timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table notifications (
  id              uuid primary key default uuid_generate_v4(),
  recipient_id    uuid not null references profiles(id) on delete cascade,
  type            notification_type not null,
  title           text not null,
  body            text,
  link            text,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOG (core component, not optional)
-- ============================================================

create table activity_log (
  id            uuid primary key default uuid_generate_v4(),
  actor_id      uuid references profiles(id) on delete set null,
  entity_type   text not null,   -- 'quote', 'appointment', 'invoice', etc.
  entity_id     uuid not null,
  action        text not null,   -- 'created', 'updated', 'status_changed', 'deleted', 'sent'
  metadata      jsonb,           -- before/after values, extra context
  ip_address    text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Profiles
create index idx_profiles_role on profiles(role);
create index idx_profiles_company on profiles(company_id);

-- Clients
create index idx_clients_company on clients(company_id);
create index idx_clients_email on clients(email);
create index idx_clients_search on clients using gin(
  to_tsvector('dutch', coalesce(company_name,'') || ' ' || contact_name || ' ' || coalesce(email,'') || ' ' || coalesce(city,''))
);

-- Appointments
create index idx_appointments_client on appointments(client_id);
create index idx_appointments_date on appointments(scheduled_date);
create index idx_appointments_status on appointments(status);
create index idx_appointments_company_date on appointments(company_id, scheduled_date);
create index idx_appointment_employees_employee on appointment_employees(employee_id);
create index idx_appointment_employees_date on appointment_employees(employee_id, appointment_id);

-- Quotes
create index idx_quotes_client on quotes(client_id);
create index idx_quotes_status on quotes(status);

-- Invoices
create index idx_invoices_client on invoices(client_id);
create index idx_invoices_status on invoices(status);
create index idx_invoices_due_date on invoices(due_date) where status not in ('paid', 'cancelled');

-- Files
create index idx_files_owner on files(owner_type, owner_id);

-- Messages
create index idx_messages_conversation on messages(conversation_id, created_at);

-- Notifications
create index idx_notifications_recipient on notifications(recipient_id, created_at);
create index idx_notifications_unread on notifications(recipient_id) where read_at is null;

-- Activity log
create index idx_activity_log_entity on activity_log(entity_type, entity_id);
create index idx_activity_log_actor on activity_log(actor_id);
create index idx_activity_log_created on activity_log(created_at desc);

-- ============================================================
-- VIEWS
-- ============================================================

-- Upcoming appointments for admin/planning
create view v_appointments_today as
  select
    a.*,
    c.contact_name,
    c.company_name,
    c.phone as client_phone,
    array_agg(
      json_build_object(
        'employee_id', ae.employee_id,
        'role', ae.role
      )
    ) as employees
  from appointments a
  join clients c on c.id = a.client_id
  left join appointment_employees ae on ae.appointment_id = a.id
  where a.scheduled_date = current_date
  group by a.id, c.id;

-- Invoice overview with client name
create view v_invoices_overview as
  select
    i.*,
    c.contact_name,
    c.company_name,
    c.email as client_email,
    case
      when i.status = 'sent' and i.due_date < current_date then 'overdue'
      else i.status::text
    end as computed_status
  from invoices i
  join clients c on c.id = i.client_id;

-- Employee daily schedule
create view v_employee_schedule as
  select
    ae.employee_id,
    a.id as appointment_id,
    a.scheduled_date,
    a.scheduled_start,
    a.scheduled_end,
    a.status,
    a.address,
    a.city,
    c.contact_name,
    c.phone as client_phone,
    a.notes,
    ae.role
  from appointment_employees ae
  join appointments a on a.id = ae.appointment_id
  join clients c on c.id = a.client_id
  order by a.scheduled_date, a.scheduled_start;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Generate sequential invoice number: MC-2026-0001
create or replace function generate_invoice_number(company uuid)
returns text language plpgsql as $$
declare
  year_str text := to_char(now(), 'YYYY');
  seq int;
  result text;
begin
  select count(*) + 1
  into seq
  from invoices
  where company_id = company
    and extract(year from created_at) = extract(year from now());

  result := 'MC-' || year_str || '-' || lpad(seq::text, 4, '0');
  return result;
end;
$$;

-- Generate sequential quote number: MC-OFF-2026-0001
create or replace function generate_quote_number(company uuid)
returns text language plpgsql as $$
declare
  year_str text := to_char(now(), 'YYYY');
  seq int;
  result text;
begin
  select count(*) + 1
  into seq
  from quotes
  where company_id = company
    and extract(year from created_at) = extract(year from now());

  result := 'MC-OFF-' || year_str || '-' || lpad(seq::text, 4, '0');
  return result;
end;
$$;

-- Log activity automatically
create or replace function log_activity(
  p_actor_id    uuid,
  p_entity_type text,
  p_entity_id   uuid,
  p_action      text,
  p_metadata    jsonb default null
)
returns void language plpgsql security definer as $$
begin
  insert into activity_log (actor_id, entity_type, entity_id, action, metadata)
  values (p_actor_id, p_entity_type, p_entity_id, p_action, p_metadata);
end;
$$;

-- Auto-log appointment status changes
create or replace function log_appointment_status_change()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    insert into appointment_status_history (appointment_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, new.updated_by);
  end if;
  return new;
end;
$$;

-- Auto-mark invoice as overdue
create or replace function mark_overdue_invoices()
returns void language plpgsql security definer as $$
begin
  update invoices
  set status = 'overdue', updated_at = now()
  where status = 'sent'
    and due_date < current_date;
end;
$$;

-- Update maintenance schedule after completed appointment
create or replace function update_maintenance_schedule()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update maintenance_schedules
    set
      last_done_at = new.scheduled_date,
      next_due_at  = new.scheduled_date + (frequency_weeks * 7),
      updated_at   = now()
    where client_id = new.client_id
      and active = true;
  end if;
  return new;
end;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at on all relevant tables
create trigger trg_companies_updated_at before update on companies
  for each row execute function update_updated_at();
create trigger trg_branches_updated_at before update on branches
  for each row execute function update_updated_at();
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger trg_clients_updated_at before update on clients
  for each row execute function update_updated_at();
create trigger trg_services_updated_at before update on services
  for each row execute function update_updated_at();
create trigger trg_quotes_updated_at before update on quotes
  for each row execute function update_updated_at();
create trigger trg_appointments_updated_at before update on appointments
  for each row execute function update_updated_at();
create trigger trg_invoices_updated_at before update on invoices
  for each row execute function update_updated_at();
create trigger trg_employee_profiles_updated_at before update on employee_profiles
  for each row execute function update_updated_at();
create trigger trg_assets_updated_at before update on assets
  for each row execute function update_updated_at();

-- Appointment status history
create trigger trg_appointment_status_history
  after update on appointments
  for each row execute function log_appointment_status_change();

-- Maintenance schedule update on completion
create trigger trg_maintenance_schedule_update
  after update on appointments
  for each row execute function update_maintenance_schedule();

-- Auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- SEED: More Clean company & branch
-- ============================================================

insert into companies (id, name, kvk, vat_number)
values (
  'a1000000-0000-0000-0000-000000000001',
  'More Clean',
  '12345678',
  'NL123456789B01'
);

insert into branches (id, company_id, name, address, postal_code, city, phone, email, timezone)
values (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Roermond',
  'Voorbeeldstraat 1',
  '6041 AA',
  'Roermond',
  '+31613672320',
  'info@moreclean.nl',
  'Europe/Amsterdam'
);

-- Seed services
insert into services (company_id, name, category, default_price, unit, sort_order) values
  ('a1000000-0000-0000-0000-000000000001', 'Glasbewassing buiten',    'glasbewassing',  2.50, 'per_raam',   1),
  ('a1000000-0000-0000-0000-000000000001', 'Glasbewassing binnen',    'glasbewassing',  2.50, 'per_raam',   2),
  ('a1000000-0000-0000-0000-000000000001', 'Glasbewassing binnen+buiten', 'glasbewassing', 4.00, 'per_raam', 3),
  ('a1000000-0000-0000-0000-000000000001', 'Zonnepanelen reiniging',  'zonnepanelen',   8.00, 'per_paneel', 10),
  ('a1000000-0000-0000-0000-000000000001', 'Gevelreiniging',          'gevelreiniging', 95.00,'per_uur',    20),
  ('a1000000-0000-0000-0000-000000000001', 'Kantoorschoonmaak',       'schoonmaak',     45.00,'per_uur',    30);
