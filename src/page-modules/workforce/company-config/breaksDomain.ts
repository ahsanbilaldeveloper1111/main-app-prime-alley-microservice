import {
  buildPolicyEffectiveDatesPayload,
  defaultCompanyPolicyEffectiveFrom,
  formatCompanyPolicyUpdatedAt,
  formatPolicyEffectiveDate,
  readPolicyEffectiveFrom,
  readPolicyEffectiveTo,
  validatePolicyEffectiveDates,
} from "@page-modules/workforce/company-config/companyConfigShared";
import {
  formatWorkforceUnknownNumber,
  toWorkforceSearchToken,
} from "@page-modules/workforce/shared/workforceSearchText";
import type {
  AttendanceBreakPolicy,
  CreateAttendanceBreakPolicyPayload,
} from "@utils/staffManagement";

export type { ShiftTenantOption as BreaksTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type BreaksPolicyFormState = Readonly<{
  max_breaks_per_day: number;
  min_gap_minutes: number;
  effective_from: string;
  effective_to: string;
}>;

export const BREAKS_LIST_DEFAULT_LIMIT = 25;

export const BREAKS_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function createDefaultBreaksPolicyFormState(): BreaksPolicyFormState {
  return {
    max_breaks_per_day: 2,
    min_gap_minutes: 30,
    effective_from: defaultCompanyPolicyEffectiveFrom(),
    effective_to: "",
  };
}

export function validateBreaksPolicyForm(
  form: BreaksPolicyFormState,
  tenantId: string,
): string | null {
  if (!(tenantId ?? "").trim()) {
    return "Select a tenant.";
  }
  if (!Number.isFinite(form.max_breaks_per_day) || form.max_breaks_per_day <= 0) {
    return "Maximum breaks per day must be greater than zero.";
  }
  if (!Number.isFinite(form.min_gap_minutes) || form.min_gap_minutes < 0) {
    return "Minimum gap minutes cannot be negative.";
  }
  return validatePolicyEffectiveDates(form.effective_from, form.effective_to);
}

export function buildBreaksPolicyPayload(
  tenantId: string,
  form: BreaksPolicyFormState,
): CreateAttendanceBreakPolicyPayload {
  const trimmedTenantId = tenantId.trim();
  const effectiveDates = buildPolicyEffectiveDatesPayload(
    form.effective_from,
    form.effective_to,
  );

  return {
    tenant_id: trimmedTenantId,
    target_type: "company",
    target_id: trimmedTenantId,
    max_breaks_per_day: form.max_breaks_per_day,
    min_gap_minutes: form.min_gap_minutes,
    ...effectiveDates,
  };
}

export function breaksPolicyToFormState(
  policy: AttendanceBreakPolicy | null | undefined,
): BreaksPolicyFormState {
  const defaults = createDefaultBreaksPolicyFormState();
  if (!policy) {
    return defaults;
  }

  const record = policy as Record<string, unknown>;
  const maxRaw = policy.max_breaks_per_day ?? record.maxBreaksPerDay;
  const gapRaw = policy.min_gap_minutes ?? record.minGapMinutes;
  const maxBreaks = Number(maxRaw);
  const minGap = Number(gapRaw);

  return {
    ...defaults,
    max_breaks_per_day:
      Number.isFinite(maxBreaks) && maxBreaks > 0 ? maxBreaks : defaults.max_breaks_per_day,
    min_gap_minutes:
      Number.isFinite(minGap) && minGap >= 0 ? minGap : defaults.min_gap_minutes,
    effective_from: readPolicyEffectiveFrom(policy, record),
    effective_to: readPolicyEffectiveTo(policy, record),
  };
}

export function formatBreaksPolicyNumber(
  row: Pick<AttendanceBreakPolicy, "max_breaks_per_day" | "min_gap_minutes"> &
    Record<string, unknown>,
  key: "max_breaks_per_day" | "min_gap_minutes",
): string {
  const camelKey = key === "max_breaks_per_day" ? "maxBreaksPerDay" : "minGapMinutes";
  const value = row[key] ?? row[camelKey];
  return formatWorkforceUnknownNumber(value);
}

export function formatBreaksPolicyMinutes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value} min`;
}

export function formatBreaksEffectiveFrom(
  value: string | null | undefined,
  row?: Record<string, unknown>,
): string {
  return formatPolicyEffectiveDate(value, row, "effectiveFrom");
}

export function formatBreaksEffectiveTo(
  value: string | null | undefined,
  row?: Record<string, unknown>,
): string {
  return formatPolicyEffectiveDate(value, row, "effectiveTo");
}

export function formatBreaksPolicyUpdatedAt(value: string | null | undefined): string | null {
  return formatCompanyPolicyUpdatedAt(value);
}

export function filterBreaksPoliciesBySearch(
  rows: readonly AttendanceBreakPolicy[],
  searchValue: string,
): AttendanceBreakPolicy[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    const record = row as Record<string, unknown>;
    const haystack = [
      row.max_breaks_per_day ?? record.maxBreaksPerDay,
      row.min_gap_minutes ?? record.minGapMinutes,
      row.effective_from ?? record.effectiveFrom,
      row.effective_to ?? record.effectiveTo,
      row.target_type ?? record.targetType,
      row.updated_at ?? record.updatedAt,
    ]
      .map((part) => toWorkforceSearchToken(part))
      .join(" ");
    return haystack.includes(query);
  });
}

export function readBreaksPolicyRowId(row: AttendanceBreakPolicy, index: number): string {
  if (row.id != null && Number.isFinite(row.id)) {
    return String(row.id);
  }
  return `breaks-row-${index}`;
}
