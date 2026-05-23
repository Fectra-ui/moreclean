import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#667FB0] via-[#95AEC1] to-[#4D7EBA]" />

      <div className="absolute inset-0 bg-[#101536]/20 backdrop-blur-[120px]" />

      {/* GLOW */}
      <div className="absolute left-1/2 top-[-300px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

      {/* CONTENT */}
      <div className="relative z-10 mx-auto grid max-w-7xl gap-14 px-6 py-20 md:grid-cols-4">
        {/* LOGO */}
        <div className="max-w-md">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={90}
              height={40}
              className="h-auto w-auto object-contain"
            />
          </Link>

          <p className="mt-6 text-[15px] leading-relaxed text-white/75">
            Professionele glasbewassing, zonnepanelen reiniging en
            schoonmaakdiensten in Roermond, Venlo, Weert en omgeving.
          </p>

          {/* CTA */}
          <Link
            href="/offerte"
            className="
              mt-8
              inline-flex
              items-center
              justify-center
              rounded-2xl
              bg-white
              px-6
              py-3
              text-sm
              font-semibold
              text-[#101536]
              shadow-[0_10px_40px_rgba(255,255,255,.15)]
              transition
              duration-300
              hover:scale-[1.03]
            "
          >
            Gratis Offerte
          </Link>
        </div>

        {/* NAVIGATIE */}
        <div>
          <h4 className="text-lg font-semibold text-white">
            Navigatie
          </h4>

          <div className="mt-6 flex flex-col gap-4">
            {[
              ["Home", "/"],
              ["Diensten", "/diensten"],
              ["Over Ons", "/over-ons"],
              ["Contact", "/contact"],
              ["Offerte", "/offerte"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="
                  text-white/75
                  transition
                  duration-300
                  hover:translate-x-1
                  hover:text-white
                "
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* WERKGEBIEDEN */}
        <div>
          <h4 className="text-lg font-semibold text-white">
            Werkgebieden
          </h4>

          <div className="mt-6 flex flex-col gap-4">
            {[
              ["Roermond", "/roermond"],
              ["Venlo", "/venlo"],
              ["Weert", "/weert"],
              ["Echt", "/echt"],
              ["Limburg", "/limburg"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="
                  text-white/75
                  transition
                  duration-300
                  hover:translate-x-1
                  hover:text-white
                "
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="text-lg font-semibold text-white">
            Contact
          </h4>

          <div className="mt-6 flex flex-col gap-4">
            <a
              href="tel:+31613672320"
              className="
                text-white/75
                transition
                duration-300
                hover:text-white
              "
            >
              +31 6 13672320
            </a>

            <a
              href="mailto:info@moreclean.nl"
              className="
                text-white/75
                transition
                duration-300
                hover:text-white
              "
            >
              info@moreclean.nl
            </a>

            <span className="text-white/75">
              Roermond, Limburg
            </span>

            {/* TRUST BADGE */}
            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-sm text-white/85">
                Binnen 24 uur reactie
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="relative z-10 border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-white/60 md:flex-row">
          <p>
            © 2026 More Clean — Alle rechten voorbehouden
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacybeleid
            </Link>

            <Link
              href="/algemene-voorwaarden"
              className="transition hover:text-white"
            >
              Algemene voorwaarden
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}