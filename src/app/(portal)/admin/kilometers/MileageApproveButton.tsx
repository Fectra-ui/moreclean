"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function MileageApproveButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const approve = async () => {
    setLoading(true);
    await fetch(`/api/mileage/${id}/approve`, { method: "POST" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button onClick={approve} disabled={loading}
      className="flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
      {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
      Goedkeuren
    </button>
  );
}
