import { formatDailyReportStatus } from "@page-modules/workforce/attendance-reports/dailyAttendanceReportDomain";
import type {
  TeamAttendanceSnapshotEmployee,
  TeamAttendanceSnapshotStatusFilter,
  TeamAttendanceSnapshotSummary,
} from "@utils/staffManagement";
import { TEAM_ATTENDANCE_SNAPSHOT_STATUS_FILTERS } from "@utils/staffManagement";

export const TEAM_SNAPSHOT_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: TeamAttendanceSnapshotStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "on_break", label: "On break" },
  { value: "overtime", label: "Overtime" },
  { value: "on_leave", label: "On leave" },
  { value: "no_show", label: "No show" },
];

export function isTeamAttendanceSnapshotStatusFilter(
  value: string,
): value is TeamAttendanceSnapshotStatusFilter {
  return TEAM_ATTENDANCE_SNAPSHOT_STATUS_FILTERS.includes(
    value as TeamAttendanceSnapshotStatusFilter,
  );
}

export function formatTeamSnapshotStatus(value: string | null | undefined): string {
  return formatDailyReportStatus(value);
}

export function formatTeamSnapshotWorkedMinutes(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) {
    return "—";
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) {
    return `${hours}h ${remainder}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${remainder} min`;
}

export function buildUserNameByExtensionMap(
  users: ReadonlyArray<{ name: string; phone: string }>,
): Map<string, string> {
  const map = new Map<string, string>();

  for (const user of users) {
    const extension = user.phone.trim();
    if (!extension) {
      continue;
    }

    const name = user.name.trim();
    if (name && name !== "—") {
      map.set(extension, name);
    }
  }

  return map;
}

export function lookupUserNameByExtension(
  extension: string,
  userNameByExtension: ReadonlyMap<string, string>,
): string | null {
  const trimmed = extension.trim();
  if (!trimmed) {
    return null;
  }

  const direct = userNameByExtension.get(trimmed);
  if (direct) {
    return direct;
  }

  const extensionDigits = trimmed.replace(/\D/g, "");
  if (!extensionDigits) {
    return null;
  }

  for (const [key, name] of userNameByExtension) {
    const keyDigits = key.replace(/\D/g, "");
    if (keyDigits && keyDigits === extensionDigits) {
      return name;
    }
  }

  return null;
}

export function resolveTeamSnapshotEmployeeName(
  employee: TeamAttendanceSnapshotEmployee,
  userNameByExtension: ReadonlyMap<string, string>,
): string {
  const apiName = employee.user_name?.trim();
  if (apiName) {
    return apiName;
  }

  const userId = employee.user_id?.trim();
  if (userId) {
    const lookedUp = lookupUserNameByExtension(userId, userNameByExtension);
    if (lookedUp) {
      return lookedUp;
    }
  }

  const employeeCode = employee.employee_code?.trim();
  if (employeeCode) {
    return employeeCode;
  }

  return userId || "—";
}

export function resolveTeamSnapshotDepartmentLabel(
  departmentId: number | null | undefined,
  departmentNameById: ReadonlyMap<number, string>,
): string {
  if (departmentId == null || !Number.isFinite(departmentId)) {
    return "—";
  }

  return departmentNameById.get(departmentId) ?? `Department #${departmentId}`;
}

export function resolveTeamSnapshotStatusModifier(status: string | null | undefined): string {
  const raw = status?.trim().toLowerCase() ?? "";
  if (!raw) return "unknown";
  if (raw === "present" || raw.includes("checked_in")) return "present";
  if (raw === "absent") return "absent";
  if (raw === "late") return "late";
  if (raw === "on_break" || raw.includes("break")) return "on-break";
  if (raw === "overtime" || raw === "on_overtime") return "overtime";
  if (raw === "on_leave" || raw.includes("leave")) return "on-leave";
  if (raw === "no_show" || raw === "no-show") return "no-show";
  return "unknown";
}

export function readTeamSnapshotEmployeeRowKey(
  employee: TeamAttendanceSnapshotEmployee,
  index: number,
): string {
  const userId = employee.user_id?.trim();
  if (userId) {
    return userId;
  }

  const employeeCode = employee.employee_code?.trim();
  if (employeeCode) {
    return employeeCode;
  }

  return `team-snapshot-row-${index}`;
}

export function readTeamSnapshotSummaryCount(
  summary: TeamAttendanceSnapshotSummary,
  key: keyof TeamAttendanceSnapshotSummary,
): number {
  const value = summary[key];
  return value != null && Number.isFinite(value) ? value : 0;
}
