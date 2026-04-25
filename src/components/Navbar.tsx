"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
    "text-white/85 text-sm font-medium transition hover:text-white";

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-3 left-3 right-3 z-50 rounded-2xl border transition-all duration-300 ${
          scrolled || open
            ? "border-white/20 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
            : "border-white/10 bg-black/10 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-24 md:h-28 max-w-7xl items-center justify-between px-4 md:px-6">
          {/* LOGO */}
          <Link href="/" onClick={closeMenu} className="shrink-0">
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={220}
              height={90}
              priority
              className="w-36 md:w-44 h-auto object-contain brightness-110 drop-shadow-[0_0_14px_rgba(149,174,193,0.28)] transition duration-300 hover:scale-105"
            />
          </Link>

          {/* DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={navLink}>Home</Link>
            <Link href="/diensten" className={navLink}>Diensten</Link>
            <Link href="/over-ons" className={navLink}>Over Ons</Link>
            <Link href="/contact" className={navLink}>Contact</Link>

            <Link
              href="/offerte"
              className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white border border-white/15 transition hover:bg-white/15"
            >
              Gratis Offerte
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeMenu}
        />

        <div
          className={`absolute left-4 right-4 top-24 rounded-3xl border border-white/15 bg-[#101536]/90 p-5 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
            open
              ? "translate-y-0 opacity-100 scale-100"
              : "-translate-y-3 opacity-0 scale-95"
          }`}
        >
          <nav className="flex flex-col gap-2">
            <Link href="/diensten" onClick={closeMenu} className="rounded-2xl px-4 py-3 text-white hover:bg-white/10">
              Diensten
            </Link>

            <Link href="/over-ons" onClick={closeMenu} className="rounded-2xl px-4 py-3 text-white hover:bg-white/10">
              Over Ons
            </Link>

            <Link href="/contact" onClick={closeMenu} className="rounded-2xl px-4 py-3 text-white hover:bg-white/10">
              Contact
            </Link>

            <Link
              href="/offerte"
              onClick={closeMenu}
              className="mt-2 rounded-full bg-[#4D7EBA] px-6 py-4 text-center font-semibold text-white"
            >
              Gratis Offerte
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}