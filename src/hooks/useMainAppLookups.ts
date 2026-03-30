import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {  getMainAppUsers } from "@utils/staffManagement";
import { GetDepartments } from "@utils/users";

export interface MainAppDepartmentLookup {
  id: number;
  name?: string;
  [key: string]: unknown;
}

export interface MainAppUserLookup {
  id: number;
  name: string;
  phone: string;
}

/** Raw row from `users/users` (GetMinifiedUsers) — field names vary by API. */
type MinifiedUserApiRow = {
  id?: number;
  name?: string;
  phone?: string | number | null;
  phone_no?: string | number | null;
};

function phoneFromMinifiedUserRow(u: MinifiedUserApiRow): string {
  const raw = u.phone ?? u.phone_no;
  if (raw == null) return "";
  const s = String(raw).trim();
  return s;
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
          GetDepartments(),
          getMainAppUsers(companyIdentifier),
        ]);
        console.log(departments);
        setMainAppDepartments(Array.isArray(departments) ? (departments as MainAppDepartmentLookup[]) : []);
        setMainAppUsers(
          Array.isArray(usersRaw)
            ? (usersRaw as MinifiedUserApiRow[]).map((u) => ({
                id: typeof u.id === "number" ? u.id : Number(u.id),
                name: u.name != null && String(u.name).trim() !== "" ? String(u.name) : "—",
                phone: phoneFromMinifiedUserRow(u),
              }))
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
