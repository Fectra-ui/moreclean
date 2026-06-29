import type { Metadata } from "next";
import OfferteForm from "@/components/OfferteForm";

export const metadata: Metadata = {
  title: "Gratis Offerte Aanvragen | More Clean",
  description:
    "Vraag vrijblijvend een gratis offerte aan voor glasbewassing, zonnepanelen reinigen of schoonmaakdiensten in Limburg. Reactie binnen 24 uur.",
  alternates: {
    canonical: "https://moreclean.nl/offerte",
  },
};

export default function OffertePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-32 text-[#121212]">
      {/* BACKGROUND GLOW */}
      <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-6xl text-center">
        <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
          Gratis Offerte
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl xl:text-7xl">
          Vraag direct een{" "}
          <span className="gradient-text">vrijblijvende offerte aan</span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#606774]">
          Vul het formulier in en ontvang snel een duidelijke prijsopgave.
        </p>
      </section>

      {/* CONTENT */}
      <OfferteForm />
    </div>
  );
}
