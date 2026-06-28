import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReceiptSignedUrl } from "@/lib/services/accounting/receipts";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: receipt } = await supabase
    .from("receipts")
    .select("file_path, uploaded_by")
    .eq("id", id)
    .single();

  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  // Medewerkers mogen alleen hun eigen bonnetjes zien
  if (role !== "admin" && (receipt as { uploaded_by: string }).uploaded_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const signedUrl = await getReceiptSignedUrl((receipt as { file_path: string }).file_path);
  if (!signedUrl) return NextResponse.json({ error: "Bestand niet beschikbaar" }, { status: 404 });

  return NextResponse.redirect(signedUrl);
}
