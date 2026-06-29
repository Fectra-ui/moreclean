-- 019: Expliciet client_type veld (company | private)
-- Vervangt is_company boolean als primaire type-indicator.

alter table public.clients
  add column if not exists client_type text not null default 'company'
    check (client_type in ('company', 'private'));

-- Backfill vanuit is_company
update public.clients
  set client_type = case when is_company then 'company' else 'private' end
  where true;

create index if not exists idx_clients_client_type
  on public.clients (company_id, client_type);
