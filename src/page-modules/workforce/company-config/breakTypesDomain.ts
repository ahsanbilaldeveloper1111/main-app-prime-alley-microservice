import type {
  AttendanceBreakType,
  CreateAttendanceBreakTypePayload,
} from "@utils/staffManagement";

export type { ShiftTenantOption as BreakTypeTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type CreateBreakTypeFormState = Omit<CreateAttendanceBreakTypePayload, "tenant_id">;

export const BREAK_TYPE_FORM_OPTIONS = [
  { value: "flexible", label: "Flexible" },
  { value: "fixed", label: "Fixed" },
] as const;

export const BREAK_TYPES_LIST_DEFAULT_LIMIT = 25;

export const BREAK_TYPES_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function createDefaultBreakTypeFormState(): CreateBreakTypeFormState {
  return {
    name: "",
    type: "flexible",
    duration_minutes: 60,
    is_paid: false,
    is_active: true,
  };
}

export function validateCreateBreakTypeForm(
  form: CreateBreakTypeFormState,
  tenantId: string,
): string | null {
  if (!tenantId.trim()) {
    return "Select a tenant.";
  }
  if (!form.name.trim()) {
    return "Name is required.";
  }
  if (!form.type.trim()) {
    return "Type is required.";
  }
  if (!Number.isFinite(form.duration_minutes) || form.duration_minutes <= 0) {
    return "Duration must be greater than zero.";
  }
  return null;
}

export function buildCreateBreakTypePayload(
  tenantId: string,
  form: CreateBreakTypeFormState,
): CreateAttendanceBreakTypePayload {
  return {
    tenant_id: tenantId.trim(),
    name: form.name.trim(),
    type: form.type.trim(),
    duration_minutes: form.duration_minutes,
    is_paid: form.is_paid,
    is_active: form.is_active,
  };
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
      row.duration_minutes,
      row.is_paid,
      row.is_active,
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}
