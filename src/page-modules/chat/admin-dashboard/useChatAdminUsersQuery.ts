import { resolveTenantDisplayFromCompanies } from "@page-modules/chat/shared/chatCompanySelectOptions";
import {
  useChatCompaniesQuery,
  type ChatCompanyOption,
} from "@page-modules/chat/useChatCompaniesQuery";
import { chatKeys } from "@query/keys";
import { getAdminChatUsers } from "@utils/chat";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { mapAdminUsersApi } from "./mapAdminUsersApi";
import type { AdminUserBudgetRow } from "./types";

function enrichRowsWithTenantNames(
  rows: AdminUserBudgetRow[],
  companies: readonly ChatCompanyOption[] | undefined,
): AdminUserBudgetRow[] {
  const list = companies ?? [];
  return rows.map((row) => {
    const { tenantId, tenantName } = resolveTenantDisplayFromCompanies(
      row.tenantId,
      list,
    );
    return { ...row, tenantId, tenantName };
  });
}

export function useChatAdminUsersQuery(enabled: boolean) {
  const { status: sessionStatus } = useSession();
  const companiesQuery = useChatCompaniesQuery(
    enabled && sessionStatus === "authenticated",
  );

  const query = useQuery({
    queryKey: chatKeys.adminUsers.list(),
    queryFn: async () => {
      const data = await getAdminChatUsers();
      return {
        count: data.count,
        rows: mapAdminUsersApi(data),
      };
    },
    enabled: enabled && sessionStatus === "authenticated",
    staleTime: 60_000,
  });

  const rows = useMemo(
    () =>
      enrichRowsWithTenantNames(query.data?.rows ?? [], companiesQuery.data),
    [query.data?.rows, companiesQuery.data],
  );

  return {
    ...query,
    rows,
    count: query.data?.count ?? 0,
  };
}
