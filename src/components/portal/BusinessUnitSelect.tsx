"use client";

import type { BusinessUnit } from "@/lib/services/crm/businessUnits";

interface Props {
  units: BusinessUnit[];
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  label?: string;
}

export default function BusinessUnitSelect({ units, value, onChange, required, label = "Bedrijfsunit" }: Props) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#606774]">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {units.map((bu) => {
          const active = value === bu.id;
          return (
            <button
              key={bu.id}
              type="button"
              onClick={() => onChange(bu.id)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition"
              style={active
                ? { backgroundColor: bu.primary_color, borderColor: bu.primary_color, color: "#fff" }
                : { borderColor: `${bu.primary_color}40`, color: bu.primary_color, backgroundColor: `${bu.primary_color}0d` }
              }
            >
              {bu.icon && <span>{bu.icon}</span>}
              {bu.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
