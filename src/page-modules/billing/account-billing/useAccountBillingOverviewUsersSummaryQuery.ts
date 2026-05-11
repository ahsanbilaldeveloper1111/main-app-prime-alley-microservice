import { useQuery } from "@tanstack/react-query";

import { accountBillingKeys } from "../../../query/keys";
import { extractSummaryUsersCount } from "@components/billings/Overview/overviewHelpers";
import { getAllUsers } from "@utils/users";

export function useAccountBillingOverviewUsersSummaryQuery(
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: accountBillingKeys.overviewUsersSummary(),
    queryFn: () => getAllUsers({ page: 1, perPage: 1 }),
    enabled: options?.enabled ?? true,
    select: (data) => extractSummaryUsersCount(data),
  });
}
