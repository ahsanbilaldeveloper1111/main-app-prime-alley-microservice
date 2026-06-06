import {
  fetchTicketSubmodulesListPage,
  getTicketSubmodulesListQueryOptions,
} from "@utils/ticket-module";
import {
  usePaginatedListQuery,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export function useTicketSubmodulesListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery({
    args,
    queryKey: getTicketSubmodulesListQueryOptions(args).queryKey,
    fetchPage: fetchTicketSubmodulesListPage,
    errorLabel: "ticket categories",
    toastId: "ticket_submodules_list_failed",
  });
}
