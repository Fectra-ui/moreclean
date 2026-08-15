import { NextRequest, NextResponse } from "next/server";
import { markPaymentReceived } from "@/lib/services/crm/quotes";
import { getApiIdentity } from "@/lib/auth/apiAuth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getApiIdentity(["admin"]);
  if (!auth.identity) return NextResponse.json({ error: "Geen toegang" }, { status: auth.status });

  try {
    await markPaymentReceived(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
