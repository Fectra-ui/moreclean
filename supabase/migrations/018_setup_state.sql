-- 018 SETUP STATE
-- Vervangt setup_progress JSONB in companies tabel.
-- Elke stap krijgt een eigen rij met timestamp.
create table if not exists public.setup_state (
  company_id uuid        not null references public.companies(id) on delete cascade,
  step       text        not null,
  completed_at timestamptz not null default now(),
  primary key (company_id, step)
);
alter table public.setup_state enable row level security;
create policy "service_only" on public.setup_state using (false) with check (false);
