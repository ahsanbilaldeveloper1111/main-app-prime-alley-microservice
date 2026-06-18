import { useMemo } from "react";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";
import { parseHierarchyUsersForAttendanceScope } from "@utils/workforce/attendanceTeamScope";

type SessionLike = Readonly<{
  user?: { id?: string | number | null } | null;
}>;

/**
 * Non-privileged workforce attendance / org-chart: scope user ids from
 * `GET users/hierarchyData` (staff-management module) instead of Control Hub teams API.
 */
export function useAttendanceHierarchyScope(
  session: SessionLike | null | undefined,
  sessionStatus: string,
  canViewAll: boolean,
): Readonly<{ teamScopeUserIds: string[]; teamScopeLoading: boolean }> {
  const fetchHierarchy = !canViewAll && sessionStatus === "authenticated";
  const { hierarchyDataUsers, loading: hierarchyLoading } = useHierarchyData(
    ModuleSlug.STAFF_MANAGEMENT,
    fetchHierarchy,
  );

  const selfStr = useMemo(() => {
    const raw = session?.user?.id;
    return raw == null ? "" : String(raw).trim();
  }, [session?.user?.id]);

  const teamScopeUserIds = useMemo(() => {
    if (canViewAll || sessionStatus !== "authenticated") {
      return [];
    }
    if (selfStr === "") {
      return [];
    }
    return parseHierarchyUsersForAttendanceScope(hierarchyDataUsers, selfStr);
  }, [canViewAll, sessionStatus, hierarchyDataUsers, selfStr]);

  const teamScopeLoading = fetchHierarchy && hierarchyLoading;

  return { teamScopeUserIds, teamScopeLoading };
}
