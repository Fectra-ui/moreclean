import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const svc = createServiceClient();
  const { data } = await svc.from("companies").select("name, iban").eq("id", COMPANY_ID).single();
  return NextResponse.json(data ?? {});
}
