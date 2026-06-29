import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";
const BUCKET = "boekhouding";

export interface ReceiptInput {
  category: "brandstof" | "materiaal" | "gereedschap" | "parkeren" | "reiskosten" | "overig";
  supplier?: string;
  receiptDate: string;
  amount: number;
  vatPct: number;
  appointmentId?: string;
  vehicleId?: string;
  notes?: string;
  file: File;
}

export interface Receipt {
  id: string;
  uploaded_by: string;
  appointment_id: string | null;
  vehicle_id: string | null;
  category: string;
  supplier: string | null;
  receipt_date: string;
  amount: number;
  vat_pct: number;
  vat_amount: number;
  amount_excl_vat: number;
  notes: string | null;
  file_path: string | null;
  file_name: string | null;
  year: number;
  quarter: number;
  processed: boolean;
  created_at: string;
  uploader?: { first_name: string | null; last_name: string | null };
}

export async function uploadReceipt(input: ReceiptInput, uploaderId: string): Promise<{ id: string | null; error: string | null }> {
  const companyId = await getCompanyId();
  const supabase = await createClient();

  // 1. Upload bestand naar Storage
  const ext = input.file.name.split(".").pop() ?? "jpg";
  const date = new Date(input.receiptDate);
  const year = date.getFullYear();
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  const fileName = `${Date.now()}-${input.file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
  const filePath = `${companyId}/${year}/Q${quarter}/bonnetjes/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, input.file, { contentType: input.file.type, upsert: false });

  if (uploadError) return { id: null, error: `Upload mislukt: ${uploadError.message}` };

  // 2. Sla metadata op
  const { data, error } = await supabase.from("receipts").insert({
    company_id: companyId,
    uploaded_by: uploaderId,
    appointment_id: input.appointmentId ?? null,
    vehicle_id: input.vehicleId ?? null,
    category: input.category,
    supplier: input.supplier ?? null,
    receipt_date: input.receiptDate,
    amount: input.amount,
    vat_pct: input.vatPct,
    notes: input.notes ?? null,
    file_path: filePath,
    file_name: input.file.name,
  }).select("id").single();

  if (error) return { id: null, error: error.message };
  return { id: (data as { id: string }).id, error: null };
}

export async function listReceipts(year?: number, quarter?: number): Promise<Receipt[]> {
  const companyId = await getCompanyId();
  const supabase = await createClient();
  let q = supabase
    .from("receipts")
    .select("*, uploader:profiles!uploaded_by(first_name, last_name)")
    .eq("company_id", companyId)
    .order("receipt_date", { ascending: false });

  if (year) q = q.eq("year", year);
  if (quarter) q = q.eq("quarter", quarter);

  const { data } = await q.limit(500);
  return (data ?? []) as Receipt[];
}

export async function getReceiptSignedUrl(filePath: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600);
  return data?.signedUrl ?? null;
}

// Archiveer een factuur-PDF in de kwartaalmap
export async function archiveInvoicePdf(
  invoiceId: string,
  invoiceNumber: string,
  pdfBuffer: Buffer,
  issueDate: string
): Promise<void> {
  const companyId = await getCompanyId();
  const supabase = createServiceClient();
  const date = new Date(issueDate);
  const year = date.getFullYear();
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  const fileName = `${invoiceNumber.replace(/[^a-z0-9\-]/gi, "-")}.pdf`;
  const filePath = `${companyId}/${year}/Q${quarter}/facturen/${fileName}`;

  await supabase.storage.from(BUCKET).upload(filePath, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  // Registreer in invoice_archive
  await supabase.from("invoice_archive").upsert({
    invoice_id: invoiceId,
    company_id: companyId,
    year,
    quarter,
    file_path: filePath,
  }, { onConflict: "invoice_id" });
}
