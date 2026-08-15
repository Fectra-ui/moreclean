import { NextRequest, NextResponse } from "next/server";
import { toggleChecklistItem } from "@/lib/services/planning/execution";
import { getApiIdentity } from "@/lib/auth/apiAuth";

export async function PATCH(req: NextRequest) {
  const auth = await getApiIdentity(["admin", "employee"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const body = await req.json().catch(() => null) as { item_id?: unknown; checked?: unknown } | null;
  if (typeof body?.item_id !== "string" || body.item_id.length > 100 || typeof body.checked !== "boolean") {
    return NextResponse.json({ error: "Ongeldige checklistgegevens" }, { status: 400 });
  }
  const result = await toggleChecklistItem(body.item_id, body.checked);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
