"use client";

import { useState, useRef, useEffect } from "react";
import type { AppointmentFull, ChecklistItem } from "@/lib/services/planning/execution";
import type { Vehicle } from "@/lib/services/mileage/mileage";
import {
  Loader2, CheckCircle2, Circle, Camera, Plus, Pen, Phone,
  Navigation, Clock, Package, Car, MapPin, ArrowRight,
} from "lucide-react";

interface Props {
  appointment: AppointmentFull;
  userId: string;
  vehicles: Vehicle[];
}

function elapsed(since: string): string {
  const s = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    : `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatTime(t: string): string { return t.slice(0, 5); }
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

// ---- Fase-machine ----
// pre → driving → active → done
type Phase = "pre" | "driving" | "active" | "done";

export default function ExecutionView({ appointment: initial, userId, vehicles }: Props) {
  const [appt, setAppt] = useState(initial);
  const [phase, setPhase] = useState<Phase>(
    initial.status === "completed"   ? "done"    :
    initial.status === "in_progress" ? "active"  : "pre"
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [timer, setTimer] = useState("0:00");
  const [travelTimer, setTravelTimer] = useState("0:00");

  // Ritregistratie state
  const [departedAt, setDepartedAt] = useState<string | null>(null);
  const [arrivedAt, setArrivedAt] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>(vehicles[0]?.id ?? "");
  const [startOdometer, setStartOdometer] = useState("");
  const [endOdometer, setEndOdometer] = useState("");

  // Afronding state
  const [showSignature, setShowSignature] = useState(false);
  const [showMileageEnd, setShowMileageEnd] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);
  const [materialName, setMaterialName] = useState("");
  const [materialQty, setMaterialQty] = useState("1");
  const [materialUnit, setMaterialUnit] = useState("");
  const [signedBy, setSignedBy] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const travelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Werkuren timer
  useEffect(() => {
    if (phase === "active" && appt.started_at) {
      timerRef.current = setInterval(() => setTimer(elapsed(appt.started_at!)), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, appt.started_at]);

  // Reistijd timer
  useEffect(() => {
    if (phase === "driving" && departedAt) {
      travelTimerRef.current = setInterval(() => setTravelTimer(elapsed(departedAt)), 1000);
    }
    return () => { if (travelTimerRef.current) clearInterval(travelTimerRef.current); };
  }, [phase, departedAt]);

  // ---- Rit starten ----
  const startTrip = () => {
    if (!startOdometer) { alert("Vul de kilometerstand bij vertrek in."); return; }
    const now = new Date().toISOString();
    setDepartedAt(now);
    setPhase("driving");
  };

  // ---- Aankomst registreren → werk starten ----
  const arriveAndStartWork = async () => {
    const now = new Date().toISOString();
    setArrivedAt(now);
    setLoading("start");

    // 1. Werk starten via API
    const res = await fetch(`/api/appointments/${appt.id}/start`, { method: "POST" });
    if (res.ok) {
      setAppt((a) => ({ ...a, status: "in_progress", started_at: now }));
      setPhase("active");
    }

    // 2. Kilometerlog aanmaken met kilometerstand bij aankomst
    if (departedAt && startOdometer && endOdometer) {
      const travelMin = Math.round((new Date(now).getTime() - new Date(departedAt).getTime()) / 60000);
      const clientName = appt.client.company_name || appt.client.contact_name;
      const clientAddr = appt.address ? `${clientName} (${appt.address}, ${appt.city ?? ""})`.trim() : clientName;
      await fetch("/api/mileage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt.id,
          vehicleId: selectedVehicle || null,
          date: appt.scheduled_date,
          startOdometer: parseInt(startOdometer, 10),
          endOdometer: parseInt(endOdometer, 10),
          route: `Kantoor → ${clientAddr} → Kantoor`,
          travelTimeMin: travelMin,
          departedAt: departedAt,
          arrivedAt: now,
          endLocation: appt.address ? `${appt.address}, ${appt.city ?? ""}`.trim() : null,
        }),
      });
    }

    setLoading(null);
  };

  // ---- Checklist ----
  const handleCheckItem = async (itemId: string, checked: boolean) => {
    setAppt((a) => ({
      ...a,
      checklists: a.checklists.map((cl) => ({
        ...cl,
        items: cl.items.map((it) =>
          it.id === itemId ? { ...it, checked, checked_at: checked ? new Date().toISOString() : null } : it
        ),
      })),
    }));
    await fetch(`/api/appointments/${appt.id}/checklist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, checked }),
    });
  };

  // ---- Materialen ----
  const handleAddMaterial = async () => {
    if (!materialName) return;
    setLoading("material");
    await fetch(`/api/appointments/${appt.id}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: materialName, quantity: parseFloat(materialQty) || 1, unit: materialUnit || null }),
    });
    setAppt((a) => ({
      ...a,
      materials: [...a.materials, { id: crypto.randomUUID(), name: materialName, quantity: parseFloat(materialQty) || 1, unit: materialUnit || null, note: null }],
    }));
    setMaterialName(""); setMaterialQty("1"); setMaterialUnit(""); setShowMaterial(false);
    setLoading(null);
  };

  // ---- Handtekening canvas ----
  const getPoint = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };
  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext("2d")!;
    const pt = getPoint(e, canvasRef.current);
    ctx.beginPath(); ctx.moveTo(pt.x, pt.y);
  };
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#101536";
    const pt = getPoint(e, canvasRef.current);
    ctx.lineTo(pt.x, pt.y); ctx.stroke();
  };
  const endDraw = () => { isDrawing.current = false; };
  const clearCanvas = () => canvasRef.current?.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

  // ---- Afronden ----
  const handleComplete = async () => {
    if (!signedBy.trim()) { alert("Vul de naam van de ondertekenaar in."); return; }
    if (!canvasRef.current) return;
    const sigData = canvasRef.current.toDataURL("image/png");
    setLoading("complete");

    const res = await fetch(`/api/appointments/${appt.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature_data: sigData, signed_by_name: signedBy }),
    });

    if (res.ok) {
      setAppt((a) => ({ ...a, status: "completed", completed_at: new Date().toISOString() }));
      setPhase("done");
      setShowSignature(false);
    }
    setLoading(null);
  };

  const totalChecked = appt.checklists.flatMap((cl) => cl.items).filter((it) => it.checked).length;
  const totalItems = appt.checklists.flatMap((cl) => cl.items).length;
  const requiredUnchecked = appt.checklists.flatMap((cl) => cl.items).filter((it: ChecklistItem) => it.required && !it.checked).length;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${appt.address ?? ""} ${appt.city ?? ""}`)}`;
  const travelMinutes = departedAt && arrivedAt
    ? Math.round((new Date(arrivedAt).getTime() - new Date(departedAt).getTime()) / 60000)
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-10">

      {/* Status banner */}
      {phase === "done" && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
          <CheckCircle2 className="text-emerald-600" size={20} />
          <div>
            <p className="font-semibold text-emerald-800">Opdracht afgerond</p>
            <p className="text-xs text-emerald-600">
              {appt.completed_at ? new Date(appt.completed_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          </div>
        </div>
      )}

      {phase === "driving" && (
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3">
          <Car className="text-blue-600 animate-pulse" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-blue-800">Onderweg</p>
            <p className="text-xs text-blue-600">Vertrokken om {departedAt ? new Date(departedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "–"}</p>
          </div>
          <span className="font-mono text-lg font-bold text-blue-700">{travelTimer}</span>
        </div>
      )}

      {phase === "active" && (
        <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
          <Clock className="text-amber-600 animate-pulse" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Bezig</p>
            <p className="text-xs text-amber-600">
              Gestart om {appt.started_at ? new Date(appt.started_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "–"}
              {travelMinutes !== null && ` · Reistijd: ${travelMinutes} min`}
            </p>
          </div>
          <span className="font-mono text-lg font-bold text-amber-700">{timer}</span>
        </div>
      )}

      {/* Opdrachtkaart */}
      <div className="rounded-3xl bg-gradient-to-br from-[#101536] to-[#1a2050] p-6 text-white shadow-xl">
        <p className="text-sm font-medium text-[#95AEC1] capitalize">{formatDate(appt.scheduled_date)}</p>
        <h1 className="mt-1 text-2xl font-bold">{appt.client.company_name || appt.client.contact_name}</h1>
        <p className="mt-1 text-[#95AEC1]">
          {appt.scheduled_start && formatTime(appt.scheduled_start)} – {appt.scheduled_end && formatTime(appt.scheduled_end)}
        </p>
        {appt.address && <p className="mt-2 text-sm text-white/70">{appt.address}, {appt.city}</p>}

        <div className="mt-4 flex gap-2 flex-wrap">
          {appt.address && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25 transition">
              <Navigation size={14} /> Navigeren
            </a>
          )}
          {appt.client.phone && (
            <a href={`tel:${appt.client.phone}`}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25 transition">
              <Phone size={14} /> Bel klant
            </a>
          )}
        </div>
      </div>

      {/* Instructies */}
      {!!appt.notes && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">Instructies</p>
          <p className="text-sm text-amber-900">{appt.notes}</p>
        </div>
      )}

      {/* ===================== PRE: Start rit ===================== */}
      {phase === "pre" && (
        <div className="rounded-2xl border border-[#101536]/08 bg-white p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#101536] flex items-center gap-2">
            <Car size={16} /> Ritregistratie
          </h2>

          {vehicles.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#606774]">Voertuig</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40"
              >
                <option value="">Selecteer voertuig…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.license_plate}){v.current_odometer ? ` — ${v.current_odometer.toLocaleString("nl-NL")} km` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#606774]">
              Kilometerstand bij vertrek <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number" min="0" inputMode="numeric"
                value={startOdometer}
                onChange={(e) => setStartOdometer(e.target.value)}
                placeholder={vehicles.find(v => v.id === selectedVehicle)?.current_odometer?.toString() ?? "145.283"}
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#606774]">km</span>
            </div>
          </div>

          <button
            onClick={startTrip}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#4D7EBA] to-[#667FB0] py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(77,126,186,.35)] transition hover:-translate-y-0.5"
          >
            <Car size={18} /> Rit starten
          </button>
        </div>
      )}

      {/* ===================== DRIVING: Aankomst ===================== */}
      {phase === "driving" && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-blue-600 shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Op weg naar {appt.client.company_name || appt.client.contact_name}</p>
              {appt.address && <p className="text-sm text-blue-700">{appt.address}, {appt.city}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-blue-700">
              Kilometerstand bij aankomst <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number" min={startOdometer || "0"} inputMode="numeric"
                value={endOdometer}
                onChange={(e) => setEndOdometer(e.target.value)}
                placeholder={startOdometer ? String(parseInt(startOdometer, 10) + 50) : "145.327"}
                className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600">km</span>
            </div>
            {startOdometer && endOdometer && parseInt(endOdometer, 10) >= parseInt(startOdometer, 10) && (
              <p className="mt-1 text-xs font-semibold text-blue-700">
                = {parseInt(endOdometer, 10) - parseInt(startOdometer, 10)} km gereden
              </p>
            )}
          </div>

          <button
            onClick={arriveAndStartWork}
            disabled={loading === "start" || !endOdometer || parseInt(endOdometer, 10) < parseInt(startOdometer || "0", 10)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(16,185,129,.3)] transition hover:-translate-y-0.5 disabled:opacity-70"
          >
            {loading === "start"
              ? <Loader2 size={18} className="animate-spin" />
              : <><MapPin size={18} /> <ArrowRight size={14} /> <Clock size={18} /></>
            }
            Aangekomen — Werk starten
          </button>
        </div>
      )}

      {/* ===================== Checklists ===================== */}
      {appt.checklists.map((cl) => (
        <div key={cl.id} className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#101536]/06">
            <h3 className="font-semibold text-[#101536]">{cl.template_name}</h3>
            <span className="text-xs text-[#606774]">{cl.items.filter((it) => it.checked).length}/{cl.items.length}</span>
          </div>
          <ul className="divide-y divide-[#101536]/05">
            {cl.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                <button
                  onClick={() => phase === "active" && handleCheckItem(item.id, !item.checked)}
                  disabled={phase !== "active"}
                  className="mt-0.5 shrink-0 disabled:opacity-40"
                >
                  {item.checked
                    ? <CheckCircle2 size={20} className="text-emerald-500" />
                    : <Circle size={20} className="text-[#4D7EBA]" />
                  }
                </button>
                <p className={`text-sm mt-0.5 ${item.checked ? "line-through text-[#606774]" : "text-[#101536]"}`}>
                  {item.label}
                  {item.required && <span className="ml-1 text-red-400">*</span>}
                </p>
              </li>
            ))}
          </ul>
          {totalItems > 0 && (
            <div className="px-4 pb-3">
              <div className="h-1.5 rounded-full bg-[#F3F5F7] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(totalChecked / totalItems) * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Materialen */}
      {phase !== "pre" && (
        <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#101536]/06">
            <h3 className="flex items-center gap-2 font-semibold text-[#101536]">
              <Package size={16} /> Materialen
            </h3>
            {phase === "active" && (
              <button onClick={() => setShowMaterial(!showMaterial)}
                className="rounded-xl bg-[#F3F5F7] px-2 py-1 text-xs font-semibold text-[#101536] transition hover:bg-[#101536]/08">
                <Plus size={12} className="inline" /> Toevoegen
              </button>
            )}
          </div>

          {showMaterial && (
            <div className="px-4 py-3 border-b border-[#101536]/06 space-y-2">
              <input value={materialName} onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Materiaal naam"
                className="w-full rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none" />
              <div className="flex gap-2">
                <input value={materialQty} onChange={(e) => setMaterialQty(e.target.value)} type="number"
                  placeholder="Aantal" className="w-24 rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none" />
                <input value={materialUnit} onChange={(e) => setMaterialUnit(e.target.value)}
                  placeholder="Eenheid" className="flex-1 rounded-xl border border-[#101536]/10 bg-[#F3F5F7] px-3 py-2 text-sm outline-none" />
              </div>
              <button onClick={handleAddMaterial} disabled={!materialName || loading === "material"}
                className="w-full rounded-xl bg-[#101536] py-2 text-sm font-semibold text-white transition hover:bg-[#1a2050] disabled:opacity-50">
                {loading === "material" ? <Loader2 size={14} className="inline animate-spin" /> : "Opslaan"}
              </button>
            </div>
          )}
          {appt.materials.length === 0
            ? <p className="px-4 py-3 text-sm text-[#606774]">Geen materialen geregistreerd</p>
            : <ul className="divide-y divide-[#101536]/05">
                {appt.materials.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-sm text-[#101536]">{m.name}</p>
                    <span className="text-sm font-semibold text-[#606774]">{m.quantity} {m.unit ?? ""}</span>
                  </li>
                ))}
              </ul>
          }
        </div>
      )}

      {/* Foto's */}
      {phase === "active" && (
        <div className="rounded-2xl border-2 border-dashed border-[#101536]/15 bg-white p-5 text-center">
          <Camera size={24} className="mx-auto text-[#606774] mb-2" />
          <p className="text-sm font-medium text-[#101536]">Foto&apos;s toevoegen</p>
          <p className="text-xs text-[#606774] mt-0.5">Vóór, tijdens en na de werkzaamheden</p>
          <label className="mt-3 inline-block cursor-pointer rounded-xl bg-[#F3F5F7] px-4 py-2 text-sm font-semibold text-[#101536] transition hover:bg-[#101536]/08">
            Camera / Galerij
            <input type="file" accept="image/*" capture="environment" multiple className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) alert(`${files.length} foto(s) geselecteerd. Upload-integratie volgt.`);
              }}
            />
          </label>
        </div>
      )}

      {/* Afronden */}
      {phase === "active" && (
        <div className="space-y-3">
          {requiredUnchecked > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Nog <strong>{requiredUnchecked} verplichte</strong> punten niet afgevinkt.
            </div>
          )}
          <button
            onClick={() => setShowSignature(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-base font-bold text-white shadow-[0_10px_30px_rgba(16,185,129,.3)] transition hover:-translate-y-0.5"
          >
            <Pen size={18} /> Handtekening & afronden
          </button>
        </div>
      )}

      {/* Handtekening modal */}
      {showSignature && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="px-6 py-4 border-b border-[#101536]/08">
              <h2 className="text-lg font-bold text-[#101536]">Handtekening klant</h2>
              <p className="text-sm text-[#606774] mt-0.5">Laat de klant hieronder tekenen.</p>
            </div>
            <div className="p-6 space-y-4">
              <input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} placeholder="Naam ondertekenaar"
                className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] px-4 py-2.5 text-sm outline-none focus:border-[#4D7EBA]/40 focus:bg-white" />
              <div className="relative rounded-2xl border-2 border-[#101536]/15 bg-[#FAFAFA] overflow-hidden touch-none">
                <canvas ref={canvasRef} width={480} height={180} className="w-full"
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
                <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-[#606774]/50">Teken hier</p>
              </div>
              <div className="flex gap-3">
                <button onClick={clearCanvas} className="rounded-2xl border border-[#101536]/10 px-4 py-2.5 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">Wissen</button>
                <button onClick={() => setShowSignature(false)} className="rounded-2xl border border-[#101536]/10 px-4 py-2.5 text-sm font-semibold text-[#606774] transition hover:bg-[#F3F5F7]">Annuleren</button>
                <button onClick={handleComplete} disabled={!signedBy || loading === "complete"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-60">
                  {loading === "complete" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Afronden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Afgerond */}
      {phase === "done" && appt.signature && (
        <div className="rounded-2xl border border-[#101536]/08 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#101536]/06">
            <h3 className="font-semibold text-[#101536]">Handtekening</h3>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-[#606774]">Ondertekend door <strong className="text-[#101536]">{appt.signature.signed_by_name}</strong></p>
            <p className="text-xs text-[#606774]">{new Date(appt.signature.signed_at).toLocaleString("nl-NL")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
