-- Migration 016: payment tracking on quotes
alter table public.quotes
  add column if not exists payment_received_at timestamptz,
  add column if not exists payment_reference    text;
