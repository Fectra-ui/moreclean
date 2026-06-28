"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface BlogTOCProps {
  headings: Heading[];
}

export default function BlogTOC({ headings }: BlogTOCProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      {
        rootMargin: "0px 0px -60% 0px",
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="glass rounded-[24px] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#4D7EBA] mb-4">
        Inhoudsopgave
      </p>
      <ul className="space-y-1">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={level === 3 ? "pl-4" : ""}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveId(id);
                }
              }}
              className={`flex items-center gap-2 py-1 text-sm transition-colors leading-snug ${
                activeId === id
                  ? "text-[#4D7EBA] font-semibold"
                  : "text-[#606774] hover:text-[#101536]"
              }`}
            >
              <span
                className={`flex-shrink-0 rounded-full transition-all ${
                  level === 2
                    ? activeId === id
                      ? "w-2 h-2 bg-[#4D7EBA]"
                      : "w-1.5 h-1.5 bg-[#CACED3]"
                    : activeId === id
                    ? "w-1.5 h-1.5 bg-[#95AEC1]"
                    : "w-1 h-1 bg-[#CACED3]"
                }`}
              />
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
