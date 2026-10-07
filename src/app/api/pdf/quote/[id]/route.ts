import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCompany } from "@/lib/services/crm/company";
import { QuotePdf } from "@/lib/services/pdf/quotePdf";

const FALLBACK_COMPANY = {
  name: "More Clean",
  address: "Roermond, Limburg",
  email: "info@moreclean.nl",
  phone: "+31 6 13672320",
  kvk: undefined as string | undefined,
  vat_number: undefined as string | undefined,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  if (profileError || !profile?.company_id || !["admin", "customer"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const svc = createServiceClient();
  const [quoteResult, company] = await Promise.all([
    svc.from("quotes").select(`*, quote_items (*), clients (*)`).eq("id", id).eq("company_id", profile.company_id).single(),
    getCompany(),
  ]);

  const { data: quote, error } = quoteResult;
  if (error || !quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: client } = await svc.from("clients")
    .select("id, profile_id")
    .eq("id", quote.client_id)
    .eq("company_id", profile.company_id)
    .single();
  if (!client || (profile.role === "customer" && client.profile_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyInfo = company
    ? {
        name: company.name,
        address: [company.address, [company.postal_code, company.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
        email: company.email ?? "",
        phone: company.phone ?? "",
        kvk: company.kvk ?? undefined,
        vat_number: company.vat_number ?? undefined,
        logo_path: company.logo_path ?? null,
      }
    : FALLBACK_COMPANY;

  try {
    const element = createElement(QuotePdf, {
      quote: quote as Parameters<typeof QuotePdf>[0]["quote"],
      company: companyInfo,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Offerte-${quote.quote_number}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
