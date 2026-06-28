"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Lock, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  year: number;
  quarter: number;
  status: string;
}

export default function ExportActions({ year, quarter, status }: Props) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/accounting/quarter?year=${year}&quarter=${quarter}&action=export`);
      if (!res.ok) { alert("Export mislukt. Probeer opnieuw."); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Q${quarter}-${year}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = async () => {
    if (!confirm(`Kwartaal Q${quarter} ${year} afsluiten? Dit kan niet ongedaan worden gemaakt.`)) return;
    setClosing(true);
    const res = await fetch("/api/accounting/quarter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, quarter, action: "close" }),
    });
    setClosing(false);
    if (res.ok) router.refresh();
    else alert("Afsluiten mislukt");
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleExport}
        disabled={downloading}
        className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5 disabled:opacity-70"
      >
        {downloading ? <Loader2 size={14} className="animate-spin" /> : done ? <CheckCircle2 size={14} /> : <Download size={14} />}
        {done ? "ZIP gedownload" : `Q${quarter}-${year}.zip downloaden`}
      </button>

      {status === "open" && (
        <button
          onClick={handleClose}
          disabled={closing}
          className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-70"
        >
          {closing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          Kwartaal afsluiten
        </button>
      )}

      {status === "closed" && (
        <p className="flex items-center gap-2 text-sm text-amber-700">
          <Lock size={14} />
          Kwartaal is afgesloten. Download voor definitieve export.
        </p>
      )}
    </div>
  );
}
