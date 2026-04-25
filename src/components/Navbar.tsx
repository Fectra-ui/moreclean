"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
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
      {/* NAVBAR */}
      <header
        className={`fixed top-3 left-3 right-3 z-50 overflow-hidden rounded-2xl transition-all duration-500 ${
          scrolled || open
            ? "border border-white/20 bg-white/[0.035] backdrop-blur-[18px] shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
            : "border border-white/10 bg-black/10 backdrop-blur-sm"
        }`}
      >
        {/* GLASS LIGHTS */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/80" />
          <div className="absolute top-0 left-[10%] h-full w-24 rotate-12 bg-white/10 blur-2xl" />
          <div className="absolute top-1 right-[24%] h-10 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-black/20" />
        </div>

        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-2 md:px-6 md:py-4">
          {/* LOGO */}
          <Link href="/" onClick={closeMenu} className="shrink-0">
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={220}
              height={90}
              priority
              className="h-auto w-24 md:w-32 object-contain transition duration-300 hover:scale-105"
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-8 md:flex">
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
              className="rounded-full border border-white/20 bg-white/[0.08] px-5 py-3 font-semibold text-white transition duration-300 hover:scale-105 hover:bg-white/[0.14]"
            >
              Gratis Offerte
            </Link>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu openen"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white backdrop-blur-xl transition duration-300 hover:bg-white/[0.12] md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
<div
  className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
    open
      ? "pointer-events-auto opacity-100"
      : "pointer-events-none opacity-0"
  }`}
>
  {/* BACKDROP */}
  <div
    className="absolute inset-0 bg-black/35 backdrop-blur-md"
    onClick={closeMenu}
  />

  {/* PANEL */}
  <div
    className={`absolute left-4 right-4 top-28 rounded-3xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 ${
      open
        ? "translate-y-0 scale-100 opacity-100"
        : "-translate-y-4 scale-95 opacity-0"
    }`}
  >
    <nav className="flex flex-col gap-2 text-white">
      <Link
        href="/"
        onClick={closeMenu}
        className="rounded-2xl px-4 py-3 text-lg font-medium transition hover:bg-white/10"
      >
        Home
      </Link>

      <Link
        href="/diensten"
        onClick={closeMenu}
        className="rounded-2xl px-4 py-3 text-lg font-medium transition hover:bg-white/10"
      >
        Diensten
      </Link>

      <Link
        href="/over-ons"
        onClick={closeMenu}
        className="rounded-2xl px-4 py-3 text-lg font-medium transition hover:bg-white/10"
      >
        Over Ons
      </Link>

      <Link
        href="/contact"
        onClick={closeMenu}
        className="rounded-2xl px-4 py-3 text-lg font-medium transition hover:bg-white/10"
      >
        Contact
      </Link>

      <Link
        href="/offerte"
        onClick={closeMenu}
        className="mt-3 rounded-full bg-[#4D7EBA] px-6 py-4 text-center font-semibold text-white shadow-lg"
      >
        Gratis Offerte
      </Link>
    </nav>
  </div>
</div>
    </>
  );
}