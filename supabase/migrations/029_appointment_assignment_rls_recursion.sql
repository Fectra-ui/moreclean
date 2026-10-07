-- Resolve the appointments <-> appointment_employees policy cycle without
-- changing the existing actor, company, or status conditions.
begin;

create function public.is_assigned_to_appointment(p_appointment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.appointment_employees as ae
    where ae.appointment_id = p_appointment_id
      and ae.employee_id = auth.uid()
  );
$$;

alter function public.is_assigned_to_appointment(uuid) owner to postgres;
revoke execute on function public.is_assigned_to_appointment(uuid) from public, anon, service_role;
grant execute on function public.is_assigned_to_appointment(uuid) to authenticated;

alter policy "Employee: assigned appointments" on public.appointments
  using (
    public.auth_role() = 'employee'
    and public.is_assigned_to_appointment(id)
  );

alter policy "Employee: update assigned appointment status" on public.appointments
  using (
    public.auth_role() = 'employee'
    and public.is_assigned_to_appointment(id)
  );

commit;
