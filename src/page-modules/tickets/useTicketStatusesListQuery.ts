import { useQuery } from "@tanstack/react-query";
import {
  fetchTicketStatusesListPage,
  getTicketStatusesListQueryOptions,
  type TicketStatusesListPayload,
} from "@utils/ticket-statuses";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type { TicketStatusesListPayload };

export function useTicketStatusesListQuery(
  args: Readonly<{ page: number; perPage: number; search: string }>,
) {
  return useQuery({
    ...getTicketStatusesListQueryOptions(args),
    queryFn: async (): Promise<TicketStatusesListPayload> => {
      try {
        return await fetchTicketStatusesListPage(args);
      } catch (error) {
        toast.error(`Failed to load ticket statuses: ${getErrorMessage(error)}`, {
          toastId: "ticket_statuses_list_failed",
        });
        return { data: [], total: 0 };
      }
    },
  });
}
