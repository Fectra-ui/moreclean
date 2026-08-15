-- Eenmalige activatiecode voor het eerste eigenaaraccount.
-- Alleen de SHA-256 hash wordt opgeslagen; de leesbare code staat niet in de repository.
alter table public.profiles
  add column if not exists is_owner boolean not null default false;

-- Er kan binnen deze installatie maar één hoofdadmin/eigenaar zijn.
create unique index if not exists profiles_single_owner
  on public.profiles (is_owner)
  where is_owner = true;

create table if not exists public.owner_activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.owner_activation_codes enable row level security;
revoke all on public.owner_activation_codes from anon, authenticated;

insert into public.owner_activation_codes (code_hash, expires_at)
values (
  '05f20d966055591bc81f72fed1c0c08326b57d35885e7603c89e2718821bac91',
  now() + interval '90 days'
)
on conflict (code_hash) do nothing;
