import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logMileage, getMileageLogs } from "@/lib/services/mileage/mileage";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !["admin", "employee"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = req.nextUrl;
  const logs = await getMileageLogs({
    year: url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined,
    month: url.searchParams.get("month") ? Number(url.searchParams.get("month")) : undefined,
    quarter: url.searchParams.get("quarter") ? Number(url.searchParams.get("quarter")) : undefined,
    employeeId: role === "employee" ? user.id : (url.searchParams.get("employeeId") ?? undefined),
    appointmentId: url.searchParams.get("appointmentId") ?? undefined,
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "employee"].includes((profile as { role: string } | null)?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = await logMileage(body, user.id);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
