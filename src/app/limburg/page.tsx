import Navbar from "@/components/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Schoonmaakbedrijf Limburg | More Clean",
  description:
    "Professionele schoonmaakdiensten, glasbewassing en zonnepanelen reinigen in Limburg. Betrouwbaar, snel en resultaatgericht.",
};

export default function LimburgPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Werkgebied Limburg
          </span>

          <h1 className="mt-6 text-5xl font-bold md:text-7xl">
            Schoonmaakdiensten in{" "}
            <span className="gradient-text">Limburg</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            More Clean is actief in heel Limburg voor glasbewassing,
            zonnepanelen reinigen, zakelijke schoonmaak en particuliere
            schoonmaak.
          </p>

          <Link
            href="/offerte"
            className="mt-8 inline-block rounded-full bg-[#4D7EBA] px-8 py-4 font-semibold"
          >
            Vraag Gratis Offerte Aan
          </Link>
        </section>

        <section className="mx-auto mt-20 grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            "Glazenwasser Limburg",
            "Professionele reiniging",
            "Zakelijke schoonmaak",
            "Particuliere service",
            "Snelle planning",
            "Top kwaliteit",
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