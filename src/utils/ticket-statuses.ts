import axiosInstance from "./axios";
import { ticketsKeys } from "../query/keys";
import {
  handleCrudResponse,
  handleFetchOneOrAllResponse,
  postPaginatedListRequest,
  type PaginationParams,
} from "./ticket-resource-helpers";

/**
 * Ticket status API helpers (axios).
 *
 * TanStack Query integration:
 * - List (paginated): `getTicketStatusesListQueryOptions` + `fetchTicketStatusesListPage`
 * - Hook: `src/page-modules/tickets/useTicketStatusesListQuery.ts`
 * - Mutations + UI: `src/pages/tickets/statuses/useTicketStatusesPage.tsx`
 *
 * Do not add `useQuery` / React imports here — keep network + query *definitions* only.
 */

/** Row shape for ticket status list/detail UIs and list query payload. */
export interface TicketStatusRecord {
  id: string | number;
  name: string;
  color: string;
  created_at: string;
}

export type TicketStatusesListPayload = Readonly<{
  data: TicketStatusRecord[];
  total: number;
}>;

export type TicketStatusesListPageParams = Readonly<{
  page: number;
  perPage: number;
  search: string;
}>;

export const ListStatuses = (params: PaginationParams = {}) =>
  postPaginatedListRequest("/tickets/statuses", params);

/**
 * Fetches one page of ticket statuses (used by TanStack `queryFn` and anywhere else).
 * Errors propagate; callers (e.g. the query hook) handle toasts / empty fallbacks.
 */
export async function fetchTicketStatusesListPage(
  params: TicketStatusesListPageParams,
): Promise<TicketStatusesListPayload> {
  const response = await ListStatuses({
    page: params.page,
    perPage: params.perPage,
    search: params.search,
    filters: { search: params.search },
  });
  return {
    data: (response?.data ?? []) as TicketStatusRecord[],
    total: response?.total ?? 0,
  };
}

/**
 * Stable `queryKey` + default `queryFn` for TanStack Query (`useQuery`, `prefetchQuery`, etc.).
 */
export function getTicketStatusesListQueryOptions(params: TicketStatusesListPageParams) {
  return {
    queryKey: ticketsKeys.statuses.list({
      page: params.page,
      perPage: params.perPage,
      search: params.search,
    }),
    queryFn: () => fetchTicketStatusesListPage(params),
  };
}

export const GetAllStatuses = async () => {
  const response = await axiosInstance.post(`/tickets/statuses`, { all: true });
  return handleFetchOneOrAllResponse(response, "Failed to fetch statuses");
};

export const UpdateStatus = async (id: string, name: string, color: string) => {
  const response = await axiosInstance.post(`/tickets/update-status`, {
    id,
    name,
    color,
  });
  return handleCrudResponse(response, {
    successMessage: "Status updated successfully",
    failureMessage: "Failed to update status",
  });
};

export const DeleteStatus = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/delete-status`, { id });
  return handleCrudResponse(response, {
    successMessage: "Status deleted successfully",
    failureMessage: "Failed to delete status",
    requireDataSuccess: true,
  });
};

export const CreateStatus = async (name: string, color: string) => {
  try {
    const response = await axiosInstance.post("/tickets/create-status", {
      name,
      color,
    });
    return handleCrudResponse(response, {
      successMessage: "Status created successfully",
      failureMessage: "Failed to create status",
      requireDataSuccess: true,
    });
  } catch (error) {
    console.error("Error creating status:", error);
    throw error;
  }
};

export const GetStatus = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/view-status`, { id });
  return handleFetchOneOrAllResponse(response, "Failed to fetch status");
};
