import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KlantGegevensForm from "./KlantGegevensForm";

export const metadata: Metadata = { title: "Mijn gegevens" };

export default async function KlantGegevensPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [clientResult, profileResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, contact_name, company_name, email, phone, address, postal_code, city, vat_number")
      .eq("profile_id", user.id)
      .single(),
    supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single(),
  ]);

  if (!clientResult.data) redirect("/klant");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Mijn gegevens</h1>
        <p className="mt-1 text-sm text-[#606774]">Uw contactgegevens en bedrijfsinformatie</p>
      </div>
      <KlantGegevensForm
        client={clientResult.data}
        email={user.email ?? ""}
      />
    </div>
  );
}
