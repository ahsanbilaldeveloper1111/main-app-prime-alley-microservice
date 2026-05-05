import type { CrossTabCtiManager } from "../utils/crossTabCtiManager";

export function assignCtiConnectTokenToRefsAndBroadcast(params: {
  result: {
    token: string;
    userAddress: string;
    userTeams: unknown;
    userDataExtensions: unknown;
  };
  tokenRef: { current: string | null };
  userAddressRef: { current: string | null };
  userTeamsRef: { current: unknown };
  userDataExtensionsRef: { current: unknown };
  isGlobalInstance: boolean;
  crossTabManagerRef: { current: CrossTabCtiManager };
}): { token: string; userAddress: string } {
  const { token, userAddress, userTeams, userDataExtensions } = params.result;
  params.tokenRef.current = token;
  params.userAddressRef.current = userAddress;
  params.userTeamsRef.current = userTeams;
  params.userDataExtensionsRef.current = userDataExtensions;

  if (
    params.isGlobalInstance &&
    params.crossTabManagerRef.current.isMasterTab() &&
    params.crossTabManagerRef.current.isCrossTabSupported()
  ) {
    params.crossTabManagerRef.current.broadcastCtiEvent({
      type: "user_data_extensions",
      data: userDataExtensions,
    });
  }

  return { token, userAddress };
}
