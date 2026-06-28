"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2, FileX, Download, ExternalLink } from "lucide-react";

interface Props {
  invoiceId: string;
  status: string;
  type: string;
  invoiceNumber: string;
  paymentUrl: string | null;
}

export default function InvoiceActions({ invoiceId, status, type, invoiceNumber, paymentUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const action = async (endpoint: string, key: string, redirect?: string) => {
    setLoading(key);
    setError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/${endpoint}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Er is een fout opgetreden"); setLoading(null); return; }
    if (redirect) router.push(redirect);
    else router.refresh();
    setLoading(null);
  };

  const isCredit = type === "credit";

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700">{error}</p>
      )}

      {/* PDF download */}
      <a
        href={`/api/pdf/invoice/${invoiceId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#101536]/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#101536] shadow-sm transition hover:bg-[#F3F5F7]"
      >
        <Download size={14} /> PDF downloaden
      </a>

      {/* Payment link */}
      {paymentUrl && status !== "paid" && (
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#4D7EBA]/30 bg-[#4D7EBA]/05 px-4 py-2.5 text-sm font-semibold text-[#4D7EBA] transition hover:bg-[#4D7EBA]/10"
        >
          <ExternalLink size={14} /> Betaallink openen
        </a>
      )}

      {/* Send */}
      {status === "draft" && !isCredit && (
        <button
          onClick={() => action("send", "send")}
          disabled={loading === "send"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.25)] transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {loading === "send" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Verzenden naar klant
        </button>
      )}

      {/* Mark paid (manual) */}
      {(status === "sent" || status === "overdue") && (
        <button
          onClick={() => action("paid", "paid")}
          disabled={loading === "paid"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70"
        >
          {loading === "paid" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Markeren als betaald
        </button>
      )}

      {/* Credit invoice */}
      {(status === "paid" || status === "sent") && !isCredit && (
        <button
          onClick={() => action("credit", "credit", `/admin/facturen`)}
          disabled={loading === "credit"}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-70"
        >
          {loading === "credit" ? <Loader2 size={14} className="animate-spin" /> : <FileX size={14} />}
          Creditfactuur aanmaken
        </button>
      )}
    </div>
  );
}
