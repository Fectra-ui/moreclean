import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Verify caller is an admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  // This endpoint already authenticates the caller using their session above.
  // Read the authorization profile with the server-only client so an RLS
  // lookup cannot turn a valid admin into a false 403 response.
  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if ((profile as { role: string; company_id: string | null } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; role?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !["admin", "employee", "customer"].includes(String(role))) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const companyId = (profile as { company_id: string | null }).company_id;
  if (!companyId) return NextResponse.json({ error: "Beheerder is niet aan een bedrijf gekoppeld" }, { status: 409 });

  const { data: invited, error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { role, company_id: companyId },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.moreclean.nl"}/reset-password`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (invited.user) {
    await service.from("profiles").update({ role, company_id: companyId }).eq("id", invited.user.id);
    if (role === "customer") {
      await service.from("clients").update({ profile_id: invited.user.id }).eq("company_id", companyId).ilike("email", email);
    }
  }

  return NextResponse.json({ ok: true });
}
