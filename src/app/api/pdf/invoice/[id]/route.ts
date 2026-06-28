import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { getInvoiceFull } from "@/lib/services/finance/invoices";
import { getCompany } from "@/lib/services/crm/company";
import { InvoicePdf } from "@/lib/services/pdf/invoicePdf";
import type { CompanyInfo } from "@/lib/services/pdf/invoicePdf";

const FALLBACK_COMPANY: CompanyInfo = {
  name: "More Clean",
  address: "Roermond",
  postal_code: null,
  city: "Limburg",
  email: "info@moreclean.nl",
  phone: null,
  kvk: null,
  vat_number: null,
  iban: null,
  logo_path: null,
  primary_color: "#4D7EBA",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "customer"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [invoice, company] = await Promise.all([
    getInvoiceFull(id),
    getCompany(),
  ]);

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (profile.role === "customer") {
    const { data: client } = await supabase.from("clients").select("id").eq("profile_id", user.id).single();
    if (!client || client.id !== invoice.client.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const companyInfo: CompanyInfo = company
    ? {
        name: company.name,
        address: company.address,
        postal_code: company.postal_code,
        city: company.city,
        email: company.email,
        phone: company.phone,
        kvk: company.kvk,
        vat_number: company.vat_number,
        iban: company.iban,
        logo_path: company.logo_path,
        primary_color: company.primary_color ?? "#4D7EBA",
      }
    : FALLBACK_COMPANY;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(InvoicePdf, { invoice, company: companyInfo }) as any);
  const label = invoice.type === "credit" ? "Credit" : "Factuur";

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${label}-${invoice.invoice_number}.pdf"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
