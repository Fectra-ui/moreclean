import { NextRequest, NextResponse } from "next/server";
import { toggleChecklistItem } from "@/lib/services/planning/execution";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const result = await toggleChecklistItem(body.item_id, body.checked);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
