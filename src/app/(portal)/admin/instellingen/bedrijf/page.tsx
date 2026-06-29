import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getCompany } from "@/lib/services/crm/company";
import CompanySettingsForm from "../CompanySettingsForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Bedrijfsgegevens | Instellingen" };

export default async function BedrijfPage() {
  await requireAdmin();
  const company = await getCompany();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/instellingen"
          className="flex items-center gap-1 text-sm text-[#606774] hover:text-[#101536] transition"
        >
          <ChevronLeft size={16} />
          Instellingen
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#101536]">Bedrijfsgegevens</h1>
        <p className="mt-1 text-sm text-[#606774]">
          Deze gegevens verschijnen op facturen, offertes en e-mails.
        </p>
      </div>

      {company ? (
        <CompanySettingsForm company={company} />
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#101536]/20 bg-white/60 p-10 text-center">
          <p className="text-sm font-semibold text-[#101536]">Geen bedrijfsprofiel gevonden</p>
          <p className="mt-1 text-sm text-[#606774]">
            Voeg een rij toe in Supabase met id{" "}
            <code className="rounded bg-[#F3F5F7] px-1 text-xs">
              a1000000-0000-0000-0000-000000000001
            </code>{" "}
            in de <code className="rounded bg-[#F3F5F7] px-1 text-xs">companies</code>-tabel.
          </p>
        </div>
      )}
    </div>
  );
}
