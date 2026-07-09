import type { AttendanceBreakType, AttendanceStatusData, MyAttendanceData } from "@utils/staffManagement";
import {
  formatBreakTypeLabel,
  formatBreakTypeDurationWindow,
  isFixedBreakType,
} from "@page-modules/workforce/company-config/breakTypesDomain";

/* Late adjustment domain (disabled)
import {
  isOnTimeWithAdjustmentStatus,
  shouldShowOnTimeWithAdjustmentBadge,
} from "@page-modules/workforce/check-in-out/lateAdjustmentDomain";

export { shouldShowOnTimeWithAdjustmentBadge } from "@page-modules/workforce/check-in-out/lateAdjustmentDomain";
*/

export function shouldShowOnTimeWithAdjustmentBadge(_data: MyAttendanceData | null): boolean {
  return false;
}

export type MyAttendanceActionAvailability = Readonly<{
  canCheckIn: boolean;
  canCheckOut: boolean;
  canStartBreak: boolean;
  canEndBreak: boolean;
  canStartOvertime: boolean;
  canEndOvertime: boolean;
}>;

const NO_ACTIONS: MyAttendanceActionAvailability = {
  canCheckIn: false,
  canCheckOut: false,
  canStartBreak: false,
  canEndBreak: false,
  canStartOvertime: false,
  canEndOvertime: false,
};

const ACTIVE_SESSION_STATES = new Set([
  "checked_in",
  "on_break",
  "on_overtime",
  "overtime_in_progress",
]);

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
    canEndOvertime: data.actions.includes("end_overtime"),
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
  if (normalized === "on_overtime" || normalized === "overtime_in_progress") {
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

export function readMyAttendanceSessionActive(
  data: MyAttendanceData | null,
  availability: MyAttendanceActionAvailability,
): boolean {
  if (!data) {
    return false;
  }

  if (data.is_checked_in === true) {
    return true;
  }

  const state = data.state.trim().toLowerCase();
  if (isMyAttendanceActiveSessionState(state)) {
    return true;
  }

  return (
    availability.canCheckOut ||
    availability.canStartBreak ||
    availability.canEndBreak ||
    availability.canStartOvertime ||
    availability.canEndOvertime
  );
}

export function isMyAttendanceActiveSessionState(state: string): boolean {
  return ACTIVE_SESSION_STATES.has(state.trim().toLowerCase());
}

export function buildMyAttendanceStatusData(
  data: MyAttendanceData | null,
  isCheckedIn: boolean,
): AttendanceStatusData | null {
  if (!data) {
    return null;
  }

  const attendance = data.attendance;
  const checkInAt = attendance?.check_in_at?.trim() ?? "";

  return {
    user_id: data.user_id,
    tenant_id: data.tenant_id,
    work_date: data.work_date,
    is_checked_in: isCheckedIn,
    is_on_break: isMyAttendanceOnBreak(data.state),
    is_on_overtime: isMyAttendanceOnOvertime(data.state),
    attendance:
      attendance && checkInAt
        ? {
            id: attendance.id,
            tenant_id: data.tenant_id,
            user_id: data.user_id,
            work_date: data.work_date,
            check_in_at: checkInAt,
            check_out_at: attendance.check_out_at ?? null,
          }
        : null,
  };
}

export function isMyAttendanceOnBreak(state: string): boolean {
  return state.trim().toLowerCase() === "on_break";
}

export function isMyAttendanceOnOvertime(state: string): boolean {
  const normalized = state.trim().toLowerCase();
  return normalized === "on_overtime" || normalized === "overtime_in_progress";
}

export function isMyAttendanceAutoCheckout(data: MyAttendanceData | null): boolean {
  return data?.attendance?.is_auto_checkout === true;
}

export function shouldPollMyAttendance(data: MyAttendanceData | null): boolean {
  if (!data) {
    return false;
  }
  if (data.is_checked_in === true) {
    return true;
  }
  return isMyAttendanceActiveSessionState(data.state);
}

export function readMyAttendanceContextBreakTypes(
  data: MyAttendanceData | null,
): AttendanceBreakType[] {
  return data?.context?.break_types ?? [];
}

export function readMyAttendanceCheckoutGraceMinutes(
  data: MyAttendanceData | null,
): number | null {
  const minutes = data?.context?.checkout_grace_minutes;
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) {
    return null;
  }
  return minutes;
}

export function formatCheckoutGraceHelpText(minutes: number): string {
  return `You can check out up to ${minutes} minute${minutes === 1 ? "" : "s"} before shift end without being marked early.`;
}

export function readMyAttendanceEarlyExitMinutes(
  data: MyAttendanceData | null,
): number | null {
  const minutes = data?.attendance?.early_exit_minutes;
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  return Math.round(minutes);
}

export function readMyAttendanceLateMinutes(data: MyAttendanceData | null): number | null {
  const minutes = data?.attendance?.late_minutes;
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return null;
  }
  return Math.round(minutes);
}

export function isMyAttendanceEarlyExitStatus(status: string | null | undefined): boolean {
  const normalized = status?.trim().toLowerCase() ?? "";
  return normalized === "early_exit" || normalized === "early exit";
}

export function shouldShowEarlyCheckoutBadge(data: MyAttendanceData | null): boolean {
  if (!data?.attendance) {
    return false;
  }
  const earlyExitMinutes = readMyAttendanceEarlyExitMinutes(data);
  if (earlyExitMinutes != null) {
    return true;
  }
  return isMyAttendanceEarlyExitStatus(data.attendance.status);
}

export function formatEarlyCheckoutBadgeLabel(minutes: number): string {
  return `Early checkout — ${minutes} min before shift end`;
}

export const OVERTIME_UNAPPROVED_WARNING =
  "You do not have pre-approved overtime for today. Starting overtime will be flagged as unapproved.";

export function shouldShowLateArrivalBadge(data: MyAttendanceData | null): boolean {
  if (shouldShowOnTimeWithAdjustmentBadge(data)) {
    return false;
  }
  return readMyAttendanceLateMinutes(data) != null;
}

export function formatOnTimeWithAdjustmentBadgeLabel(): string {
  return "On time with adjustment";
}

export function buildCheckOutSuccessMessage(data: MyAttendanceData | null): string {
  if (shouldShowOnTimeWithAdjustmentBadge(data)) {
    return `Checked out successfully. ${formatOnTimeWithAdjustmentBadgeLabel()}`;
  }
  const earlyExitMinutes = readMyAttendanceEarlyExitMinutes(data);
  if (earlyExitMinutes != null) {
    return `Checked out successfully. ${formatEarlyCheckoutBadgeLabel(earlyExitMinutes)}`;
  }
  return "Checked out successfully";
}

export function isOnTimeWithAdjustmentAttendanceStatus(
  _status: string | null | undefined,
): boolean {
  return false;
  // return isOnTimeWithAdjustmentStatus(status);
}

export function readMyAttendanceMultipleBreakTypesEnabled(
  data: MyAttendanceData | null,
): boolean {
  return data?.context?.tenant_settings?.multiple_break_types_enabled !== false;
}

export function readSelectableBreakTypes(
  data: MyAttendanceData | null,
): AttendanceBreakType[] {
  return filterSelectableBreakTypes(data?.context?.break_types ?? []);
}

export function hasSelectableBreakTypes(data: MyAttendanceData | null): boolean {
  return readSelectableBreakTypes(data).length > 0;
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
  if (isFixedBreakType(row.type)) {
    const window = formatBreakTypeDurationWindow(row);
    if (window !== "—") {
      parts.push(window);
    }
  } else if (row.duration_minutes != null && Number.isFinite(row.duration_minutes)) {
    parts.push(`${row.duration_minutes} min`);
  }
  if (row.is_paid === true) {
    parts.push("Paid");
  } else if (row.is_paid === false) {
    parts.push("Unpaid");
  }
  return parts.join(" · ");
}

export const SHIFT_END_MODAL_SNOOZE_MS = 5 * 60 * 1000;

export function readMyAttendanceShiftEndTime(data: MyAttendanceData | null): string | null {
  const endTime = data?.context?.shift?.end_time;
  if (!endTime?.trim()) {
    return null;
  }
  return endTime.trim();
}

function parseClockTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function isPastShiftEndTime(shiftEndTime: string, now: Date = new Date()): boolean {
  const endMinutes = parseClockTimeToMinutes(shiftEndTime);
  if (endMinutes == null) {
    return false;
  }
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes > endMinutes;
}

export function shouldShowShiftEndModal(
  data: MyAttendanceData | null,
  availability: MyAttendanceActionAvailability,
  snoozedUntilMs: number | null,
  nowMs: number = Date.now(),
): boolean {
  if (!data || !availability.canCheckOut) {
    return false;
  }
  if (isMyAttendanceOnBreak(data.state) || isMyAttendanceOnOvertime(data.state)) {
    return false;
  }
  if (!isMyAttendanceActiveSessionState(data.state)) {
    return false;
  }
  if (snoozedUntilMs != null && nowMs < snoozedUntilMs) {
    return false;
  }
  const shiftEndTime = readMyAttendanceShiftEndTime(data);
  if (!shiftEndTime) {
    return false;
  }
  return isPastShiftEndTime(shiftEndTime, new Date(nowMs));
}
