begin;

alter policy "Employee: assigned appointments"
  on public.appointments to authenticated;

alter policy "Employee: update assigned appointment status"
  on public.appointments to authenticated;

commit;
