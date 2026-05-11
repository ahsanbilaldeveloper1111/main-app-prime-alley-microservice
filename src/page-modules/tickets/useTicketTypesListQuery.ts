import {
  fetchTicketTypesListPage,
  getTicketTypesListQueryOptions,
} from "@utils/ticket-types";
import {
  usePaginatedListQuery,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type { TicketTypesListPayload } from "@utils/ticket-types";

export function useTicketTypesListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery({
    args,
    queryKey: getTicketTypesListQueryOptions(args).queryKey,
    fetchPage: fetchTicketTypesListPage,
    errorLabel: "ticket types",
    toastId: "ticket_types_list_failed",
  });
}
