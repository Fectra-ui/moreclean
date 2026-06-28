import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateQuarterZip, getQuarterStats, closeQuarter } from "@/lib/services/accounting/quarterExport";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const year = Number(req.nextUrl.searchParams.get("year") ?? new Date().getFullYear());
  const quarter = Number(req.nextUrl.searchParams.get("quarter") ?? Math.ceil((new Date().getMonth() + 1) / 3));
  const action = req.nextUrl.searchParams.get("action");

  if (action === "export") {
    // Genereer ZIP-bestand
    const zipBuffer = await generateQuarterZip(year, quarter);
    return new NextResponse(zipBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Q${quarter}-${year}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // Standaard: statistieken
  const stats = await getQuarterStats(year, quarter);
  return NextResponse.json(stats);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { year, quarter, action } = await req.json();

  if (action === "close") {
    const result = await closeQuarter(year, quarter, user.id);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Onbekende actie" }, { status: 400 });
}
