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

export const ListTypes = (params: PaginationParams = {}) =>
  postPaginatedListRequest("/tickets/types", params);

export interface TicketTypeRecord {
  id: string | number;
  name: string;
  description: string;
  created_at: string;
}

export type TicketTypesListPayload = Readonly<{
  data: TicketTypeRecord[];
  total: number;
}>;

export type TicketTypesListPageParams = Readonly<{
  page: number;
  perPage: number;
  search: string;
}>;

export const fetchTicketTypesListPage = (
  params: TicketTypesListPageParams,
): Promise<TicketTypesListPayload> =>
  fetchTicketResourcePage<TicketTypeRecord>(ListTypes, params);

export const getTicketTypesListQueryOptions = (
  params: TicketTypesListPageParams,
) => ({
  queryKey: ticketsKeys.types.list(params),
  queryFn: () => fetchTicketTypesListPage(params),
});

export const GetAllTypes = async () => {
  const response = await axiosInstance.post(`/tickets/types`, { all: true });
  return handleFetchOneOrAllResponse(response, "Failed to fetch ticket types");
};

export const UpdateType = (id: string, name: string, description: string) =>
  postWriteRequest(
    `/tickets/update-type`,
    { id, name, description },
    {
      successMessage: "Ticket type updated successfully",
      failureMessage: "Failed to update ticket type",
    },
  );

export const DeleteType = (id: string) =>
  postWriteRequest(
    `/tickets/delete-type`,
    { id },
    {
      successMessage: "Ticket type deleted successfully",
      failureMessage: "Failed to delete ticket type",
      requireDataSuccess: true,
    },
  );

export const CreateType = (name: string, description: string) =>
  postCreateRequest(
    "/tickets/create-type",
    { name, description },
    {
      entity: "ticket type",
      successMessage: "Ticket type created successfully",
      failureMessage: "Failed to create ticket type",
    },
  );

export const GetType = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/view-type`, { id });
  return handleFetchOneOrAllResponse(response, "Failed to fetch ticket type");
};
