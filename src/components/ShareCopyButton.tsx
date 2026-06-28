"use client";

interface ShareCopyButtonProps {
  slug: string;
}

export default function ShareCopyButton({ slug }: ShareCopyButtonProps) {
  return (
    <button
      onClick={() => {
        navigator.clipboard
          .writeText(`https://moreclean.nl/blog/${slug}`)
          .then(() => alert("Link gekopieerd!"))
          .catch(() => {});
      }}
      className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#101536] hover:bg-white transition-colors"
    >
      <svg
        className="w-4 h-4 text-[#4D7EBA]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
      Kopieer link
    </button>
  );
}
