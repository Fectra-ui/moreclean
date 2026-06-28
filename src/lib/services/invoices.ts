import { createClient } from "@/lib/supabase/server";
import type { Invoice, InvoiceWithItems } from "@/types/database";

export async function getInvoices(
  companyId: string,
  status?: Invoice["status"]
): Promise<InvoiceWithItems[]> {
  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select(`*, clients (contact_name, company_name, email), invoice_items (*)`)
    .eq("company_id", companyId)
    .order("issue_date", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as InvoiceWithItems[];
}

export async function getInvoiceById(id: string): Promise<InvoiceWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(`*, clients (*), invoice_items (*, services (*))`)
    .eq("id", id)
    .single();
  if (error) return null;
  return data as unknown as InvoiceWithItems;
}

export async function getInvoiceStats(companyId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const monthStart = today.slice(0, 7) + "-01";

  const { data, error } = await supabase
    .from("invoices")
    .select("status, total, issue_date")
    .eq("company_id", companyId);
  if (error) throw error;

  const stats = {
    totalOpen: 0,
    totalOverdue: 0,
    revenueThisMonth: 0,
    countOpen: 0,
    countOverdue: 0,
  };

  for (const inv of data) {
    if (inv.status === "sent") {
      stats.totalOpen += inv.total;
      stats.countOpen++;
    }
    if (inv.status === "overdue") {
      stats.totalOverdue += inv.total;
      stats.countOverdue++;
    }
    if (inv.status === "paid" && inv.issue_date >= monthStart) {
      stats.revenueThisMonth += inv.total;
    }
  }

  return stats;
}
