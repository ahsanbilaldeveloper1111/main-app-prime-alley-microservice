import React from "react";

const DEFAULT_HEX = "#4680FF";

/** Normalize API color to a non-empty CSS color string. */
export function plannerDisplayHex(color: unknown, fallback = DEFAULT_HEX): string {
  if (typeof color !== "string") return fallback;
  const t = color.trim();
  return t.length > 0 ? t : fallback;
}

export type PlannerColorSwatchVariant = "squareMd" | "squareSm" | "barWide";

type PlannerColorTableCellProps = Readonly<{
  color?: string | null;
  variant?: PlannerColorSwatchVariant;
  className?: string;
}>;

const VARIANT_STYLES: Record<PlannerColorSwatchVariant, React.CSSProperties> = {
  squareMd: { width: 32, height: 32, borderRadius: 6 },
  squareSm: { width: 20, height: 20, borderRadius: 4 },
  barWide: { width: 40, height: 24, borderRadius: 4 },
};

/**
 * Visual-only color cell for planner tables (hex available via tooltip / aria for a11y).
 */
export function PlannerColorTableCell({
  color,
  variant = "squareMd",
  className,
}: PlannerColorTableCellProps): React.ReactElement {
  const hex = plannerDisplayHex(color);
  const size = VARIANT_STYLES[variant];
  return (
    <span
      className={className}
      aria-label={`Color ${hex}`}
      title={hex}
      style={{
        ...size,
        display: "inline-block",
        backgroundColor: hex,
        border: "1px solid rgba(0,0,0,0.12)",
        flexShrink: 0,
        boxSizing: "border-box",
      }}
    />
  );
}
