import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVehicles } from "@/lib/services/mileage/mileage";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vehicles = await getVehicles();
  return NextResponse.json(vehicles);
}
