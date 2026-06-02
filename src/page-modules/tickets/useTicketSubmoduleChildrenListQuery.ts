import {
  fetchTicketSubmoduleChildrenListPage,
  getTicketSubmoduleChildrenListQueryOptions,
} from "@utils/ticket-module";
import {
  usePaginatedListQuery,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export function useTicketSubmoduleChildrenListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery({
    args,
    queryKey: getTicketSubmoduleChildrenListQueryOptions(args).queryKey,
    fetchPage: fetchTicketSubmoduleChildrenListPage,
    errorLabel: "ticket sub categories",
    toastId: "ticket_submodule_children_list_failed",
  });
}
