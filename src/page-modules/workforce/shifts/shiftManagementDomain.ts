import type {
  AttendanceWorkHoursPolicy,
  CreateStaffShiftPayload,
  StaffShift,
} from "@utils/staffManagement";
import { formatDateForTable } from "@utils/Helper";
import moment from "moment";

export const SHIFT_GRACE_PERIOD_MAX_MINUTES = 60;
export const SHIFT_REQUIRED_DAILY_HOURS_MIN = 1;
export const SHIFT_REQUIRED_DAILY_HOURS_MAX = 24;
export const REQUIRED_WORKING_DAYS_EXCEEDS_MESSAGE =
  "Required days cannot exceed selected working days.";
export const SHIFT_MIDNIGHT_SPAN_NOTE =
  "This shift spans midnight — ends the next calendar day.";

export type ShiftTenantOption = Readonly<{
  value: string;
  label: string;
}>;

export type CreateStaffShiftFormState = Readonly<{
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  working_days: number[];
  required_working_days_per_week: number;
  required_daily_hours: number;
  earliest_checkin: string;
  latest_checkout: string;
  grace_period_minutes?: number;
  hard_limit_hours?: number;
  overtime_enabled?: boolean;
  effective_from: string;
  status: string;
}>;

export const SHIFT_WORKING_DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
] as const;

export const SHIFT_TYPE_FORM_OPTIONS = [
  { value: "fixed", label: "Fixed" },
  { value: "flexible", label: "Flexible" },
] as const;

export const SHIFT_STATUS_FORM_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
] as const;

export function createDefaultShiftFormState(): CreateStaffShiftFormState {
  const workingDays = [1, 2, 3, 4, 5];
  return {
    name: "",
    type: "fixed",
    start_time: "09:00",
    end_time: "18:00",
    working_days: workingDays,
    required_working_days_per_week: workingDays.length,
    required_daily_hours: 8,
    earliest_checkin: "08:30",
    latest_checkout: "18:00",
    grace_period_minutes: 10,
    hard_limit_hours: 12,
    overtime_enabled: true,
    effective_from: new Date().toISOString().slice(0, 10),
    status: "active",
  };
}

export function isFixedShiftType(type: string): boolean {
  return type.trim().toLowerCase() === "fixed";
}

export function isFlexibleShiftType(type: string): boolean {
  return type.trim().toLowerCase() === "flexible";
}

export function parseShiftTimeToMinutes(value: string): number | null {
  const normalized = normalizeShiftTimeForInput(value);
  if (!normalized) return null;
  const parts = extractShiftClockParts(normalized);
  if (!parts) return null;
  return parts.hours * 60 + parts.minutes;
}

export function doesShiftSpanMidnight(startTime: string, endTime: string): boolean {
  const start = parseShiftTimeToMinutes(startTime);
  const end = parseShiftTimeToMinutes(endTime);
  if (start == null || end == null) return false;
  return end <= start;
}

export function computeShiftWindowMinutes(startTime: string, endTime: string): number | null {
  const start = parseShiftTimeToMinutes(startTime);
  const end = parseShiftTimeToMinutes(endTime);
  if (start == null || end == null) return null;

  let durationMinutes = end - start;
  if (durationMinutes <= 0) {
    durationMinutes += 24 * 60;
  }
  return durationMinutes;
}

export function computeFixedShiftTotalHours(startTime: string, endTime: string): number | null {
  const durationMinutes = computeShiftWindowMinutes(startTime, endTime);
  if (durationMinutes == null) return null;
  return Math.round((durationMinutes / 60) * 100) / 100;
}

export function formatFixedShiftTotalHours(startTime: string, endTime: string): string {
  const hours = computeFixedShiftTotalHours(startTime, endTime);
  if (hours == null) return "—";
  return `${hours} h`;
}

export function readShiftRequirementHours(
  policy: AttendanceWorkHoursPolicy | null | undefined,
): number | null {
  if (!policy) return null;
  const candidate =
    policy.shift_requirement_hours ??
    policy.min_hours_per_day;
  if (typeof candidate !== "number" || !Number.isFinite(candidate) || candidate <= 0) {
    return null;
  }
  return candidate;
}

export type ValidateCreateStaffShiftFormOptions = Readonly<{
  shiftRequirementHours?: number | null;
}>;

export function toggleShiftWorkingDay(
  workingDays: number[],
  day: number,
): number[] {
  if (workingDays.includes(day)) {
    return workingDays.filter((value) => value !== day);
  }
  return [...workingDays, day].sort((a, b) => a - b);
}

const SHIFT_TIME_PARSE_FORMATS = [
  "HH:mm:ss",
  "HH:mm",
  "H:mm:ss",
  "H:mm",
  "h:mm A",
  "hh:mm A",
  "h:mm:ss A",
  "hh:mm:ss A",
] as const;
const SHIFT_TIME_DISPLAY_FORMAT = "hh:mm A";
const SHIFT_WORKING_DAY_SHORT_LABELS: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

function formatShiftWorkingDayRanges(sortedDays: number[]): string {
  if (sortedDays.length === 0) return "";

  const ranges: string[] = [];
  let rangeStart = sortedDays[0];
  let rangeEnd = sortedDays[0];

  const pushRange = () => {
    const startLabel = SHIFT_WORKING_DAY_SHORT_LABELS[rangeStart] ?? String(rangeStart);
    const endLabel = SHIFT_WORKING_DAY_SHORT_LABELS[rangeEnd] ?? String(rangeEnd);
    ranges.push(rangeStart === rangeEnd ? startLabel : `${startLabel}–${endLabel}`);
  };

  for (let index = 1; index < sortedDays.length; index += 1) {
    const day = sortedDays[index];
    if (day === rangeEnd + 1) {
      rangeEnd = day;
      continue;
    }
    pushRange();
    rangeStart = day;
    rangeEnd = day;
  }
  pushRange();
  return ranges.join(", ");
}

export function formatShiftWorkingDays(
  workingDays: number[] | null | undefined,
): string {
  if (!Array.isArray(workingDays) || workingDays.length === 0) return "—";
  const sortedDays = [...workingDays].sort((a, b) => a - b);
  return formatShiftWorkingDayRanges(sortedDays) || sortedDays.join(", ");
}

export function validateCreateStaffShiftForm(
  form: CreateStaffShiftFormState,
  tenantIds: readonly string[],
  options?: ValidateCreateStaffShiftFormOptions,
): string | null {
  if (tenantIds.length === 0) {
    return "Select a tenant.";
  }
  if (!form.name.trim()) {
    return "Shift name is required.";
  }
  if (!form.working_days.length) {
    return "Select at least one working day.";
  }
  if (
    form.required_working_days_per_week == null ||
    !Number.isFinite(form.required_working_days_per_week) ||
    form.required_working_days_per_week < 1
  ) {
    return "Required working days per week must be at least 1.";
  }
  if (form.required_working_days_per_week > form.working_days.length) {
    return REQUIRED_WORKING_DAYS_EXCEEDS_MESSAGE;
  }
  if (!form.effective_from.trim()) {
    return "Effective from date is required.";
  }
  if (form.grace_period_minutes != null) {
    if (form.grace_period_minutes < 0) {
      return "Grace period cannot be negative.";
    }
    if (form.grace_period_minutes > SHIFT_GRACE_PERIOD_MAX_MINUTES) {
      return `Grace period cannot exceed ${SHIFT_GRACE_PERIOD_MAX_MINUTES} minutes.`;
    }
  }
  if (form.hard_limit_hours != null && form.hard_limit_hours <= 0) {
    return "Hard limit hours must be greater than zero.";
  }
  const shiftRequirementHours = options?.shiftRequirementHours;
  if (
    shiftRequirementHours != null &&
    form.hard_limit_hours != null &&
    form.hard_limit_hours <= shiftRequirementHours
  ) {
    return `Hard limit hours must be greater than shift requirement hours (${shiftRequirementHours} h).`;
  }

  if (isFixedShiftType(form.type)) {
    if (!form.start_time.trim() || !form.end_time.trim()) {
      return "Start and end times are required.";
    }
    if (computeFixedShiftTotalHours(form.start_time, form.end_time) == null) {
      return "Enter valid start and end times.";
    }
    return null;
  }

  if (!isFlexibleShiftType(form.type)) {
    return "Select a valid shift type.";
  }
  if (
    form.required_daily_hours == null ||
    !Number.isFinite(form.required_daily_hours) ||
    form.required_daily_hours < SHIFT_REQUIRED_DAILY_HOURS_MIN ||
    form.required_daily_hours > SHIFT_REQUIRED_DAILY_HOURS_MAX
  ) {
    return `Required daily hours must be between ${SHIFT_REQUIRED_DAILY_HOURS_MIN} and ${SHIFT_REQUIRED_DAILY_HOURS_MAX}.`;
  }
  if (!form.earliest_checkin?.trim()) {
    return "Earliest check-in time is required.";
  }
  if (!form.latest_checkout?.trim()) {
    return "Latest check-out time is required.";
  }
  const windowMinutes = computeShiftWindowMinutes(
    form.earliest_checkin,
    form.latest_checkout,
  );
  if (windowMinutes == null) {
    return "Enter valid earliest check-in and latest check-out times.";
  }
  if (windowMinutes < form.required_daily_hours * 60) {
    return "The check-in window must be at least as long as required daily hours.";
  }
  return null;
}

export function buildCreateStaffShiftPayload(
  tenantId: string,
  form: CreateStaffShiftFormState,
): CreateStaffShiftPayload {
  const base: CreateStaffShiftPayload = {
    tenant_id: tenantId,
    name: form.name.trim(),
    type: form.type,
    working_days: [...form.working_days],
    required_working_days_per_week: form.required_working_days_per_week,
    grace_period_minutes: form.grace_period_minutes,
    hard_limit_hours: form.hard_limit_hours,
    overtime_enabled: form.overtime_enabled ?? true,
    effective_from: form.effective_from.trim(),
    status: form.status,
  };

  if (isFixedShiftType(form.type)) {
    return {
      ...base,
      start_time: form.start_time.trim(),
      end_time: form.end_time.trim(),
    };
  }

  return {
    ...base,
    required_daily_hours: form.required_daily_hours,
    earliest_checkin: form.earliest_checkin?.trim() || undefined,
    latest_checkout: form.latest_checkout?.trim() || undefined,
  };
}

export function resolveStaffShiftTenantId(
  shift: StaffShift,
  fallback: string,
): string {
  const candidate = shift.tenant_id ?? shift.tenantId;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return String(candidate);
  }
  return fallback;
}

export function normalizeShiftTimeForInput(value: unknown): string {
  const raw = coerceShiftTimeString(value);
  if (!raw) return "";

  const parts = extractShiftClockParts(raw);
  if (parts) {
    return `${String(parts.hours).padStart(2, "0")}:${String(parts.minutes).padStart(2, "0")}`;
  }

  const parsed = moment(raw, [...SHIFT_TIME_PARSE_FORMATS, moment.ISO_8601], true);
  if (parsed.isValid()) {
    return parsed.format("HH:mm");
  }

  const loose = moment(raw);
  return loose.isValid() ? loose.format("HH:mm") : "";
}

function coerceShiftDateString(value: unknown): string {
  if (value == null) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (value instanceof Date) {
    return moment(value).format("YYYY-MM-DD");
  }
  return "";
}

export function normalizeShiftDateForInput(value: unknown): string {
  const raw = coerceShiftDateString(value);
  if (!raw) return "";

  const datePart = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  const parsed = moment(raw);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
}

export function staffShiftToFormState(shift: StaffShift): CreateStaffShiftFormState {
  const workingDays = Array.isArray(shift.working_days) ? [...shift.working_days] : [];
  const normalizedWorkingDays =
    workingDays.length > 0 ? workingDays.toSorted((a, b) => a - b) : [1, 2, 3, 4, 5];
  const requiredWorkingDays =
    shift.required_working_days_per_week ?? normalizedWorkingDays.length;

  return {
    name: shift.name?.trim() ?? "",
    type: shift.type?.trim() || "fixed",
    start_time:
      normalizeShiftTimeForInput(readStaffShiftTime(shift, "start_time")) || "09:00",
    end_time: normalizeShiftTimeForInput(readStaffShiftTime(shift, "end_time")) || "18:00",
    working_days: normalizedWorkingDays,
    required_working_days_per_week: Math.min(
      Math.max(1, requiredWorkingDays),
      normalizedWorkingDays.length,
    ),
    required_daily_hours: shift.required_daily_hours ?? 8,
    earliest_checkin: normalizeShiftTimeForInput(shift.earliest_checkin) || "08:30",
    latest_checkout: normalizeShiftTimeForInput(shift.latest_checkout) || "18:00",
    grace_period_minutes: shift.grace_period_minutes ?? 10,
    hard_limit_hours: shift.hard_limit_hours ?? 12,
    overtime_enabled: shift.overtime_enabled !== false,
    effective_from:
      normalizeShiftDateForInput(shift.effective_from) ||
      new Date().toISOString().slice(0, 10),
    status: shift.status?.trim() || "active",
  };
}

export const SHIFT_STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
] as const;

export const SHIFT_TYPE_FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "fixed", label: "Fixed" },
  { value: "flexible", label: "Flexible" },
] as const;

export const SHIFT_LIST_DEFAULT_LIMIT = 25;

export const SHIFT_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function formatShiftLabel(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "—";
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function readStaffShiftTime(
  shift: StaffShift,
  key: "start_time" | "end_time",
): unknown {
  const direct = shift[key];
  if (direct != null && String(direct).trim()) {
    return direct;
  }
  if (key === "start_time") {
    return shift.startTime ?? shift.start;
  }
  return shift.endTime ?? shift.end;
}

function coerceShiftTimeString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value >= 0 && value < 24 * 60) {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }
  if (value instanceof Date) {
    return moment(value).format("HH:mm:ss");
  }
  return "";
}

function extractShiftClockParts(
  value: string,
): Readonly<{ hours: number; minutes: number; seconds: number }> | null {
  const withoutFraction = value.replace(/\.\d+/, "");
  const withoutTimezone = withoutFraction
    .replace(/[Zz]$/, "")
    .replace(/[+-]\d{2}:?\d{2}$/, "");
  const withoutDate = withoutTimezone.replace(/^\d{4}-\d{2}-\d{2}[T\s]/, "");
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(withoutDate.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return { hours, minutes, seconds };
}

function formatShiftClockParts(
  parts: Readonly<{ hours: number; minutes: number; seconds: number }>,
): string {
  return moment()
    .startOf("day")
    .hours(parts.hours)
    .minutes(parts.minutes)
    .seconds(parts.seconds)
    .format(SHIFT_TIME_DISPLAY_FORMAT);
}

export function formatShiftTimeValue(value: unknown): string {
  const raw = coerceShiftTimeString(value);
  if (!raw) return "—";

  const clockParts = extractShiftClockParts(raw);
  if (clockParts) {
    return formatShiftClockParts(clockParts);
  }

  const parsed = moment(raw, [...SHIFT_TIME_PARSE_FORMATS, moment.ISO_8601], true);
  if (parsed.isValid()) {
    return parsed.format(SHIFT_TIME_DISPLAY_FORMAT);
  }

  const loose = moment(raw);
  if (loose.isValid()) {
    return loose.format(SHIFT_TIME_DISPLAY_FORMAT);
  }

  return raw;
}

export function formatShiftDateValue(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "—";
  const formatted = formatDateForTable(trimmed);
  return formatted || trimmed;
}

export function filterShiftsBySearch(
  rows: StaffShift[],
  searchValue: string,
): StaffShift[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.type,
      row.status,
      formatShiftLabel(row.type),
      formatShiftLabel(row.status),
      formatShiftWorkingDays(row.working_days),
      formatShiftTimeValue(readStaffShiftTime(row, "start_time")),
      formatShiftTimeValue(readStaffShiftTime(row, "end_time")),
      formatShiftTimeValue(row.earliest_checkin),
      row.grace_period_minutes,
      row.hard_limit_hours,
      formatShiftDateValue(row.effective_from),
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}

/** Fields returned by the staff-management shifts API (create/list payloads). */
export const STAFF_SHIFT_API_FIELD_KEYS = [
  "name",
  "type",
  "status",
  "start_time",
  "end_time",
  "working_days",
  "earliest_checkin",
  "grace_period_minutes",
  "hard_limit_hours",
  "effective_from",
] as const;

export type StaffShiftApiFieldKey = (typeof STAFF_SHIFT_API_FIELD_KEYS)[number];

export type StaffShiftTableColumnKey = StaffShiftApiFieldKey | "tenant_id";

const SHIFT_TABLE_ALWAYS_VISIBLE_COLUMNS: readonly StaffShiftTableColumnKey[] = [
  "name",
  "type",
  "status",
  "start_time",
  "end_time",
  "working_days",
  "effective_from",
];

export function shiftFieldHasDisplayValue(
  shift: StaffShift,
  field: StaffShiftTableColumnKey,
): boolean {
  switch (field) {
    case "name":
      return Boolean(shift.name?.trim());
    case "type":
      return Boolean(shift.type?.trim());
    case "status":
      return Boolean(shift.status?.trim());
    case "start_time":
      return Boolean(normalizeShiftTimeForInput(readStaffShiftTime(shift, "start_time")));
    case "end_time":
      return Boolean(normalizeShiftTimeForInput(readStaffShiftTime(shift, "end_time")));
    case "working_days":
      return Array.isArray(shift.working_days) && shift.working_days.length > 0;
    case "earliest_checkin":
      return Boolean(normalizeShiftTimeForInput(shift.earliest_checkin));
    case "grace_period_minutes":
      return shift.grace_period_minutes != null;
    case "hard_limit_hours":
      return shift.hard_limit_hours != null;
    case "effective_from":
      return Boolean(normalizeShiftDateForInput(shift.effective_from));
    case "tenant_id":
      return Boolean(resolveStaffShiftTenantId(shift, ""));
    default:
      return false;
  }
}

export function resolveVisibleStaffShiftTableColumns(
  rows: readonly StaffShift[],
  options?: Readonly<{ includeTenant?: boolean }>,
): StaffShiftTableColumnKey[] {
  const columns: StaffShiftTableColumnKey[] = [...SHIFT_TABLE_ALWAYS_VISIBLE_COLUMNS];

  for (const field of ["earliest_checkin", "grace_period_minutes", "hard_limit_hours"] as const) {
    if (rows.some((row) => shiftFieldHasDisplayValue(row, field))) {
      columns.push(field);
    }
  }

  if (options?.includeTenant && rows.some((row) => shiftFieldHasDisplayValue(row, "tenant_id"))) {
    columns.push("tenant_id");
  }

  return columns;
}

export function formatShiftHardLimitHours(
  value: number | null | undefined,
): string {
  if (value == null) return "—";
  return `${value} h`;
}
