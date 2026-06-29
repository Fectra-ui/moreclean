-- ============================================================
-- 015 SETUP WIZARD
-- Voortgangstracking voor de onboarding-wizard.
-- setup_completed_at: tijdstip waarop de wizard is afgerond.
-- setup_progress: per-stap voortgang als JSON zodat de wizard
--   altijd hervat kan worden op de eerste onvoltooide stap.
-- ============================================================

alter table public.companies
  add column if not exists setup_completed_at timestamptz;

alter table public.companies
  add column if not exists setup_progress jsonb not null default '{}'::jsonb;
