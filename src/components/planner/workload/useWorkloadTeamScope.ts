import { useMemo } from "react";
import {
  parseWorkloadHierarchyScope,
  type WorkloadTeamScopeResult,
} from "@page-modules/planner/workload/workloadTeamScope";

const LOADING_SCOPE: WorkloadTeamScopeResult = {
  loading: true,
  isTeamOwner: false,
  isTeamMemberOnly: false,
  teamExtensions: [],
};

const IDLE_UNAUTHENTICATED: WorkloadTeamScopeResult = {
  loading: false,
  isTeamOwner: false,
  isTeamMemberOnly: false,
  teamExtensions: [],
};

/**
 * Workload roster scope from work-planner hierarchy (`useHierarchyData`), not teams API.
 */
export function useWorkloadTeamScope(
  sessionUserId: string | null | undefined,
  sessionExtension: string,
  sessionStatus: string,
  skipFetch: boolean,
  hierarchyExtensions: unknown[],
  hierarchyUsers: unknown[],
  hierarchyLoading: boolean,
): WorkloadTeamScopeResult {
  return useMemo(() => {
    if (sessionStatus !== "authenticated" || skipFetch) {
      return IDLE_UNAUTHENTICATED;
    }
    const selfId = sessionUserId == null ? "" : String(sessionUserId).trim();
    const viewerExt = sessionExtension.trim();
    if (!selfId && !viewerExt) {
      return IDLE_UNAUTHENTICATED;
    }
    if (hierarchyLoading) {
      return LOADING_SCOPE;
    }
    return parseWorkloadHierarchyScope(
      hierarchyExtensions,
      hierarchyUsers,
      selfId,
      viewerExt,
    );
  }, [
    sessionUserId,
    sessionExtension,
    sessionStatus,
    skipFetch,
    hierarchyExtensions,
    hierarchyUsers,
    hierarchyLoading,
  ]);
}
