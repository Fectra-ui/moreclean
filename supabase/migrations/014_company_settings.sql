-- Extend companies table with operational fields
alter table public.companies
  add column if not exists address          text,
  add column if not exists postal_code      text,
  add column if not exists city             text,
  add column if not exists phone            text,
  add column if not exists email            text,
  add column if not exists iban             text,
  add column if not exists boekhouder_email text,
  add column if not exists primary_color    text default '#4D7EBA',
  add column if not exists site_url         text;

-- Seed real placeholder data for More Clean
update public.companies
set
  address          = 'Voorbeeldstraat 1',
  postal_code      = '6041 AA',
  city             = 'Roermond',
  phone            = '+31 6 13672320',
  email            = 'info@moreclean.nl',
  iban             = 'NL00 RABO 0000 0000 00',
  primary_color    = '#4D7EBA',
  vat_number       = 'NL123456789B01',
  kvk              = '12345678'
where id = 'a1000000-0000-0000-0000-000000000001';

-- Storage bucket for company assets (logo, etc.)
-- Run this separately in Supabase dashboard or via CLI if bucket does not exist:
-- insert into storage.buckets (id, name, public) values ('company-assets', 'company-assets', true);
