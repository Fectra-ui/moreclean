"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, User, FileText, Receipt, X } from "lucide-react";
import type { SearchResult } from "@/lib/services/search/globalSearch";

const TYPE_ICONS = {
  client: <User size={14} className="text-[#4D7EBA]" />,
  quote: <FileText size={14} className="text-amber-500" />,
  invoice: <Receipt size={14} className="text-emerald-500" />,
  appointment: <Search size={14} className="text-violet-500" />,
};

const TYPE_LABELS = {
  client: "Klant",
  quote: "Offerte",
  invoice: "Factuur",
  appointment: "Afspraak",
};

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const { results } = await res.json();
        setResults(results);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut ⌘K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function handleSelect(result: SearchResult) {
    setQuery("");
    setOpen(false);
    router.push(result.href);
  }

  return (
    <div ref={containerRef} className="relative w-72">
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#606774]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Zoeken… ⌘K"
          className="w-full rounded-2xl border border-[#101536]/10 bg-[#F3F5F7] py-2.5 pl-9 pr-9 text-sm text-[#101536] outline-none transition placeholder-[#606774]/50 focus:border-[#4D7EBA]/30 focus:bg-white focus:ring-2 focus:ring-[#4D7EBA]/10"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606774] hover:text-[#101536]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[#101536]/08 bg-white shadow-[0_20px_60px_rgba(16,21,54,.15)]">
          {loading ? (
            <div className="px-4 py-3 text-sm text-[#606774]">Zoeken…</div>
          ) : (
            <>
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#F3F5F7]"
                >
                  <span className="flex-shrink-0 rounded-lg bg-[#F3F5F7] p-1.5">
                    {TYPE_ICONS[result.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#101536]">{result.title}</span>
                      <span className="flex-shrink-0 rounded-full bg-[#F3F5F7] px-1.5 py-0.5 text-[10px] text-[#606774]">
                        {TYPE_LABELS[result.type]}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[#606774]">{result.subtitle}</p>
                  </div>
                  {result.meta && (
                    <span className="flex-shrink-0 text-xs font-medium text-[#606774]">{result.meta}</span>
                  )}
                </button>
              ))}

              <div className="border-t border-[#101536]/06 px-4 py-2 text-xs text-[#606774]">
                {results.length} resultaat{results.length !== 1 ? "en" : ""}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
