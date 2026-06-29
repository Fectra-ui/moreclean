import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transitionQuote, type WorkflowState } from "@/lib/services/workflow/quoteWorkflow";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const to = body.to as WorkflowState | undefined;
  if (!to) return NextResponse.json({ error: "Missing 'to' state" }, { status: 400 });

  const { error } = await transitionQuote(id, to, user.id);
  if (error) return NextResponse.json({ error }, { status: 422 });

  return NextResponse.json({ ok: true });
}
