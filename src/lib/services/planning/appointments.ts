import { createClient } from "@/lib/supabase/server";

export interface CalendarAppointment {
  id: string;
  status: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  estimated_duration: number | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  client_id: string;
  client_name: string;
  client_phone: string | null;
  employees: { employee_id: string; name: string; color: string; role: string }[];
}

export interface EmployeeWithColor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  calendar_color: string;
}

export async function getCalendarAppointments(
  companyId: string,
  from: string,
  to: string
): Promise<CalendarAppointment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      id, status, scheduled_date, scheduled_start, scheduled_end,
      estimated_duration, address, city, notes, client_id,
      clients ( contact_name, company_name, phone ),
      appointment_employees (
        role, employee_id,
        profiles ( first_name, last_name,
          employee_profiles ( calendar_color )
        )
      )
    `)
    .eq("company_id", companyId)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .order("scheduled_date")
    .order("scheduled_start");

  if (error || !data) return [];

  return data.map((a) => {
    const c = a.clients as unknown as Record<string, string | null> | null;
    const emps = (a.appointment_employees as unknown as Array<{
      role: string;
      employee_id: string;
      profiles: { first_name: string | null; last_name: string | null; employee_profiles: { calendar_color: string }[] | null } | null;
    }>) ?? [];

    return {
      id: a.id,
      status: a.status,
      scheduled_date: a.scheduled_date,
      scheduled_start: a.scheduled_start,
      scheduled_end: a.scheduled_end,
      estimated_duration: a.estimated_duration,
      address: a.address,
      city: a.city,
      notes: a.notes,
      client_id: a.client_id,
      client_name: c?.company_name || c?.contact_name || "Onbekend",
      client_phone: c?.phone ?? null,
      employees: emps.map((e) => ({
        employee_id: e.employee_id,
        name: [e.profiles?.first_name, e.profiles?.last_name].filter(Boolean).join(" ") || "Medewerker",
        color: e.profiles?.employee_profiles?.[0]?.calendar_color ?? "#4D7EBA",
        role: e.role,
      })),
    };
  });
}

export async function getEmployees(companyId: string): Promise<EmployeeWithColor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, employee_profiles ( calendar_color )")
    .eq("company_id", companyId)
    .eq("role", "employee")
    .eq("active", true);

  return (data ?? []).map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    calendar_color: (p.employee_profiles as unknown as { calendar_color: string }[] | null)?.[0]?.calendar_color ?? "#4D7EBA",
  }));
}

export async function moveAppointment(
  id: string,
  scheduledDate: string,
  scheduledStart: string,
  scheduledEnd: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ scheduled_date: scheduledDate, scheduled_start: scheduledStart, scheduled_end: scheduledEnd })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export interface CreateAppointmentInput {
  company_id: string;
  client_id: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  address?: string;
  city?: string;
  notes?: string;
  employee_ids?: string[];
  created_by: string;
}

export async function createAppointment(input: CreateAppointmentInput): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      company_id: input.company_id,
      client_id: input.client_id,
      scheduled_date: input.scheduled_date,
      scheduled_start: input.scheduled_start,
      scheduled_end: input.scheduled_end,
      address: input.address ?? null,
      city: input.city ?? null,
      notes: input.notes ?? null,
      created_by: input.created_by,
    })
    .select("id")
    .single();

  if (error || !data) return { id: null, error: error?.message ?? "Onbekende fout" };

  if (input.employee_ids?.length) {
    await supabase.from("appointment_employees").insert(
      input.employee_ids.map((eid, i) => ({
        appointment_id: data.id,
        employee_id: eid,
        role: i === 0 ? "lead" : "assistant",
      }))
    );
  }

  return { id: data.id, error: null };
}
