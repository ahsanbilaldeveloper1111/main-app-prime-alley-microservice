import { formatDateForTable, GlobalDateTimeFormat } from "@utils/Helper";
import { normalizeShiftDateForInput } from "@page-modules/workforce/shifts/shiftManagementDomain";
import type { DailyAttendanceReportRow } from "@utils/staffManagement";
import moment from "moment";

export const DAILY_ATTENDANCE_REPORT_LIST_DEFAULT_LIMIT = 25;

export const DAILY_ATTENDANCE_REPORT_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function defaultDailyReportDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function serializeDailyReportExtensionsKey(extensions: readonly string[]): string {
  return [...extensions]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
}

export function formatDailyReportDate(value: string | null | undefined): string {
  const normalized = normalizeShiftDateForInput(value);
  if (!normalized) return "—";
  return formatDateForTable(normalized) ?? normalized;
}

export function formatDailyReportDateTime(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "—";
  const parsed = moment(trimmed);
  if (!parsed.isValid()) return trimmed;
  return parsed.format(GlobalDateTimeFormat);
}

export function formatDailyReportLabel(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "—";
}

export function formatDailyReportWorkedDuration(row: DailyAttendanceReportRow): string {
  if (row.worked_hours != null && Number.isFinite(row.worked_hours)) {
    return `${row.worked_hours} hrs`;
  }
  if (row.worked_minutes != null && Number.isFinite(row.worked_minutes)) {
    const hours = Math.floor(row.worked_minutes / 60);
    const minutes = row.worked_minutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes} min`;
  }
  return "—";
}

export function formatDailyReportStatus(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "—";
  return trimmed
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function resolveDailyReportUserLabel(
  row: DailyAttendanceReportRow,
  userLabelById: ReadonlyMap<string, string>,
): string {
  const userName = row.user_name?.trim();
  if (userName) return userName;

  const userId = row.user_id?.trim();
  if (!userId) return "—";

  return userLabelById.get(userId) ?? userId;
}

export function filterDailyAttendanceReportBySearch(
  rows: readonly DailyAttendanceReportRow[],
  searchValue: string,
  userLabelById: ReadonlyMap<string, string>,
): DailyAttendanceReportRow[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return [...rows];

  return rows.filter((row) => {
    const haystack = [
      resolveDailyReportUserLabel(row, userLabelById),
      row.user_id,
      row.department_name,
      row.shift_name,
      row.status,
      row.check_in_at,
      row.check_out_at,
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}

export function readDailyAttendanceReportRowId(
  row: DailyAttendanceReportRow,
  index: number,
): string {
  if (row.id != null && Number.isFinite(row.id)) {
    return String(row.id);
  }
  const userId = row.user_id?.trim();
  if (userId) {
    return `${userId}-${row.work_date ?? index}`;
  }
  return `daily-report-row-${index}`;
}

export type DailyReportUserSource = Readonly<{
  id?: number;
  name?: string;
  phone?: string | number | null;
  phone_no?: string | number | null;
  extension?: string | number | null;
  extension_number?: string | number | null;
  department_id?: number | null;
}>;

export type DailyReportUserLookup = Readonly<{
  name: string;
  phone: string;
  department_id?: number | null;
}>;

export function readDailyReportUserExtension(user: DailyReportUserSource): string {
  const raw = user.phone ?? user.phone_no ?? user.extension ?? user.extension_number;
  if (raw == null) return "";
  return String(raw).trim();
}

export function normalizeDailyReportUsers(users: unknown): DailyReportUserLookup[] {
  if (!Array.isArray(users)) return [];

  return users.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const user = raw as DailyReportUserSource;
    const phone = readDailyReportUserExtension(user);
    if (!phone) return [];

    const name =
      user.name != null && String(user.name).trim() !== "" ? String(user.name).trim() : "—";
    const departmentIdRaw = user.department_id;
    const department_id =
      typeof departmentIdRaw === "number" && Number.isFinite(departmentIdRaw)
        ? departmentIdRaw
        : null;

    return [{ name, phone, department_id }];
  });
}

export function buildDailyReportUserOptions(
  users: ReadonlyArray<DailyReportUserLookup>,
  departmentId?: number | null,
): ReadonlyArray<{ value: string; label: string }> {
  return users.flatMap((user) => {
    if (
      departmentId != null &&
      user.department_id != null &&
      user.department_id !== departmentId
    ) {
      return [];
    }

    const extension = user.phone.trim();
    if (!extension) return [];
    const label = user.name.trim() ? `${user.name.trim()} (${extension})` : extension;
    return [{ value: extension, label }];
  });
}
