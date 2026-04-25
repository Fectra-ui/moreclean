import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MapPin } from "lucide-react";

export const metadata = {
  title: "Schoonmaakbedrijf Weert | Glasbewassing & Glazenwasser | More Clean",
  description:
    "Professioneel schoonmaakbedrijf in Weert voor glasbewassing, glazenwasser service, zonnepanelen reinigen en schoonmaakdiensten. Snel, betrouwbaar en resultaatgericht.",
};

const voordelen = [
  "Glazenwasser actief in Weert",
  "Glasbewassing & ramen wassen",
  "Zonnepanelen professioneel reinigen",
  "Zakelijke schoonmaakservice",
  "Particuliere schoonmaak op maat",
  "Flexibele planning en hoge kwaliteit",
];

export default function WeertPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-36 md:pt-46 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Weert
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-7xl">
            Schoonmaak, glasbewassing & glazenwasser in{" "}
            <span className="gradient-text">Weert</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/75">
            More Clean helpt klanten in Weert met professionele schoonmaak,
            glasbewassing, ramen wassen en zonnepanelen reinigen voor woningen,
            winkels en bedrijven.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
          >
            Vraag Offerte Aan
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
            Waarom kiezen voor More Clean in Weert?
          </h2>

          <p className="mt-6 leading-relaxed text-white/75">
            Een schoon pand en heldere ramen zorgen direct voor een verzorgde
            uitstraling. Wij werken betrouwbaar, professioneel en met oog voor
            detail zodat u altijd tevreden bent over het resultaat.
          </p>

          <p className="mt-4 leading-relaxed text-white/75">
            Wij zijn snel inzetbaar in Weert, Stramproy, Tungelroy, Altweerterheide
            en omliggende plaatsen.
          </p>

          <div className="mt-8 flex items-center gap-3 text-[#95AEC1]">
            <MapPin size={20} />
            <span>Werkzaam in Weert en omgeving</span>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-5xl text-center">
          <h2 className="text-4xl font-bold">
            Op zoek naar een schoonmaakbedrijf in Weert?
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