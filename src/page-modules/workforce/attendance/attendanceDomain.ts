import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import type { AttendanceStatusData } from "@utils/staffManagement";
import { getWorkforceTableDatePresetRange } from "@utils/workforceTableDatePresetRange";
import moment from "moment";

export const ATTENDANCE_ITEMS_PER_PAGE = 15;

export const ATTENDANCE_DATE_PRESETS = [
  "Today",
  "Last 7 days",
  "Last 30 days",
  "Last 3 months",
  "All time",
] as const;

export type AttendancePaginationState = Readonly<{
  page: number;
  limit: number;
  total: number;
  last_page: number;
}>;

export function serializeAttendanceListFiltersKey(
  appliedUserIds: readonly string[],
  selectedDatePreset: string,
): string {
  const ids = [...appliedUserIds]
    .map((id) => String(id).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
  const dateKey = selectedDatePreset ?? "";
  return `${ids}|${dateKey}`;
}

export function buildAttendanceListRequestParams(args: Readonly<{
  page: number;
  limit: number;
  appliedUserIds: readonly string[];
  selectedDatePreset: string;
}>): {
  page: number;
  limit: number;
  user_ids?: string[];
  date_from?: string;
  date_to?: string;
} {
  const params: {
    page: number;
    limit: number;
    user_ids?: string[];
    date_from?: string;
    date_to?: string;
  } = {
    page: args.page,
    limit: args.limit,
  };
  const normalizedUserIds = args.appliedUserIds
    .map((id) => String(id).trim())
    .filter(Boolean);
  if (normalizedUserIds.length > 0) {
    params.user_ids = normalizedUserIds;
  }
  const dateRange = getWorkforceTableDatePresetRange(args.selectedDatePreset ?? "");
  if (dateRange) {
    params.date_from = dateRange.from;
    params.date_to = dateRange.to;
  }
  return params;
}

export function consumeHandledAttendanceError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "Attendance" });
}

export function formatAttendanceToolbarDateLine(
  status: AttendanceStatusData,
  isCheckedIn: boolean,
): string | null {
  if (status.work_date) {
    const day = moment(status.work_date).format("dddd, DD MMM YYYY");
    if (isCheckedIn && status.attendance?.check_in_at) {
      return `${day} · In at ${moment(status.attendance.check_in_at).format("hh:mm A")}`;
    }
    return day;
  }
  if (isCheckedIn && status.attendance?.check_in_at) {
    return `In at ${moment(status.attendance.check_in_at).format("dddd, DD MMM YYYY, hh:mm A")}`;
  }
  return null;
}
