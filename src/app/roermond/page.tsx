import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Glasbewassing Roermond | More Clean",
  description:
    "Professionele glasbewassing, zonnepanelen reinigen en schoonmaakdiensten in Roermond. Vraag direct een gratis offerte aan.",
};

export default function RoermondPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Roermond
          </span>

          <h1 className="mt-6 text-5xl font-bold md:text-7xl">
            Glasbewassing & Schoonmaak in{" "}
            <span className="gradient-text">Roermond</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            More Clean helpt particulieren en bedrijven in Roermond met
            glasbewassing, zonnepanelen reinigen en professionele
            schoonmaakdiensten.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold"
          >
            Gratis Offerte Aanvragen
          </Link>
        </section>

        <section className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            "Glasbewassing woningen",
            "Zonnepanelen reinigen",
            "Kantoor schoonmaak",
            "Particuliere schoonmaak",
            "Streeploos resultaat",
            "Snelle service in Roermond",
          ].map((item) => (
            <div
              key={item}
              className="glass rounded-3xl p-6 shadow-premium"
            >
              {item}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}