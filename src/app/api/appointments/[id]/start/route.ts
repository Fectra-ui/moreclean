import { NextRequest, NextResponse } from "next/server";
import { startAppointment } from "@/lib/services/planning/execution";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await startAppointment(id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
