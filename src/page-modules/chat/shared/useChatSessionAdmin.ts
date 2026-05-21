import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { isChatSessionAdminUser } from "./isChatSessionAdmin";

export function useChatSessionAdmin(): boolean {
  const { data: session } = useSession();
  return useMemo(
    () => isChatSessionAdminUser(session?.user),
    [session?.user],
  );
}
