import type {
  AttendanceBreakType,
  CreateAttendanceBreakTypePayload,
} from "@utils/staffManagement";
import { normalizeShiftDateForInput } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type { ShiftTenantOption as BreakTypeTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export const BREAK_TYPE_NAME_MAX_LENGTH = 40;
export const BREAK_TYPE_FLEXIBLE_DURATION_MIN = 5;
export const BREAK_TYPE_FLEXIBLE_DURATION_MAX = 180;

export const BREAK_TYPE_EMPTY_LIST_MESSAGE =
  "No break types defined. Add your first break type to start tracking breaks.";

export const BREAK_TYPE_DELETE_BLOCKED_MESSAGE =
  "This break type has existing records and cannot be deleted. Deactivate it instead.";

export type BreakTypeFormState = Readonly<{
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_per_day: number;
  is_paid: boolean;
  is_active: boolean;
  effective_from: string;
}>;

export const BREAK_TYPE_FORM_OPTIONS = [
  { value: "flexible", label: "Flexible" },
  { value: "fixed", label: "Fixed" },
] as const;

export const BREAK_TYPES_LIST_DEFAULT_LIMIT = 25;
export const BREAK_TYPES_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

function defaultBreakTypeEffectiveFrom(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isFixedBreakType(type: string | null | undefined): boolean {
  return type?.trim().toLowerCase() === "fixed";
}

export function isFlexibleBreakType(type: string | null | undefined): boolean {
  return type?.trim().toLowerCase() === "flexible";
}

export function createDefaultBreakTypeFormState(): BreakTypeFormState {
  return {
    name: "",
    type: "flexible",
    start_time: "",
    end_time: "",
    duration_minutes: 60,
    max_per_day: 1,
    is_paid: false,
    is_active: true,
    effective_from: defaultBreakTypeEffectiveFrom(),
  };
}

export function breakTypeToFormState(
  breakType: AttendanceBreakType | null | undefined,
): BreakTypeFormState {
  const defaults = createDefaultBreakTypeFormState();
  if (!breakType) {
    return defaults;
  }
  const record = breakType as Record<string, unknown>;
  return {
    ...defaults,
    name: breakType.name?.trim() ?? "",
    type: breakType.type?.trim() || defaults.type,
    start_time: breakType.start_time?.trim() ?? "",
    end_time: breakType.end_time?.trim() ?? "",
    duration_minutes:
      breakType.duration_minutes != null && Number.isFinite(breakType.duration_minutes)
        ? breakType.duration_minutes
        : defaults.duration_minutes,
    max_per_day:
      breakType.max_per_day != null && Number.isFinite(breakType.max_per_day)
        ? breakType.max_per_day
        : defaults.max_per_day,
    is_paid: breakType.is_paid === true,
    is_active: breakType.is_active !== false,
    effective_from:
      normalizeShiftDateForInput(breakType.effective_from ?? record.effectiveFrom) ||
      defaults.effective_from,
  };
}

function validateEffectiveFromNotPast(effectiveFrom: string): string | null {
  const normalized = normalizeShiftDateForInput(effectiveFrom);
  if (!normalized) {
    return "Effective date is required.";
  }
  const today = defaultBreakTypeEffectiveFrom();
  if (normalized < today) {
    return "Effective date cannot be in the past.";
  }
  return null;
}

export function validateBreakTypeForm(
  form: BreakTypeFormState,
  tenantId: string,
): string | null {
  if (!tenantId.trim()) {
    return "Select a tenant.";
  }
  const name = form.name.trim();
  if (!name) {
    return "Break name is required.";
  }
  if (name.length > BREAK_TYPE_NAME_MAX_LENGTH) {
    return `Break name cannot exceed ${BREAK_TYPE_NAME_MAX_LENGTH} characters.`;
  }
  if (!form.type.trim()) {
    return "Break type is required.";
  }
  if (!Number.isFinite(form.max_per_day) || form.max_per_day < 1) {
    return "Maximum breaks per day must be at least 1.";
  }

  const effectiveFromError = validateEffectiveFromNotPast(form.effective_from);
  if (effectiveFromError) {
    return effectiveFromError;
  }

  if (isFixedBreakType(form.type)) {
    if (!form.start_time.trim() || !form.end_time.trim()) {
      return "Start time and end time are required for fixed breaks.";
    }
    return null;
  }

  if (!Number.isFinite(form.duration_minutes)) {
    return "Duration is required for flexible breaks.";
  }
  if (form.duration_minutes < BREAK_TYPE_FLEXIBLE_DURATION_MIN) {
    return `Duration must be at least ${BREAK_TYPE_FLEXIBLE_DURATION_MIN} minutes.`;
  }
  if (form.duration_minutes > BREAK_TYPE_FLEXIBLE_DURATION_MAX) {
    return `Duration cannot exceed ${BREAK_TYPE_FLEXIBLE_DURATION_MAX} minutes.`;
  }
  return null;
}

export function buildCreateBreakTypePayload(
  tenantId: string,
  form: BreakTypeFormState,
): CreateAttendanceBreakTypePayload {
  const payload: CreateAttendanceBreakTypePayload = {
    tenant_id: tenantId.trim(),
    name: form.name.trim(),
    type: form.type.trim(),
    max_per_day: form.max_per_day,
    is_paid: form.is_paid,
    is_active: form.is_active,
    effective_from: normalizeShiftDateForInput(form.effective_from) || defaultBreakTypeEffectiveFrom(),
  };

  if (isFixedBreakType(form.type)) {
    payload.start_time = form.start_time.trim();
    payload.end_time = form.end_time.trim();
    return payload;
  }

  payload.duration_minutes = form.duration_minutes;
  return payload;
}

export function formatBreakTypeLabel(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "—";
  const match = BREAK_TYPE_FORM_OPTIONS.find(
    (option) => option.value === trimmed.toLowerCase(),
  );
  if (match) return match.label;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function formatBreakTypePaidLabel(value: boolean | null | undefined): string {
  if (value == null) return "—";
  return value ? "Paid" : "Unpaid";
}

export function formatBreakTypeDurationWindow(row: AttendanceBreakType): string {
  if (isFixedBreakType(row.type)) {
    const start = row.start_time?.trim();
    const end = row.end_time?.trim();
    if (start && end) {
      return `${start} – ${end}`;
    }
    return "—";
  }
  if (row.duration_minutes != null && Number.isFinite(row.duration_minutes)) {
    return `${row.duration_minutes} min`;
  }
  return "—";
}

export function formatBreakTypeDuration(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return "—";
  return `${minutes} min`;
}

export function formatBreakTypeBoolean(value: boolean | null | undefined): string {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

export function filterBreakTypesBySearch(
  rows: readonly AttendanceBreakType[],
  searchValue: string,
): AttendanceBreakType[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.type,
      row.start_time,
      row.end_time,
      row.duration_minutes,
      row.max_per_day,
      row.is_paid,
      row.is_active,
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}
