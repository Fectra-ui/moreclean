-- Migration 017: workflow_state op quotes
-- Authoritative state machine naast de bestaande quote_status enum.
-- Text i.p.v. enum zodat nieuwe states uitbreidbaar zijn zonder ALTER TYPE.

alter table public.quotes
  add column if not exists workflow_state     text not null default 'concept',
  add column if not exists planned_at         timestamptz,
  add column if not exists work_started_at    timestamptz,
  add column if not exists work_completed_at  timestamptz,
  add column if not exists invoice_id         uuid references public.invoices(id) on delete set null;

-- Backfill vanuit bestaande status
update public.quotes set workflow_state = case
  when status = 'draft'     then 'concept'
  when status = 'sent'      then 'verzonden'
  when status = 'accepted'  and payment_received_at is null then 'wacht_betaling'
  when status = 'accepted'  and payment_received_at is not null then 'betaald'
  when status = 'rejected'  then 'afgewezen'
  when status = 'expired'   then 'verlopen'
  else 'concept'
end
where workflow_state = 'concept' and status != 'draft';

create index if not exists idx_quotes_workflow_state
  on public.quotes (company_id, workflow_state);
