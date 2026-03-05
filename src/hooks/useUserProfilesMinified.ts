import { useCallback, useEffect, useState } from "react";
import { getUserProfilesMinified, type UserProfileMinified } from "@utils/staffManagement";

export function useUserProfilesMinified() {
  const [userProfilesMinified, setUserProfilesMinified] = useState<UserProfileMinified[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserProfilesMinified();
      setUserProfilesMinified(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[useUserProfilesMinified] fetch error:", e);
      setUserProfilesMinified([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { userProfilesMinified, loading, refetch };
}
