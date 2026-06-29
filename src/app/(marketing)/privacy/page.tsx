import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacybeleid | More Clean",
  description:
    "Lees het privacybeleid van More Clean. Hoe wij omgaan met uw persoonsgegevens.",
  alternates: {
    canonical: "https://moreclean.nl/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-32 text-[#121212]">
      <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
          Privacybeleid
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight text-[#101536] md:text-5xl">
          Privacybeleid
        </h1>

        <p className="mt-4 text-[#606774]">
          Laatst bijgewerkt: 28 juni 2026
        </p>

        <div className="mt-12 space-y-10 rounded-[32px] border border-white/60 bg-white/75 p-10 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">1. Wie zijn wij?</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              More Clean is een schoonmaakbedrijf gevestigd in Roermond, Limburg. Wij verzorgen
              glasbewassing, zonnepanelen reiniging en schoonmaakdiensten voor particulieren en
              bedrijven. Contactgegevens: <a href="mailto:info@moreclean.nl" className="text-[#4D7EBA] underline">info@moreclean.nl</a> |{" "}
              <a href="tel:+31613672320" className="text-[#4D7EBA] underline">+31 6 13672320</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">2. Welke gegevens verzamelen wij?</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Wanneer u een offerte aanvraagt of contact met ons opneemt via het formulier op onze website,
              verzamelen wij de volgende persoonsgegevens:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-[#606774]">
              <li>Naam</li>
              <li>E-mailadres</li>
              <li>Telefoonnummer (optioneel)</li>
              <li>Inhoud van uw bericht</li>
            </ul>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Wij verzamelen via Google Analytics ook anonieme bezoekersstatistieken (browsertype,
              paginabezoeken, klikgedrag). Deze gegevens zijn niet herleidbaar tot individuele personen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">3. Waarvoor gebruiken wij uw gegevens?</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Wij gebruiken uw persoonsgegevens uitsluitend voor:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-[#606774]">
              <li>Het beantwoorden van uw vraag of aanvraag</li>
              <li>Het uitbrengen van een offerte</li>
              <li>Het verbeteren van onze website en dienstverlening</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">4. Hoe lang bewaren wij uw gegevens?</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk. Contactberichten worden
              maximaal 12 maanden bewaard, tenzij er een lopende zakelijke relatie bestaat.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">5. Derden en verwerkers</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Uw gegevens worden verwerkt via <strong>Formspree</strong> (formulierverwerking) en{" "}
              <strong>Google Analytics</strong> (websitestatistieken). Wij verkopen uw gegevens nooit
              aan derden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">6. Uw rechten</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Op grond van de AVG heeft u het recht op inzage, rectificatie, verwijdering en bezwaar
              met betrekking tot uw persoonsgegevens. Neem hiervoor contact op via{" "}
              <a href="mailto:info@moreclean.nl" className="text-[#4D7EBA] underline">info@moreclean.nl</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">7. Vragen?</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Heeft u vragen over dit privacybeleid? Neem contact met ons op.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#667FB0] via-[#95AEC1] to-[#4D7EBA] px-6 py-3 font-semibold text-white transition hover:scale-[1.02]"
            >
              Contact opnemen
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}
