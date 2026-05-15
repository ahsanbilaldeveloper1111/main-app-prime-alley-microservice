import axiosInstance from "./axios";
import { ticketsKeys } from "@query/keys";
import {
  fetchTicketResourcePage,
  handleFetchOneOrAllResponse,
  postCreateRequest,
  postPaginatedListRequest,
  postWriteRequest,
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
export const fetchTicketStatusesListPage = (
  params: TicketStatusesListPageParams,
): Promise<TicketStatusesListPayload> =>
  fetchTicketResourcePage<TicketStatusRecord>(ListStatuses, params, {
    passSearchInFilters: true,
  });

/**
 * Stable `queryKey` + default `queryFn` for TanStack Query (`useQuery`, `prefetchQuery`, etc.).
 */
export const getTicketStatusesListQueryOptions = (
  params: TicketStatusesListPageParams,
) => ({
  queryKey: ticketsKeys.statuses.list(params),
  queryFn: () => fetchTicketStatusesListPage(params),
});

export const GetAllStatuses = async () => {
  const response = await axiosInstance.post(`/tickets/statuses`, { all: true });
  return handleFetchOneOrAllResponse(response, "Failed to fetch statuses");
};

export const UpdateStatus = (id: string, name: string, color: string) =>
  postWriteRequest(
    `/tickets/update-status`,
    { id, name, color },
    {
      successMessage: "Status updated successfully",
      failureMessage: "Failed to update status",
    },
  );

export const DeleteStatus = (id: string) =>
  postWriteRequest(
    `/tickets/delete-status`,
    { id },
    {
      successMessage: "Status deleted successfully",
      failureMessage: "Failed to delete status",
      requireDataSuccess: true,
    },
  );

export const CreateStatus = (name: string, color: string) =>
  postCreateRequest(
    "/tickets/create-status",
    { name, color },
    {
      entity: "status",
      successMessage: "Status created successfully",
      failureMessage: "Failed to create status",
    },
  );

export const GetStatus = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/view-status`, { id });
  return handleFetchOneOrAllResponse(response, "Failed to fetch status");
};
