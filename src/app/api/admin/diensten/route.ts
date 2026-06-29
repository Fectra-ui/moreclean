import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const companyId = await getCompanyId();
  const body = await req.json();
  const { name, description, category, unit, default_price, vat_rate } = body;

  if (!name) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });

  const svc = createServiceClient();
  const { data, error } = await svc.from("services").insert({
    company_id: companyId,
    name,
    description: description || null,
    category: category || "overig",
    unit: unit || "vast",
    default_price: default_price ?? null,
    vat_rate: vat_rate ?? 21,
    active: true,
    sort_order: 999,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const companyId = await getCompanyId();
  const body = await req.json();
  const { id, ...patch } = body;

  if (!id) return NextResponse.json({ error: "id vereist" }, { status: 400 });

  // Only allow updating own company's services
  const allowed = ["name", "description", "category", "unit", "default_price", "vat_rate", "active", "sort_order"];
  const safe = Object.fromEntries(Object.entries(patch).filter(([k]) => allowed.includes(k)));

  const svc = createServiceClient();
  const { error } = await svc.from("services").update({ ...safe, updated_at: new Date().toISOString() })
    .eq("id", id).eq("company_id", companyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
