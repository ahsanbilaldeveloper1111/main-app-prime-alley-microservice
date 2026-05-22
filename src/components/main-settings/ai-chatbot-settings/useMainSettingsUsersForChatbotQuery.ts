import type { ChatCompanyOption } from "@page-modules/chat/useChatCompaniesQuery";
import { controlhubKeys } from "@query/keys";
import { fetchUsersDirectoryList } from "@utils/users";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

import {
  mapUsersDirectoryForBudget,
  type ChatbotPerUserBudgetOption,
  type UsersDirectoryListRow,
} from "./mapUsersDirectoryForBudget";

export const MAIN_SETTINGS_USERS_FETCH_ERROR_MESSAGE =
  "Could not load users from Users & Teams. Please try again.";

export function useMainSettingsUsersForChatbotQuery(
  enabled: boolean,
  tenantId = "",
  companies: readonly ChatCompanyOption[] = [],
) {
  const { status: sessionStatus } = useSession();
  const tid = tenantId.trim();

  const query = useQuery({
    queryKey: [
      ...controlhubKeys.users.directoryAll(tid || "__current__"),
      companies.length,
    ],
    queryFn: async () => {
      const raw = await fetchUsersDirectoryList();
      const rows = raw as UsersDirectoryListRow[];
      return mapUsersDirectoryForBudget(rows, tid, companies);
    },
    enabled: enabled && sessionStatus === "authenticated",
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    users: query.data ?? ([] as ChatbotPerUserBudgetOption[]),
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
