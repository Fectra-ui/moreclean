import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    code?: unknown; email?: unknown; password?: unknown; firstName?: unknown; lastName?: unknown;
  } | null;

  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";

  if (!EMAIL.test(email) || password.length < 12 || password.length > 128 || !firstName || firstName.length > 80 || lastName.length > 80) {
    return NextResponse.json({ error: "Controleer uw gegevens. Het wachtwoord moet minimaal 12 tekens bevatten." }, { status: 400 });
  }

  const service = createServiceClient();
  const codeHash = createHash("sha256").update(code).digest("hex");
  const now = new Date().toISOString();

  // De voorwaarde op used_at maakt gelijktijdig hergebruik onmogelijk.
  const { data: activation } = await service
    .from("owner_activation_codes")
    .update({ used_at: now })
    .eq("code_hash", codeHash)
    .is("used_at", null)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();

  if (!activation) {
    return NextResponse.json({ error: "Deze activatiecode is ongeldig, verlopen of al gebruikt." }, { status: 403 });
  }

  const { data: company } = await service.from("companies").select("id").order("created_at").limit(1).maybeSingle();
  if (!company?.id) {
    await service.from("owner_activation_codes").update({ used_at: null }).eq("id", activation.id);
    return NextResponse.json({ error: "MoreClean is nog niet volledig ingericht." }, { status: 503 });
  }

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", first_name: firstName, last_name: lastName },
  });

  if (createError || !created.user) {
    await service.from("owner_activation_codes").update({ used_at: null }).eq("id", activation.id);
    return NextResponse.json({ error: createError?.message.includes("registered") ? "Dit e-mailadres heeft al een account." : "Account aanmaken is niet gelukt." }, { status: 400 });
  }

  const { error: profileError } = await service.from("profiles").update({
    role: "admin",
    company_id: company.id,
    first_name: firstName,
    last_name: lastName || null,
    email,
    active: true,
    is_owner: true,
  }).eq("id", created.user.id);

  if (profileError) {
    await service.auth.admin.deleteUser(created.user.id);
    await service.from("owner_activation_codes").update({ used_at: null }).eq("id", activation.id);
    return NextResponse.json({ error: "Account koppelen is niet gelukt." }, { status: 500 });
  }

  await service.from("owner_activation_codes").update({ used_by: created.user.id }).eq("id", activation.id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
