"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, Building2, Layers, Package, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { saveCompanyInfo, importServices, completeSetup } from "./actions";
import { STARTER_SERVICES, BRANCH_TEMPLATES } from "@/lib/data/service-templates";
import type { CompanySettings } from "@/lib/services/crm/company";

interface Props {
  initialCompany: CompanySettings | null;
}

const STEPS = [
  { id: 0, label: "Welkom", icon: Sparkles },
  { id: 1, label: "Bedrijf", icon: Building2 },
  { id: 2, label: "Diensten", icon: Package },
  { id: 3, label: "Klaar", icon: CheckCircle2 },
];

type DienstenKeuze = "starter" | "template" | "leeg" | null;

export default function SetupWizard({ initialCompany }: Props) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dienstenKeuze, setDienstenKeuze] = useState<DienstenKeuze>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  function handleCompanySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveCompanyInfo(fd);
      if (result.error) { setError(result.error); return; }
      setStep(2);
    });
  }

  function handleDiensten() {
    setError(null);
    if (!dienstenKeuze) { setError("Maak een keuze"); return; }

    if (dienstenKeuze === "leeg") { setStep(3); return; }

    const services =
      dienstenKeuze === "starter"
        ? STARTER_SERVICES
        : BRANCH_TEMPLATES.find((t) => t.id === selectedTemplate)?.services ?? [];

    if (dienstenKeuze === "template" && !selectedTemplate) {
      setError("Kies een branchetemplate");
      return;
    }

    startTransition(async () => {
      const result = await importServices(services);
      if (result.error) { setError(result.error); return; }
      setImportedCount(services.length);
      setStep(3);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      await completeSetup();
    });
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-10">
      {/* Progress header */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                  ? "bg-[#4D7EBA] text-white shadow-[0_0_0_4px_rgba(77,126,186,.15)]"
                  : "bg-[#101536]/08 text-[#606774]"
              }`}>
                {i < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-[#101536]" : "text-[#606774]"}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`ml-2 h-px w-12 sm:w-24 transition-all ${i < step ? "bg-emerald-400" : "bg-[#101536]/10"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="h-1.5 rounded-full bg-[#101536]/08 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_8px_40px_rgba(16,21,54,.10)] backdrop-blur-xl">

        {/* Step 0: Welkom */}
        {step === 0 && (
          <div className="text-center py-4">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4D7EBA]/15 to-[#95AEC1]/15">
              <Sparkles size={28} className="text-[#4D7EBA]" />
            </div>
            <h1 className="text-2xl font-bold text-[#101536]">Welkom bij More Clean</h1>
            <p className="mt-3 text-[#606774] max-w-md mx-auto">
              Laten we je platform in een paar stappen inrichten. Vul je bedrijfsgegevens in, importeer diensten en je bent klaar om je eerste offerte te sturen.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: "📋", label: "Bedrijfsgegevens", sub: "Naam, KVK, IBAN" },
                { icon: "🧽", label: "Diensten", sub: "In 30 seconden klaar" },
                { icon: "🚀", label: "Start", sub: "Dashboard openen" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#F3F5F7] p-4">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-xs font-semibold text-[#101536]">{item.label}</p>
                  <p className="text-xs text-[#606774]">{item.sub}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-8 flex items-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.30)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(77,126,186,.38)]"
            >
              Laten we beginnen
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1: Bedrijfsgegevens */}
        {step === 1 && (
          <form onSubmit={handleCompanySubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#101536]">Bedrijfsgegevens</h2>
              <p className="mt-1 text-sm text-[#606774]">Deze gegevens verschijnen op je offertes, facturen en e-mails.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Bedrijfsnaam *</Label>
                <Input name="name" defaultValue={initialCompany?.name ?? ""} required placeholder="More Clean BV" />
              </div>
              <div>
                <Label>KVK-nummer</Label>
                <Input name="kvk" defaultValue={initialCompany?.kvk ?? ""} placeholder="12345678" />
              </div>
              <div>
                <Label>BTW-nummer</Label>
                <Input name="vat_number" defaultValue={initialCompany?.vat_number ?? ""} placeholder="NL123456789B01" />
              </div>
              <div className="col-span-2">
                <Label>Adres</Label>
                <Input name="address" defaultValue={initialCompany?.address ?? ""} placeholder="Straatnaam 1" />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input name="postal_code" defaultValue={initialCompany?.postal_code ?? ""} placeholder="1234 AB" />
              </div>
              <div>
                <Label>Plaats</Label>
                <Input name="city" defaultValue={initialCompany?.city ?? ""} placeholder="Amsterdam" />
              </div>
              <div>
                <Label>Telefoon</Label>
                <Input name="phone" defaultValue={initialCompany?.phone ?? ""} placeholder="020-1234567" />
              </div>
              <div>
                <Label>E-mailadres</Label>
                <Input name="email" type="email" defaultValue={initialCompany?.email ?? ""} placeholder="info@moreclean.nl" />
              </div>
              <div>
                <Label>Website</Label>
                <Input name="site_url" defaultValue={initialCompany?.site_url ?? ""} placeholder="https://moreclean.nl" />
              </div>
              <div>
                <Label>IBAN</Label>
                <Input name="iban" defaultValue={initialCompany?.iban ?? ""} placeholder="NL91ABNA0417164300" />
              </div>
              <div className="col-span-2">
                <Label>E-mail boekhouder</Label>
                <Input name="boekhouder_email" type="email" defaultValue={initialCompany?.boekhouder_email ?? ""} placeholder="boekhouder@kantoor.nl" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536] transition">
                <ChevronLeft size={16} /> Terug
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,126,186,.25)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Opslaan & verder
                <ChevronRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Diensten */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#101536]">Dienstencatalogus</h2>
              <p className="mt-1 text-sm text-[#606774]">Kies hoe je wilt beginnen. Je kunt later altijd diensten toevoegen of aanpassen.</p>
            </div>

            <div className="grid gap-3">
              {/* Starterspakket */}
              <button
                onClick={() => { setDienstenKeuze("starter"); setSelectedTemplate(null); }}
                className={`text-left rounded-2xl border-2 p-5 transition ${dienstenKeuze === "starter" ? "border-[#4D7EBA] bg-[#4D7EBA]/05" : "border-[#101536]/10 hover:border-[#4D7EBA]/40"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-0.5">🚀</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#101536]">Starterspakket</p>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">AANBEVOLEN</span>
                    </div>
                    <p className="text-sm text-[#606774] mt-0.5">6 populaire diensten direct klaar voor gebruik</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {STARTER_SERVICES.map((s) => (
                        <span key={s.name} className="rounded-lg bg-[#F3F5F7] px-2 py-0.5 text-[11px] font-medium text-[#606774]">{s.name}</span>
                      ))}
                    </div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${dienstenKeuze === "starter" ? "border-[#4D7EBA] bg-[#4D7EBA]" : "border-[#101536]/20"}`}>
                    {dienstenKeuze === "starter" && <CheckCircle2 size={16} className="text-white -mt-px -ml-px" />}
                  </div>
                </div>
              </button>

              {/* Branchetemplate */}
              <button
                onClick={() => setDienstenKeuze("template")}
                className={`text-left rounded-2xl border-2 p-5 transition ${dienstenKeuze === "template" ? "border-[#4D7EBA] bg-[#4D7EBA]/05" : "border-[#101536]/10 hover:border-[#4D7EBA]/40"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl mt-0.5">📋</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#101536]">Branchetemplate</p>
                    <p className="text-sm text-[#606774] mt-0.5">Kies een template passend bij jouw branche</p>
                    {dienstenKeuze === "template" && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {BRANCH_TEMPLATES.map((t) => (
                          <button
                            key={t.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t.id); }}
                            className={`text-left rounded-xl border p-3 transition ${selectedTemplate === t.id ? "border-[#4D7EBA] bg-[#4D7EBA]/08" : "border-[#101536]/10 hover:border-[#4D7EBA]/30"}`}
                          >
                            <span className="text-lg">{t.icon}</span>
                            <p className="text-xs font-semibold text-[#101536] mt-1">{t.label}</p>
                            <p className="text-[10px] text-[#606774]">{t.services.length} diensten</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${dienstenKeuze === "template" ? "border-[#4D7EBA] bg-[#4D7EBA]" : "border-[#101536]/20"}`}>
                    {dienstenKeuze === "template" && <CheckCircle2 size={16} className="text-white -mt-px -ml-px" />}
                  </div>
                </div>
              </button>

              {/* Leeg beginnen */}
              <button
                onClick={() => { setDienstenKeuze("leeg"); setSelectedTemplate(null); }}
                className={`text-left rounded-2xl border-2 p-5 transition ${dienstenKeuze === "leeg" ? "border-[#4D7EBA] bg-[#4D7EBA]/05" : "border-[#101536]/10 hover:border-[#4D7EBA]/40"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl">✏️</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#101536]">Zelf beginnen</p>
                    <p className="text-sm text-[#606774]">Voeg later handmatig je eigen diensten toe</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${dienstenKeuze === "leeg" ? "border-[#4D7EBA] bg-[#4D7EBA]" : "border-[#101536]/20"}`}>
                    {dienstenKeuze === "leeg" && <CheckCircle2 size={16} className="text-white -mt-px -ml-px" />}
                  </div>
                </div>
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536] transition">
                <ChevronLeft size={16} /> Terug
              </button>
              <button
                onClick={handleDiensten}
                disabled={isPending}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(77,126,186,.25)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Verder
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Voltooid */}
        {step === 3 && (
          <div className="text-center py-4">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#101536]">Platform klaar!</h2>
            <p className="mt-3 text-[#606774] max-w-md mx-auto">
              {importedCount > 0
                ? `${importedCount} diensten zijn geïmporteerd. Je platform is ingericht en klaar voor gebruik.`
                : "Je platform is ingericht. Voeg diensten toe via Instellingen → Diensten."}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
              {[
                { icon: "👤", label: "Klant aanmaken", href: "/admin/klanten/nieuw" },
                { icon: "📄", label: "Eerste offerte", href: "/admin/offertes/nieuw" },
                { icon: "📅", label: "Afspraak plannen", href: "/admin/planning" },
                { icon: "⚙️", label: "Instellingen", href: "/admin/instellingen" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-[#101536]/08 bg-[#F3F5F7] p-3.5 text-sm font-medium text-[#101536] transition hover:bg-white hover:shadow-sm"
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>

            <button
              onClick={handleComplete}
              disabled={isPending}
              className="mt-8 flex items-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.30)] transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              Naar het dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold text-[#606774] uppercase tracking-wide">{children}</label>;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[#101536]/10 bg-white px-4 py-2.5 text-sm text-[#101536] placeholder-[#606774]/40 outline-none transition focus:border-[#4D7EBA]/40 focus:ring-2 focus:ring-[#4D7EBA]/10 ${className}`}
    />
  );
}
