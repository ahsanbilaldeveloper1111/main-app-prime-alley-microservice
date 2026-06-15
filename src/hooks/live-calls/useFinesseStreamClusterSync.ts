import { useCallback, useRef, useState } from "react";
import {
  getEffectiveTeamId,
  getFinesseClusterId,
  getFinesseUserData,
  getFinesseUserTeam,
  mergeClusterIntoStoredUserFromTeamPayload,
} from "@utils/finesse";

/**
 * Resolves Finesse cluster id for SSE preview/roster topics.
 * Coalesces concurrent getFinesseUserTeam calls and bumps stream config once when cluster is persisted.
 */
export function useFinesseStreamClusterSync() {
  const syncInFlightRef = useRef(false);
  const [streamConfigBump, setStreamConfigBump] = useState(0);

  const syncStreamClusterFromTeam = useCallback(async () => {
    if (syncInFlightRef.current) return;
    const d = getFinesseUserData();
    const username = d?.loginId ?? d?.loginName;
    const teamId = getEffectiveTeamId(d);
    if (!username || teamId == null || getFinesseClusterId()) return;

    syncInFlightRef.current = true;
    try {
      const res = await getFinesseUserTeam(username, teamId, false);
      const payload = res?.responseData ?? res;
      if (mergeClusterIntoStoredUserFromTeamPayload(payload)) {
        setStreamConfigBump((b) => b + 1);
      }
    } catch {
      // ignore — preview may still work via legacy topics when cluster is unavailable
    } finally {
      syncInFlightRef.current = false;
    }
  }, []);

  return { syncStreamClusterFromTeam, streamConfigBump, setStreamConfigBump };
}
