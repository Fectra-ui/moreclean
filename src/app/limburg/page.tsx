import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MapPin } from "lucide-react";

export const metadata = {
  title: "Schoonmaakbedrijf Limburg | Glasbewassing & Ramen Wassen | More Clean",
  description:
    "Professioneel schoonmaakbedrijf in Limburg voor glasbewassing, ramen wassen, zonnepanelen reinigen en zakelijke of particuliere schoonmaak. Vraag vrijblijvend een offerte aan.",
};

const voordelen = [
  "Glazenwasser actief in heel Limburg",
  "Ramen wassen & glasbewassing",
  "Zonnepanelen professioneel reinigen",
  "Zakelijke schoonmaak op maat",
  "Particuliere schoonmaakservice",
  "Snelle planning en duidelijke service",
];

export default function LimburgPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Limburg
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-7xl">
            Schoonmaakbedrijf, glasbewassing & ramen wassen in{" "}
            <span className="gradient-text">Limburg</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/75">
            More Clean helpt particulieren en bedrijven in heel Limburg met
            professionele schoonmaakdiensten. Van ramen wassen en
            glasbewassing tot zonnepanelen reinigen en complete schoonmaak op
            locatie.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
          >
            Vraag Gratis Offerte Aan
            <ArrowRight size={18} />
          </Link>
        </section>

        {/* CARDS */}
        <section className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-3">
          {voordelen.map((item) => (
            <div
              key={item}
              className="glass shadow-premium rounded-3xl border border-white/10 p-6 transition hover:-translate-y-2"
            >
              <CheckCircle2 className="mb-4 text-[#95AEC1]" size={22} />
              <p>{item}</p>
            </div>
          ))}
        </section>

        {/* SEO CONTENT */}
        <section className="mx-auto mt-24 max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="text-3xl font-bold">
            Waarom kiezen voor More Clean in Limburg?
          </h2>

          <p className="mt-6 leading-relaxed text-white/75">
            Wij leveren betrouwbare kwaliteit met oog voor detail. Of u nu een
            woning, winkel, kantoor of bedrijfspand heeft: wij zorgen voor een
            representatief en schoon resultaat.
          </p>

          <p className="mt-4 leading-relaxed text-white/75">
            Dankzij onze flexibele planning zijn wij inzetbaar in steden en
            dorpen door heel Limburg, waaronder Roermond, Venlo, Weert, Echt,
            Sittard en omgeving.
          </p>

          <div className="mt-8 flex items-center gap-3 text-[#95AEC1]">
            <MapPin size={20} />
            <span>Werkzaam in heel Limburg</span>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-5xl text-center">
          <h2 className="text-4xl font-bold">
            Op zoek naar een schoonmaakbedrijf in Limburg?
          </h2>

          <p className="mt-4 text-white/75">
            Vraag vrijblijvend een offerte aan en ontvang snel reactie.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
          >
            Gratis Offerte Aanvragen
          </Link>
        </section>
      </main>
    </>
  );
}