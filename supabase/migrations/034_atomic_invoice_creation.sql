-- Atomic invoice persistence. Apply separately after TEST approval.
-- No existing rows, RLS policies or legacy generator are changed.
begin;

create function public.create_invoice_atomic(p_invoice jsonb, p_items jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_company uuid;
  v_year text := pg_catalog.to_char(pg_catalog.now(), 'YYYY');
  v_next bigint;
  v_number text;
  v_id uuid;
  v_item jsonb;
  v_client uuid := (p_invoice->>'client_id')::uuid;
begin
  if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Invoice operation requires read committed isolation';
  end if;
  -- The JWT identity, never a caller-supplied actor/company, determines access.
  select company_id into v_company from public.profiles
    where id = v_actor and role = 'admin' and active is true for share;
  if v_company is null then raise exception 'Invoice operation not authorized'; end if;
  if pg_catalog.jsonb_typeof(p_items) is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_invoice) is distinct from 'object' then
    raise exception 'Invalid invoice request';
  end if;

  -- Self-exclusive and conflicting with INSERT/UPDATE/DELETE, including legacy writers.
  -- Held until transaction end; ordinary reads can continue.
  lock table public.invoices in share row exclusive mode;
  if exists (select 1 from public.invoices where company_id = v_company
      and invoice_number !~ '^MC-[0-9]{4}-[0-9]{4}$'
      and invoice_number !~ '^MC-CREDIT-[0-9]+$')
    or exists (select 1 from public.invoices where company_id = v_company
      group by invoice_number having count(*) > 1) then
    raise exception 'Existing invoice numbers require review';
  end if;
  select greatest(
    (select count(*) from public.invoices where company_id = v_company
      and extract(year from created_at) = extract(year from pg_catalog.now())),
    coalesce(max(split_part(invoice_number, '-', 3)::bigint), 0)
  ) + 1 into v_next from public.invoices
    where company_id = v_company and invoice_number ~ ('^MC-' || v_year || '-[0-9]{4}$');
  if v_next > 9999 then raise exception 'Invoice number range exhausted'; end if;
  v_number := 'MC-' || v_year || '-' || pg_catalog.lpad(v_next::text, 4, '0');

  perform 1 from public.clients where id = v_client and company_id = v_company for share;
  if not found then raise exception 'Invoice relation not available'; end if;
  if p_invoice->>'quote_id' is not null then
    perform 1 from public.quotes where id = (p_invoice->>'quote_id')::uuid
      and company_id = v_company and client_id = v_client for share;
    if not found then raise exception 'Invoice relation not available'; end if;
  end if;
  if p_invoice->>'appointment_id' is not null then
    perform 1 from public.appointments where id = (p_invoice->>'appointment_id')::uuid
      and company_id = v_company and client_id = v_client for share;
    if not found then raise exception 'Invoice relation not available'; end if;
  end if;
  for v_item in select value from pg_catalog.jsonb_array_elements(p_items) loop
    if v_item->>'service_id' is not null then
      perform 1 from public.services where id = (v_item->>'service_id')::uuid
        and (company_id = v_company or company_id is null) for share;
      if not found then raise exception 'Invoice service not available'; end if;
    end if;
  end loop;

  insert into public.invoices (company_id, client_id, appointment_id, quote_id,
    invoice_number, status, type, issue_date, due_date, subtotal, discount_pct,
    vat_rate, vat_amount, total, notes, created_by)
  values (v_company, v_client, (p_invoice->>'appointment_id')::uuid, (p_invoice->>'quote_id')::uuid,
    v_number, 'draft', 'invoice', (p_invoice->>'issue_date')::date, (p_invoice->>'due_date')::date,
    (p_invoice->>'subtotal')::numeric, (p_invoice->>'discount_pct')::numeric,
    (p_invoice->>'vat_rate')::numeric, (p_invoice->>'vat_amount')::numeric,
    (p_invoice->>'total')::numeric, p_invoice->>'notes', v_actor)
  returning id into v_id;
  insert into public.invoice_items (invoice_id, service_id, description, quantity, unit_price, total_price, sort_order)
    select v_id, (item->>'service_id')::uuid, item->>'description',
      (item->>'quantity')::numeric, (item->>'unit_price')::numeric,
      (item->>'total_price')::numeric, (ordinality - 1)::integer
    from pg_catalog.jsonb_array_elements(p_items) with ordinality as entries(item, ordinality);
  -- No exception handler: any failure rolls back both header and lines.
  return pg_catalog.jsonb_build_object('id', v_id, 'invoice_number', v_number);
end;
$$;

create function public.create_credit_invoice_atomic(p_original_id uuid, p_today date)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_actor uuid := auth.uid();
  v_company uuid;
  v_original public.invoices%rowtype;
  v_year text := pg_catalog.to_char(pg_catalog.now(), 'YYYY');
  v_next bigint;
  v_number text;
  v_id uuid;
  v_client_name text;
begin
  if pg_catalog.current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Invoice operation requires read committed isolation';
  end if;
  select company_id into v_company from public.profiles
    where id = v_actor and role = 'admin' and active is true for share;
  if v_company is null then raise exception 'Invoice operation not authorized'; end if;
  lock table public.invoices in share row exclusive mode;
  select * into v_original from public.invoices where id = p_original_id and company_id = v_company;
  if not found then raise exception 'Original invoice not available'; end if;
  select coalesce(company_name, contact_name) into v_client_name
    from public.clients where id = v_original.client_id and company_id = v_company for share;
  if not found then raise exception 'Invoice relation not available'; end if;
  if exists (select 1 from public.invoices where company_id = v_company
      and invoice_number !~ '^MC-[0-9]{4}-[0-9]{4}$'
      and invoice_number !~ '^MC-CREDIT-[0-9]+$')
    or exists (select 1 from public.invoices where company_id = v_company
      group by invoice_number having count(*) > 1) then
    raise exception 'Existing invoice numbers require review';
  end if;
  select greatest(
    (select count(*) from public.invoices where company_id = v_company
      and extract(year from created_at) = extract(year from pg_catalog.now())),
    coalesce(max(split_part(invoice_number, '-', 3)::bigint), 0)
  ) + 1 into v_next from public.invoices
    where company_id = v_company and invoice_number ~ ('^MC-' || v_year || '-[0-9]{4}$');
  if v_next > 9999 then raise exception 'Invoice number range exhausted'; end if;
  v_number := 'MC-' || v_year || '-' || pg_catalog.lpad(v_next::text, 4, '0');
  -- Snapshot source lines while copying; conflict with line edits/deletion.
  lock table public.invoice_items in share mode;
  insert into public.invoices (company_id, client_id, invoice_number, status, type, credit_of,
    issue_date, due_date, subtotal, discount_pct, vat_rate, vat_amount, total, notes, created_by)
  values (v_company, v_original.client_id, v_number, 'draft', 'credit', p_original_id,
    p_today, p_today, -v_original.subtotal, v_original.discount_pct, v_original.vat_rate,
    -v_original.vat_amount, -v_original.total, 'Creditfactuur voor ' || v_original.invoice_number, v_actor)
  returning id into v_id;
  insert into public.invoice_items (invoice_id, description, quantity, unit_price, total_price, sort_order)
    select v_id, description, -quantity, unit_price, -total_price, sort_order
      from public.invoice_items where invoice_id = p_original_id;
  return pg_catalog.jsonb_build_object('id', v_id, 'invoice_number', v_number,
    'client_id', v_original.client_id, 'client_name', v_client_name,
    'original_total', v_original.total);
end;
$$;

revoke all on function public.create_invoice_atomic(jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.create_credit_invoice_atomic(uuid, date) from public, anon, authenticated, service_role;
grant execute on function public.create_invoice_atomic(jsonb, jsonb) to authenticated;
grant execute on function public.create_credit_invoice_atomic(uuid, date) to authenticated;
commit;
