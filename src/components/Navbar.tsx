"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkClass =
    "text-white/90 transition hover:text-white";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || open
            ? "border-b border-white/10 bg-[#101536]/80 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" onClick={() => setOpen(false)}>
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={150}
              height={60}
              priority
            />
          </Link>

          {/* DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={linkClass}>Home</Link>
            <Link href="/diensten" className={linkClass}>Diensten</Link>
            <Link href="/over-ons" className={linkClass}>Over Ons</Link>
            <Link href="/contact" className={linkClass}>Contact</Link>

            <Link
              href="/offerte"
              className="rounded-full bg-[#4D7EBA] px-5 py-3 font-semibold text-white transition hover:scale-105"
            >
              Gratis Offerte
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl md:hidden"
            aria-label="Menu"
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        <div
          className={`absolute left-4 right-4 top-24 rounded-3xl border border-white/10 bg-[#101536]/95 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-500 ${
            open
              ? "translate-y-0 opacity-100"
              : "-translate-y-6 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-3">
            <Link href="/" className="rounded-2xl px-4 py-3 hover:bg-white/5" onClick={() => setOpen(false)}>
              Home
            </Link>

            <Link href="/diensten" className="rounded-2xl px-4 py-3 hover:bg-white/5" onClick={() => setOpen(false)}>
              Diensten
            </Link>

            <Link href="/over-ons" className="rounded-2xl px-4 py-3 hover:bg-white/5" onClick={() => setOpen(false)}>
              Over Ons
            </Link>

            <Link href="/contact" className="rounded-2xl px-4 py-3 hover:bg-white/5" onClick={() => setOpen(false)}>
              Contact
            </Link>

            <Link
              href="/offerte"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full bg-[#4D7EBA] px-6 py-4 text-center font-semibold text-white"
            >
              Gratis Offerte
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}