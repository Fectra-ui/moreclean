import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Schoonmaakbedrijf Weert | More Clean",
  description:
    "Glasbewassing, zonnepanelen reinigen en professionele schoonmaakdiensten in Weert. Snel, betrouwbaar en professioneel.",
};

export default function WeertPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Weert
          </span>

          <h1 className="mt-6 text-5xl font-bold md:text-7xl">
            Schoonmaak & Glasbewassing in{" "}
            <span className="gradient-text">Weert</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            More Clean helpt klanten in Weert met professionele schoonmaak,
            glasbewassing en zonnepanelen reinigen voor woningen en bedrijven.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold"
          >
            Vraag Offerte Aan
          </Link>
        </section>

        <section className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            "Glazenwasser Weert",
            "Bedrijfsschoonmaak",
            "Particuliere service",
            "Zonnepanelen reinigen",
            "Flexibele planning",
            "Hoogwaardige kwaliteit",
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