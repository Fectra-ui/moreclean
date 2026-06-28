import { createClient } from "@/lib/supabase/server";
import type { Appointment, AppointmentWithDetails } from "@/types/database";

export async function getAppointmentsByDate(
  companyId: string,
  date: string
): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      clients (contact_name, company_name, phone, email, address, city),
      appointment_employees (
        *,
        profiles (id, first_name, last_name, email, avatar_path)
      ),
      appointment_services (
        *,
        services (name, category)
      ),
      files (*)
    `)
    .eq("company_id", companyId)
    .eq("scheduled_date", date)
    .order("scheduled_start");
  if (error) throw error;
  return data as unknown as AppointmentWithDetails[];
}

export async function getAppointmentsByEmployee(
  employeeId: string,
  date: string
): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      clients (contact_name, company_name, phone, address, city),
      appointment_employees!inner (employee_id, role),
      appointment_services (*, services (name, category)),
      files (*)
    `)
    .eq("appointment_employees.employee_id", employeeId)
    .eq("scheduled_date", date)
    .order("scheduled_start");
  if (error) throw error;
  return data as unknown as AppointmentWithDetails[];
}

export async function getAppointmentById(id: string): Promise<AppointmentWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      clients (*),
      appointment_employees (
        *,
        profiles (id, first_name, last_name, email, avatar_path)
      ),
      appointment_services (*, services (*)),
      appointment_status_history (*),
      appointment_signatures (*),
      files (*)
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as AppointmentWithDetails;
}

export async function updateAppointmentStatus(
  id: string,
  status: Appointment["status"],
  updatedBy: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_by: updatedBy })
    .eq("id", id);
  if (error) throw error;
}

export async function getAppointmentsRange(
  companyId: string,
  from: string,
  to: string
): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      clients (contact_name, company_name, phone),
      appointment_employees (
        employee_id, role,
        profiles (id, first_name, last_name)
      ),
      appointment_services (*, services (name))
    `)
    .eq("company_id", companyId)
    .gte("scheduled_date", from)
    .lte("scheduled_date", to)
    .order("scheduled_date")
    .order("scheduled_start");
  if (error) throw error;
  return data as unknown as AppointmentWithDetails[];
}
