import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getMainAppDepartments, getMainAppUsers } from "@utils/staffManagement";

export interface MainAppDepartmentLookup {
  id: number;
  name?: string;
  [key: string]: unknown;
}

export interface MainAppUserLookup {
  id: number;
  name: string;
}

export function useMainAppLookups() {
  const { data: session } = useSession();
  const [mainAppDepartments, setMainAppDepartments] = useState<MainAppDepartmentLookup[]>([]);
  const [mainAppUsers, setMainAppUsers] = useState<MainAppUserLookup[]>([]);
  const [loading, setLoading] = useState(false);

  const companyIdentifier = (session?.user?.company_identifier as string | undefined) ?? null;

  useEffect(() => {
    if (!companyIdentifier) {
      setMainAppDepartments([]);
      setMainAppUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchData = async () => {
      try {
        const [departments, usersRaw] = await Promise.all([
          getMainAppDepartments(companyIdentifier),
          getMainAppUsers(companyIdentifier),
        ]);
        setMainAppDepartments(Array.isArray(departments) ? (departments as MainAppDepartmentLookup[]) : []);
        setMainAppUsers(
          Array.isArray(usersRaw)
            ? (usersRaw as { id: number; name?: string }[]).map((u) => ({ id: u.id, name: u.name ?? "—" }))
            : []
        );
      } catch (e) {
        console.error("[useMainAppLookups] fetch error:", e);
        setMainAppDepartments([]);
        setMainAppUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyIdentifier]);

  return {
    mainAppDepartments,
    mainAppUsers,
    loading,
    loadingDepartments: loading,
    loadingUsers: loading,
    companyIdentifier,
  };
}
