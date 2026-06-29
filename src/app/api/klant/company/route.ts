import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = await getCompanyId();
  const svc = createServiceClient();
  const { data } = await svc.from("companies").select("name, iban").eq("id", companyId).single();
  return NextResponse.json(data ?? {});
}
