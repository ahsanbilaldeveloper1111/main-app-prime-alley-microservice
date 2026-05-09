import { useQuery } from "@tanstack/react-query";
import {
  fetchTicketModulesListPage,
  getTicketModulesListQueryOptions,
  type TicketModulesListPayload,
} from "@utils/ticket-module";
import { getErrorMessage } from "@utils/errors";
import { toast } from "react-toastify";

export type { TicketModulesListPayload };

export function useTicketModulesListQuery(
  args: Readonly<{ page: number; perPage: number; search: string }>,
) {
  return useQuery({
    ...getTicketModulesListQueryOptions(args),
    queryFn: async (): Promise<TicketModulesListPayload> => {
      try {
        return await fetchTicketModulesListPage(args);
      } catch (error) {
        toast.error(`Failed to load ticket modules: ${getErrorMessage(error)}`, {
          toastId: "ticket_modules_list_failed",
        });
        return { data: [], total: 0 };
      }
    },
  });
}
