import type { BusinessUnit } from "@/lib/services/crm/businessUnits";

interface Props {
  bu: Pick<BusinessUnit, "name" | "icon" | "primary_color"> | null | undefined;
  size?: "sm" | "md";
}

export default function BusinessUnitBadge({ bu, size = "sm" }: Props) {
  if (!bu) return null;
  const padding = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding}`}
      style={{ backgroundColor: `${bu.primary_color}18`, color: bu.primary_color }}
    >
      {bu.icon && <span>{bu.icon}</span>}
      {bu.name}
    </span>
  );
}
