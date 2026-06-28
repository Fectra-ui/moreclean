import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadReceipt } from "@/lib/services/accounting/receipts";
import { listReceipts } from "@/lib/services/accounting/receipts";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "employee"].includes((profile as { role: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = req.nextUrl;
  const year = url.searchParams.get("year") ? Number(url.searchParams.get("year")) : undefined;
  const quarter = url.searchParams.get("quarter") ? Number(url.searchParams.get("quarter")) : undefined;

  const receipts = await listReceipts(year, quarter);
  return NextResponse.json(receipts);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "employee"].includes((profile as { role: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Geen bestand" }, { status: 400 });

  const amount = parseFloat(formData.get("amount") as string);
  const vatPct = parseFloat(formData.get("vatPct") as string ?? "21");
  const receiptDate = formData.get("receiptDate") as string;
  const category = (formData.get("category") as string) || "overig";

  if (!receiptDate || isNaN(amount)) {
    return NextResponse.json({ error: "Datum en bedrag zijn verplicht" }, { status: 400 });
  }

  const result = await uploadReceipt(
    {
      file,
      category: category as "brandstof" | "materiaal" | "gereedschap" | "parkeren" | "reiskosten" | "overig",
      supplier: (formData.get("supplier") as string) || undefined,
      receiptDate,
      amount,
      vatPct,
      appointmentId: (formData.get("appointmentId") as string) || undefined,
      vehicleId: (formData.get("vehicleId") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    },
    user.id
  );

  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
