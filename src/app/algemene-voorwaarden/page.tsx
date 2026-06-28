import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Algemene Voorwaarden | More Clean",
  description:
    "Lees de algemene voorwaarden van More Clean voor onze schoonmaak- en glasbewassingsservices.",
  alternates: {
    canonical: "https://moreclean.nl/algemene-voorwaarden",
  },
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F3F5F7] px-6 pb-24 pt-[220px] text-[#121212]">
      <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[#95AEC1]/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <span className="glass inline-flex rounded-full px-4 py-2 text-sm">
          Algemene Voorwaarden
        </span>

        <h1 className="mt-6 text-4xl font-bold leading-tight text-[#101536] md:text-5xl">
          Algemene Voorwaarden
        </h1>

        <p className="mt-4 text-[#606774]">
          Versie: 28 juni 2026 | More Clean, Roermond
        </p>

        <div className="mt-12 space-y-10 rounded-[32px] border border-white/60 bg-white/75 p-10 shadow-[0_20px_80px_rgba(0,0,0,.08)] backdrop-blur-3xl">

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 1 — Definities</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              <strong>More Clean</strong>: het schoonmaakbedrijf gevestigd te Roermond, ingeschreven bij
              de Kamer van Koophandel.<br />
              <strong>Opdrachtgever</strong>: de natuurlijke persoon of rechtspersoon die More Clean
              opdracht geeft tot het uitvoeren van werkzaamheden.<br />
              <strong>Diensten</strong>: glasbewassing, zonnepanelen reiniging, schoonmaakdiensten en
              aanverwante werkzaamheden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 2 — Toepasselijkheid</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Deze algemene voorwaarden zijn van toepassing op alle offertes, aanbiedingen en
              overeenkomsten tussen More Clean en de opdrachtgever. Afwijkingen zijn alleen geldig
              indien schriftelijk overeengekomen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 3 — Offertes en prijzen</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Alle offertes zijn vrijblijvend en geldig gedurende 30 dagen na dagtekening, tenzij
              anders vermeld. Prijzen zijn inclusief BTW tenzij anders aangegeven.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 4 — Uitvoering van de diensten</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              More Clean zal de overeengekomen werkzaamheden naar beste inzicht en vermogen uitvoeren.
              De opdrachtgever zorgt voor een veilige en toegankelijke werkomgeving. More Clean is
              niet aansprakelijk voor schade als gevolg van onjuiste of onvolledige informatie van
              de opdrachtgever.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 5 — Annulering</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Annulering dient minimaal 48 uur voor de geplande uitvoerdatum te geschieden. Bij
              annulering binnen 24 uur kan More Clean 50% van de overeengekomen prijs in rekening
              brengen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 6 — Betaling</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Betaling dient te geschieden binnen 14 dagen na factuurdatum. Bij niet-tijdige betaling
              is de opdrachtgever van rechtswege in verzuim en is More Clean gerechtigd wettelijke
              rente en incassokosten in rekening te brengen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 7 — Aansprakelijkheid</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              De aansprakelijkheid van More Clean is beperkt tot het bedrag dat in het kader van de
              betreffende opdracht is gefactureerd. More Clean is niet aansprakelijk voor indirecte
              schade, gevolgschade of gederfde winst.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Artikel 8 — Toepasselijk recht</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Op alle overeenkomsten met More Clean is Nederlands recht van toepassing. Geschillen
              worden voorgelegd aan de bevoegde rechter in het arrondissement Limburg.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#101536]">Vragen?</h2>
            <p className="mt-4 leading-relaxed text-[#606774]">
              Heeft u vragen over onze algemene voorwaarden?
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
