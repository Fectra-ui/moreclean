import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  type: "client" | "quote" | "invoice" | "appointment";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
}

export async function globalSearch(query: string, companyId: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = await createClient();
  const q = `%${query}%`;

  const [clients, quotes, invoices] = await Promise.all([
    supabase
      .from("clients")
      .select("id, contact_name, company_name, email, phone, city")
      .eq("company_id", companyId)
      .or(`contact_name.ilike.${q},company_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`)
      .limit(5),
    supabase
      .from("quotes")
      .select("id, quote_number, status, total, clients(contact_name, company_name)")
      .eq("company_id", companyId)
      .ilike("quote_number", q)
      .limit(3),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, clients(contact_name, company_name)")
      .eq("company_id", companyId)
      .ilike("invoice_number", q)
      .limit(3),
  ]);

  const results: SearchResult[] = [];

  for (const c of clients.data ?? []) {
    results.push({
      type: "client",
      id: c.id,
      title: c.company_name || c.contact_name,
      subtitle: [c.email, c.phone, c.city].filter(Boolean).join(" · "),
      href: `/admin/klanten/${c.id}`,
    });
  }

  for (const q of quotes.data ?? []) {
    const client = q.clients as unknown as Record<string, string | null> | null;
    results.push({
      type: "quote",
      id: q.id,
      title: q.quote_number,
      subtitle: client?.company_name || client?.contact_name || "Onbekend",
      href: `/admin/offertes/${q.id}`,
      meta: `€${Number(q.total).toLocaleString("nl-NL")}`,
    });
  }

  for (const inv of invoices.data ?? []) {
    const client = inv.clients as unknown as Record<string, string | null> | null;
    results.push({
      type: "invoice",
      id: inv.id,
      title: inv.invoice_number,
      subtitle: client?.company_name || client?.contact_name || "Onbekend",
      href: `/admin/facturen/${inv.id}`,
      meta: `€${Number(inv.total).toLocaleString("nl-NL")}`,
    });
  }

  return results;
}
