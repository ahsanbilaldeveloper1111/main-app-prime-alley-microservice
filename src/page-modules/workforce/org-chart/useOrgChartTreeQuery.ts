import { useQuery } from "@tanstack/react-query";
import { getUserProfilesOrgChartTree } from "@utils/staffManagement";
import { workforceKeys } from "@query/keys";
import {
  buildOrgChartTreeRequestParams,
  parseOrgChartTreeResponse,
  serializeOrgChartFiltersKey,
  type ApiOrgChartNode,
} from "./orgChartDomain";
import {
  collectUniqueOrgChartUserIdsAsArray,
  fetchTodayAttendanceForOrgChartUserIds,
  filterOrgChartUserIdsForAttendanceFetch,
  mergeAttendanceIntoOrgChartTree,
} from "./orgChartAttendanceMerge";

export type OrgChartAttendanceContext = Readonly<{
  canViewAllAttendance: boolean;
  teamScopeLoading: boolean;
  teamScopeUserIds: readonly string[];
  sessionUserId: string | null | undefined;
  sessionStatus: string;
}>;

export interface UseOrgChartTreeQueryParams {
  companyIdentifier: string | null;
  departmentId?: string;
  userIds?: string[];
  attendance?: OrgChartAttendanceContext;
}

function attendanceScopeCacheKey(ctx: OrgChartAttendanceContext | undefined): string {
  if (!ctx) return "no-att";
  if (ctx.sessionStatus !== "authenticated") return "unauth";
  if (ctx.canViewAllAttendance) return "all";
  if (ctx.teamScopeLoading) return "team-loading";
  const ids = [...ctx.teamScopeUserIds]
    .map((x) => String(x).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
  return `team:${ids}`;
}

export function useOrgChartTreeQuery(params: Readonly<UseOrgChartTreeQueryParams>) {
  const { companyIdentifier, departmentId, userIds, attendance } = params;
  const filtersKey = serializeOrgChartFiltersKey(
    departmentId,
    userIds,
    attendanceScopeCacheKey(attendance),
  );

  return useQuery({
    queryKey: workforceKeys.orgChart.tree(filtersKey),
    queryFn: async (): Promise<ApiOrgChartNode[]> => {
      try {
        const req = buildOrgChartTreeRequestParams(departmentId, userIds);
        const raw = await getUserProfilesOrgChartTree(req);
        let nodes = parseOrgChartTreeResponse(raw);
        if (
          attendance?.sessionStatus === "authenticated" &&
          (attendance.canViewAllAttendance || !attendance.teamScopeLoading)
        ) {
          const chartUserIds = collectUniqueOrgChartUserIdsAsArray(nodes);
          const idsForAttendance = filterOrgChartUserIdsForAttendanceFetch({
            chartUserIds,
            canViewAllAttendance: attendance.canViewAllAttendance,
            attendanceTeamScopeLoading: attendance.teamScopeLoading,
            attendanceTeamScopeIds: attendance.teamScopeUserIds,
            sessionUserId: attendance.sessionUserId,
          });
          if (idsForAttendance.length > 0) {
            const byUser = await fetchTodayAttendanceForOrgChartUserIds(idsForAttendance);
            nodes = mergeAttendanceIntoOrgChartTree(nodes, byUser);
          }
        }
        return nodes;
      } catch (e) {
        console.error("[useOrgChartTreeQuery] fetch org chart error:", e);
        return [];
      }
    },
    enabled: Boolean(companyIdentifier),
  });
}
