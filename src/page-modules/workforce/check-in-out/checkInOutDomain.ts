import type { AttendanceBreakType, MyAttendanceData } from "@utils/staffManagement";
import { formatBreakTypeLabel } from "@page-modules/workforce/company-config/breakTypesDomain";

export type MyAttendanceActionAvailability = Readonly<{
  canCheckIn: boolean;
  canCheckOut: boolean;
  canStartBreak: boolean;
  canEndBreak: boolean;
  canStartOvertime: boolean;
}>;

const NO_ACTIONS: MyAttendanceActionAvailability = {
  canCheckIn: false,
  canCheckOut: false,
  canStartBreak: false,
  canEndBreak: false,
  canStartOvertime: false,
};

export function getMyAttendanceActionAvailability(
  data: MyAttendanceData | null,
  canPerformActions: boolean,
): MyAttendanceActionAvailability {
  if (!canPerformActions || !data) {
    return NO_ACTIONS;
  }

  return {
    canCheckIn: data.actions.includes("check_in"),
    canCheckOut: data.actions.includes("check_out"),
    canStartBreak: data.actions.includes("start_break"),
    canEndBreak: data.actions.includes("end_break"),
    canStartOvertime: data.actions.includes("start_overtime"),
  };
}

export function resolveMyAttendanceState(state: string): Readonly<{
  label: string;
  chipModifier: string;
}> {
  const normalized = state.trim().toLowerCase();
  if (normalized === "checked_in") {
    return { label: "Checked in", chipModifier: "in" };
  }
  if (normalized === "checked_out") {
    return { label: "Checked out", chipModifier: "out" };
  }
  if (normalized === "on_break") {
    return { label: "On break", chipModifier: "break" };
  }
  if (normalized === "on_overtime") {
    return { label: "Overtime active", chipModifier: "overtime" };
  }
  if (!normalized) {
    return { label: "Unknown", chipModifier: "out" };
  }
  const label = normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { label, chipModifier: "out" };
}

export function readMyAttendanceCheckInAt(data: MyAttendanceData | null): string | null {
  const raw = data?.attendance?.check_in_at;
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

export function isMyAttendanceOnBreak(state: string): boolean {
  return state.trim().toLowerCase() === "on_break";
}

export function isMyAttendanceOnOvertime(state: string): boolean {
  return state.trim().toLowerCase() === "on_overtime";
}

export function filterSelectableBreakTypes(
  rows: readonly AttendanceBreakType[],
): AttendanceBreakType[] {
  return rows.filter((row) => row.is_active !== false && Number.isFinite(row.id));
}

export function formatBreakTypeOptionTitle(row: AttendanceBreakType): string {
  const name = row.name?.trim();
  if (name) {
    return name;
  }
  return `Break #${row.id}`;
}

export function formatBreakTypeOptionMeta(row: AttendanceBreakType): string {
  const parts: string[] = [];
  const typeLabel = formatBreakTypeLabel(row.type);
  if (typeLabel !== "—") {
    parts.push(typeLabel);
  }
  if (row.duration_minutes != null && Number.isFinite(row.duration_minutes)) {
    parts.push(`${row.duration_minutes} min`);
  }
  if (row.is_paid === true) {
    parts.push("Paid");
  }
  return parts.join(" · ");
}
