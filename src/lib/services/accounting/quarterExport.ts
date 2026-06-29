import { createServiceClient } from "@/lib/supabase/server";
import { zipSync, strToU8 } from "fflate";
import type { BusinessUnit } from "@/lib/services/crm/businessUnits";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";
const BUCKET = "boekhouding";

export interface QuarterStats {
  year: number;
  quarter: number;
  status: string;
  invoiceCount: number;
  revenueExclVat: number;
  vatCollected: number;
  revenueInclVat: number;
  paidCount: number;
  receiptCount: number;
  costsExclVat: number;
  vatPaid: number;
  vatToPay: number;
  profitExclVat: number;
}

const euro = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

// Berekent statistieken rechtstreeks uit DB (geen aparte view nodig als de view niet beschikbaar is)
export async function getQuarterStats(year: number, quarter: number): Promise<QuarterStats> {
  const supabase = createServiceClient();

  const [invoicesResult, receiptsResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, status, subtotal, vat_amount, total")
      .eq("company_id", COMPANY_ID)
      .eq("type", "invoice")
      .gte("issue_date", `${year}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}-01`)
      .lt("issue_date", quarterEndDate(year, quarter)),
    supabase
      .from("receipts")
      .select("amount_excl_vat, vat_amount")
      .eq("company_id", COMPANY_ID)
      .eq("year", year)
      .eq("quarter", quarter),
  ]);

  const invoices = (invoicesResult.data ?? []) as Array<{
    id: string; status: string; subtotal: number; vat_amount: number; total: number;
  }>;
  const recs = (receiptsResult.data ?? []) as Array<{ amount_excl_vat: number; vat_amount: number }>;

  const revenueExclVat = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
  const vatCollected = invoices.reduce((s, i) => s + Number(i.vat_amount), 0);
  const revenueInclVat = invoices.reduce((s, i) => s + Number(i.total), 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const costsExclVat = recs.reduce((s, r) => s + Number(r.amount_excl_vat), 0);
  const vatPaid = recs.reduce((s, r) => s + Number(r.vat_amount), 0);

  const { data: qRow } = await supabase
    .from("accounting_quarters")
    .select("status")
    .eq("company_id", COMPANY_ID)
    .eq("year", year)
    .eq("quarter", quarter)
    .maybeSingle();

  return {
    year,
    quarter,
    status: (qRow as { status: string } | null)?.status ?? "open",
    invoiceCount: invoices.length,
    revenueExclVat,
    vatCollected,
    revenueInclVat,
    paidCount,
    receiptCount: recs.length,
    costsExclVat,
    vatPaid,
    vatToPay: vatCollected - vatPaid,
    profitExclVat: revenueExclVat - costsExclVat,
  };
}

export async function getAllQuarterStats(year: number): Promise<QuarterStats[]> {
  return Promise.all([1, 2, 3, 4].map((q) => getQuarterStats(year, q)));
}

// Genereert een ZIP-buffer met alle factuur-PDFs, bonnetjes en een CSV
// Mapstructuur: {BU-naam}/Facturen/ en {BU-naam}/Bonnetjes/
export async function generateQuarterZip(year: number, quarter: number): Promise<Buffer> {
  const supabase = createServiceClient();

  // 1. Haal business units + gearchiveerde facturen op
  const [{ data: buData }, { data: archives }, { data: receipts }] = await Promise.all([
    supabase.from("business_units").select("id, name, short_code").eq("company_id", COMPANY_ID).eq("active", true),
    supabase
      .from("invoice_archive")
      .select("file_path, invoices(invoice_number, issue_date, total, status, business_unit_id, clients(contact_name, company_name), quotes(quote_number, accepted_at, payment_received_at, payment_reference))")
      .eq("company_id", COMPANY_ID)
      .eq("year", year)
      .eq("quarter", quarter),
    supabase
      .from("receipts")
      .select("file_path, file_name, supplier, receipt_date, amount, vat_amount, category, business_unit_id")
      .eq("company_id", COMPANY_ID)
      .eq("year", year)
      .eq("quarter", quarter),
  ]);

  const units = (buData ?? []) as BusinessUnit[];
  const buMap = new Map(units.map((u) => [u.id, u.name]));

  const zipFiles: Record<string, Uint8Array> = {};

  // 2. Factuur PDFs — per business unit
  const invoiceArchives = (archives ?? []) as Array<{
    file_path: string;
    invoices: {
      invoice_number: string;
      issue_date: string;
      total: number;
      status: string;
      business_unit_id: string | null;
      clients: { contact_name: string; company_name?: string | null } | null;
      quotes: { quote_number: string; accepted_at: string | null; payment_received_at: string | null; payment_reference: string | null } | null;
    } | null;
  }>;

  await Promise.all(
    invoiceArchives.map(async (arc) => {
      if (!arc.file_path || !arc.invoices) return;
      const { data } = await supabase.storage.from(BUCKET).download(arc.file_path);
      if (!data) return;
      const buf = await data.arrayBuffer();
      const buName = arc.invoices.business_unit_id ? (buMap.get(arc.invoices.business_unit_id) ?? "Overig") : "Overig";
      const name = arc.file_path.split("/").pop() ?? "factuur.pdf";
      zipFiles[`${buName}/Facturen/${name}`] = new Uint8Array(buf);
    })
  );

  // 3. Bonnetjes — per business unit
  const receiptList = (receipts ?? []) as Array<{
    file_path: string | null;
    file_name: string | null;
    supplier: string | null;
    receipt_date: string;
    amount: number;
    vat_amount: number;
    category: string;
    business_unit_id: string | null;
  }>;

  await Promise.all(
    receiptList.map(async (r) => {
      if (!r.file_path) return;
      const { data } = await supabase.storage.from(BUCKET).download(r.file_path);
      if (!data) return;
      const buf = await data.arrayBuffer();
      const buName = r.business_unit_id ? (buMap.get(r.business_unit_id) ?? "Overig") : "Overig";
      const name = r.file_name ?? r.file_path.split("/").pop() ?? "bonnetje";
      zipFiles[`${buName}/Bonnetjes/${name}`] = new Uint8Array(buf);
    })
  );

  // 4. CSV per business unit + gecombineerd rapport
  const csvHeader = [
    "Factuurnummer",
    "Offertenummer",
    "Klant",
    "Bedrijfsunit",
    "Datum factuur",
    "Datum akkoord",
    "Datum betaling",
    "Referentie",
    "Excl. BTW",
    "BTW (21%)",
    "Incl. BTW",
    "Status",
  ].join(";");

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("nl-NL") : "";

  const csvRows = invoiceArchives
    .filter((a) => a.invoices)
    .map((a) => {
      const inv = a.invoices!;
      const q = inv.quotes;
      const clientName = inv.clients?.company_name ?? inv.clients?.contact_name ?? "";
      const buName = inv.business_unit_id ? (buMap.get(inv.business_unit_id) ?? "Overig") : "Overig";
      const exclBtw = Number(inv.total) / 1.21;
      return [
        inv.invoice_number,
        q?.quote_number ?? "",
        clientName,
        buName,
        fmt(inv.issue_date),
        fmt(q?.accepted_at ?? null),
        fmt(q?.payment_received_at ?? null),
        q?.payment_reference ?? "",
        euro(exclBtw),
        euro(Number(inv.total) - exclBtw),
        euro(Number(inv.total)),
        { draft: "Concept", sent: "Verzonden", paid: "Betaald", overdue: "Verlopen" }[inv.status] ?? inv.status,
      ].join(";");
    });

  zipFiles[`rapport.csv`] = strToU8([csvHeader, ...csvRows].join("\n"));

  // 5. Audit JSON
  const stats = await getQuarterStats(year, quarter);
  const audit = {
    exported_at: new Date().toISOString(),
    period: `Q${quarter} ${year}`,
    company_id: COMPANY_ID,
    business_units: units.map((u) => u.name),
    summary: stats,
    invoice_count: invoiceArchives.length,
    receipt_count: receiptList.length,
  };
  zipFiles[`audit.json`] = strToU8(JSON.stringify(audit, null, 2));

  const zipped = zipSync(zipFiles, { level: 6 });
  return Buffer.from(zipped);
}

// Registreer kwartaal als gesloten en sla export op
export async function closeQuarter(year: number, quarter: number, closedBy: string): Promise<{ error: string | null }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("accounting_quarters")
    .upsert({
      company_id: COMPANY_ID,
      year,
      quarter,
      status: "closed",
      closed_by: closedBy,
    }, { onConflict: "company_id,year,quarter" });
  return { error: error?.message ?? null };
}

// Helper: eerste dag van volgend kwartaal
function quarterEndDate(year: number, quarter: number): string {
  const month = quarter * 3 + 1;
  if (month > 12) return `${year + 1}-01-01`;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
