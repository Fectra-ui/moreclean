import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const COMPANY_ID = "a1000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, license_plate, brand, model, year, fuel_type, current_odometer, apk_expiry, next_service_km } = body;

  if (!name || !license_plate) {
    return NextResponse.json({ error: "Naam en kenteken zijn verplicht" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc.from("vehicles").insert({
    company_id:       COMPANY_ID,
    name,
    license_plate:    license_plate.toUpperCase().replace(/\s/g, "-"),
    brand:            brand || null,
    model:            model || null,
    year:             year ? Number(year) : null,
    fuel_type:        fuel_type || "diesel",
    current_odometer: current_odometer ? Number(current_odometer) : 0,
    apk_expiry:       apk_expiry || null,
    next_service_km:  next_service_km ? Number(next_service_km) : null,
    status:           "active",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
