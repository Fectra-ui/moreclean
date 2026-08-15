-- Public buckets serve known object URLs without a SELECT policy.
-- Removing this broad policy prevents anonymous bucket listing.
drop policy if exists "Company assets: public read" on storage.objects;

-- This table is intentionally service-role-only. Explicit deny policies make
-- that intent visible to the linter while still exposing zero rows to clients.
drop policy if exists "Owner activation: deny client access" on public.owner_activation_codes;
create policy "Owner activation: deny client access"
  on public.owner_activation_codes
  for all
  to anon, authenticated
  using (false)
  with check (false);
