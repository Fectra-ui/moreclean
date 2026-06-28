-- ============================================================
-- MORE CLEAN — ROW LEVEL SECURITY
-- Migration 002: RLS policies
--
-- Strategy:
--   admin   → full access to their company's data
--   employee → own schedule, own profile, own messages
--   customer → own data only (quotes, invoices, appointments, files, messages)
--
-- NEVER filter in frontend — all enforced in PostgreSQL.
-- ============================================================

-- Helper function: get current user's role (cached in JWT claim)
create or replace function auth_role()
returns user_role language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper function: get current user's company_id
create or replace function auth_company_id()
returns uuid language sql stable security definer as $$
  select company_id from profiles where id = auth.uid();
$$;

-- Helper function: get client_id linked to current user (customer portal)
create or replace function auth_client_id()
returns uuid language sql stable security definer as $$
  select id from clients where profile_id = auth.uid() limit 1;
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

alter table companies                   enable row level security;
alter table branches                    enable row level security;
alter table profiles                    enable row level security;
alter table employee_profiles           enable row level security;
alter table employee_availability       enable row level security;
alter table services                    enable row level security;
alter table clients                     enable row level security;
alter table maintenance_schedules       enable row level security;
alter table assets                      enable row level security;
alter table quotes                      enable row level security;
alter table quote_items                 enable row level security;
alter table appointments                enable row level security;
alter table appointment_employees       enable row level security;
alter table appointment_services        enable row level security;
alter table appointment_status_history  enable row level security;
alter table appointment_signatures      enable row level security;
alter table files                       enable row level security;
alter table invoices                    enable row level security;
alter table invoice_items               enable row level security;
alter table invoice_reminders           enable row level security;
alter table conversations               enable row level security;
alter table messages                    enable row level security;
alter table notifications               enable row level security;
alter table activity_log                enable row level security;
alter table assets                      enable row level security;

-- ============================================================
-- COMPANIES
-- ============================================================

create policy "Admin: full company access"
  on companies for all
  using (auth_role() = 'admin');

create policy "Employee/customer: read own company"
  on companies for select
  using (
    auth_role() in ('employee', 'customer')
    and id = auth_company_id()
  );

-- ============================================================
-- BRANCHES
-- ============================================================

create policy "Admin: full branch access"
  on branches for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

create policy "Employee: read own branch"
  on branches for select
  using (auth_role() = 'employee' and company_id = auth_company_id());

-- ============================================================
-- PROFILES
-- ============================================================

-- Own profile: always readable/writable
create policy "Own profile: read"
  on profiles for select
  using (id = auth.uid());

create policy "Own profile: update"
  on profiles for update
  using (id = auth.uid());

-- Admin: full access to company profiles
create policy "Admin: full profile access"
  on profiles for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

-- Employee: read other employees (for scheduling view)
create policy "Employee: read colleagues"
  on profiles for select
  using (
    auth_role() = 'employee'
    and role = 'employee'
    and company_id = auth_company_id()
  );

-- ============================================================
-- EMPLOYEE PROFILES & AVAILABILITY
-- ============================================================

create policy "Admin: full employee_profiles access"
  on employee_profiles for all
  using (auth_role() = 'admin');

create policy "Employee: own employee_profile"
  on employee_profiles for select
  using (profile_id = auth.uid());

create policy "Employee: update own employee_profile"
  on employee_profiles for update
  using (profile_id = auth.uid());

create policy "Admin: full employee_availability"
  on employee_availability for all
  using (auth_role() = 'admin');

create policy "Employee: own availability"
  on employee_availability for all
  using (employee_id = auth.uid());

-- ============================================================
-- SERVICES
-- ============================================================

-- Services are read-only for employees/customers
create policy "Admin: full service access"
  on services for all
  using (auth_role() = 'admin' and (company_id = auth_company_id() or company_id is null));

create policy "Authenticated: read active services"
  on services for select
  using (
    auth.uid() is not null
    and active = true
    and (company_id = auth_company_id() or company_id is null)
  );

-- ============================================================
-- CLIENTS
-- ============================================================

create policy "Admin: full client access"
  on clients for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

create policy "Employee: read clients"
  on clients for select
  using (auth_role() = 'employee' and company_id = auth_company_id());

-- Customer: only own record
create policy "Customer: own client record"
  on clients for select
  using (profile_id = auth.uid());

create policy "Customer: update own client record"
  on clients for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ============================================================
-- MAINTENANCE SCHEDULES
-- ============================================================

create policy "Admin: full maintenance_schedules"
  on maintenance_schedules for all
  using (
    auth_role() = 'admin'
    and client_id in (select id from clients where company_id = auth_company_id())
  );

create policy "Employee: read maintenance_schedules"
  on maintenance_schedules for select
  using (
    auth_role() = 'employee'
    and client_id in (select id from clients where company_id = auth_company_id())
  );

create policy "Customer: own maintenance_schedules"
  on maintenance_schedules for select
  using (client_id = auth_client_id());

-- ============================================================
-- ASSETS
-- ============================================================

create policy "Admin: full asset access"
  on assets for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

create policy "Employee: read assets"
  on assets for select
  using (auth_role() = 'employee' and company_id = auth_company_id());

-- ============================================================
-- QUOTES
-- ============================================================

create policy "Admin: full quote access"
  on quotes for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

create policy "Customer: own quotes (sent/accepted/rejected only)"
  on quotes for select
  using (
    client_id = auth_client_id()
    and status in ('sent', 'accepted', 'rejected')
  );

create policy "Admin: full quote_items"
  on quote_items for all
  using (
    auth_role() = 'admin'
    and quote_id in (select id from quotes where company_id = auth_company_id())
  );

create policy "Customer: own quote_items"
  on quote_items for select
  using (
    quote_id in (
      select id from quotes
      where client_id = auth_client_id()
        and status in ('sent', 'accepted', 'rejected')
    )
  );

-- ============================================================
-- APPOINTMENTS
-- ============================================================

create policy "Admin: full appointment access"
  on appointments for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

-- Employee: only assigned appointments
create policy "Employee: assigned appointments"
  on appointments for select
  using (
    auth_role() = 'employee'
    and id in (
      select appointment_id from appointment_employees where employee_id = auth.uid()
    )
  );

create policy "Employee: update assigned appointment status"
  on appointments for update
  using (
    auth_role() = 'employee'
    and id in (
      select appointment_id from appointment_employees where employee_id = auth.uid()
    )
  )
  with check (
    status in ('in_progress', 'completed') -- employees can only move forward
  );

-- Customer: own appointments (scheduled/completed only)
create policy "Customer: own appointments"
  on appointments for select
  using (
    client_id = auth_client_id()
    and status in ('scheduled', 'completed', 'cancelled')
  );

-- appointment_employees
create policy "Admin: full appointment_employees"
  on appointment_employees for all
  using (auth_role() = 'admin');

create policy "Employee: own assignment records"
  on appointment_employees for select
  using (employee_id = auth.uid());

create policy "Customer: see employees on own appointments"
  on appointment_employees for select
  using (
    appointment_id in (select id from appointments where client_id = auth_client_id())
  );

-- appointment_services
create policy "Admin: full appointment_services"
  on appointment_services for all
  using (
    auth_role() = 'admin'
    and appointment_id in (select id from appointments where company_id = auth_company_id())
  );

create policy "Employee: read appointment_services for assigned"
  on appointment_services for select
  using (
    appointment_id in (
      select appointment_id from appointment_employees where employee_id = auth.uid()
    )
  );

create policy "Customer: own appointment_services"
  on appointment_services for select
  using (
    appointment_id in (select id from appointments where client_id = auth_client_id())
  );

-- appointment_status_history
create policy "Admin: full status history"
  on appointment_status_history for all
  using (
    auth_role() = 'admin'
    and appointment_id in (select id from appointments where company_id = auth_company_id())
  );

create policy "Employee: read status history for assigned"
  on appointment_status_history for select
  using (
    appointment_id in (
      select appointment_id from appointment_employees where employee_id = auth.uid()
    )
  );

-- appointment_signatures
create policy "Admin: full signatures"
  on appointment_signatures for all
  using (
    auth_role() = 'admin'
    and appointment_id in (select id from appointments where company_id = auth_company_id())
  );

create policy "Employee: insert signature on assigned appointment"
  on appointment_signatures for insert
  with check (
    appointment_id in (
      select appointment_id from appointment_employees where employee_id = auth.uid()
    )
  );

-- ============================================================
-- FILES
-- ============================================================

create policy "Admin: full file access"
  on files for all
  using (auth_role() = 'admin');

create policy "Employee: read files on assigned appointments"
  on files for select
  using (
    auth_role() = 'employee'
    and owner_type = 'appointment'
    and owner_id in (
      select appointment_id from appointment_employees where employee_id = auth.uid()
    )
  );

create policy "Employee: upload files on assigned appointments"
  on files for insert
  with check (
    auth_role() = 'employee'
    and owner_type = 'appointment'
    and owner_id in (
      select appointment_id from appointment_employees where employee_id = auth.uid()
    )
  );

create policy "Customer: own files"
  on files for select
  using (
    (owner_type = 'appointment' and owner_id in (
      select id from appointments where client_id = auth_client_id()
    ))
    or (owner_type = 'quote' and owner_id in (
      select id from quotes where client_id = auth_client_id()
    ))
    or (owner_type = 'invoice' and owner_id in (
      select id from invoices where client_id = auth_client_id()
    ))
  );

-- ============================================================
-- INVOICES
-- ============================================================

create policy "Admin: full invoice access"
  on invoices for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

create policy "Customer: own invoices"
  on invoices for select
  using (
    client_id = auth_client_id()
    and status in ('sent', 'paid', 'overdue')
  );

create policy "Admin: full invoice_items"
  on invoice_items for all
  using (
    auth_role() = 'admin'
    and invoice_id in (select id from invoices where company_id = auth_company_id())
  );

create policy "Customer: own invoice_items"
  on invoice_items for select
  using (
    invoice_id in (
      select id from invoices where client_id = auth_client_id()
    )
  );

create policy "Admin: full invoice_reminders"
  on invoice_reminders for all
  using (
    auth_role() = 'admin'
    and invoice_id in (select id from invoices where company_id = auth_company_id())
  );

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================

create policy "Admin: full conversation access"
  on conversations for all
  using (auth_role() = 'admin' and company_id = auth_company_id());

create policy "Customer: own conversations"
  on conversations for select
  using (client_id = auth_client_id());

create policy "Customer: create conversation"
  on conversations for insert
  with check (client_id = auth_client_id());

create policy "Admin: full message access"
  on messages for all
  using (
    auth_role() = 'admin'
    and conversation_id in (select id from conversations where company_id = auth_company_id())
  );

create policy "Customer: read own messages"
  on messages for select
  using (
    conversation_id in (select id from conversations where client_id = auth_client_id())
  );

create policy "Customer: send messages"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and conversation_id in (select id from conversations where client_id = auth_client_id())
  );

create policy "Employee: read assigned appointment conversations"
  on messages for select
  using (
    auth_role() = 'employee'
    and conversation_id in (
      select c.id from conversations c
      join appointments a on a.client_id = c.client_id
      join appointment_employees ae on ae.appointment_id = a.id
      where ae.employee_id = auth.uid()
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create policy "Own notifications only"
  on notifications for select
  using (recipient_id = auth.uid());

create policy "Mark own notifications read"
  on notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "Admin/system: insert notifications"
  on notifications for insert
  with check (auth_role() = 'admin' or auth.role() = 'service_role');

-- ============================================================
-- ACTIVITY LOG
-- ============================================================

create policy "Admin: read activity log"
  on activity_log for select
  using (auth_role() = 'admin');

-- Only service_role can insert (via server-side functions)
create policy "Service role: insert activity log"
  on activity_log for insert
  with check (auth.role() = 'service_role');
