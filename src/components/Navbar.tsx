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
      <header className="fixed left-0 top-0 z-[70] w-full px-3 pt-3 md:px-4 md:pt-0">
        <div
          className={`
            relative
            overflow-hidden
            mx-auto
            mt-0
            md:mt-4
            flex
            max-w-7xl
            items-center
            justify-between
            rounded-[24px]
            border
            px-4
            py-2.5
            md:px-6
            md:py-4
            transition-all
            duration-500

            ${
              scrolled || open
                ? `
                  border-white/30
                  bg-white/[0.20]
                  shadow-[0_12px_50px_rgba(0,0,0,.18)]
                  backdrop-blur-[34px]
                `
                : `
                  border-white/20
                  bg-white/[0.12]
                  shadow-[0_10px_40px_rgba(0,0,0,.12)]
                  backdrop-blur-[26px]
                `
            }

            before:absolute
            before:inset-0
            before:rounded-[inherit]
            before:bg-[linear-gradient(180deg,rgba(255,255,255,.30),rgba(255,255,255,.08))]
            before:pointer-events-none

            after:absolute
            after:inset-[1px]
            after:rounded-[22px]
            after:border
            after:border-white/10
            after:pointer-events-none
          `}
        >
          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMenu}
            className="relative z-50 flex items-center"
          >
            <Image
              src="/images/logo.png"
              alt="More Clean"
              width={82}
              height={32}
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
                  relative
                  z-50
                  text-sm
                  font-medium
                  text-white
                  transition
                  duration-300
                  hover:opacity-80
                "
              >
                {label}
              </Link>
            ))}

            {/* CTA */}
            <Link
              href="/offerte"
              className="
                group
                relative
                z-50
                overflow-hidden
                rounded-2xl
                bg-gradient-to-r
                from-[#667FB0]
                via-[#95AEC1]
                to-[#4D7EBA]
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                shadow-[0_15px_40px_rgba(77,126,186,.25)]
                transition-all
                duration-500
                hover:-translate-y-1
                hover:shadow-[0_25px_60px_rgba(77,126,186,.34)]
              "
            >
              <span className="relative z-10">
                Gratis Offerte
              </span>

              <div
                className="
                  absolute
                  inset-0
                  opacity-0
                  transition
                  duration-500
                  group-hover:opacity-100
                  bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.25),transparent)]
                  translate-x-[-120%]
                  group-hover:translate-x-[120%]
                "
              />
            </Link>
          </nav>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Open menu"
            className="
              relative
              z-50
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-2xl
              border
              border-white/30
              bg-white/20
              text-white
              shadow-[0_10px_30px_rgba(0,0,0,.20)]
              backdrop-blur-2xl
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
          z-[60]
          transition-all
          duration-500
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
          className="
            absolute
            inset-0
            bg-[#101536]/70
            backdrop-blur-xl
          "
          onClick={closeMenu}
        />

        {/* MENU PANEL */}
        <div
          className={`
            absolute
            left-4
            right-4
            top-24
            overflow-hidden
            rounded-[28px]
            border
            border-white/20
            bg-white/[0.20]
            p-4
            shadow-[0_20px_80px_rgba(0,0,0,.18)]
            backdrop-blur-[34px]
            transition-all
            duration-500

            before:absolute
            before:inset-0
            before:bg-[linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.08))]
            before:pointer-events-none

            ${
              open
                ? "translate-y-0 opacity-100 scale-100"
                : "-translate-y-10 opacity-0 scale-95"
            }
          `}
        >
          <nav className="relative z-10 flex flex-col gap-2">
            {[
              ["Home", "/"],
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
                  px-5
                  py-4
                  text-lg
                  font-semibold
                  text-white
                  transition
                  duration-300
                  hover:bg-white/10
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
                group
                relative
                mt-4
                flex
                items-center
                justify-center
                overflow-hidden
                rounded-[22px]
                bg-gradient-to-r
                from-[#667FB0]
                via-[#95AEC1]
                to-[#4D7EBA]
                px-6
                py-5
                text-lg
                font-semibold
                text-white
                shadow-[0_20px_60px_rgba(77,126,186,.30)]
                transition-all
                duration-500
                hover:-translate-y-1
                hover:shadow-[0_30px_80px_rgba(77,126,186,.38)]
              "
            >
              <span className="relative z-10">
                Gratis Offerte
              </span>

              <div
                className="
                  absolute
                  inset-0
                  opacity-0
                  transition
                  duration-500
                  group-hover:opacity-100
                  bg-[linear-gradient(120deg,transparent,rgba(255,255,255,.25),transparent)]
                  translate-x-[-120%]
                  group-hover:translate-x-[120%]
                "
              />
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}