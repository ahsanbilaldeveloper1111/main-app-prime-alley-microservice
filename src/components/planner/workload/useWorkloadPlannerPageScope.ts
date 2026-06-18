import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { getSessionPhoneOrExtension } from "@planner/projectMemberRole";
import { ModuleSlug } from "@utils/Helper";
import { plannerKeys } from "../../../query/keys";
import { canViewAllEmployeesAttendance } from "@utils/workforce/canViewAllEmployeesAttendance";
import {
  fetchCompanyWorkloadRoster,
  readWorkloadCompanyScopeFromSession,
} from "@page-modules/planner/workload/workloadTeamScope";
import { useWorkloadTeamScope } from "./useWorkloadTeamScope";
import {
  readIsCompanyAdminFromSession,
  readWorkloadSessionUserId,
  resolveWorkloadPageCompanyAllowlist,
  resolveWorkloadPageRosterExtensions,
} from "./workloadPlannerPageHelpers";

export function useWorkloadPlannerPageScope() {
  const { data: session, status: sessionStatus } = useSession();
  const extension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  const isCompanyAdmin = useMemo(
    () => readIsCompanyAdminFromSession(session?.user),
    [session?.user],
  );
  const canViewCompanyWideRoster = useMemo(
    () => canViewAllEmployeesAttendance(session?.user),
    [session?.user],
  );
  const sessionUserId = useMemo(
    () => readWorkloadSessionUserId(session?.user),
    [session?.user],
  );
  const isWorkloadRoot = canViewCompanyWideRoster || isCompanyAdmin;
  const {
    hierarchyDataExtensions,
    hierarchyDataUsers,
    loading: hierarchyLoading,
  } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  const teamScope = useWorkloadTeamScope(
    sessionUserId,
    extension,
    sessionStatus,
    isWorkloadRoot,
    hierarchyDataExtensions,
    hierarchyDataUsers,
    hierarchyLoading,
  );
  const effectiveTeamScope = useMemo(
    () => ({ ...teamScope, isTeamOwner: isWorkloadRoot }),
    [teamScope, isWorkloadRoot],
  );
  const companyScope = useMemo(
    () => readWorkloadCompanyScopeFromSession(session?.user),
    [session?.user],
  );
  const companyRosterQuery = useQuery({
    queryKey: [
      ...plannerKeys.workload.all(),
      "company-roster",
      companyScope?.companyId ?? "",
      companyScope?.companyIdentifier ?? "",
    ],
    queryFn: () => fetchCompanyWorkloadRoster(companyScope),
    enabled: isWorkloadRoot && sessionStatus === "authenticated",
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const companyExtensionAllowlist = useMemo(
    () =>
      resolveWorkloadPageCompanyAllowlist(isWorkloadRoot, {
        companyScope,
        companyRoster: companyRosterQuery.data,
        hierarchyExtensions: hierarchyDataExtensions,
        teamExtensions: teamScope.teamExtensions,
        viewerExtension: extension,
      }),
    [
      isWorkloadRoot,
      companyScope,
      companyRosterQuery.data,
      hierarchyDataExtensions,
      teamScope.teamExtensions,
      extension,
    ],
  );
  const rosterExtensions = useMemo(
    () =>
      resolveWorkloadPageRosterExtensions({
        isWorkloadRoot,
        isTeamMemberOnly: teamScope.isTeamMemberOnly,
        teamExtensions: teamScope.teamExtensions,
        viewerExtension: extension,
        companyRoster: companyRosterQuery.data ?? [],
        hierarchyExtensions: hierarchyDataExtensions,
        hierarchyUsers: hierarchyDataUsers,
        companyExtensionAllowlist,
      }),
    [
      isWorkloadRoot,
      teamScope.isTeamMemberOnly,
      teamScope.teamExtensions,
      extension,
      companyRosterQuery.data,
      hierarchyDataExtensions,
      hierarchyDataUsers,
      companyExtensionAllowlist,
    ],
  );

  const companyRosterLoading = isWorkloadRoot && companyRosterQuery.isLoading;
  const hasWorkloadScope =
    isWorkloadRoot ||
    teamScope.teamExtensions.length > 0 ||
    extension.trim().length > 0;
  const filtersEnabled =
    extension.length > 0 ||
    teamScope.teamExtensions.length > 0 ||
    (isWorkloadRoot && rosterExtensions.length > 0);

  return {
    session,
    sessionStatus,
    extension,
    isWorkloadRoot,
    teamScope,
    effectiveTeamScope,
    hierarchyDataExtensions,
    hierarchyDataUsers,
    companyExtensionAllowlist,
    workloadSelfScoped: teamScope.isTeamMemberOnly,
    rosterExtensions,
    companyRosterLoading,
    hasWorkloadScope,
    filtersEnabled,
  };
}
