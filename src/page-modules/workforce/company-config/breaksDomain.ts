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
  AttendanceBreakPolicyTargetType,
  CreateAttendanceBreakPolicyPayload,
} from "@utils/staffManagement";

export type { ShiftTenantOption as BreaksTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export const BREAK_POLICY_TARGET_OPTIONS = [
  { value: "company", label: "Company" },
  { value: "department", label: "Department" },
  { value: "employee", label: "Employee" },
] as const;

export type BreaksPolicyFormState = Readonly<{
  target_type: AttendanceBreakPolicyTargetType;
  target_id: string;
  max_breaks_per_day: number;
  min_gap_minutes: number;
  total_max_break_minutes: number;
  break_time_counts_toward_overtime: boolean;
  effective_from: string;
  effective_to: string;
}>;

export const BREAKS_LIST_DEFAULT_LIMIT = 25;
export const BREAKS_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function createDefaultBreaksPolicyFormState(): BreaksPolicyFormState {
  return {
    target_type: "company",
    target_id: "",
    max_breaks_per_day: 2,
    min_gap_minutes: 30,
    total_max_break_minutes: 90,
    break_time_counts_toward_overtime: false,
    effective_from: defaultCompanyPolicyEffectiveFrom(),
    effective_to: "",
  };
}

export function resolveBreakPolicyTargetId(
  tenantId: string,
  form: BreaksPolicyFormState,
): string {
  if (form.target_type === "company") {
    return tenantId.trim();
  }
  return form.target_id.trim();
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
  if (!Number.isFinite(form.total_max_break_minutes) || form.total_max_break_minutes <= 0) {
    return "Total max break time per day must be greater than zero.";
  }
  if (form.target_type !== "company" && !form.target_id.trim()) {
    return "Select a target for this break policy.";
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
    target_type: form.target_type,
    target_id: resolveBreakPolicyTargetId(trimmedTenantId, form),
    max_breaks_per_day: form.max_breaks_per_day,
    min_gap_minutes: form.min_gap_minutes,
    total_max_break_minutes: form.total_max_break_minutes,
    break_time_counts_toward_overtime: form.break_time_counts_toward_overtime,
    ...effectiveDates,
  };
}

export function breaksPolicyToFormState(
  policy: AttendanceBreakPolicy | null | undefined,
  tenantId: string,
): BreaksPolicyFormState {
  const defaults = createDefaultBreaksPolicyFormState();
  if (!policy) {
    return defaults;
  }

  const record = policy as Record<string, unknown>;
  const maxRaw = policy.max_breaks_per_day ?? record.maxBreaksPerDay;
  const gapRaw = policy.min_gap_minutes ?? record.minGapMinutes;
  const totalRaw = policy.total_max_break_minutes ?? record.totalMaxBreakMinutes;
  const maxBreaks = Number(maxRaw);
  const minGap = Number(gapRaw);
  const totalMax = Number(totalRaw);
  const targetTypeRaw = policy.target_type ?? record.targetType;
  const targetType =
    targetTypeRaw === "department" || targetTypeRaw === "employee"
      ? targetTypeRaw
      : "company";

  return {
    ...defaults,
    target_type: targetType,
    target_id:
      targetType === "company"
        ? ""
        : String(policy.target_id ?? record.targetId ?? "").trim(),
    max_breaks_per_day:
      Number.isFinite(maxBreaks) && maxBreaks > 0 ? maxBreaks : defaults.max_breaks_per_day,
    min_gap_minutes:
      Number.isFinite(minGap) && minGap >= 0 ? minGap : defaults.min_gap_minutes,
    total_max_break_minutes:
      Number.isFinite(totalMax) && totalMax > 0
        ? totalMax
        : defaults.total_max_break_minutes,
    break_time_counts_toward_overtime:
      policy.break_time_counts_toward_overtime === true ||
      record.breakTimeCountsTowardOvertime === true,
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
      row.total_max_break_minutes ?? record.totalMaxBreakMinutes,
      row.target_type ?? record.targetType,
      row.target_id ?? record.targetId,
      row.effective_from ?? record.effectiveFrom,
      row.effective_to ?? record.effectiveTo,
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
