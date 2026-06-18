import {
  buildPolicyEffectiveDatesPayload,
  defaultCompanyPolicyEffectiveFrom,
  formatCompanyPolicyUpdatedAt,
  formatPolicyEffectiveDate,
  readPolicyEffectiveFrom,
  readPolicyEffectiveTo,
  validatePolicyEffectiveDates,
} from "@page-modules/workforce/company-config/companyConfigShared";
import { toWorkforceSearchToken } from "@page-modules/workforce/shared/workforceSearchText";
import type {
  AttendanceOvertimePolicy,
  CreateAttendanceOvertimePolicyPayload,
} from "@utils/staffManagement";

export type { ShiftTenantOption as OvertimeTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type OvertimePolicyFormState = Readonly<{
  buffer_minutes: number;
  weekly_cap_hours: number;
  enabled: boolean;
  effective_from: string;
  effective_to: string;
}>;

export const OVERTIME_LIST_DEFAULT_LIMIT = 25;

export const OVERTIME_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function createDefaultOvertimePolicyFormState(): OvertimePolicyFormState {
  return {
    buffer_minutes: 15,
    weekly_cap_hours: 20,
    enabled: true,
    effective_from: defaultCompanyPolicyEffectiveFrom(),
    effective_to: "",
  };
}

export function validateOvertimePolicyForm(
  form: OvertimePolicyFormState,
  tenantId: string,
): string | null {
  if (!(tenantId ?? "").trim()) {
    return "Select a tenant.";
  }
  if (!Number.isFinite(form.buffer_minutes) || form.buffer_minutes < 0) {
    return "Buffer minutes cannot be negative.";
  }
  if (!Number.isFinite(form.weekly_cap_hours) || form.weekly_cap_hours <= 0) {
    return "Weekly cap hours must be greater than zero.";
  }
  return validatePolicyEffectiveDates(form.effective_from, form.effective_to);
}

export function buildOvertimePolicyPayload(
  tenantId: string,
  form: OvertimePolicyFormState,
): CreateAttendanceOvertimePolicyPayload {
  const trimmedTenantId = tenantId.trim();
  const effectiveDates = buildPolicyEffectiveDatesPayload(
    form.effective_from,
    form.effective_to,
  );

  return {
    tenant_id: trimmedTenantId,
    target_type: "company",
    target_id: trimmedTenantId,
    buffer_minutes: form.buffer_minutes,
    weekly_cap_hours: form.weekly_cap_hours,
    enabled: form.enabled,
    ...effectiveDates,
  };
}

export function overtimePolicyToFormState(
  policy: AttendanceOvertimePolicy | null | undefined,
): OvertimePolicyFormState {
  const defaults = createDefaultOvertimePolicyFormState();
  if (!policy) {
    return defaults;
  }

  const record = policy as Record<string, unknown>;
  const bufferRaw = policy.buffer_minutes ?? record.bufferMinutes;
  const capRaw =
    policy.weekly_cap_hours ?? record.weeklyCapHours ?? record.weekly_cap ?? record.weeklyCap;
  const bufferMinutes = Number(bufferRaw);
  const weeklyCap = Number(capRaw);
  let enabled = defaults.enabled;
  if (typeof policy.enabled === "boolean") {
    enabled = policy.enabled;
  } else if (typeof record.isEnabled === "boolean") {
    enabled = record.isEnabled;
  }

  return {
    ...defaults,
    buffer_minutes:
      Number.isFinite(bufferMinutes) && bufferMinutes >= 0
        ? bufferMinutes
        : defaults.buffer_minutes,
    weekly_cap_hours:
      Number.isFinite(weeklyCap) && weeklyCap > 0 ? weeklyCap : defaults.weekly_cap_hours,
    enabled,
    effective_from: readPolicyEffectiveFrom(policy, record),
    effective_to: readPolicyEffectiveTo(policy, record),
  };
}

export function formatOvertimePolicyMinutes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value} min`;
}

export function formatOvertimePolicyHours(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value} hrs`;
}

export function formatOvertimePolicyEnabled(value: boolean | null | undefined): string {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

export function formatOvertimeEffectiveFrom(
  value: string | null | undefined,
  row?: Record<string, unknown>,
): string {
  return formatPolicyEffectiveDate(value, row, "effectiveFrom");
}

export function formatOvertimeEffectiveTo(
  value: string | null | undefined,
  row?: Record<string, unknown>,
): string {
  return formatPolicyEffectiveDate(value, row, "effectiveTo");
}

export function formatOvertimePolicyUpdatedAt(value: string | null | undefined): string | null {
  return formatCompanyPolicyUpdatedAt(value);
}

export function filterOvertimePoliciesBySearch(
  rows: readonly AttendanceOvertimePolicy[],
  searchValue: string,
): AttendanceOvertimePolicy[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    const record = row as Record<string, unknown>;
    const haystack = [
      row.buffer_minutes ?? record.bufferMinutes,
      row.weekly_cap_hours ?? record.weeklyCapHours,
      row.enabled ?? record.isEnabled,
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

export function readOvertimePolicyRowId(row: AttendanceOvertimePolicy, index: number): string {
  if (row.id != null && Number.isFinite(row.id)) {
    return String(row.id);
  }
  return `overtime-row-${index}`;
}
