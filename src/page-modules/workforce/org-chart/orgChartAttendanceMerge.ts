import { getAttendance, type AttendanceRecord } from "@utils/staffManagement";
import { getWorkforceTableDatePresetRange } from "@utils/workforceTableDatePresetRange";
import { ATTENDANCE_QUERY_MAX_USER_IDS } from "@utils/workforce/attendanceTeamScope";
import type { ApiOrgChartNode } from "./orgChartDomain";
import { collectOrgChartUserIds } from "./orgChartDomain";

const ORG_CHART_ATTENDANCE_PAGE_LIMIT = 200;
const ORG_CHART_ATTENDANCE_MAX_PAGES = 25;

export type OrgChartNodeAttendanceShape = Readonly<{
  status: string;
  check_in_at: string | null;
  check_out_at: string | null;
}>;

function attendanceRankForMerge(status: string): number {
  if (status === "checked_out") return 2;
  if (status === "checked_in") return 1;
  return 0;
}

function attendanceSummaryFromRecord(record: AttendanceRecord): OrgChartNodeAttendanceShape {
  if (record.check_out_at) {
    return {
      status: "checked_out",
      check_in_at: record.check_in_at,
      check_out_at: record.check_out_at,
    };
  }
  if (record.check_in_at) {
    return {
      status: "checked_in",
      check_in_at: record.check_in_at,
      check_out_at: record.check_out_at ?? null,
    };
  }
  return { status: "none", check_in_at: null, check_out_at: null };
}

function mergeAttendanceRowsIntoUserMap(
  map: Map<string, OrgChartNodeAttendanceShape>,
  rows: readonly AttendanceRecord[],
): void {
  for (const row of rows) {
    const uid = String(row.user_id ?? "").trim();
    if (uid === "") continue;
    const next = attendanceSummaryFromRecord(row);
    const prev = map.get(uid);
    if (
      !prev ||
      attendanceRankForMerge(next.status) >= attendanceRankForMerge(prev.status)
    ) {
      map.set(uid, next);
    }
  }
}

async function fetchAttendanceRecordsForOrgChartChunk(
  chunk: readonly string[],
  dateFrom: string,
  dateTo: string,
): Promise<AttendanceRecord[]> {
  const all: AttendanceRecord[] = [];
  let page = 1;
  for (let guard = 0; guard < ORG_CHART_ATTENDANCE_MAX_PAGES; guard += 1) {
    const { data, pagination } = await getAttendance(
      {
        page,
        limit: ORG_CHART_ATTENDANCE_PAGE_LIMIT,
        user_ids: [...chunk],
        date_from: dateFrom,
        date_to: dateTo,
      },
      { silent: true },
    );
    const rows = data ?? [];
    all.push(...rows);
    const lastPage = pagination?.last_page ?? 1;
    if (!pagination || page >= lastPage || rows.length === 0) {
      break;
    }
    page += 1;
  }
  return all;
}

export async function fetchTodayAttendanceForOrgChartUserIds(
  userIds: readonly string[],
): Promise<Map<string, OrgChartNodeAttendanceShape>> {
  const out = new Map<string, OrgChartNodeAttendanceShape>();
  const today = getWorkforceTableDatePresetRange("Today");
  if (!today || userIds.length === 0) {
    return out;
  }
  for (let start = 0; start < userIds.length; start += ATTENDANCE_QUERY_MAX_USER_IDS) {
    const chunk = userIds.slice(start, start + ATTENDANCE_QUERY_MAX_USER_IDS);
    const rows = await fetchAttendanceRecordsForOrgChartChunk(chunk, today.from, today.to);
    mergeAttendanceRowsIntoUserMap(out, rows);
  }
  return out;
}

/** Non-privileged users: only enrich attendance for hierarchy-visible users (or self while hierarchy loads). */
export function filterOrgChartUserIdsForAttendanceFetch(input: Readonly<{
  chartUserIds: readonly string[];
  canViewAllAttendance: boolean;
  attendanceTeamScopeLoading: boolean;
  attendanceTeamScopeIds: readonly string[];
  sessionUserId: string | number | undefined | null;
}>): string[] {
  if (input.canViewAllAttendance) {
    return [...input.chartUserIds];
  }
  if (input.attendanceTeamScopeLoading) {
    return [];
  }
  const allow = new Set(
    input.attendanceTeamScopeIds.map((x) => String(x).trim()).filter((x) => x.length > 0),
  );
  if (allow.size > 0) {
    return input.chartUserIds.filter((id) => allow.has(String(id).trim()));
  }
  const self = String(input.sessionUserId ?? "").trim();
  if (self === "") {
    return [];
  }
  return input.chartUserIds.filter((id) => String(id).trim() === self);
}

export function mergeAttendanceIntoOrgChartTree(
  nodes: ApiOrgChartNode[],
  byUserId: ReadonlyMap<string, OrgChartNodeAttendanceShape>,
): ApiOrgChartNode[] {
  return nodes.map((node) => {
    const next: ApiOrgChartNode = { ...node };
    if (node.children && node.children.length > 0) {
      next.children = mergeAttendanceIntoOrgChartTree(node.children, byUserId);
    }
    const uid = node.user_id == null ? "" : String(node.user_id).trim();
    const fetched = uid === "" ? undefined : byUserId.get(uid);
    if (fetched) {
      next.attendance = fetched;
    }
    return next;
  });
}

export function collectUniqueOrgChartUserIdsAsArray(nodes: readonly ApiOrgChartNode[]): string[] {
  return Array.from(collectOrgChartUserIds([...nodes]));
}
