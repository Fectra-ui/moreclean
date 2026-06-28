import { createClient } from "@/lib/supabase/server";

export interface AppointmentFull {
  id: string;
  status: string;
  scheduled_date: string;
  scheduled_start: string;
  scheduled_end: string;
  address: string | null;
  city: string | null;
  notes: string | null;
  internal_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  client: {
    id: string;
    contact_name: string;
    company_name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
  };
  employees: { employee_id: string; name: string; role: string }[];
  checklists: ChecklistInstance[];
  materials: MaterialEntry[];
  time_logs: TimeLog[];
  files: FileEntry[];
  signature: { signed_by_name: string; signed_at: string } | null;
}

export interface ChecklistInstance {
  id: string;
  template_name: string;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  sort_order: number;
  checked: boolean;
  checked_at: string | null;
  note: string | null;
}

export interface MaterialEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  note: string | null;
}

export interface TimeLog {
  id: string;
  type: string;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
}

export interface FileEntry {
  id: string;
  type: string;
  storage_path: string;
  file_name: string;
  created_at: string;
}

export async function getAppointmentFull(id: string): Promise<AppointmentFull | null> {
  const supabase = await createClient();

  const { data: a, error } = await supabase
    .from("appointments")
    .select(`
      id, status, scheduled_date, scheduled_start, scheduled_end,
      address, city, notes, internal_notes, started_at, completed_at,
      clients ( id, contact_name, company_name, phone, address, city ),
      appointment_employees (
        employee_id, role,
        profiles ( first_name, last_name )
      ),
      appointment_checklists (
        id, template_name,
        appointment_checklist_items (
          id, label, required, sort_order, checked, checked_at, note
        )
      ),
      appointment_materials ( id, name, quantity, unit, note ),
      appointment_time_logs ( id, type, started_at, ended_at, duration_min ),
      appointment_signatures ( signed_by_name, signed_at ),
      files ( id, type, storage_path, file_name, created_at )
    `)
    .eq("id", id)
    .single();

  if (error || !a) return null;

  const c = a.clients as unknown as AppointmentFull["client"] | null;
  const emps = a.appointment_employees as unknown as Array<{
    employee_id: string; role: string;
    profiles: { first_name: string | null; last_name: string | null } | null;
  }>;
  const sig = a.appointment_signatures as unknown as { signed_by_name: string; signed_at: string } | null;

  return {
    id: a.id,
    status: a.status,
    scheduled_date: a.scheduled_date,
    scheduled_start: a.scheduled_start,
    scheduled_end: a.scheduled_end,
    address: a.address,
    city: a.city,
    notes: a.notes,
    internal_notes: a.internal_notes,
    started_at: a.started_at,
    completed_at: a.completed_at,
    client: c ?? { id: "", contact_name: "Onbekend", company_name: null, phone: null, address: null, city: null },
    employees: emps?.map((e) => ({
      employee_id: e.employee_id,
      name: [e.profiles?.first_name, e.profiles?.last_name].filter(Boolean).join(" ") || "Medewerker",
      role: e.role,
    })) ?? [],
    checklists: (a.appointment_checklists as unknown as Array<{
      id: string; template_name: string;
      appointment_checklist_items: ChecklistItem[];
    }>)?.map((cl) => ({
      id: cl.id,
      template_name: cl.template_name,
      items: [...(cl.appointment_checklist_items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    })) ?? [],
    materials: (a.appointment_materials as unknown as MaterialEntry[]) ?? [],
    time_logs: (a.appointment_time_logs as unknown as TimeLog[]) ?? [],
    files: (a.files as unknown as FileEntry[]) ?? [],
    signature: sig,
  };
}

export async function startAppointment(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd" };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "in_progress", started_at: new Date().toISOString() })
    .eq("id", id);

  if (!error) {
    await supabase.from("appointment_time_logs").insert({
      appointment_id: id,
      employee_id: user.id,
      type: "work",
      started_at: new Date().toISOString(),
    });
  }

  return { error: error?.message ?? null };
}

export async function completeAppointment(
  id: string,
  signatureData: string,
  signedByName: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd" };

  const now = new Date().toISOString();

  const [apptResult, timeResult, sigResult] = await Promise.all([
    supabase.from("appointments").update({
      status: "completed",
      completed_at: now,
    }).eq("id", id),

    // Stop all open time logs
    supabase.from("appointment_time_logs")
      .update({ ended_at: now })
      .eq("appointment_id", id)
      .eq("employee_id", user.id)
      .is("ended_at", null),

    supabase.from("appointment_signatures").upsert({
      appointment_id: id,
      signature_data: signatureData,
      signed_at: now,
      signed_by_name: signedByName,
    }, { onConflict: "appointment_id" }),
  ]);

  const err = apptResult.error ?? timeResult.error ?? sigResult.error;
  return { error: err?.message ?? null };
}

export async function toggleChecklistItem(
  itemId: string,
  checked: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("appointment_checklist_items")
    .update({
      checked,
      checked_at: checked ? new Date().toISOString() : null,
      checked_by: checked ? user?.id : null,
    })
    .eq("id", itemId);

  return { error: error?.message ?? null };
}

export async function addMaterial(
  appointmentId: string,
  name: string,
  quantity: number,
  unit: string | null
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("appointment_materials").insert({
    appointment_id: appointmentId,
    name,
    quantity,
    unit,
    logged_by: user?.id,
  });

  return { error: error?.message ?? null };
}
