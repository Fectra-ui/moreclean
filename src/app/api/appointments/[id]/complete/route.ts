import { NextRequest, NextResponse } from "next/server";
import { completeAppointment } from "@/lib/services/planning/execution";
import { getApiIdentity } from "@/lib/auth/apiAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiIdentity(["admin", "employee"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const { id } = await params;
  const body = await req.json().catch(() => null) as { signature_data?: unknown; signed_by_name?: unknown } | null;
  const signature = typeof body?.signature_data === "string" ? body.signature_data : "";
  const signedBy = typeof body?.signed_by_name === "string" ? body.signed_by_name.trim() : "";
  if (!signature.startsWith("data:image/") || signature.length > 1_000_000 || !signedBy || signedBy.length > 120) {
    return NextResponse.json({ error: "Ongeldige handtekening" }, { status: 400 });
  }
  const result = await completeAppointment(id, signature, signedBy);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
