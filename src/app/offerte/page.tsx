"use client";

import Navbar from "@/components/Navbar";
import { CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/gtag";

export default function OffertePage() {
  return (
    <>
      <Navbar />

      <main className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[220px] text-[#121212]">
        {/* BACKGROUND GLOW */}
        <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

        {/* HERO */}
        <section className="relative z-10 mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Gratis Offerte
          </span>

          <h1 className="mt-6 text-4xl font-bold md:text-6xl xl:text-7xl leading-tight">
            Vraag direct een{" "}
            <span className="gradient-text">vrijblijvende offerte aan</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#606774]">
            Vul het formulier in en ontvang snel een duidelijke prijsopgave.
          </p>
        </section>

        {/* CONTENT */}
        <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
          {/* LEFT */}
          <div className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
            <h2 className="text-3xl font-bold">Waarom More Clean?</h2>

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
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FORM */}
          <div className="rounded-[32px] border border-white/60 bg-white/75 p-8 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">
            <h2 className="text-3xl font-bold">Offerteformulier</h2>

            <form
            action="https://formspree.io/f/xnjlwrpv"
            method="POST"
            encType="multipart/form-data"
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
              <input
                type="hidden"
                name="_next"
                value="https://moreclean.nl/bedankt"
              />

              <input
                type="text"
                name="_gotcha"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              <input
                type="text"
                name="naam"
                required
                placeholder="Naam"
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <input
                type="email"
                name="email"
                required
                placeholder="E-mail"
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <input
                type="tel"
                name="telefoon"
                placeholder="Telefoon"
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <select
                name="dienst"
                required
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              >
                <option value="">Kies een dienst</option>
                <option value="Glasbewassing">Glasbewassing</option>
                <option value="Zonnepanelen Reinigen">
                  Zonnepanelen Reinigen
                </option>
                <option value="Zakelijke Schoonmaak">
                  Zakelijke Schoonmaak
                </option>
                <option value="Particuliere Schoonmaak">
                  Particuliere Schoonmaak
                </option>
              </select>

              <textarea
                rows={5}
                name="bericht"
                placeholder="Extra informatie"
                className="w-full rounded-2xl border border-[#E5EAF0] bg-white px-5 py-4 text-[#101536] outline-none transition focus:border-[#4D7EBA] focus:ring-4 focus:ring-[#4D7EBA]/10"
              />

              <input
                type="hidden"
                name="_subject"
                value="Nieuwe offerte aanvraag - More Clean"
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[#4D7EBA] px-6 py-4 font-semibold transition hover:scale-[1.02]"
              >
                Offerte Aanvragen
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}