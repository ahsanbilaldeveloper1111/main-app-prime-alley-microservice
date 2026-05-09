import { useQuery } from "@tanstack/react-query";
import {
  fetchTicketTypesListPage,
  getTicketTypesListQueryOptions,
  type TicketTypesListPayload,
} from "@utils/ticket-types";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type { TicketTypesListPayload };

export function useTicketTypesListQuery(
  args: Readonly<{ page: number; perPage: number; search: string }>,
) {
  return useQuery({
    ...getTicketTypesListQueryOptions(args),
    queryFn: async (): Promise<TicketTypesListPayload> => {
      try {
        return await fetchTicketTypesListPage(args);
      } catch (error) {
        toast.error(`Failed to load ticket types: ${getErrorMessage(error)}`, {
          toastId: "ticket_types_list_failed",
        });
        return { data: [], total: 0 };
      }
    },
  });
}
