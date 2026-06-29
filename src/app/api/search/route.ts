import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyId } from "@/lib/auth/getCompanyId";
import { globalSearch } from "@/lib/services/search/globalSearch";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ results: [] });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const companyId = await getCompanyId();
  const results = await globalSearch(q, companyId);
  return NextResponse.json({ results });
}
