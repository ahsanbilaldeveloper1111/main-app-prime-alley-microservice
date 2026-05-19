import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";

/** Close the SSE transport only when another tab is provably the CTI master. */
export function shouldCloseCtiSseOnCrossTabDemotion(
  isGlobalInstance: boolean,
  manager: CrossTabCtiManager,
): boolean {
  if (!isGlobalInstance || !manager.isCrossTabSupported()) {
    return false;
  }
  if (manager.isMasterTab()) {
    return false;
  }
  return manager.hasActiveRemoteMasterTab();
}
