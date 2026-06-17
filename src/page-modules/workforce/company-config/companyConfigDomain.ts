import {
  buildPolicyEffectiveDatesPayload,
  defaultCompanyPolicyEffectiveFrom,
  formatCompanyPolicyUpdatedAt,
  formatPolicyEffectiveDate,
  readPolicyEffectiveFrom,
  readPolicyEffectiveTo,
  validatePolicyEffectiveDates,
} from "@page-modules/workforce/company-config/companyConfigShared";
import type {
  AttendanceWorkHoursPolicy,
  CreateAttendanceWorkHoursPolicyPayload,
} from "@utils/staffManagement";

export type { ShiftTenantOption as CompanyConfigTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";
export type { ShiftTenantOption as WorkHoursTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type WorkHoursPolicyFormState = Readonly<{
  min_hours_per_day: number;
  max_hours_per_day: number;
  effective_from: string;
  effective_to: string;
}>;

export const WORK_HOURS_LIST_DEFAULT_LIMIT = 25;

export const WORK_HOURS_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function createDefaultWorkHoursPolicyFormState(): WorkHoursPolicyFormState {
  return {
    min_hours_per_day: 8,
    max_hours_per_day: 12,
    effective_from: defaultCompanyPolicyEffectiveFrom(),
    effective_to: "",
  };
}

export function validateWorkHoursPolicyForm(
  form: WorkHoursPolicyFormState,
  tenantId: string,
): string | null {
  if (!(tenantId ?? "").trim()) {
    return "Select a tenant.";
  }
  if (!Number.isFinite(form.min_hours_per_day) || form.min_hours_per_day <= 0) {
    return "Minimum hours per day must be greater than zero.";
  }
  if (!Number.isFinite(form.max_hours_per_day) || form.max_hours_per_day <= 0) {
    return "Maximum hours per day must be greater than zero.";
  }
  if (form.max_hours_per_day < form.min_hours_per_day) {
    return "Maximum hours per day cannot be less than minimum hours per day.";
  }
  return validatePolicyEffectiveDates(form.effective_from, form.effective_to);
}

export function buildWorkHoursPolicyPayload(
  tenantId: string,
  form: WorkHoursPolicyFormState,
): CreateAttendanceWorkHoursPolicyPayload {
  const trimmedTenantId = tenantId.trim();
  const effectiveDates = buildPolicyEffectiveDatesPayload(
    form.effective_from,
    form.effective_to,
  );

  return {
    tenant_id: trimmedTenantId,
    target_type: "company",
    target_id: trimmedTenantId,
    min_hours_per_day: form.min_hours_per_day,
    max_hours_per_day: form.max_hours_per_day,
    ...effectiveDates,
  };
}

export function formatWorkHoursPolicyHours(
  row: Pick<AttendanceWorkHoursPolicy, "min_hours_per_day" | "max_hours_per_day"> & Record<string, unknown>,
  key: "min_hours_per_day" | "max_hours_per_day",
): string {
  const camelKey = key === "min_hours_per_day" ? "minHoursPerDay" : "maxHoursPerDay";
  const value = row[key] ?? row[camelKey];
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return String(value);
}

export function formatWorkHoursEffectiveFrom(
  value: string | null | undefined,
  row?: Record<string, unknown>,
): string {
  return formatPolicyEffectiveDate(value, row, "effectiveFrom");
}

export function formatWorkHoursEffectiveTo(
  value: string | null | undefined,
  row?: Record<string, unknown>,
): string {
  return formatPolicyEffectiveDate(value, row, "effectiveTo");
}

export function formatWorkHoursPolicyUpdatedAt(value: string | null | undefined): string | null {
  return formatCompanyPolicyUpdatedAt(value);
}

export function filterWorkHoursPoliciesBySearch(
  rows: readonly AttendanceWorkHoursPolicy[],
  searchValue: string,
): AttendanceWorkHoursPolicy[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    const record = row as Record<string, unknown>;
    const haystack = [
      row.min_hours_per_day ?? record.minHoursPerDay,
      row.max_hours_per_day ?? record.maxHoursPerDay,
      row.effective_from ?? record.effectiveFrom,
      row.effective_to ?? record.effectiveTo,
      row.target_type ?? record.targetType,
      row.updated_at ?? record.updatedAt,
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}

export function readWorkHoursPolicyRowId(row: AttendanceWorkHoursPolicy, index: number): string {
  if (row.id != null && Number.isFinite(row.id)) {
    return String(row.id);
  }
  return `work-hours-row-${index}`;
}

export function resolveWorkHoursPolicyTenantId(
  row: AttendanceWorkHoursPolicy,
  fallbackTenantId: string,
): string {
  const record = row as Record<string, unknown>;
  const tenantId = readAttendancePolicyTenantId(row.tenant_id ?? record.tenantId);
  const targetId = readAttendancePolicyTenantId(row.target_id ?? record.targetId);
  return tenantId || targetId || fallbackTenantId.trim();
}

function readAttendancePolicyTenantId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function workHoursPolicyToFormState(
  policy: AttendanceWorkHoursPolicy | null | undefined,
): WorkHoursPolicyFormState {
  if (!policy) {
    return createDefaultWorkHoursPolicyFormState();
  }

  const record = policy as Record<string, unknown>;
  const minRaw = policy.min_hours_per_day ?? record.minHoursPerDay;
  const maxRaw = policy.max_hours_per_day ?? record.maxHoursPerDay;
  const minHours = Number(minRaw);
  const maxHours = Number(maxRaw);

  return {
    ...createDefaultWorkHoursPolicyFormState(),
    min_hours_per_day: Number.isFinite(minHours) && minHours > 0 ? minHours : 8,
    max_hours_per_day: Number.isFinite(maxHours) && maxHours > 0 ? maxHours : 12,
    effective_from: readPolicyEffectiveFrom(policy, record),
    effective_to: readPolicyEffectiveTo(policy, record),
  };
}

export function formatWorkHoursPolicyLabel(row: AttendanceWorkHoursPolicy): string {
  const min = formatWorkHoursPolicyHours(row, "min_hours_per_day");
  const max = formatWorkHoursPolicyHours(row, "max_hours_per_day");
  if (min === "—" && max === "—") {
    return "work hours policy";
  }
  return `${min}–${max} hrs/day policy`;
}
