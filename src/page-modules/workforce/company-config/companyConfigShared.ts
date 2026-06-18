import { normalizeShiftDateForInput } from "@page-modules/workforce/shifts/shiftManagementDomain";
import { formatDateForTable } from "@utils/Helper";

export function defaultCompanyPolicyEffectiveFrom(): string {
  const year = new Date().getFullYear();
  return `${year}-01-01`;
}

export function formatCompanyPolicyUpdatedAt(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return formatDateForTable(trimmed);
}

export function readPolicyEffectiveFrom(
  policy: { effective_from?: string | null } | null | undefined,
  record?: Record<string, unknown>,
): string {
  const raw =
    policy?.effective_from ??
    (typeof record?.effectiveFrom === "string" ? record.effectiveFrom : null);
  return normalizeShiftDateForInput(raw) || defaultCompanyPolicyEffectiveFrom();
}

export function readPolicyEffectiveTo(
  policy: { effective_to?: string | null } | null | undefined,
  record?: Record<string, unknown>,
): string {
  const raw =
    policy?.effective_to ??
    (typeof record?.effectiveTo === "string" ? record.effectiveTo : null);
  return normalizeShiftDateForInput(raw) ?? "";
}

export function validatePolicyEffectiveDates(
  effectiveFrom: string | null | undefined,
  effectiveTo: string | null | undefined,
): string | null {
  const from = (effectiveFrom ?? "").trim();
  const to = (effectiveTo ?? "").trim();
  if (!from) {
    return "Effective from date is required.";
  }
  if (to && to < from) {
    return "Effective to date cannot be before effective from date.";
  }
  return null;
}

export function buildPolicyEffectiveDatesPayload(
  effectiveFrom: string | null | undefined,
  effectiveTo: string | null | undefined,
): { effective_from: string; effective_to: string | null } {
  return {
    effective_from: (effectiveFrom ?? "").trim(),
    effective_to: (effectiveTo ?? "").trim() || null,
  };
}

export function formatPolicyEffectiveDate(
  value: string | null | undefined,
  row?: Record<string, unknown>,
  camelAlternate?: "effectiveFrom" | "effectiveTo",
): string {
  const raw =
    value ??
    (camelAlternate && typeof row?.[camelAlternate] === "string"
      ? row[camelAlternate]
      : null);
  const normalized = normalizeShiftDateForInput(raw);
  if (!normalized) return "—";
  return formatCompanyPolicyUpdatedAt(normalized) ?? normalized;
}
