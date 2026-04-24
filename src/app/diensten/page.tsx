import Navbar from "@/components/Navbar";
import { Sparkles, Building2, Home, SunMedium } from "lucide-react";

const services = [
  {
    icon: Sparkles,
    title: "Glasbewassing",
    text: "Streeploze ramen voor woningen, winkels en bedrijfspanden. Professioneel, veilig en representatief resultaat.",
  },
  {
    icon: SunMedium,
    title: "Zonnepanelen Reinigen",
    text: "Meer rendement en langere levensduur dankzij specialistische reiniging zonder schade of strepen.",
  },
  {
    icon: Building2,
    title: "Zakelijke Schoonmaak",
    text: "Schone kantoren, winkels en werkplekken zorgen voor een professionele uitstraling en prettige werkomgeving.",
  },
  {
    icon: Home,
    title: "Particuliere Schoonmaak",
    text: "Betrouwbare hulp voor een fris, schoon en verzorgd thuis. Flexibel en zorgvuldig uitgevoerd.",
  },
];

export default function DienstenPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-7xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Onze Diensten
          </span>

          <h1 className="mt-6 text-5xl font-bold md:text-7xl">
            Professionele{" "}
            <span className="gradient-text">schoonmaakdiensten</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            More Clean levert hoogwaardige schoonmaakdiensten voor particulieren
            en bedrijven in Roermond, Limburg en omgeving.
          </p>
        </section>

        {/* SERVICES */}
        <section className="mx-auto mt-20 grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="glass shadow-premium rounded-3xl p-6 transition duration-300 hover:-translate-y-2"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-[#4D7EBA]/20 p-4 text-[#95AEC1]">
                  <Icon size={26} />
                </div>

                <h2 className="text-2xl font-semibold">{service.title}</h2>

                <p className="mt-4 text-white/75">{service.text}</p>

                <a
                  href="/offerte"
                  className="mt-6 inline-block font-medium text-[#95AEC1]"
                >
                  Offerte aanvragen →
                </a>
              </div>
            );
          })}
        </section>

        {/* CTA */}
        <section className="mx-auto mt-24 max-w-5xl">
          <div className="glass shadow-premium rounded-3xl p-10 text-center">
            <h2 className="text-4xl font-bold">
              Op zoek naar kwaliteit en resultaat?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-white/75">
              Vraag vandaag nog vrijblijvend een offerte aan en ontvang snel een
              reactie van More Clean.
            </p>

            <a
              href="/offerte"
              className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
            >
              Gratis Offerte Aanvragen
            </a>
          </div>
        </section>
      </main>
    </>
  );
}