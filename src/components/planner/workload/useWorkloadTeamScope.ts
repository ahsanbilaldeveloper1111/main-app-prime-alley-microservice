import { useEffect, useState } from "react";
import {
  fetchWorkloadTeamScope,
  type WorkloadTeamScopeResult,
} from "@page-modules/planner/workload/workloadTeamScope";

const INITIAL: WorkloadTeamScopeResult = {
  loading: true,
  isTeamOwner: false,
  isTeamMemberOnly: false,
  teamExtensions: [],
};

export function useWorkloadTeamScope(
  sessionUserId: string | null | undefined,
  sessionExtension: string,
  sessionStatus: string,
  skipFetch = false,
): WorkloadTeamScopeResult {
  const [scope, setScope] = useState<WorkloadTeamScopeResult>(INITIAL);

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      setScope(IDLE_UNAUTHENTICATED);
      return;
    }
    if (skipFetch) {
      setScope(IDLE_UNAUTHENTICATED);
      return;
    }
    const selfId = sessionUserId == null ? "" : String(sessionUserId).trim();
    const viewerExt = sessionExtension.trim();
    if (!selfId && !viewerExt) {
      setScope(IDLE_UNAUTHENTICATED);
      return;
    }

    let cancelled = false;
    setScope((prev) => ({ ...prev, loading: true }));

    fetchWorkloadTeamScope(selfId, viewerExt)
      .then((result) => {
        if (!cancelled) setScope(result);
      })
      .catch(() => {
        if (!cancelled) {
          setScope({
            loading: false,
            isTeamOwner: false,
            isTeamMemberOnly: false,
            teamExtensions: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionUserId, sessionExtension, sessionStatus, skipFetch]);

  return scope;
}

const IDLE_UNAUTHENTICATED: WorkloadTeamScopeResult = {
  loading: false,
  isTeamOwner: false,
  isTeamMemberOnly: false,
  teamExtensions: [],
};
