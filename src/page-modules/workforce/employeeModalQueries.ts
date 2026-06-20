import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import {
  fetchDepartmentUserRowsForModal,
  type DepartmentUserRow,
} from "@utils/workforce/employeeModalShared";
import { getUserProfiles, type UserProfile } from "@utils/staffManagement";

function normalizeDepartmentIdForQuery(raw: number | null | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function useEmployeeModalDepartmentUsersQuery(args: Readonly<{
  companyUuid: string | null | undefined;
  departmentId: number | null | undefined;
  enabled: boolean;
}>): Readonly<{
  rows: DepartmentUserRow[];
  isFetching: boolean;
}> {
  const uuid = String(args.companyUuid ?? "").trim();
  const deptId = normalizeDepartmentIdForQuery(args.departmentId);
  const enabled =
    Boolean(args.enabled && uuid.length > 0 && deptId > 0);

  const q = useQuery({
    queryKey: workforceKeys.employees.departmentUsers({
      companyUuid: uuid || "—",
      departmentId: deptId || 0,
    }),
    queryFn: () => fetchDepartmentUserRowsForModal(uuid, deptId),
    enabled,
    staleTime: 60 * 1000,
  });

  return {
    rows: q.data ?? [],
    isFetching: q.isFetching,
  };
}

export function useEmployeeModalPhoneValidationQuery(enabled: boolean): Readonly<{
  profiles: UserProfile[];
  isFetching: boolean;
}> {
  const q = useQuery({
    queryKey: [...workforceKeys.employees.all(), "phoneValidation"] as const,
    queryFn: async () => {
      const { data } = await getUserProfiles({ page: 1, limit: 500 });
      return data ?? [];
    },
    enabled,
    staleTime: 60 * 1000,
  });

  return {
    profiles: q.data ?? [],
    isFetching: q.isFetching,
  };
}
