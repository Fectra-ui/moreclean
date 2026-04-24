import Navbar from "@/components/Navbar";
import { CheckCircle2, Upload } from "lucide-react";

export default function OffertePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen px-6 pt-32 pb-24 text-white">
        {/* HERO */}
        <section className="mx-auto max-w-6xl text-center">
          <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
            Gratis Offerte
          </span>

          <h1 className="mt-6 text-5xl font-bold md:text-7xl">
            Vraag direct een{" "}
            <span className="gradient-text">vrijblijvende offerte aan</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/75">
            Vul het formulier in en ontvang snel een duidelijke prijsopgave.
          </p>
        </section>

        {/* CONTENT */}
        <section className="mx-auto mt-20 grid max-w-7xl gap-8 md:grid-cols-2">
          {/* LEFT */}
          <div className="glass shadow-premium rounded-3xl p-8">
            <h2 className="text-3xl font-bold">Waarom More Clean?</h2>

            <div className="mt-6 space-y-5">
              {[
                "Binnen 24 uur reactie",
                "Gratis en vrijblijvend",
                "Professionele service",
                "Duidelijke prijzen",
                "Actief in Limburg",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="text-[#95AEC1]" size={20} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FORM */}
          <div className="glass shadow-premium rounded-3xl p-8">
            <h2 className="text-3xl font-bold">Offerteformulier</h2>

            <form className="mt-6 space-y-5">
              <input
                type="text"
                placeholder="Naam"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <input
                type="email"
                placeholder="E-mail"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <input
                type="tel"
                placeholder="Telefoon"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <select className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none">
                <option>Glasbewassing</option>
                <option>Zonnepanelen Reinigen</option>
                <option>Zakelijke Schoonmaak</option>
                <option>Particuliere Schoonmaak</option>
              </select>

              <textarea
                rows={5}
                placeholder="Extra informatie"
                className="w-full rounded-2xl bg-white/5 px-5 py-4 outline-none"
              />

              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-5">
                <Upload size={18} />
                <span>Bestand uploaden</span>
                <input type="file" className="hidden" />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-[#4D7EBA] px-6 py-4 font-semibold transition hover:scale-[1.02]"
              >
                Offerte Aanvragen
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}