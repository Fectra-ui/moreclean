import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  accent?: string; // tailwind color class e.g. "text-emerald-500"
  highlight?: boolean;
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "text-[#4D7EBA]",
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-[24px] border p-6
        ${highlight
          ? "border-[#4D7EBA]/20 bg-gradient-to-br from-[#4D7EBA]/8 to-[#95AEC1]/6"
          : "border-white/60 bg-white/75 backdrop-blur-xl"
        }
        shadow-[0_8px_32px_rgba(16,21,54,.06)]
        transition-all duration-300 hover:shadow-[0_12px_40px_rgba(16,21,54,.10)] hover:-translate-y-0.5
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#606774]">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-[#101536]">{value}</p>
          {sub && <p className="mt-1 text-xs text-[#606774]">{sub}</p>}
        </div>
        <div className={`rounded-2xl bg-white/80 p-3 shadow-sm ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
