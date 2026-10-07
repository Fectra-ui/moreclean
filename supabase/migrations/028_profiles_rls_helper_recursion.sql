-- Resolve profiles RLS recursion without changing role/company semantics.
-- Existing function owners and EXECUTE grants are preserved by CREATE OR REPLACE.
begin;

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.auth_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

commit;
