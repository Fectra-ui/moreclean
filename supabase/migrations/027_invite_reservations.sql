-- Durable, server-only invite state. Auth email delivery is outside a database
-- transaction; an uncertain Auth response must never trigger an automatic resend.
create table public.invite_reservations (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null check (
    email_normalized = lower(btrim(email_normalized)) and email_normalized <> ''
  ),
  company_id uuid not null references public.companies(id),
  requested_role public.user_role not null,
  requested_by uuid references public.profiles(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  state text not null default 'reserved' check (
    state in ('reserved', 'identity_started', 'identity_created',
      'mail_started', 'mail_accepted', 'complete', 'failed')
  ),
  active boolean not null default true,
  auth_started_at timestamptz,
  mail_accepted_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  check (client_id is null or requested_role = 'customer'::public.user_role),
  check (active = (archived_at is null))
);

create unique index invite_reservations_active_email
  on public.invite_reservations (email_normalized) where active;

alter table public.invite_reservations enable row level security;
revoke all on public.invite_reservations from public, anon, authenticated;
grant select, insert, update on public.invite_reservations to service_role;

-- All RPCs are service-role-only; each rechecks the current database role and
-- company of the authenticated actor passed by the server route.
create function public.reserve_invite(
  p_actor uuid, p_email text, p_role public.user_role, p_company uuid
) returns public.invite_reservations
language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(btrim(p_email));
  v_row public.invite_reservations;
  v_client uuid;
  v_client_count integer;
  v_client_available boolean;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_actor and role = 'admin'::public.user_role
      and company_id = p_company and active = true
  ) then
    raise exception 'invite_not_authorized';
  end if;
  if v_email = '' or p_role is null then
    raise exception 'invite_invalid_input';
  end if;

  select * into v_row from public.invite_reservations
  where email_normalized = v_email and active for update;

  if found then
    if v_row.state = 'complete' and v_row.auth_user_id is null then
      -- A deleted account is never treated as a completed invite for a new
      -- Auth identity. Preserve the old intent as archived history.
      if exists (select 1 from auth.users where lower(btrim(email)) = v_email) then
        raise exception 'invite_existing_auth_user';
      end if;
      update public.invite_reservations
        set active = false, archived_at = now() where id = v_row.id;
    elsif v_row.state = 'failed' and not exists (
      select 1 from auth.users where lower(btrim(email)) = v_email
    ) then
      -- A definite failure can be replaced by an explicit new request,
      -- including a corrected role/company; it is never overwritten.
      update public.invite_reservations
        set active = false, archived_at = now() where id = v_row.id;
    else
      if v_row.company_id <> p_company or v_row.requested_role <> p_role then
        raise exception 'invite_intent_conflict';
      end if;
      if v_row.state = 'complete' and (
        not exists (
          select 1 from public.profiles p where p.id = v_row.auth_user_id
            and p.role = v_row.requested_role and p.company_id = v_row.company_id
        )
        or (v_row.requested_role = 'customer'::public.user_role and not exists (
          select 1 from public.clients c where c.id = v_row.client_id
            and c.company_id = v_row.company_id and c.profile_id = v_row.auth_user_id
        ))
      ) then
        raise exception 'invite_completed_drift';
      end if;
      return v_row;
    end if;
  end if;

  if exists (select 1 from auth.users where lower(btrim(email)) = v_email) then
    raise exception 'invite_existing_auth_user';
  end if;

  if p_role = 'customer'::public.user_role then
    select count(*)::integer, (array_agg(id))[1], bool_and(profile_id is null)
      into v_client_count, v_client, v_client_available
      from public.clients
      where company_id = p_company and active = true
        and lower(btrim(email)) = v_email;
    if v_client_count <> 1 or not coalesce(v_client_available, false) then
      raise exception 'invite_client_not_unique';
    end if;
  end if;

  insert into public.invite_reservations
    (email_normalized, company_id, requested_role, requested_by, client_id)
  values (v_email, p_company, p_role, p_actor, v_client)
  on conflict (email_normalized) where active do nothing
  returning * into v_row;

  if not found then
    select * into v_row from public.invite_reservations
      where email_normalized = v_email and active for update;
    if not found or v_row.company_id <> p_company or v_row.requested_role <> p_role then
      raise exception 'invite_intent_conflict';
    end if;
  end if;
  return v_row;
end;
$$;

create function public.claim_invite(p_actor uuid, p_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_claimed boolean;
begin
  update public.invite_reservations r
    set state = 'identity_started', auth_started_at = now()
  where r.id = p_id and r.active and r.state = 'reserved'
    and exists (
      select 1 from public.profiles p where p.id = p_actor
        and p.role = 'admin'::public.user_role and p.active = true
        and p.company_id = r.company_id
    )
    and (
      r.requested_role <> 'customer'::public.user_role
      or (
        r.client_id is not null
        and (select count(*) from public.clients c
          where c.company_id = r.company_id and c.active = true
            and lower(btrim(c.email)) = r.email_normalized) = 1
        and exists (
          select 1 from public.clients c where c.id = r.client_id
            and c.company_id = r.company_id and c.active = true
            and lower(btrim(c.email)) = r.email_normalized
            and c.profile_id is null
        )
      )
    )
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end;
$$;

-- The Auth user ID was fixed by the server before createUser. A returned ID,
-- email or timestamp alone cannot authorize adopting a pre-existing account.
-- app_metadata is written only by the Admin API, never by the invited user.
create function public.confirm_invite_identity(p_actor uuid, p_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_confirmed boolean;
begin
  update public.invite_reservations r
    set state = 'identity_created', auth_user_id = r.id
  where r.id = p_id and r.active and r.state = 'identity_started'
    and exists (
      select 1 from public.profiles p where p.id = p_actor
        and p.role = 'admin'::public.user_role and p.active = true
        and p.company_id = r.company_id
    )
    and exists (
      select 1 from auth.users u where u.id = r.id
        and lower(btrim(u.email)) = r.email_normalized
        and u.raw_app_meta_data->>'invite_reservation_id' = r.id::text
    )
  returning true into v_confirmed;
  return coalesce(v_confirmed, false);
end;
$$;

create function public.claim_invite_mail(p_actor uuid, p_id uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_claimed boolean;
begin
  update public.invite_reservations r
    set state = 'mail_started'
  where r.id = p_id and r.active and r.state = 'identity_created'
    and r.auth_user_id = r.id
    and exists (
      select 1 from public.profiles p where p.id = p_actor
        and p.role = 'admin'::public.user_role and p.active = true
        and p.company_id = r.company_id
    )
    and exists (
      select 1 from auth.users u where u.id = r.id
        and lower(btrim(u.email)) = r.email_normalized
        and u.raw_app_meta_data->>'invite_reservation_id' = r.id::text
    )
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end;
$$;

create function public.confirm_invite_mail(
  p_actor uuid, p_id uuid, p_auth_user uuid
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_confirmed boolean;
begin
  update public.invite_reservations r
    set state = 'mail_accepted', mail_accepted_at = now()
  where r.id = p_id and r.active and r.state = 'mail_started'
    and r.auth_user_id = r.id and p_auth_user = r.id
    and exists (
      select 1 from public.profiles p where p.id = p_actor
        and p.role = 'admin'::public.user_role and p.active = true
        and p.company_id = r.company_id
    )
    and exists (
      select 1 from auth.users u where u.id = p_auth_user
        and lower(btrim(u.email)) = r.email_normalized
        and u.raw_app_meta_data->>'invite_reservation_id' = r.id::text
    )
  returning true into v_confirmed;
  return coalesce(v_confirmed, false);
end;
$$;

-- A definite duplicate during createUser can be classified as failed only
-- when another Auth ID owns the email. Ambiguous create results stay unknown.
create function public.fail_invite_existing_user(
  p_actor uuid, p_id uuid
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_failed boolean;
begin
  update public.invite_reservations r set state = 'failed'
  where r.id = p_id and r.active and r.state = 'identity_started'
    and exists (
      select 1 from public.profiles p where p.id = p_actor
        and p.role = 'admin'::public.user_role and p.active = true
        and p.company_id = r.company_id
    )
    and exists (
      select 1 from auth.users u where lower(btrim(u.email)) = r.email_normalized
        and u.id <> r.id
    )
  returning true into v_failed;
  return coalesce(v_failed, false);
end;
$$;

-- Only the server may invoke this after verifying an invite OTP or a previously
-- established session for this exact Auth user. The recipient's identity,
-- confirmed email, trusted marker and all application writes are checked here.
-- Any exception rolls the profile, client and reservation writes back together.
create function public.complete_invite(p_id uuid, p_auth_user uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_row public.invite_reservations;
  v_count integer;
  v_client_count integer;
begin
  select * into v_row from public.invite_reservations
    where id = p_id and active for update;
  if not found or p_auth_user <> p_id or v_row.auth_user_id <> p_id then
    raise exception 'invite_not_authorized';
  end if;
  -- A lost invite API response can leave mail_started even when the recipient
  -- received a valid code. Successful OTP verification is stronger evidence.
  if v_row.state not in ('mail_started', 'mail_accepted', 'complete') then
    raise exception 'invite_not_ready';
  end if;
  if not exists (
    select 1 from auth.users where id = v_row.id
      and lower(btrim(email)) = v_row.email_normalized
      and raw_app_meta_data->>'invite_reservation_id' = v_row.id::text
      and email_confirmed_at is not null
  ) then
    raise exception 'invite_auth_mismatch';
  end if;
  if v_row.state = 'complete' then
    if not exists (
      select 1 from public.profiles where id = v_row.id
        and role = v_row.requested_role and company_id = v_row.company_id
    ) or (v_row.requested_role = 'customer'::public.user_role and not exists (
      select 1 from public.clients where id = v_row.client_id
        and company_id = v_row.company_id and profile_id = v_row.id
    )) then
      raise exception 'invite_completed_drift';
    end if;
    return true;
  end if;

  if v_row.requested_role = 'customer'::public.user_role then
    select count(*)::integer into v_client_count from public.clients
      where company_id = v_row.company_id and active = true
        and lower(btrim(email)) = v_row.email_normalized;
    if v_client_count <> 1 then raise exception 'invite_client_not_unique'; end if;
    if not exists (
      select 1 from public.clients where id = v_row.client_id
        and company_id = v_row.company_id and active = true
        and lower(btrim(email)) = v_row.email_normalized
        and (profile_id is null or profile_id = v_row.auth_user_id)
    ) then
      raise exception 'invite_client_conflict';
    end if;
  end if;

  update public.profiles
    set role = v_row.requested_role, company_id = v_row.company_id
  where id = v_row.auth_user_id and company_id is null
    and role = 'customer'::public.user_role;
  get diagnostics v_count = row_count;
  if v_count <> 1 then raise exception 'invite_profile_not_updated'; end if;

  if v_row.requested_role = 'customer'::public.user_role then
    update public.clients set profile_id = v_row.auth_user_id
      where id = v_row.client_id and company_id = v_row.company_id
        and active = true and lower(btrim(email)) = v_row.email_normalized
        and (profile_id is null or profile_id = v_row.auth_user_id);
    get diagnostics v_count = row_count;
    if v_count <> 1 then raise exception 'invite_client_not_updated'; end if;
  end if;

  update public.invite_reservations
    set state = 'complete', completed_at = now() where id = v_row.id;
  return true;
end;
$$;

revoke execute on function public.reserve_invite(uuid, text, public.user_role, uuid) from public, anon, authenticated;
revoke execute on function public.claim_invite(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.confirm_invite_identity(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.claim_invite_mail(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.confirm_invite_mail(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.fail_invite_existing_user(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.complete_invite(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_invite(uuid, text, public.user_role, uuid) to service_role;
grant execute on function public.claim_invite(uuid, uuid) to service_role;
grant execute on function public.confirm_invite_identity(uuid, uuid) to service_role;
grant execute on function public.claim_invite_mail(uuid, uuid) to service_role;
grant execute on function public.confirm_invite_mail(uuid, uuid, uuid) to service_role;
grant execute on function public.fail_invite_existing_user(uuid, uuid) to service_role;
grant execute on function public.complete_invite(uuid, uuid) to service_role;
