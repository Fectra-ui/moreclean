import Navbar from "@/components/Navbar";
import Link from "next/link";
import { CheckCircle2, ArrowRight, MapPin } from "lucide-react";

export const metadata = {
  title: "Glasbewassing Echt | Ramen Wassen & Schoonmaak | More Clean",
  description:
    "Professionele glasbewassing in Echt. Ramen wassen, zonnepanelen reinigen en schoonmaakdiensten voor particulieren en bedrijven. Vraag vrijblijvend een offerte aan bij More Clean.",
};

const voordelen = [
  "Glasbewassing in Echt en omgeving",
  "Ramen wassen & ramen lappen",
  "Zonnepanelen professioneel reinigen",
  "Zakelijke schoonmaakservice",
  "Particuliere schoonmaak op maat",
  "Snelle planning en strak resultaat",
];

export default function EchtPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-36 md:pt-46 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Echt
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-7xl">
            Glasbewassing, ramen wassen & schoonmaak in{" "}
            <span className="gradient-text">Echt</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-white/75">
            More Clean helpt particulieren en bedrijven in Echt met
            professionele glasbewassing, ramen lappen, zonnepanelen reinigen en
            complete schoonmaakdiensten. Betrouwbaar, snel en met zichtbaar
            resultaat.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
          >
            Gratis Offerte
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
            Waarom kiezen voor More Clean in Echt?
          </h2>

          <p className="mt-6 leading-relaxed text-white/75">
            Wij leveren professionele schoonmaak met aandacht voor kwaliteit en
            service. Of het nu gaat om een woning, winkel of bedrijfspand:
            schone ramen en een verzorgde uitstraling maken direct verschil.
          </p>

          <p className="mt-4 leading-relaxed text-white/75">
            Dankzij onze flexibele planning zijn wij snel beschikbaar in Echt,
            Pey, Sint Joost, Dieteren en omliggende plaatsen.
          </p>

          <div className="mt-8 flex items-center gap-3 text-[#95AEC1]">
            <MapPin size={20} />
            <span>Werkzaam in Echt en omgeving</span>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-5xl text-center">
          <h2 className="text-4xl font-bold">
            Direct een prijs voor glasbewassing in Echt?
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