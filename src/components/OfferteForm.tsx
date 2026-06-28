"use client";

import { trackEvent } from "@/lib/gtag";
import { CheckCircle2 } from "lucide-react";

export default function OfferteForm() {
  return (
    <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
      {/* LEFT */}
      <div className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
        <h2 className="text-3xl font-bold text-[#101536]">Waarom More Clean?</h2>

        <div className="mt-6 space-y-5">
          {[
            "Binnen 24 uur reactie",
            "Gratis en vrijblijvend",
            "Professionele service",
            "Duidelijke prijzen",
            "Actief in Limburg",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <CheckCircle2 className="text-[#95AEC1]" size={20} />
              <span className="text-[#101536]">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FORM */}
      <div className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
        <h2 className="text-3xl font-bold text-[#101536]">Offerteformulier</h2>

        <form
          action="https://formspree.io/f/xnjlwrpv"
          method="POST"
          className="mt-6 space-y-5"
          onSubmit={() => {
            trackEvent("generate_lead", {
              event_category: "Offerte",
              event_label: "Offerte formulier verzonden",
              value: 1,
            });

            setTimeout(() => {
              window.location.href = "/bedankt";
            }, 500);
          }}
        >
          <input type="hidden" name="_next" value="https://moreclean.nl/bedankt" />
          <input type="text" name="_gotcha" className="hidden" tabIndex={-1} autoComplete="off" />
          <input type="hidden" name="_subject" value="Nieuwe offerte aanvraag - More Clean" />

          <div>
            <label htmlFor="offerte-naam" className="mb-1.5 block text-sm font-medium text-[#101536]">
              Naam <span aria-hidden="true">*</span>
            </label>
            <input
              id="offerte-naam"
              type="text"
              name="naam"
              required
              placeholder="Uw naam"
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

          <div>
            <label htmlFor="offerte-email" className="mb-1.5 block text-sm font-medium text-[#101536]">
              E-mail <span aria-hidden="true">*</span>
            </label>
            <input
              id="offerte-email"
              type="email"
              name="email"
              required
              placeholder="uw@email.nl"
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

          <div>
            <label htmlFor="offerte-telefoon" className="mb-1.5 block text-sm font-medium text-[#101536]">
              Telefoon
            </label>
            <input
              id="offerte-telefoon"
              type="tel"
              name="telefoon"
              placeholder="+31 6 ..."
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

          <div>
            <label htmlFor="offerte-dienst" className="mb-1.5 block text-sm font-medium text-[#101536]">
              Dienst <span aria-hidden="true">*</span>
            </label>
            <select
              id="offerte-dienst"
              name="dienst"
              required
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            >
              <option value="">Kies een dienst</option>
              <option value="Glasbewassing">Glasbewassing</option>
              <option value="Zonnepanelen Reinigen">Zonnepanelen Reinigen</option>
              <option value="Zakelijke Schoonmaak">Zakelijke Schoonmaak</option>
              <option value="Particuliere Schoonmaak">Particuliere Schoonmaak</option>
            </select>
          </div>

          <div>
            <label htmlFor="offerte-bericht" className="mb-1.5 block text-sm font-medium text-[#101536]">
              Extra informatie
            </label>
            <textarea
              id="offerte-bericht"
              rows={5}
              name="bericht"
              placeholder="Beschrijf uw situatie..."
              className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-[#4D7EBA] px-6 py-4 font-semibold text-white transition hover:scale-[1.02]"
          >
            Offerte Aanvragen
          </button>
        </form>
      </div>
    </section>
  );
}
