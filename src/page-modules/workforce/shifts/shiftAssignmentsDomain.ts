import { validatePolicyEffectiveDates } from "@page-modules/workforce/company-config/companyConfigShared";
import { normalizeShiftDateForInput } from "@page-modules/workforce/shifts/shiftManagementDomain";
import { formatDateForTable } from "@utils/Helper";
import type {
  CreateStaffShiftAssignmentPayload,
  StaffShift,
  StaffShiftAssignment,
} from "@utils/staffManagement";

export type { ShiftTenantOption } from "@page-modules/workforce/shifts/shiftManagementDomain";

export type ShiftAssignmentFormState = Omit<
  CreateStaffShiftAssignmentPayload,
  "tenant_id" | "effective_to"
> & {
  effective_to: string;
};

export const SHIFT_ASSIGNMENTS_LIST_DEFAULT_LIMIT = 25;

export const SHIFT_ASSIGNMENTS_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export const SHIFT_OPTIONS_QUERY_LIMIT = 100;

export function defaultShiftAssignmentEffectiveFrom(): string {
  const year = new Date().getFullYear();
  return `${year}-01-01`;
}

export function createDefaultShiftAssignmentFormState(): ShiftAssignmentFormState {
  return {
    shift_id: 0,
    user_id: "",
    effective_from: defaultShiftAssignmentEffectiveFrom(),
    effective_to: "",
    reason: "Initial shift assignment",
  };
}

export function shiftAssignmentToFormState(
  assignment: StaffShiftAssignment | null | undefined,
): ShiftAssignmentFormState {
  const shiftId = Number(assignment?.shift_id);
  return {
    shift_id: Number.isFinite(shiftId) && shiftId > 0 ? shiftId : 0,
    user_id: String(assignment?.user_id ?? "").trim(),
    effective_from:
      normalizeShiftDateForInput(assignment?.effective_from) ||
      defaultShiftAssignmentEffectiveFrom(),
    effective_to: normalizeShiftDateForInput(assignment?.effective_to) ?? "",
    reason: assignment?.reason?.trim() || "",
  };
}

export function validateShiftAssignmentForm(
  form: ShiftAssignmentFormState,
  tenantId: string,
): string | null {
  if (!tenantId.trim()) {
    return "Select a tenant.";
  }
  if (!Number.isFinite(form.shift_id) || form.shift_id <= 0) {
    return "Select a shift.";
  }
  if (!form.user_id.trim()) {
    return "Select a user.";
  }
  const dateError = validatePolicyEffectiveDates(form.effective_from, form.effective_to);
  if (dateError) {
    return dateError;
  }
  if (!form.reason.trim()) {
    return "Reason is required.";
  }
  return null;
}

export function buildShiftAssignmentPayload(
  tenantId: string,
  form: ShiftAssignmentFormState,
): CreateStaffShiftAssignmentPayload {
  return {
    tenant_id: tenantId.trim(),
    shift_id: form.shift_id,
    user_id: form.user_id.trim(),
    effective_from: form.effective_from.trim(),
    effective_to: (form.effective_to ?? "").trim() || null,
    reason: form.reason.trim(),
  };
}

export function formatShiftAssignmentDate(value: string | null | undefined): string {
  const normalized = normalizeShiftDateForInput(value);
  if (!normalized) return "—";
  return formatDateForTable(normalized) ?? normalized;
}

export function formatShiftAssignmentLabel(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "—";
}

export function resolveShiftAssignmentTenantId(
  row: StaffShiftAssignment,
  fallbackTenantId: string,
): string {
  const tenantId = String(row.tenant_id ?? "").trim();
  return tenantId || fallbackTenantId;
}

export function resolveShiftAssignmentShiftLabel(
  row: StaffShiftAssignment,
  shiftsById: ReadonlyMap<number, StaffShift>,
): string {
  const shiftName = row.shift_name?.trim();
  if (shiftName) return shiftName;

  const shiftId = row.shift_id;
  if (shiftId != null && Number.isFinite(shiftId)) {
    const shift = shiftsById.get(shiftId);
    const name = shift?.name?.trim();
    if (name) return name;
    return `Shift #${shiftId}`;
  }

  return "—";
}

export function resolveShiftAssignmentUserLabel(
  row: StaffShiftAssignment,
  userLabelById: ReadonlyMap<string, string>,
): string {
  const userName = row.user_name?.trim();
  if (userName) return userName;

  const userId = row.user_id?.trim();
  if (!userId) return "—";

  return userLabelById.get(userId) ?? userId;
}

export function formatShiftAssignmentRowLabel(
  row: StaffShiftAssignment,
  shiftsById: ReadonlyMap<number, StaffShift>,
  userLabelById: ReadonlyMap<string, string>,
): string {
  const shift = resolveShiftAssignmentShiftLabel(row, shiftsById);
  const user = resolveShiftAssignmentUserLabel(row, userLabelById);
  return `${user} — ${shift}`;
}

export function filterShiftAssignmentsBySearch(
  rows: readonly StaffShiftAssignment[],
  searchValue: string,
  shiftsById: ReadonlyMap<number, StaffShift>,
  userLabelById: ReadonlyMap<string, string>,
): StaffShiftAssignment[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    const haystack = [
      resolveShiftAssignmentShiftLabel(row, shiftsById),
      resolveShiftAssignmentUserLabel(row, userLabelById),
      row.shift_id,
      row.user_id,
      row.effective_from,
      row.effective_to,
      row.reason,
      row.updated_at,
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}

export function readShiftAssignmentRowId(row: StaffShiftAssignment, index: number): string {
  if (row.id != null && Number.isFinite(row.id)) {
    return String(row.id);
  }
  return `shift-assignment-row-${index}`;
}

export function buildShiftOptions(
  shifts: readonly StaffShift[],
): ReadonlyArray<{ value: number; label: string }> {
  return shifts.flatMap((shift) => {
    if (!Number.isFinite(shift.id)) return [];
    const name = shift.name?.trim() || `Shift #${shift.id}`;
    return [{ value: shift.id, label: name }];
  });
}

export type ShiftAssignmentUserOption = Readonly<{
  value: string;
  label: string;
}>;

export function buildShiftAssignmentUserOptions(
  users: ReadonlyArray<{ name: string; phone: string }>,
): ShiftAssignmentUserOption[] {
  return users.flatMap((user) => {
    const userId = user.phone.trim();
    if (!userId) return [];
    const label = user.name.trim() ? `${user.name.trim()} (${userId})` : userId;
    return [{ value: userId, label }];
  });
}
