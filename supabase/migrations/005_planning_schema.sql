-- ============================================================
-- MORE CLEAN — FASE 3: PLANNING & UITVOERING
-- Migration 005: Checklists, materialen, tijdregistratie,
--                afwezigheid, notificatiebus
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

create type absence_type as enum ('vacation', 'sick', 'personal', 'training', 'other');
create type time_log_type as enum ('work', 'travel', 'break', 'wait');

-- ============================================================
-- CHECKLIST TEMPLATES (per dienst)
-- ============================================================

create table checklist_templates (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid references public.companies(id) on delete cascade,
  service_id  uuid references public.services(id) on delete set null,
  name        text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table checklist_template_items (
  id          uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  label       text not null,
  description text,
  required    boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- APPOINTMENT CHECKLISTS (instantie per afspraak)
-- ============================================================

create table appointment_checklists (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  template_id     uuid references public.checklist_templates(id) on delete set null,
  template_name   text not null,  -- snapshot name at creation time
  created_at      timestamptz not null default now()
);

create table appointment_checklist_items (
  id              uuid primary key default uuid_generate_v4(),
  checklist_id    uuid not null references public.appointment_checklists(id) on delete cascade,
  template_item_id uuid references public.checklist_template_items(id) on delete set null,
  label           text not null,  -- snapshot label
  required        boolean not null default false,
  sort_order      int not null default 0,
  checked         boolean not null default false,
  checked_at      timestamptz,
  checked_by      uuid references public.profiles(id) on delete set null,
  note            text
);

-- ============================================================
-- APPOINTMENT MATERIALS (gebruikte materialen)
-- ============================================================

create table appointment_materials (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  asset_id        uuid references public.assets(id) on delete set null,
  name            text not null,      -- free text fallback if no asset
  quantity        numeric(10,2) not null default 1,
  unit            text,               -- 'liter', 'stuk', 'meter', etc.
  note            text,
  logged_by       uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- APPOINTMENT TIME LOGS (tijdregistratie)
-- ============================================================

create table appointment_time_logs (
  id              uuid primary key default uuid_generate_v4(),
  appointment_id  uuid not null references public.appointments(id) on delete cascade,
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  type            time_log_type not null default 'work',
  started_at      timestamptz not null,
  ended_at        timestamptz,
  duration_min    int generated always as (
    case when ended_at is not null
    then extract(epoch from (ended_at - started_at))::int / 60
    else null end
  ) stored,
  note            text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- EMPLOYEE ABSENCE (extended from employee_availability)
-- Separate table so absence spans can be multi-day ranges
-- ============================================================

create table employee_absences (
  id            uuid primary key default uuid_generate_v4(),
  employee_id   uuid not null references public.profiles(id) on delete cascade,
  type          absence_type not null default 'vacation',
  starts_on     date not null,
  ends_on       date not null,
  approved      boolean,
  approved_by   uuid references public.profiles(id) on delete set null,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (ends_on >= starts_on)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_checklist_templates_service on public.checklist_templates(service_id);
create index idx_appt_checklists_appointment on public.appointment_checklists(appointment_id);
create index idx_appt_checklist_items_checklist on public.appointment_checklist_items(checklist_id);
create index idx_appt_materials_appointment on public.appointment_materials(appointment_id);
create index idx_appt_time_logs_appointment on public.appointment_time_logs(appointment_id);
create index idx_appt_time_logs_employee on public.appointment_time_logs(employee_id);
create index idx_employee_absences_employee on public.employee_absences(employee_id);
create index idx_employee_absences_dates on public.employee_absences(starts_on, ends_on);
create index idx_notifications_recipient_read on public.notifications(recipient_id, read_at);

-- ============================================================
-- RLS
-- ============================================================

alter table public.checklist_templates enable row level security;
alter table public.checklist_template_items enable row level security;
alter table public.appointment_checklists enable row level security;
alter table public.appointment_checklist_items enable row level security;
alter table public.appointment_materials enable row level security;
alter table public.appointment_time_logs enable row level security;
alter table public.employee_absences enable row level security;

-- Admins: full access
create policy "Admin: full on checklist_templates" on public.checklist_templates
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "Admin: full on checklist_template_items" on public.checklist_template_items
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "Admin: full on appointment_checklists" on public.appointment_checklists
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "Admin: full on appointment_checklist_items" on public.appointment_checklist_items
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "Admin: full on appointment_materials" on public.appointment_materials
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "Admin: full on appointment_time_logs" on public.appointment_time_logs
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

create policy "Admin: full on employee_absences" on public.employee_absences
  using (public.auth_role() = 'admin') with check (public.auth_role() = 'admin');

-- Employees: own appointments only
create policy "Employee: read assigned checklists" on public.appointment_checklists
  for select using (
    public.auth_role() = 'employee'
    and exists (
      select 1 from public.appointment_employees ae
      where ae.appointment_id = appointment_checklists.appointment_id
        and ae.employee_id = auth.uid()
    )
  );

create policy "Employee: update own checklist items" on public.appointment_checklist_items
  for update using (
    public.auth_role() = 'employee'
    and exists (
      select 1 from public.appointment_checklists ac
      join public.appointment_employees ae on ae.appointment_id = ac.appointment_id
      where ac.id = appointment_checklist_items.checklist_id
        and ae.employee_id = auth.uid()
    )
  );

create policy "Employee: read own checklist items" on public.appointment_checklist_items
  for select using (
    public.auth_role() = 'employee'
    and exists (
      select 1 from public.appointment_checklists ac
      join public.appointment_employees ae on ae.appointment_id = ac.appointment_id
      where ac.id = appointment_checklist_items.checklist_id
        and ae.employee_id = auth.uid()
    )
  );

create policy "Employee: manage own materials" on public.appointment_materials
  for all using (
    public.auth_role() = 'employee'
    and exists (
      select 1 from public.appointment_employees ae
      where ae.appointment_id = appointment_materials.appointment_id
        and ae.employee_id = auth.uid()
    )
  );

create policy "Employee: manage own time logs" on public.appointment_time_logs
  for all using (
    public.auth_role() = 'employee'
    and employee_id = auth.uid()
  );

create policy "Employee: read own absences" on public.employee_absences
  for select using (
    public.auth_role() = 'employee'
    and employee_id = auth.uid()
  );

create policy "Employee: insert own absence requests" on public.employee_absences
  for insert with check (
    public.auth_role() = 'employee'
    and employee_id = auth.uid()
  );

-- Templates: readable by employees
create policy "Employee: read checklist templates" on public.checklist_templates
  for select using (public.auth_role() in ('admin', 'employee'));

create policy "Employee: read checklist template items" on public.checklist_template_items
  for select using (public.auth_role() in ('admin', 'employee'));

-- ============================================================
-- SEED: Checklist templates voor More Clean diensten
-- ============================================================

-- Glasbewassing template
insert into public.checklist_templates (id, company_id, name) values
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Glasbewassing'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Zonnepanelen reiniging'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Reguliere schoonmaak');

insert into public.checklist_template_items (template_id, label, required, sort_order) values
  -- Glasbewassing
  ('c1000000-0000-0000-0000-000000000001', 'Kozijnen gecontroleerd op beschadigingen', false, 1),
  ('c1000000-0000-0000-0000-000000000001', 'Vensterbanken vrij gemaakt', false, 2),
  ('c1000000-0000-0000-0000-000000000001', 'Binnenzijde gereinigd', true, 3),
  ('c1000000-0000-0000-0000-000000000001', 'Buitenzijde gereinigd', true, 4),
  ('c1000000-0000-0000-0000-000000000001', 'Ramen nagekeken op strepen', true, 5),
  ('c1000000-0000-0000-0000-000000000001', 'Klant akkoord gegeven', true, 6),
  -- Zonnepanelen
  ('c1000000-0000-0000-0000-000000000002', 'Visuele inspectie panelen', true, 1),
  ('c1000000-0000-0000-0000-000000000002', 'Reiniging uitgevoerd', true, 2),
  ('c1000000-0000-0000-0000-000000000002', 'Panelen gecontroleerd na reiniging', true, 3),
  ('c1000000-0000-0000-0000-000000000002', 'Opmerkingen genoteerd', false, 4),
  -- Schoonmaak
  ('c1000000-0000-0000-0000-000000000003', 'Vloeren gestofzuigd', true, 1),
  ('c1000000-0000-0000-0000-000000000003', 'Vloeren gedweild', true, 2),
  ('c1000000-0000-0000-0000-000000000003', 'Sanitair gereinigd', true, 3),
  ('c1000000-0000-0000-0000-000000000003', 'Keuken/pantry gereinigd', false, 4),
  ('c1000000-0000-0000-0000-000000000003', 'Afval afzonderlijk', false, 5),
  ('c1000000-0000-0000-0000-000000000003', 'Klant akkoord gegeven', true, 6);
