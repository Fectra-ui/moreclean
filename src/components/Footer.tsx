import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#667FB0] via-[#95AEC1] to-[#4D7EBA]" />

      <div className="absolute inset-0 bg-black/10 backdrop-blur-[120px]" />

      {/* CONTENT */}
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-4">
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

          <p className="mt-6 leading-relaxed text-white/75">
            Professionele glasbewassing en zonnepanelen reiniging in
            Roermond en omgeving.
          </p>
        </div>

        {/* NAVIGATIE */}
        <div>
          <h4 className="font-semibold text-white">Navigatie</h4>

          <div className="mt-5 flex flex-col gap-3">
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
                className="text-white/75 transition duration-300 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* WERKGEBIEDEN */}
        <div>
          <h4 className="font-semibold text-white">Werkgebieden</h4>

          <div className="mt-5 flex flex-col gap-3 text-white/75">
            <span>Roermond</span>
            <span>Venlo</span>
            <span>Weert</span>
            <span>Echt</span>
            <span>Limburg</span>
          </div>
        </div>

        {/* CONTACT */}
        <div>
          <h4 className="font-semibold text-white">Contact</h4>

          <div className="mt-5 flex flex-col gap-3 text-white/75">
            <a
              href="tel:+31613672320"
              className="transition hover:text-white"
            >
              +31 6 13672320
            </a>

            <a
              href="mailto:info@moreclean.nl"
              className="transition hover:text-white"
            >
              info@moreclean.nl
            </a>

            <span>Roermond, Limburg</span>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-sm text-white/60">
        © 2026 More Clean — Alle rechten voorbehouden
      </div>
    </footer>
  );
}