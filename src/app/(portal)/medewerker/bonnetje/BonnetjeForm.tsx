"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Loader2, CheckCircle2, X } from "lucide-react";

const CATEGORIES = [
  { value: "brandstof", label: "Brandstof", icon: "⛽" },
  { value: "materiaal", label: "Materiaal", icon: "📦" },
  { value: "gereedschap", label: "Gereedschap", icon: "🔧" },
  { value: "parkeren", label: "Parkeren", icon: "🅿️" },
  { value: "reiskosten", label: "Reiskosten", icon: "🚗" },
  { value: "overig", label: "Overig", icon: "📄" },
] as const;

interface Props {
  appointments: Array<{ id: string; label: string }>;
  vehicles: Array<{ id: string; label: string }>;
}

export default function BonnetjeForm({ appointments, vehicles }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("overig");
  const [supplier, setSupplier] = useState("");
  const [amount, setAmount] = useState("");
  const [vatPct, setVatPct] = useState("21");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [appointmentId, setAppointmentId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (f: File) => {
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  // Bereken BTW-bedrag voor weergave
  const amountNum = parseFloat(amount) || 0;
  const vatPctNum = parseFloat(vatPct) || 21;
  const vatAmount = amountNum > 0 ? amountNum * vatPctNum / (100 + vatPctNum) : 0;
  const amountExcl = amountNum - vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Selecteer een bestand"); return; }
    if (!amount || amountNum <= 0) { setError("Vul een geldig bedrag in"); return; }

    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    fd.append("supplier", supplier);
    fd.append("receiptDate", receiptDate);
    fd.append("amount", amount);
    fd.append("vatPct", vatPct);
    if (appointmentId) fd.append("appointmentId", appointmentId);
    if (vehicleId) fd.append("vehicleId", vehicleId);
    if (notes) fd.append("notes", notes);

    const res = await fetch("/api/receipts", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Indienen mislukt"); setLoading(false); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500" />
        <p className="text-lg font-bold text-emerald-800">Bonnetje ingediend!</p>
        <p className="mt-1 text-sm text-emerald-700">Het bonnetje is opgeslagen en zichtbaar voor de administratie.</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => { setSubmitted(false); setFile(null); setPreview(null); setAmount(""); setSupplier(""); setNotes(""); }}
            className="rounded-2xl border border-emerald-300 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
          >
            Nieuw bonnetje
          </button>
          <button
            onClick={() => router.push("/medewerker")}
            className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Terug naar dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Bestand uploaden */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[#101536]">Foto of bestand</p>

        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full rounded-xl object-cover" style={{ maxHeight: 240 }} />
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-md"
            >
              <X size={14} />
            </button>
            <p className="mt-2 text-xs text-[#606774]">{file?.name}</p>
          </div>
        ) : file ? (
          <div className="flex items-center gap-3 rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-3">
            <Upload size={16} className="text-[#4D7EBA]" />
            <p className="text-sm font-medium text-[#101536] truncate">{file.name}</p>
            <button type="button" onClick={() => setFile(null)} className="ml-auto text-[#606774] hover:text-red-500">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Camera (mobiel) */}
            <button
              type="button"
              onClick={() => { fileRef.current!.accept = "image/*"; fileRef.current!.capture = "environment"; fileRef.current!.click(); }}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#4D7EBA]/30 bg-[#4D7EBA]/04 py-6 text-sm font-medium text-[#4D7EBA] transition hover:border-[#4D7EBA]/60 hover:bg-[#4D7EBA]/08"
            >
              <Camera size={24} />
              Foto maken
            </button>
            {/* Bestand */}
            <button
              type="button"
              onClick={() => { fileRef.current!.accept = "image/*,application/pdf"; fileRef.current!.removeAttribute("capture"); fileRef.current!.click(); }}
              className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[#101536]/15 bg-[#F3F5F7] py-6 text-sm font-medium text-[#606774] transition hover:border-[#101536]/30"
            >
              <Upload size={24} />
              Bestand kiezen
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Categorie */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-semibold text-[#101536]">Categorie</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition ${
                category === cat.value
                  ? "bg-[#4D7EBA] text-white shadow-sm"
                  : "border border-[#101536]/10 bg-[#F3F5F7] text-[#606774] hover:border-[#4D7EBA]/30"
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-[#101536]">Details</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Datum bon *</label>
            <input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} required
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Leverancier</label>
            <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Shell, Gamma, ..."
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Bedrag incl. BTW *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#606774]">€</span>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required
                placeholder="0,00"
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] pl-7 pr-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">BTW-tarief (%)</label>
            <select value={vatPct} onChange={(e) => setVatPct(e.target.value)}
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40">
              <option value="21">21% (standaard)</option>
              <option value="9">9% (laag)</option>
              <option value="0">0% (vrijgesteld)</option>
            </select>
          </div>
        </div>

        {amountNum > 0 && (
          <div className="rounded-xl bg-[#F8F9FB] px-4 py-3 text-xs text-[#606774]">
            Excl. BTW: <strong className="text-[#101536]">€{amountExcl.toFixed(2).replace(".", ",")}</strong>
            {" · "}BTW: <strong className="text-[#101536]">€{vatAmount.toFixed(2).replace(".", ",")}</strong>
          </div>
        )}

        {vehicles.length > 0 && (category === "brandstof" || category === "reiskosten" || vehicleId) && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">
              Voertuig {category === "brandstof" ? <span className="text-red-400">*</span> : "(optioneel)"}
            </label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40">
              <option value="">Selecteer voertuig…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        )}

        {appointments.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">Koppelen aan opdracht (optioneel)</label>
            <select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)}
              className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40">
              <option value="">Geen koppeling</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#606774]">Toelichting</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionele opmerking..."
            className="w-full resize-none rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.22)] transition hover:-translate-y-0.5 disabled:opacity-70">
        {loading && <Loader2 size={16} className="animate-spin" />}
        Bonnetje indienen
      </button>
    </form>
  );
}
