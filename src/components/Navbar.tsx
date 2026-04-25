"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const navLink =
    "text-white/90 transition duration-300 hover:text-white";

  return (
    <>
      <header
        className={`fixed top-3 left-3 right-3 z-50 rounded-2xl border overflow-hidden transition-all duration-500 ${
          scrolled || open
            ? "translate-y-0 opacity-100 border-white/25 bg-white/[0.03] backdrop-blur-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            : "-translate-y-6 opacity-0 pointer-events-none border-transparent bg-transparent"
        }`}
      >
        {/* HELDER GLASS */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
          {/* top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-white/90" />

          {/* subtle shine */}
          <div className="absolute top-0 left-[12%] h-full w-24 rotate-12 bg-white/10 blur-2xl" />

          {/* center reflection */}
          <div className="absolute top-1 right-[24%] h-10 w-32 rounded-full bg-white/12 blur-2xl" />

          {/* super light wash */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />

          {/* bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-black/20" />
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-6 md:py-4">
          {/* LOGO */}
          <Link href="/" onClick={closeMenu}>
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={220}
              height={90}
              priority
              className="w-28 md:w-32 h-auto object-contain"
            />
          </Link>

          {/* DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={navLink}>
              Home
            </Link>

            <Link href="/diensten" className={navLink}>
              Diensten
            </Link>

            <Link href="/over-ons" className={navLink}>
              Over Ons
            </Link>

            <Link href="/contact" className={navLink}>
              Contact
            </Link>

            <Link
              href="/offerte"
              className="rounded-full border border-white/20 bg-white/[0.08] px-5 py-3 font-semibold text-white transition duration-300 hover:bg-white/[0.14]"
            >
              Gratis Offerte
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white backdrop-blur-xl md:hidden"
            aria-label="Menu openen"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          onClick={closeMenu}
        />

        <div
          className={`absolute left-3 right-3 top-24 rounded-3xl border border-white/20 bg-white/[0.04] p-6 backdrop-blur-[22px] shadow-2xl transition-all duration-500 ${
            open
              ? "translate-y-0 opacity-100"
              : "-translate-y-6 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-3 text-white">
            <Link href="/" onClick={closeMenu} className="rounded-2xl px-4 py-3 hover:bg-white/5">
              Home
            </Link>

            <Link href="/diensten" onClick={closeMenu} className="rounded-2xl px-4 py-3 hover:bg-white/5">
              Diensten
            </Link>

            <Link href="/over-ons" onClick={closeMenu} className="rounded-2xl px-4 py-3 hover:bg-white/5">
              Over Ons
            </Link>

            <Link href="/contact" onClick={closeMenu} className="rounded-2xl px-4 py-3 hover:bg-white/5">
              Contact
            </Link>

            <Link
              href="/offerte"
              onClick={closeMenu}
              className="mt-3 rounded-full border border-white/20 bg-white/[0.08] px-6 py-4 text-center font-semibold"
            >
              Gratis Offerte
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}