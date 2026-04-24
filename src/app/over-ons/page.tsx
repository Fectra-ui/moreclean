import Navbar from "@/components/Navbar";
import { ShieldCheck, HeartHandshake, Gem, MapPin } from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Betrouwbaar",
    text: "Afspraak is afspraak. Wij werken netjes, op tijd en professioneel.",
  },
  {
    icon: Gem,
    title: "Kwaliteit",
    text: "Oog voor detail en een resultaat waar u direct verschil in ziet.",
  },
  {
    icon: HeartHandshake,
    title: "Persoonlijk",
    text: "Korte lijnen, duidelijke communicatie en echte betrokkenheid.",
  },
  {
    icon: MapPin,
    title: "Lokaal",
    text: "Actief in Roermond, Limburg en omgeving.",
  },
];

export default function OverOnsPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Over More Clean
          </span>

          <h1 className="mt-6 text-5xl font-bold md:text-7xl">
            Een bedrijf gebouwd op{" "}
            <span className="gradient-text">kwaliteit & vertrouwen</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            More Clean staat voor hoogwaardige schoonmaakdiensten met een
            persoonlijke aanpak. Wij helpen particulieren en bedrijven aan een
            representatief, fris en verzorgd resultaat.
          </p>
        </section>

        {/* STORY */}
        <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
          <div className="glass shadow-premium rounded-3xl p-8">
            <h2 className="text-3xl font-bold">Ons verhaal</h2>

            <p className="mt-5 text-white/75 leading-8">
              Wat begon met passie voor perfect schoon resultaat groeide uit tot
              More Clean: een modern schoonmaakbedrijf waar kwaliteit, service en
              betrouwbaarheid centraal staan.
            </p>

            <p className="mt-5 text-white/75 leading-8">
              Of het nu gaat om glasbewassing, zonnepanelen reinigen of complete
              schoonmaakdiensten — wij leveren werk waar u trots op kunt zijn.
            </p>
          </div>

          <div className="glass shadow-premium rounded-3xl p-8 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.25em] text-[#95AEC1]">
                More Clean
              </p>
              <h3 className="mt-3 text-4xl font-bold">Professioneel. Persoonlijk. Premium.</h3>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="mx-auto mt-24 max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold">Onze kernwaarden</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="glass shadow-premium rounded-3xl p-6 transition hover:-translate-y-2"
                >
                  <div className="mb-5 inline-flex rounded-2xl bg-[#4D7EBA]/20 p-4 text-[#95AEC1]">
                    <Icon size={24} />
                  </div>

                  <h3 className="text-2xl font-semibold">{value.title}</h3>

                  <p className="mt-4 text-white/75">{value.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-24 max-w-5xl">
          <div className="glass shadow-premium rounded-3xl p-10 text-center">
            <h2 className="text-4xl font-bold">
              Klaar om samen te werken?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-white/75">
              Neem contact op of vraag direct vrijblijvend een offerte aan.
            </p>

            <a
              href="/offerte"
              className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold transition hover:scale-105"
            >
              Gratis Offerte
            </a>
          </div>
        </section>
      </main>
    </>
  );
}