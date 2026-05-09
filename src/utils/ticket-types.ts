import axiosInstance from "./axios";
import { ticketsKeys } from "../query/keys";
import {
  handleCrudResponse,
  handleFetchOneOrAllResponse,
  postPaginatedListRequest,
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

export async function fetchTicketTypesListPage(
  params: TicketTypesListPageParams,
): Promise<TicketTypesListPayload> {
  const response = await ListTypes({
    page: params.page,
    perPage: params.perPage,
    search: params.search,
    filters: {},
  });
  return {
    data: (response?.data ?? []) as TicketTypeRecord[],
    total: response?.total ?? 0,
  };
}

export function getTicketTypesListQueryOptions(params: TicketTypesListPageParams) {
  return {
    queryKey: ticketsKeys.types.list({
      page: params.page,
      perPage: params.perPage,
      search: params.search,
    }),
    queryFn: () => fetchTicketTypesListPage(params),
  };
}

export const GetAllTypes = async () => {
  const response = await axiosInstance.post(`/tickets/types`, { all: true });
  return handleFetchOneOrAllResponse(response, "Failed to fetch ticket types");
};

export const UpdateType = async (id: string, name: string, description: string) => {
  const response = await axiosInstance.post(`/tickets/update-type`, {
    id,
    name,
    description,
  });
  return handleCrudResponse(response, {
    successMessage: "Ticket type updated successfully",
    failureMessage: "Failed to update ticket type",
  });
};

export const DeleteType = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/delete-type`, { id });
  return handleCrudResponse(response, {
    successMessage: "Ticket type deleted successfully",
    failureMessage: "Failed to delete ticket type",
    requireDataSuccess: true,
  });
};

export const CreateType = async (name: string, description: string) => {
  try {
    const response = await axiosInstance.post("/tickets/create-type", {
      name,
      description,
    });
    return handleCrudResponse(response, {
      successMessage: "Ticket type created successfully",
      failureMessage: "Failed to create ticket type",
      requireDataSuccess: true,
    });
  } catch (error) {
    console.error("Error creating ticket type:", error);
    throw error;
  }
};

export const GetType = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/view-type`, { id });
  return handleFetchOneOrAllResponse(response, "Failed to fetch ticket type");
};
