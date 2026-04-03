import type { CSSProperties } from "react";

export const crmPopoverCallButtonInlineStyle: CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #dee2e6",
  backgroundColor: "transparent",
  color: "#212529",
  boxShadow: "none",
  transition: "all 0.2s ease",
  minHeight: "36px",
};

export function applyCrmPopoverCallButtonHover(el: HTMLButtonElement): void {
  el.style.transform = "translateY(-1px)";
  el.style.backgroundColor = "#f8f9fa";
  el.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
}

export function resetCrmPopoverCallButtonHover(el: HTMLButtonElement): void {
  el.style.transform = "translateY(0)";
  el.style.backgroundColor = "transparent";
  el.style.boxShadow = "none";
}

export function getCrmKpiCardStyle(onClick?: () => void): CSSProperties {
  return {
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s ease",
    border: "1px solid #e9ecef",
  };
}

export function applyCrmKpiCardHover(el: HTMLElement): void {
  el.style.transform = "translateY(-4px)";
  el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
}

export function resetCrmKpiCardHover(el: HTMLElement): void {
  el.style.transform = "translateY(0)";
  el.style.boxShadow = "none";
}

export type CrmQuickFilterButtonVariantSource = {
  variant?: string;
  color?: string;
};

export function quickFilterButtonVariant(
  hasCustomColor: boolean,
  isActive: boolean,
  filter: CrmQuickFilterButtonVariantSource,
): string | undefined {
  if (hasCustomColor) {
    return undefined;
  }
  if (isActive) {
    return filter.variant || "primary";
  }
  return "outline-secondary";
}

export function buildCrmQuickFilterButtonStyle(
  filter: CrmQuickFilterButtonVariantSource,
  isActive: boolean,
): CSSProperties | undefined {
  if (!filter.color) return undefined;
  if (isActive) {
    return {
      background: filter.color,
      borderColor: filter.color,
      color: "#fff",
    };
  }
  return {
    background: "#fff",
    borderColor: filter.color,
    color: filter.color,
  };
}
