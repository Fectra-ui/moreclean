"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function ShareCopyButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard
      .writeText(`https://moreclean.nl/blog/${slug}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#101536] hover:bg-white transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[#4D7EBA]" />}
      {copied ? "Gekopieerd!" : "Kopieer link"}
    </button>
  );
}
