import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const results: Record<string, unknown> = {
    url_set: !!url,
    anon_set: !!anon,
    svc_set: !!svcKey,
    svc_length: svcKey?.length ?? 0,
  };

  // Test service client — kan het profiles lezen?
  try {
    const svc = createClient(url, svcKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error, count } = await svc
      .from("profiles")
      .select("id, role, email", { count: "exact" })
      .limit(5);
    results.svc_profiles_count = count;
    results.svc_profiles_sample = data?.map((p: Record<string, unknown>) => ({ id: String(p.id).slice(0, 8), role: p.role, email: p.email }));
    results.svc_error = error?.message ?? null;
  } catch (e) {
    results.svc_exception = String(e);
  }

  return NextResponse.json(results);
}
