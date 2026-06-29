import type { Metadata } from "next";
import ClientForm from "./ClientForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getCompanyId } from "@/lib/auth/getCompanyId";

export const metadata: Metadata = { title: "Nieuwe klant" };

export default async function NieuweKlantPage() {
  const companyId = await getCompanyId();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin/klanten" className="mb-4 flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536]">
          <ChevronLeft size={14} /> Terug naar klanten
        </Link>
        <h1 className="text-2xl font-bold text-[#101536]">Nieuwe klant</h1>
      </div>
      <div className="rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_8px_32px_rgba(16,21,54,.06)] backdrop-blur-xl">
        <ClientForm companyId={companyId} />
      </div>
    </div>
  );
}
