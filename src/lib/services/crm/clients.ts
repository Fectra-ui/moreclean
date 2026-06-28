import { createClient } from "@/lib/supabase/server";
import type { Client, ClientWithSchedules } from "@/types/database";

export interface ClientListItem {
  id: string;
  contact_name: string;
  company_name: string | null;
  is_company: boolean;
  email: string | null;
  phone: string | null;
  city: string | null;
  active: boolean;
  created_at: string;
  last_appointment: string | null;
  open_invoices: number;
  open_invoice_total: number;
  has_maintenance: boolean;
}

export interface ClientFilters {
  query?: string;
  active?: boolean;
  hasMaintenanceContract?: boolean;
  city?: string;
  sortBy?: "name" | "created_at" | "last_appointment" | "open_invoices";
  sortDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export async function getClientList(
  companyId: string,
  filters: ClientFilters = {}
): Promise<{ clients: ClientListItem[]; total: number }> {
  const supabase = await createClient();
  const {
    query,
    active,
    sortBy = "name",
    sortDir = "asc",
    limit = 50,
    offset = 0,
  } = filters;

  let q = supabase
    .from("clients")
    .select(`
      id, contact_name, company_name, is_company, email, phone, city, active, created_at,
      maintenance_schedules!left (id, active),
      invoices!left (id, status, total),
      appointments!left (id, scheduled_date, status)
    `, { count: "exact" })
    .eq("company_id", companyId);

  if (active !== undefined) q = q.eq("active", active);
  if (query) {
    q = q.or(
      `contact_name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,city.ilike.%${query}%`
    );
  }

  // Sort
  const sortColumn = sortBy === "name" ? "contact_name" : sortBy === "created_at" ? "created_at" : "contact_name";
  q = q.order(sortColumn, { ascending: sortDir === "asc" });
  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;

  const clients: ClientListItem[] = (data ?? []).map((c) => {
    const schedules = (c.maintenance_schedules as { id: string; active: boolean }[] | null) ?? [];
    const invoices = (c.invoices as { id: string; status: string; total: number }[] | null) ?? [];
    const apts = (c.appointments as { id: string; scheduled_date: string; status: string }[] | null) ?? [];

    const openInvoices = invoices.filter((i) => ["sent", "overdue"].includes(i.status));
    const completedApts = apts.filter((a) => a.status === "completed").sort((a, b) =>
      b.scheduled_date.localeCompare(a.scheduled_date)
    );

    return {
      id: c.id,
      contact_name: c.contact_name,
      company_name: c.company_name,
      is_company: c.is_company,
      email: c.email,
      phone: c.phone,
      city: c.city,
      active: c.active,
      created_at: c.created_at,
      last_appointment: completedApts[0]?.scheduled_date ?? null,
      open_invoices: openInvoices.length,
      open_invoice_total: openInvoices.reduce((s, i) => s + i.total, 0),
      has_maintenance: schedules.some((s) => s.active),
    };
  });

  return { clients, total: count ?? 0 };
}

export async function getClientDetail(id: string): Promise<ClientWithSchedules | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      maintenance_schedules (*, services (name, category, unit)),
      appointments (
        id, scheduled_date, scheduled_start, scheduled_end, status, address, city,
        appointment_employees (
          profiles (first_name, last_name)
        ),
        appointment_services (description, quantity),
        files (type, storage_path)
      ),
      quotes (id, quote_number, status, total, created_at, valid_until),
      invoices (id, invoice_number, status, total, issue_date, due_date),
      conversations (id, subject, last_message_at)
    `)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as ClientWithSchedules;
}

export async function upsertClient(
  data: Partial<Client> & { company_id: string; contact_name: string },
  createdBy: string
): Promise<Client> {
  const supabase = await createClient();
  const payload = { ...data, created_by: createdBy };

  if (data.id) {
    const { data: updated, error } = await supabase
      .from("clients")
      .update(payload)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  const { data: created, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function toggleClientActive(id: string, active: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function getClientStats(clientId: string) {
  const supabase = await createClient();
  const [invoicesResult, appointmentsResult] = await Promise.all([
    supabase.from("invoices").select("status, total").eq("client_id", clientId),
    supabase.from("appointments").select("status, scheduled_date").eq("client_id", clientId),
  ]);

  const invoices = invoicesResult.data ?? [];
  const appointments = appointmentsResult.data ?? [];

  return {
    totalRevenue: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0),
    openAmount: invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + i.total, 0),
    totalAppointments: appointments.length,
    completedAppointments: appointments.filter((a) => a.status === "completed").length,
    firstAppointment: appointments.map((a) => a.scheduled_date).sort()[0] ?? null,
  };
}
