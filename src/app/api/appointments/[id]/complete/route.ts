import { NextRequest, NextResponse } from "next/server";
import { completeAppointment } from "@/lib/services/planning/execution";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const result = await completeAppointment(id, body.signature_data, body.signed_by_name);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
