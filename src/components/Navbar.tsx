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
    "text-white/85 text-sm font-medium transition duration-300 hover:text-white";

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-3 left-2 right-2 md:left-3 md:right-3 z-50 rounded-2xl border transition-all duration-300 ${
          scrolled || open
            ? "border-white/20 bg-white/[0.05] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
            : "border-white/10 bg-black/10 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-20 md:h-24 w-full max-w-[1500px] items-center justify-between px-6 md:px-12">
          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMenu}
            className="shrink-0 flex items-center"
          >
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={260}
              height={100}
              priority
              className="w-40 md:w-52 h-auto object-contain brightness-110 saturate-125 drop-shadow-[0_8px_24px_rgba(77,126,186,0.35)] transition duration-300 hover:scale-105"
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10">
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
              className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-white/15 hover:scale-105"
            >
              Gratis Offerte
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/15 md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition duration-300 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={closeMenu}
        />

        {/* PANEL */}
        <div
          className={`absolute left-4 right-4 top-24 rounded-3xl border border-white/15 bg-[#101536]/92 p-5 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
            open
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-3 scale-95 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-2">
            <Link
              href="/diensten"
              onClick={closeMenu}
              className="rounded-2xl px-4 py-3 text-white transition hover:bg-white/10"
            >
              Diensten
            </Link>

            <Link
              href="/over-ons"
              onClick={closeMenu}
              className="rounded-2xl px-4 py-3 text-white transition hover:bg-white/10"
            >
              Over Ons
            </Link>

            <Link
              href="/contact"
              onClick={closeMenu}
              className="rounded-2xl px-4 py-3 text-white transition hover:bg-white/10"
            >
              Contact
            </Link>

            <Link
              href="/offerte"
              onClick={closeMenu}
              className="mt-2 rounded-full bg-[#4D7EBA] px-6 py-4 text-center font-semibold text-white shadow-lg transition hover:scale-[1.02]"
            >
              Gratis Offerte
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}