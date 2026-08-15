import { NextRequest, NextResponse } from "next/server";
import { addMaterial } from "@/lib/services/planning/execution";
import { getApiIdentity } from "@/lib/auth/apiAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiIdentity(["admin", "employee"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const { id } = await params;
  const body = await req.json().catch(() => null) as { name?: unknown; quantity?: unknown; unit?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const quantity = Number(body?.quantity);
  const unit = typeof body?.unit === "string" ? body.unit.trim() : null;
  if (!name || name.length > 120 || !Number.isFinite(quantity) || quantity <= 0 || quantity > 100_000 || (unit?.length ?? 0) > 40) {
    return NextResponse.json({ error: "Ongeldige materiaalgegevens" }, { status: 400 });
  }
  const result = await addMaterial(id, name, quantity, unit);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
