import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2, MapPin, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Glasbewassing Roermond | Ramen Lappen & Schoonmaak | More Clean",
  description:
    "Professionele glasbewassing in Roermond. Ramen wassen, ramen lappen, zonnepanelen reinigen en schoonmaakdiensten voor particulieren en bedrijven. Vraag direct vrijblijvend een offerte aan.",
};

const voordelen = [
  "Glasbewassing voor woningen en bedrijven",
  "Ramen wassen & ramen lappen in Roermond",
  "Zonnepanelen professioneel reinigen",
  "Kantoor en zakelijke schoonmaak",
  "Particuliere schoonmaak op maat",
  "Snelle service in Roermond en omgeving",
];

export default function RoermondPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-28 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Roermond
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-7xl">
            Glasbewassing, ramen wassen & schoonmaak in{" "}
            <span className="gradient-text">Roermond</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/75">
            Woont of werkt u in Roermond en zoekt u een betrouwbaar
            schoonmaakbedrijf? More Clean helpt met professionele
            glasbewassing, ramen lappen, zonnepanelen reinigen en complete
            schoonmaakdiensten voor particulieren en bedrijven.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
          >
            Gratis Offerte Aanvragen
            <ArrowRight size={18} />
          </Link>
        </section>

        {/* VOORDELEN */}
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

        {/* CONTENT SEO */}
        <section className="mx-auto mt-24 max-w-5xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="text-3xl font-bold">
            Waarom kiezen voor More Clean in Roermond?
          </h2>

          <p className="mt-6 leading-relaxed text-white/75">
            Wij combineren kwaliteit, betrouwbaarheid en duidelijke service.
            Of het nu gaat om ramen wassen bij een woning, glasbewassing van
            een bedrijfspand of het reinigen van zonnepanelen: wij zorgen voor
            een zichtbaar schoon resultaat.
          </p>

          <p className="mt-4 leading-relaxed text-white/75">
            Als lokaal actief schoonmaakbedrijf in Limburg zijn wij snel
            beschikbaar in Roermond, Herten, Swalmen, Maasniel en omgeving.
          </p>

          <div className="mt-8 flex items-center gap-3 text-[#95AEC1]">
            <MapPin size={20} />
            <span>Actief in Roermond en omgeving</span>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-5xl text-center">
          <h2 className="text-4xl font-bold">
            Direct een prijs voor glasbewassing in Roermond?
          </h2>

          <p className="mt-4 text-white/75">
            Vraag vrijblijvend een offerte aan en ontvang snel reactie.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
          >
            Vraag Gratis Offerte Aan
          </Link>
        </section>
      </main>
    </>
  );
}