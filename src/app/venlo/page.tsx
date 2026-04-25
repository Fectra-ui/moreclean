import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Glazenwasser Venlo | More Clean",
  description:
    "Professionele glasbewassing, zonnepanelen reinigen en schoonmaakdiensten in Venlo. Vraag vrijblijvend een offerte aan.",
};

export default function VenloPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Venlo
          </span>

          <h1 className="mt-6 text-5xl font-bold md:text-7xl">
            Glazenwasser & Schoonmaak in{" "}
            <span className="gradient-text">Venlo</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            Voor woningen, bedrijven en appartementen in Venlo levert More Clean
            hoogwaardige glasbewassing en complete schoonmaakdiensten.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold"
          >
            Gratis Offerte
          </Link>
        </section>

        <section className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            "Glasbewassing Venlo",
            "Zonnepanelen reinigen",
            "Kantoor schoonmaak",
            "Particuliere reiniging",
            "Snelle service",
            "Streeploos resultaat",
          ].map((item) => (
            <div key={item} className="glass rounded-3xl p-6 shadow-premium">
              {item}
            </div>
          ))}
        </section>
      </main>
    </>
  );
}