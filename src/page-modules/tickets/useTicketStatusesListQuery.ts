import {
  fetchTicketStatusesListPage,
  getTicketStatusesListQueryOptions,
} from "@utils/ticket-statuses";
import {
  usePaginatedListQuery,
  type PaginatedListArgs,
} from "../_shared/listQuery";

export type { TicketStatusesListPayload } from "@utils/ticket-statuses";

export function useTicketStatusesListQuery(args: PaginatedListArgs) {
  return usePaginatedListQuery({
    args,
    queryKey: getTicketStatusesListQueryOptions(args).queryKey,
    fetchPage: fetchTicketStatusesListPage,
    errorLabel: "ticket statuses",
    toastId: "ticket_statuses_list_failed",
  });
}
