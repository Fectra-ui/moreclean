-- ============================================================
-- MORE CLEAN — STORAGE BUCKETS
-- Migration 003: Supabase Storage
-- ============================================================

-- Avatars (public read, own write)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Client files: photos, documents, contracts
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clients', 'clients', false,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Appointment photos (before/during/after)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'appointments', 'appointments', false,
  20971520, -- 20MB (photos can be high-res)
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Quote PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quotes', 'quotes', false,
  5242880,
  array['application/pdf']
);

-- Invoice PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices', 'invoices', false,
  5242880,
  array['application/pdf']
);

-- Signatures (base64 stored in DB, but file fallback here)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signatures', 'signatures', false,
  1048576, -- 1MB
  array['image/png', 'image/svg+xml']
);

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- AVATARS (public bucket)
create policy "Avatar: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Avatar: own upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatar: own update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- APPOINTMENTS (employees can upload for assigned, customers can read own)
create policy "Appointments: admin full access"
  on storage.objects for all
  using (
    bucket_id = 'appointments'
    and (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Appointments: employee upload for assigned"
  on storage.objects for insert
  with check (
    bucket_id = 'appointments'
    and auth.uid() in (
      select employee_id from appointment_employees
      where appointment_id = (storage.foldername(name))[1]::uuid
    )
  );

create policy "Appointments: employee read for assigned"
  on storage.objects for select
  using (
    bucket_id = 'appointments'
    and auth.uid() in (
      select employee_id from appointment_employees
      where appointment_id = (storage.foldername(name))[1]::uuid
    )
  );

create policy "Appointments: customer read own"
  on storage.objects for select
  using (
    bucket_id = 'appointments'
    and (storage.foldername(name))[1]::uuid in (
      select id from appointments
      where client_id = (select id from clients where profile_id = auth.uid())
    )
  );

-- QUOTES (admin full, customer read own)
create policy "Quotes: admin full"
  on storage.objects for all
  using (
    bucket_id = 'quotes'
    and (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Quotes: customer read own"
  on storage.objects for select
  using (
    bucket_id = 'quotes'
    and (storage.foldername(name))[1]::uuid in (
      select id from quotes
      where client_id = (select id from clients where profile_id = auth.uid())
    )
  );

-- INVOICES (admin full, customer read own)
create policy "Invoices: admin full"
  on storage.objects for all
  using (
    bucket_id = 'invoices'
    and (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Invoices: customer read own"
  on storage.objects for select
  using (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1]::uuid in (
      select id from invoices
      where client_id = (select id from clients where profile_id = auth.uid())
    )
  );

-- CLIENTS (admin full, customer read own folder)
create policy "Clients: admin full"
  on storage.objects for all
  using (
    bucket_id = 'clients'
    and (select role from profiles where id = auth.uid()) = 'admin'
  );

-- SIGNATURES (employee upload for assigned, admin full)
create policy "Signatures: admin full"
  on storage.objects for all
  using (
    bucket_id = 'signatures'
    and (select role from profiles where id = auth.uid()) = 'admin'
  );

create policy "Signatures: employee upload for assigned"
  on storage.objects for insert
  with check (
    bucket_id = 'signatures'
    and auth.uid() in (
      select employee_id from appointment_employees
      where appointment_id = (storage.foldername(name))[1]::uuid
    )
  );
