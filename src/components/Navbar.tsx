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

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <header className="fixed left-0 top-0 z-50 w-full px-4">
        <div
          className={`
            mx-auto
            mt-4
            flex
            max-w-7xl
            items-center
            justify-between
            rounded-2xl
            border
            px-6
            py-3
            backdrop-blur-2xl
            transition-all
            duration-300
            ${
              scrolled || open
                ? "border-white/20 bg-[#DDE3EA]/55 ring-1 ring-white/25 shadow-[0_10px_40px_rgba(0,0,0,.10)]"
                : "border-white/10 bg-[#DDE3EA]/45 ring-1 ring-white/20 shadow-[0_10px_40px_rgba(0,0,0,.08)]"
            }
          `}
        >
          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center"
          >
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={80}
              height={30}
              priority
              className="
                h-auto
                w-auto
                object-contain
                transition
                duration-300
                hover:scale-[1.02]
              "
            />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden items-center gap-10 md:flex">
            {[
              ["Diensten", "/diensten"],
              ["Over Ons", "/over-ons"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="
                  text-sm
                  font-medium
                  text-[#101536]/80
                  transition
                  duration-300
                  hover:text-[#101536]
                "
              >
                {label}
              </Link>
            ))}

            {/* CTA */}
            <Link
              href="/offerte"
              className="
                rounded-xl
                bg-[#F8FAFC]
                px-5
                py-3
                text-sm
                font-semibold
                text-[#101536]
                transition
                duration-300
                hover:scale-[1.03]
              "
            >
              Gratis Offerte
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-white/20
              bg-white/20
              text-[#101536]
              transition
              duration-300
              hover:bg-white/30
              md:hidden
            "
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ================= MOBILE MENU ================= */}
      <div
        className={`
          fixed
          inset-0
          z-40
          transition
          duration-300
          md:hidden
          ${
            open
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }
        `}
      >
        {/* BACKDROP */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={closeMenu}
        />

        {/* PANEL */}
        <div
          className={`
            absolute
            left-4
            right-4
            top-24
            rounded-[30px]
            border
            border-white/20
            bg-[#DDE3EA]/95
            p-5
            shadow-[0_20px_80px_rgba(0,0,0,.12)]
            backdrop-blur-3xl
            transition-all
            duration-300
            ${
              open
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-3 scale-95 opacity-0"
            }
          `}
        >
          <nav className="flex flex-col gap-2">
            {[
              ["Diensten", "/diensten"],
              ["Over Ons", "/over-ons"],
              ["Contact", "/contact"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={closeMenu}
                className="
                  rounded-2xl
                  px-4
                  py-4
                  font-medium
                  text-[#101536]
                  transition
                  duration-300
                  hover:bg-white/50
                "
              >
                {label}
              </Link>
            ))}

            {/* CTA */}
            <Link
              href="/offerte"
              onClick={closeMenu}
              className="
                mt-3
                rounded-2xl
                bg-gradient-to-r
                from-[#667FB0]
                via-[#95AEC1]
                to-[#4D7EBA]
                px-6
                py-4
                text-center
                font-semibold
                text-white
                shadow-[0_20px_60px_rgba(77,126,186,.30)]
                transition
                duration-300
                hover:scale-[1.02]
              "
            >
              Gratis Offerte
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}