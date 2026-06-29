"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Building2, Package,
  Layers, Users, Truck, CreditCard, BarChart2, Sparkles,
  ArrowRight, Loader2, SkipForward,
} from "lucide-react";
import { saveCompanyInfo, importServices, skipStep, completeSetup } from "./actions";
import { STARTER_SERVICES, BRANCH_TEMPLATES } from "@/lib/data/service-templates";
import type { CompanySettings } from "@/lib/services/crm/company";
import type { SetupProgress, SetupStepKey } from "@/lib/services/setup";

// ── Step registry ──────────────────────────────────────────────
// To add a new step: append an entry here. The wizard picks up the
// order automatically, handles resume, and shows it in the progress bar.
const STEP_REGISTRY: { id: SetupStepKey; label: string; icon: React.ElementType; skippable: boolean }[] = [
  { id: "company",    label: "Bedrijfsgegevens", icon: Building2,  skippable: false },
  { id: "services",   label: "Diensten",          icon: Package,    skippable: true  },
  { id: "units",      label: "Bedrijfsunits",     icon: Layers,     skippable: true  },
  { id: "employees",  label: "Medewerkers",       icon: Users,      skippable: true  },
  { id: "vehicles",   label: "Voertuigen",        icon: Truck,      skippable: true  },
  { id: "payments",   label: "Betalingen",        icon: CreditCard, skippable: true  },
  { id: "accounting", label: "Boekhouding",       icon: BarChart2,  skippable: true  },
];

// ── Props ──────────────────────────────────────────────────────

interface Props {
  initialCompany: CompanySettings | null;
  initialProgress: SetupProgress;
}

// ── Helpers ────────────────────────────────────────────────────

function firstIncompleteIndex(progress: SetupProgress): number {
  const idx = STEP_REGISTRY.findIndex((s) => !progress[s.id]);
  return idx === -1 ? STEP_REGISTRY.length : idx;
}

// SHOW_WELCOME: only when no step has been started at all
function hasAnyProgress(progress: SetupProgress) {
  return STEP_REGISTRY.some((s) => progress[s.id]);
}

// ── Component ──────────────────────────────────────────────────

export default function SetupWizard({ initialCompany, initialProgress }: Props) {
  const [progress, setProgress] = useState<SetupProgress>(initialProgress);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // -1 = welcome, 0..N-1 = step index, N = completion
  const [step, setStep] = useState<number>(() =>
    hasAnyProgress(initialProgress) ? firstIncompleteIndex(initialProgress) : -1
  );

  const totalSteps = STEP_REGISTRY.length;
  const completedCount = STEP_REGISTRY.filter((s) => progress[s.id]).length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  function markDone(key: SetupStepKey) {
    setProgress((prev) => ({ ...prev, [key]: true }));
  }

  function advance() {
    setError(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  // ── Welcome ────────────────────────────────────────────────

  if (step === -1) {
    return (
      <WizardShell progressPct={0} completedCount={0} totalSteps={totalSteps} currentStep={-1}>
        <div className="text-center py-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4D7EBA]/15 to-[#95AEC1]/15">
            <Sparkles size={28} className="text-[#4D7EBA]" />
          </div>
          <h1 className="text-2xl font-bold text-[#101536]">Welkom bij More Clean</h1>
          <p className="mt-3 text-[#606774] max-w-md mx-auto">
            Richt je platform in een paar stappen in. Elke stap slaat direct op — je kunt de wizard altijd pauzeren en later hervatten.
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
            onClick={() => setStep(0)}
            className="mt-8 flex items-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.30)] transition hover:-translate-y-0.5"
          >
            Laten we beginnen <ArrowRight size={16} />
          </button>
        </div>
      </WizardShell>
    );
  }

  // ── Completion ─────────────────────────────────────────────

  if (step >= totalSteps) {
    return (
      <WizardShell progressPct={100} completedCount={totalSteps} totalSteps={totalSteps} currentStep={totalSteps}>
        <div className="text-center py-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#101536]">More Clean is ingericht 🎉</h2>
          <p className="mt-3 text-[#606774] max-w-md mx-auto">
            Je platform is klaar voor gebruik. Kies hieronder je eerste actie.
          </p>

          <div className="mt-6 space-y-2 text-left max-w-sm mx-auto">
            {STEP_REGISTRY.map((s) => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <CheckCircle2 size={16} className={progress[s.id] ? "text-emerald-500" : "text-[#606774]/30"} />
                <span className={progress[s.id] ? "text-[#101536]" : "text-[#606774]/50 line-through"}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-sm mx-auto">
            {[
              { icon: "👤", label: "Eerste klant", href: "/admin/klanten/nieuw" },
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
            onClick={() => startTransition(async () => { await completeSetup(); })}
            disabled={isPending}
            className="mt-8 flex items-center gap-2 mx-auto rounded-2xl bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(77,126,186,.30)] transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Naar het dashboard <ArrowRight size={16} />
          </button>
        </div>
      </WizardShell>
    );
  }

  // ── Active step ────────────────────────────────────────────

  const currentDef = STEP_REGISTRY[step];

  return (
    <WizardShell progressPct={progressPct} completedCount={completedCount} totalSteps={totalSteps} currentStep={step}>
      <div className="space-y-6">
        {/* Step header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#4D7EBA]/10">
            <currentDef.icon size={20} className="text-[#4D7EBA]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#606774]">
              Stap {step + 1} van {totalSteps}
            </p>
            <h2 className="text-xl font-bold text-[#101536]">{currentDef.label}</h2>
          </div>
        </div>

        {/* Step body */}
        {currentDef.id === "company" && (
          <CompanyStep
            initialCompany={initialCompany}
            isPending={isPending}
            error={error}
            onSubmit={(fd) => {
              setError(null);
              startTransition(async () => {
                const res = await saveCompanyInfo(fd);
                if (res.error) { setError(res.error); return; }
                markDone("company");
                advance();
              });
            }}
            onBack={step > 0 ? goBack : undefined}
          />
        )}

        {currentDef.id === "services" && (
          <ServicesStep
            isPending={isPending}
            error={error}
            alreadyDone={!!progress.services}
            onSubmit={(services) => {
              setError(null);
              if (services === null) {
                // Skip / already done
                startTransition(async () => {
                  await skipStep("services");
                  markDone("services");
                  advance();
                });
                return;
              }
              startTransition(async () => {
                const res = await importServices(services);
                if (res.error) { setError(res.error); return; }
                markDone("services");
                advance();
              });
            }}
            onBack={goBack}
          />
        )}

        {/* Placeholder steps: units, employees, vehicles, payments, accounting */}
        {["units", "employees", "vehicles", "payments", "accounting"].includes(currentDef.id) && (
          <PlaceholderStep
            stepDef={currentDef}
            isPending={isPending}
            alreadyDone={!!progress[currentDef.id]}
            onSkip={() => {
              startTransition(async () => {
                await skipStep(currentDef.id);
                markDone(currentDef.id);
                advance();
              });
            }}
            onBack={goBack}
          />
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </WizardShell>
  );
}

// ── Shell ──────────────────────────────────────────────────────

function WizardShell({
  children,
  progressPct,
  completedCount,
  totalSteps,
  currentStep,
}: {
  children: React.ReactNode;
  progressPct: number;
  completedCount: number;
  totalSteps: number;
  currentStep: number;
}) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-10">
      {/* Progress header */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {STEP_REGISTRY.map((s, i) => {
              const Icon = s.icon;
              const done = i < currentStep || (currentStep >= 0 && i < currentStep);
              const active = i === currentStep;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div title={s.label} className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all ${
                    done ? "bg-emerald-500 text-white"
                    : active ? "bg-[#4D7EBA] text-white ring-4 ring-[#4D7EBA]/15"
                    : "bg-[#101536]/08 text-[#606774]"
                  }`}>
                    {done ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                  </div>
                  {i < STEP_REGISTRY.length - 1 && (
                    <div className={`h-px w-4 ${i < currentStep ? "bg-emerald-400" : "bg-[#101536]/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-xs font-semibold text-[#606774]">
            {completedCount}/{totalSteps} voltooid
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[#101536]/08 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl rounded-[28px] border border-white/60 bg-white/85 p-8 shadow-[0_8px_40px_rgba(16,21,54,.10)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

// ── Step components ────────────────────────────────────────────

function CompanyStep({
  initialCompany, isPending, error, onSubmit, onBack,
}: {
  initialCompany: CompanySettings | null;
  isPending: boolean;
  error: string | null;
  onSubmit: (fd: FormData) => void;
  onBack?: () => void;
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }}
      className="space-y-5"
    >
      <p className="text-sm text-[#606774]">Deze gegevens verschijnen op offertes, facturen en e-mails.</p>
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
        {onBack ? (
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536] transition">
            <ChevronLeft size={16} /> Terug
          </button>
        ) : <span />}
        <PrimaryButton type="submit" isPending={isPending}>
          Opslaan & verder <ChevronRight size={16} />
        </PrimaryButton>
      </div>
    </form>
  );
}

type DienstenKeuze = "starter" | "template" | "leeg" | null;

function ServicesStep({
  isPending, error, alreadyDone, onSubmit, onBack,
}: {
  isPending: boolean;
  error: string | null;
  alreadyDone: boolean;
  onSubmit: (services: Parameters<typeof importServices>[0] | null) => void;
  onBack: () => void;
}) {
  const [keuze, setKeuze] = useState<DienstenKeuze>(null);
  const [template, setTemplate] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleNext() {
    setLocalError(null);
    if (keuze === null) { setLocalError("Maak een keuze"); return; }
    if (keuze === "leeg" || alreadyDone) { onSubmit(null); return; }
    if (keuze === "template" && !template) { setLocalError("Kies een branchetemplate"); return; }
    const services =
      keuze === "starter"
        ? STARTER_SERVICES
        : BRANCH_TEMPLATES.find((t) => t.id === template)?.services ?? [];
    onSubmit(services);
  }

  if (alreadyDone) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#606774]">Diensten zijn al geïmporteerd. Je kunt ze beheren via <a href="/admin/diensten" className="text-[#4D7EBA] underline">Diensten</a>.</p>
        <div className="flex justify-between pt-2">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536] transition">
            <ChevronLeft size={16} /> Terug
          </button>
          <PrimaryButton onClick={() => onSubmit(null)} isPending={isPending}>
            Verder <ChevronRight size={16} />
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#606774]">Kies hoe je wilt beginnen. Je kunt later altijd diensten toevoegen of aanpassen.</p>

      <div className="grid gap-3">
        <ChoiceCard
          selected={keuze === "starter"}
          onClick={() => { setKeuze("starter"); setTemplate(null); }}
          icon="🚀"
          title="Starterspakket"
          badge="AANBEVOLEN"
          subtitle="6 populaire diensten direct klaar"
        >
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STARTER_SERVICES.map((s) => (
              <span key={s.name} className="rounded-lg bg-[#F3F5F7] px-2 py-0.5 text-[11px] font-medium text-[#606774]">{s.name}</span>
            ))}
          </div>
        </ChoiceCard>

        <ChoiceCard
          selected={keuze === "template"}
          onClick={() => setKeuze("template")}
          icon="📋"
          title="Branchetemplate"
          subtitle="Kies een template passend bij jouw branche"
        >
          {keuze === "template" && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {BRANCH_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={(e) => { e.stopPropagation(); setTemplate(t.id); }}
                  className={`text-left rounded-xl border p-3 transition ${template === t.id ? "border-[#4D7EBA] bg-[#4D7EBA]/08" : "border-[#101536]/10 hover:border-[#4D7EBA]/30"}`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <p className="text-xs font-semibold text-[#101536] mt-1">{t.label}</p>
                  <p className="text-[10px] text-[#606774]">{t.services.length} diensten</p>
                </button>
              ))}
            </div>
          )}
        </ChoiceCard>

        <ChoiceCard
          selected={keuze === "leeg"}
          onClick={() => { setKeuze("leeg"); setTemplate(null); }}
          icon="✏️"
          title="Zelf beginnen"
          subtitle="Voeg later handmatig je eigen diensten toe"
        />
      </div>

      {(error || localError) && <p className="text-sm text-red-500">{error || localError}</p>}

      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536] transition">
          <ChevronLeft size={16} /> Terug
        </button>
        <PrimaryButton onClick={handleNext} isPending={isPending}>
          Verder <ChevronRight size={16} />
        </PrimaryButton>
      </div>
    </div>
  );
}

function PlaceholderStep({
  stepDef, isPending, alreadyDone, onSkip, onBack,
}: {
  stepDef: { id: SetupStepKey; label: string; icon: React.ElementType };
  isPending: boolean;
  alreadyDone: boolean;
  onSkip: () => void;
  onBack: () => void;
}) {
  const Icon = stepDef.icon;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-[#101536]/15 bg-[#F3F5F7]/60 p-8 text-center">
        <Icon size={28} className="mx-auto mb-3 text-[#95AEC1]" />
        <p className="text-sm font-semibold text-[#101536]">
          {alreadyDone ? `${stepDef.label} al ingesteld` : `${stepDef.label} — binnenkort`}
        </p>
        <p className="mt-1 text-sm text-[#606774]">
          {alreadyDone
            ? "Je kunt dit later aanpassen via Instellingen."
            : "Deze stap wordt binnenkort uitgebouwd. Sla over en stel later in via Instellingen."}
        </p>
      </div>
      <div className="flex justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#606774] hover:text-[#101536] transition">
          <ChevronLeft size={16} /> Terug
        </button>
        <PrimaryButton onClick={onSkip} isPending={isPending} variant="secondary">
          {alreadyDone ? <>Verder <ChevronRight size={16} /></> : <><SkipForward size={15} /> Overslaan</>}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ── UI primitives ──────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#606774]">{children}</label>;
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[#101536]/10 bg-white px-4 py-2.5 text-sm text-[#101536] placeholder-[#606774]/40 outline-none transition focus:border-[#4D7EBA]/40 focus:ring-2 focus:ring-[#4D7EBA]/10 ${className}`}
    />
  );
}

function PrimaryButton({
  children, isPending, onClick, type = "button", variant = "primary",
}: {
  children: React.ReactNode;
  isPending: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isPending}
      className={`flex items-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-semibold transition disabled:opacity-60 disabled:translate-y-0 ${
        variant === "primary"
          ? "bg-gradient-to-r from-[#667FB0] to-[#4D7EBA] text-white shadow-[0_8px_24px_rgba(77,126,186,.25)] hover:-translate-y-0.5"
          : "border border-[#101536]/10 bg-white text-[#606774] hover:bg-[#F3F5F7]"
      }`}
    >
      {isPending && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

function ChoiceCard({
  selected, onClick, icon, title, badge, subtitle, children,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  badge?: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" || e.key === " " ? onClick() : undefined}
      className={`w-full text-left rounded-2xl border-2 p-5 transition cursor-pointer ${selected ? "border-[#4D7EBA] bg-[#4D7EBA]/05" : "border-[#101536]/10 hover:border-[#4D7EBA]/40"}`}
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#101536]">{title}</p>
            {badge && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{badge}</span>}
          </div>
          <p className="text-sm text-[#606774] mt-0.5">{subtitle}</p>
          {children}
        </div>
        <div className={`h-5 w-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition ${selected ? "border-[#4D7EBA] bg-[#4D7EBA]" : "border-[#101536]/20"}`}>
          {selected && <CheckCircle2 size={16} className="text-white -mt-px -ml-px" />}
        </div>
      </div>
    </div>
  );
}
