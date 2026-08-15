import { NextRequest, NextResponse } from "next/server";
import { startAppointment } from "@/lib/services/planning/execution";
import { getApiIdentity } from "@/lib/auth/apiAuth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getApiIdentity(["admin", "employee"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });
  const { id } = await params;
  const result = await startAppointment(id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
