-- ============================================================
-- MORE CLEAN — SECURITY HARDENING
-- Migration 004: Remediation of Supabase security linter findings
-- ============================================================

-- ============================================================
-- 1. VIEWS: Recreate with SECURITY INVOKER
--    Supabase flagged all three views as SECURITY DEFINER.
--    SECURITY DEFINER views bypass the querying user's RLS
--    and run as the view creator — this defeats the whole RLS
--    model. SECURITY INVOKER views respect the caller's RLS.
-- ============================================================

drop view if exists public.v_appointments_today;
drop view if exists public.v_invoices_overview;
drop view if exists public.v_employee_schedule;

create view public.v_appointments_today
  with (security_invoker = on)
as
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
  from public.appointments a
  join public.clients c on c.id = a.client_id
  left join public.appointment_employees ae on ae.appointment_id = a.id
  where a.scheduled_date = current_date
  group by a.id, c.id;

create view public.v_invoices_overview
  with (security_invoker = on)
as
  select
    i.*,
    c.contact_name,
    c.company_name,
    c.email as client_email,
    case
      when i.status = 'sent' and i.due_date < current_date then 'overdue'
      else i.status::text
    end as computed_status
  from public.invoices i
  join public.clients c on c.id = i.client_id;

create view public.v_employee_schedule
  with (security_invoker = on)
as
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
  from public.appointment_employees ae
  join public.appointments a on a.id = ae.appointment_id
  join public.clients c on c.id = a.client_id
  order by a.scheduled_date, a.scheduled_start;

-- ============================================================
-- 2. FUNCTIONS: Add SET search_path = ''
--    Without a fixed search_path, a malicious user could
--    create objects in a schema that shadows system functions
--    (search_path injection). Setting it to empty string and
--    using fully qualified names closes this attack vector.
-- ============================================================

-- Helper: auth_role
-- SECURITY INVOKER: runs as the calling user, who has SELECT on their own
-- profile row via RLS. No SECURITY DEFINER needed — avoids the linter warning
-- while keeping correct behavior (anon → NULL, authenticated → their role).
create or replace function public.auth_role()
returns public.user_role
language sql
stable
security invoker
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: auth_company_id
create or replace function public.auth_company_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- Helper: auth_client_id
create or replace function public.auth_client_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select id from public.clients where profile_id = auth.uid() limit 1;
$$;

-- Trigger: update_updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Utility: generate_invoice_number
create or replace function public.generate_invoice_number(company uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  year_str text := to_char(now(), 'YYYY');
  seq int;
  result text;
begin
  select count(*) + 1
  into seq
  from public.invoices
  where company_id = company
    and extract(year from created_at) = extract(year from now());

  result := 'MC-' || year_str || '-' || lpad(seq::text, 4, '0');
  return result;
end;
$$;

-- Utility: generate_quote_number
create or replace function public.generate_quote_number(company uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  year_str text := to_char(now(), 'YYYY');
  seq int;
  result text;
begin
  select count(*) + 1
  into seq
  from public.quotes
  where company_id = company
    and extract(year from created_at) = extract(year from now());

  result := 'MC-OFF-' || year_str || '-' || lpad(seq::text, 4, '0');
  return result;
end;
$$;

-- Utility: log_activity
create or replace function public.log_activity(
  p_actor_id    uuid,
  p_entity_type text,
  p_entity_id   uuid,
  p_action      text,
  p_metadata    jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
  values (p_actor_id, p_entity_type, p_entity_id, p_action, p_metadata);
end;
$$;

-- Trigger: log_appointment_status_change
create or replace function public.log_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.appointment_status_history (appointment_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, new.updated_by);
  end if;
  return new;
end;
$$;

-- Cron: mark_overdue_invoices
create or replace function public.mark_overdue_invoices()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.invoices
  set status = 'overdue', updated_at = now()
  where status = 'sent'
    and due_date < current_date;
end;
$$;

-- Trigger: update_maintenance_schedule
create or replace function public.update_maintenance_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    update public.maintenance_schedules
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

-- Auth trigger: handle_new_user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'customer')
  );
  return new;
end;
$$;

-- ============================================================
-- 3. REVOKE EXECUTE from PUBLIC
--
--    The three RLS helpers (auth_role, auth_company_id,
--    auth_client_id) were converted to SECURITY INVOKER above,
--    so they no longer trigger the linter — nothing to revoke.
--
--    For everything else: revoke from PUBLIC (which covers both
--    anon and authenticated). Supabase grants ALL EXECUTE on
--    public schema to service_role by default, so server-side
--    code using the service key is unaffected.
--
--    Trigger functions are invoked by Postgres itself and do not
--    need any role-level EXECUTE permission to run.
-- ============================================================

-- Trigger-only: remove REST API exposure
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.log_appointment_status_change() from public;
revoke execute on function public.update_maintenance_schedule() from public;
revoke execute on function public.update_updated_at() from public;

-- Admin/cron: called server-side only (service_role retains access via Supabase defaults)
revoke execute on function public.mark_overdue_invoices() from public;
revoke execute on function public.log_activity(uuid, text, uuid, text, jsonb) from public;
revoke execute on function public.generate_invoice_number(uuid) from public;
revoke execute on function public.generate_quote_number(uuid) from public;

-- ============================================================
-- 4. pg_trgm: Move from public to extensions schema
--    Extensions in the public schema expose their functions
--    via PostgREST and can clash with user-defined objects.
--    The extensions schema is not exposed via the API.
-- ============================================================

-- Note: Moving an extension requires dropping and recreating it.
-- The gin index on clients uses pg_trgm — drop it first, then
-- recreate it after moving the extension.

drop index if exists public.idx_clients_search;
drop extension if exists pg_trgm;

create extension if not exists pg_trgm schema extensions;

-- Recreate the full-text search index using the extension in its new schema
create index idx_clients_search on public.clients using gin(
  (
    to_tsvector('dutch',
      coalesce(company_name, '') || ' ' ||
      contact_name || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(city, '')
    )
  )
);

-- ============================================================
-- 5. Avatars bucket: Restrict SELECT policy
--    A broad SELECT policy on a public bucket allows listing
--    all files. Public buckets don't need a SELECT policy at
--    all — object URLs are accessible by URL without it.
--    Replace the broad policy with an owner-scoped one for
--    operations that actually need DB-level auth.
-- ============================================================

drop policy if exists "Avatar: public read" on storage.objects;

-- Objects in the avatars bucket are readable by URL (public bucket).
-- For authenticated listing (e.g. own avatar), scope to own folder.
create policy "Avatar: authenticated read own"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (
      -- Own folder (authenticated users)
      auth.uid()::text = (storage.foldername(name))[1]
      -- Or the file is in the root (e.g. company logo — no folder)
      or array_length(storage.foldername(name), 1) = 0
    )
  );
