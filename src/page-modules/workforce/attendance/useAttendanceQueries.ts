import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getAttendance,
  getAttendanceStatus,
  type AttendanceRecord,
  type AttendanceStatusData,
} from "@utils/staffManagement";
import { workforceKeys } from "@query/keys";
import { planTeamAttendanceListQuery } from "@utils/workforce/attendanceTeamScope";
import {
  buildAttendanceListRequestParams,
  serializeAttendanceListFiltersKey,
  type AttendancePaginationState,
} from "./attendanceDomain";

export type AttendanceListQueryArgs = Readonly<{
  page: number;
  limit: number;
  appliedUserIds: readonly string[];
  selectedDatePreset: string;
  canViewAllEmployees: boolean;
  teamScopeLoading: boolean;
  teamScopeUserIds: readonly string[];
  sessionUserId: string | null | undefined;
  sessionStatus: string;
}>;

export type AttendanceListPayload = Readonly<{
  records: AttendanceRecord[];
  pagination: AttendancePaginationState | null;
}>;

function attendanceListScopeCacheSegment(args: AttendanceListQueryArgs): string {
  if (args.canViewAllEmployees) return "all";
  if (args.teamScopeLoading) return "loading";
  return [...args.teamScopeUserIds]
    .map((x) => String(x).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
}

function recordUserIdInAllowSet(record: AttendanceRecord, allow: ReadonlySet<string>): boolean {
  const raw = String(record.user_id ?? "").trim();
  if (raw === "") return false;
  if (allow.has(raw)) return true;
  const n = Number(raw);
  if (Number.isFinite(n) && allow.has(String(n))) return true;
  return false;
}

async function fetchAttendanceListPayload(args: AttendanceListQueryArgs): Promise<AttendanceListPayload> {
  try {
    // Admin / root / view-all-company: unrestricted list. Otherwise team-scoped request + client row filter.
    if (args.canViewAllEmployees) {
      const params = buildAttendanceListRequestParams({
        page: args.page,
        limit: args.limit,
        appliedUserIds: args.appliedUserIds,
        selectedDatePreset: args.selectedDatePreset,
      });
      const { data, pagination: p } = await getAttendance(params);
      const records = data ?? [];
      if (!p) {
        return { records, pagination: null };
      }
      return {
        records,
        pagination: {
          page: p.page,
          limit: p.limit,
          total: p.total,
          last_page: p.last_page,
        },
      };
    }

    const plan = planTeamAttendanceListQuery({
      teamScopeLoading: args.teamScopeLoading,
      teamScopeUserIds: args.teamScopeUserIds,
      sessionUserId: args.sessionUserId,
      appliedUserIds: args.appliedUserIds,
    });

    if (plan.kind === "wait_team") {
      return { records: [], pagination: null };
    }
    if (plan.kind === "no_scope" || plan.kind === "empty_page") {
      return {
        records: [],
        pagination: {
          page: 1,
          limit: args.limit,
          total: 0,
          last_page: 1,
        },
      };
    }

    const params = buildAttendanceListRequestParams({
      page: args.page,
      limit: args.limit,
      appliedUserIds: [],
      selectedDatePreset: args.selectedDatePreset,
      userIdsOverride: plan.user_ids,
    });
    const { data, pagination: p } = await getAttendance(params);
    const allow = plan.rowFilterAllow;
    const records = (data ?? []).filter((row) => recordUserIdInAllowSet(row, allow));
    if (!p) {
      return { records, pagination: null };
    }
    return {
      records,
      pagination: {
        page: p.page,
        limit: p.limit,
        total: p.total,
        last_page: p.last_page,
      },
    };
  } catch (err) {
    console.error("[Attendance] Failed to load attendance records", err);
    return { records: [], pagination: null };
  }
}

async function fetchAttendanceStatusSafe(): Promise<AttendanceStatusData | null> {
  try {
    return await getAttendanceStatus();
  } catch (err) {
    console.error("[Attendance] Failed to load attendance status", err);
    return null;
  }
}

export function useAttendanceListQuery(
  args: AttendanceListQueryArgs,
  options?: Readonly<{ enabled?: boolean }>,
) {
  const filtersKey = serializeAttendanceListFiltersKey(
    args.appliedUserIds,
    args.selectedDatePreset,
    attendanceListScopeCacheSegment(args),
  );
  return useQuery({
    queryKey: workforceKeys.attendance.list({
      page: args.page,
      limit: args.limit,
      filtersKey,
    }),
    queryFn: () => fetchAttendanceListPayload(args),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useAttendanceStatusQuery() {
  return useQuery({
    queryKey: workforceKeys.attendance.status(),
    queryFn: fetchAttendanceStatusSafe,
  });
}
