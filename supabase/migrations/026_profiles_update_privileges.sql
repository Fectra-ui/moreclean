-- Only the existing employee profile form may update profile data directly.
-- Authorization fields remain writable solely through trusted server-side paths.
begin;

revoke update on table public.profiles from authenticated;
grant update (first_name, last_name, phone)
  on table public.profiles to authenticated;

-- Auth user metadata is user-controlled and must not choose the initial role.
-- Existing invite/owner flows assign trusted roles afterwards with service_role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'customer'::public.user_role);
  return new;
end;
$$;

commit;
