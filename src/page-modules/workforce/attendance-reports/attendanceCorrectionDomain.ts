import type {
  AttendanceCorrectionPayload,
  AttendanceCorrectionStatus,
  AttendanceRecord,
} from "@utils/staffManagement";
import { ATTENDANCE_CORRECTION_STATUS_VALUES } from "@utils/staffManagement";
import moment from "moment";
import { normalizeShiftDateForInput } from "@page-modules/workforce/shifts/shiftManagementDomain";
export const ATTENDANCE_CORRECTION_STATUS_OPTIONS: ReadonlyArray<{
  value: AttendanceCorrectionStatus;
  label: string;
}> = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "on_break", label: "On break" },
  { value: "overtime", label: "Overtime" },
  { value: "on_leave", label: "On leave" },
  { value: "no_show", label: "No show" },
];

export type AttendanceCorrectionFormState = Readonly<{
  workDate: string;
  reason: string;
  checkInAtLocal: string;
  checkOutAtLocal: string;
  status: AttendanceCorrectionStatus;
  lateMinutes: string;
  totalMinutes: string;
}>;

export type AttendanceCorrectionTarget = Readonly<{
  userId: string;
  employeeName: string;
  workDate: string;
  initialStatus?: string | null;
  initialCheckInAt?: string | null;
  initialCheckOutAt?: string | null;
}>;

export function isAttendanceCorrectionStatus(value: string): value is AttendanceCorrectionStatus {
  return ATTENDANCE_CORRECTION_STATUS_VALUES.includes(value as AttendanceCorrectionStatus);
}

function buildDefaultDateTimeLocal(workDate: string, hour: number, minute: number): string {
  const date = workDate.trim();
  if (!date) {
    return "";
  }

  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${date}T${hh}:${mm}`;
}

export function resolveCorrectionStatusFromEmployee(
  status: string | null | undefined,
): AttendanceCorrectionStatus {
  const raw = status?.trim().toLowerCase() ?? "";
  if (raw === "on_overtime") {
    return "overtime";
  }
  if (isAttendanceCorrectionStatus(raw)) {
    return raw;
  }
  return "present";
}

function formatDateTimeLocalFromApi(
  value: string | null | undefined,
  workDate: string,
  fallbackHour: number,
  fallbackMinute: number,
): string {
  const trimmed = value?.trim();
  if (trimmed) {
    const parsed = moment(trimmed);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DDTHH:mm");
    }
  }

  return buildDefaultDateTimeLocal(workDate, fallbackHour, fallbackMinute);
}

export function buildAttendanceCorrectionTargetFromRecord(
  record: AttendanceRecord,
  employeeName: string,
): AttendanceCorrectionTarget | null {
  const userId = record.user_id?.trim();
  const workDate = normalizeShiftDateForInput(record.work_date);
  if (!userId || !workDate) {
    return null;
  }

  return {
    userId,
    employeeName,
    workDate,
    initialCheckInAt: record.check_in_at,
    initialCheckOutAt: record.check_out_at,
  };
}

export function buildAttendanceCorrectionFormState(
  target: AttendanceCorrectionTarget,
): AttendanceCorrectionFormState {
  const workDate = target.workDate.trim();
  const checkInAtLocal = formatDateTimeLocalFromApi(
    target.initialCheckInAt,
    workDate,
    9,
    0,
  );
  const checkOutAtLocal = formatDateTimeLocalFromApi(
    target.initialCheckOutAt,
    workDate,
    18,
    0,
  );
  const totalMinutes = computeCorrectionTotalMinutes(checkInAtLocal, checkOutAtLocal);

  return {
    workDate,
    reason: "",
    checkInAtLocal,
    checkOutAtLocal,
    status: resolveCorrectionStatusFromEmployee(target.initialStatus),
    lateMinutes: "0",
    totalMinutes: totalMinutes != null ? String(totalMinutes) : "",
  };
}

export function formatCorrectionDateTimeForApi(localValue: string): string | null {
  const trimmed = localValue.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = moment(trimmed);
  if (!parsed.isValid()) {
    return null;
  }

  return parsed.format("YYYY-MM-DDTHH:mm:ss");
}

export function computeCorrectionTotalMinutes(
  checkInAtLocal: string,
  checkOutAtLocal: string,
): number | null {
  const checkInApi = formatCorrectionDateTimeForApi(checkInAtLocal);
  const checkOutApi = formatCorrectionDateTimeForApi(checkOutAtLocal);
  if (!checkInApi || !checkOutApi) {
    return null;
  }

  const checkIn = moment(checkInApi);
  const checkOut = moment(checkOutApi);
  if (!checkIn.isValid() || !checkOut.isValid() || !checkOut.isAfter(checkIn)) {
    return null;
  }

  return checkOut.diff(checkIn, "minutes");
}

export function parseCorrectionMinutesInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed);
}

export function validateAttendanceCorrectionForm(
  form: AttendanceCorrectionFormState,
): string | null {
  if (!form.workDate.trim()) {
    return "Work date is required.";
  }

  if (!form.reason.trim()) {
    return "Reason is required.";
  }

  if (!isAttendanceCorrectionStatus(form.status)) {
    return "Status is required.";
  }

  const lateMinutes = parseCorrectionMinutesInput(form.lateMinutes);
  if (form.lateMinutes.trim() && lateMinutes == null) {
    return "Late minutes must be a valid non-negative number.";
  }

  const totalMinutes = parseCorrectionMinutesInput(form.totalMinutes);
  if (form.totalMinutes.trim() && totalMinutes == null) {
    return "Total minutes must be a valid non-negative number.";
  }

  const hasCheckIn = Boolean(form.checkInAtLocal.trim());
  const hasCheckOut = Boolean(form.checkOutAtLocal.trim());
  if (hasCheckIn !== hasCheckOut) {
    return "Provide both check-in and check-out times, or leave both empty.";
  }

  if (hasCheckIn && hasCheckOut && computeCorrectionTotalMinutes(form.checkInAtLocal, form.checkOutAtLocal) == null) {
    return "Check-out must be after check-in.";
  }

  return null;
}

export function buildAttendanceCorrectionPayload(args: Readonly<{
  tenantId: string;
  userId: string;
  form: AttendanceCorrectionFormState;
}>): AttendanceCorrectionPayload | null {
  const validationError = validateAttendanceCorrectionForm(args.form);
  if (validationError) {
    return null;
  }

  const lateMinutes = parseCorrectionMinutesInput(args.form.lateMinutes);
  const totalMinutesInput = parseCorrectionMinutesInput(args.form.totalMinutes);
  const computedTotalMinutes = computeCorrectionTotalMinutes(
    args.form.checkInAtLocal,
    args.form.checkOutAtLocal,
  );
  const totalMinutes = totalMinutesInput ?? computedTotalMinutes;

  const checkInAt = formatCorrectionDateTimeForApi(args.form.checkInAtLocal);
  const checkOutAt = formatCorrectionDateTimeForApi(args.form.checkOutAtLocal);

  return {
    tenant_id: args.tenantId.trim(),
    user_id: args.userId.trim(),
    work_date: args.form.workDate.trim(),
    reason: args.form.reason.trim(),
    status: args.form.status,
    ...(checkInAt ? { check_in_at: checkInAt } : {}),
    ...(checkOutAt ? { check_out_at: checkOutAt } : {}),
    ...(lateMinutes != null ? { late_minutes: lateMinutes } : {}),
    ...(totalMinutes != null ? { total_minutes: totalMinutes } : {}),
  };
}
