import {
  fetchTicketModulesListPage,
  getTicketModulesListQueryOptions,
} from "@utils/ticket-module";
import {
  usePaginatedListQuery,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type { TicketModulesListPayload } from "@utils/ticket-module";

export function useTicketModulesListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery({
    args,
    queryKey: getTicketModulesListQueryOptions(args).queryKey,
    fetchPage: fetchTicketModulesListPage,
    errorLabel: "ticket modules",
    toastId: "ticket_modules_list_failed",
  });
}
