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

/* ──────────────────────────────────────────────────────────────────────────
 * Modules
 * ─────────────────────────────────────────────────────────────────────────*/

export const ListModules = (params: PaginationParams = {}) =>
  postPaginatedListRequest("/tickets/modules", params);

/** Row shape for ticket module list UIs. */
export interface TicketModuleRecord {
  id: string | number;
  name: string;
  description: string;
  color: string;
  user_extension: string | null;
  created_at: string;
}

export type TicketModulesListPayload = Readonly<{
  data: TicketModuleRecord[];
  total: number;
}>;

export type TicketModulesListPageParams = Readonly<{
  page: number;
  perPage: number;
  search: string;
}>;

export const fetchTicketModulesListPage = (
  params: TicketModulesListPageParams,
): Promise<TicketModulesListPayload> =>
  fetchTicketResourcePage<TicketModuleRecord>(ListModules, params, {
    passSearchInFilters: true,
  });

export const getTicketModulesListQueryOptions = (
  params: TicketModulesListPageParams,
) => ({
  queryKey: ticketsKeys.modules.list(params),
  queryFn: () => fetchTicketModulesListPage(params),
});

export const GetAllModules = async () => {
  const response = await axiosInstance.post(`/tickets/modules`, { all: true });
  return handleFetchOneOrAllResponse(response, "Failed to fetch modules");
};

export const UpdateModule = (
  id: string,
  name: string,
  description: string,
  color: string,
  user_extension?: string | null,
) =>
  postWriteRequest(
    `/tickets/update-module`,
    { id, name, description, color, user_extension },
    {
      successMessage: "Module updated successfully",
      failureMessage: "Failed to update module",
    },
  );

export const DeleteModule = (id: string) =>
  postWriteRequest(
    `/tickets/delete-module`,
    { id },
    {
      successMessage: "Module deleted successfully",
      failureMessage: "Failed to delete module",
      requireDataSuccess: true,
    },
  );

export const CreateModule = (
  name: string,
  description: string,
  color: string,
  user_extension?: string | null,
) =>
  postCreateRequest(
    "/tickets/create-module",
    { name, description, color, user_extension },
    {
      entity: "module",
      successMessage: "Module created successfully",
      failureMessage: "Failed to create module",
    },
  );

export const GetModule = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/view-module`, { id });
  return handleFetchOneOrAllResponse(response, "Failed to fetch module");
};

/* ──────────────────────────────────────────────────────────────────────────
 * Submodules
 * ─────────────────────────────────────────────────────────────────────────*/

export const ListSubmodules = (params: PaginationParams = {}) =>
  postPaginatedListRequest("/tickets/submodules", params);

export type TicketSubmoduleRecord = Readonly<{
  id: string;
  name: string;
  description: string;
  module_id: string;
  created_at: string;
  updated_at: string;
}>;

export type TicketSubmodulesListPageParams = Readonly<{
  page: number;
  perPage: number;
  search: string;
}>;

export type TicketSubmodulesListPayload = Readonly<{
  data: TicketSubmoduleRecord[];
  total: number;
}>;

export const fetchTicketSubmodulesListPage = (
  params: TicketSubmodulesListPageParams,
): Promise<TicketSubmodulesListPayload> =>
  fetchTicketResourcePage<TicketSubmoduleRecord>(ListSubmodules, params, {
    passSearchInFilters: true,
  });

export const getTicketSubmodulesListQueryOptions = (
  params: TicketSubmodulesListPageParams,
) => ({
  queryKey: ticketsKeys.submodulesList.list({
    page: params.page,
    perPage: params.perPage,
    search: params.search,
    filtersKey: "",
  }),
  queryFn: () => fetchTicketSubmodulesListPage(params),
});

export const GetAllSubmodules = async () => {
  const response = await axiosInstance.get(`/tickets/submodules/all`);
  return handleFetchOneOrAllResponse(response, "Failed to fetch submodules");
};

export const CreateSubmodule = (
  name: string,
  description: string,
  module_id: string,
  user_extension?: string | null,
) =>
  postCreateRequest(
    "/tickets/create-submodule",
    { name, description, module_id, user_extension },
    {
      entity: "submodule",
      successMessage: "Submodule created successfully",
      failureMessage: "Failed to create submodule",
    },
  );

export const UpdateSubmodule = (
  id: string,
  name: string,
  description: string,
  module_id: string,
  color: string,
  user_extension?: string | null,
) =>
  postWriteRequest(
    `/tickets/update-submodule`,
    { id, name, description, module_id, color, user_extension },
    {
      successMessage: "Submodule updated successfully",
      failureMessage: "Failed to update submodule",
    },
  );

export const DeleteSubmodule = (id: string) =>
  postWriteRequest(
    `/tickets/delete-submodule`,
    { id },
    {
      successMessage: "Submodule deleted successfully",
      failureMessage: "Failed to delete submodule",
      requireDataSuccess: true,
    },
  );

/* ──────────────────────────────────────────────────────────────────────────
 * Submodule children
 * ─────────────────────────────────────────────────────────────────────────*/

export const ListSubmoduleChildren = (params: PaginationParams = {}) =>
  postPaginatedListRequest("/tickets/submodule-children", params);

export type TicketSubmoduleChildRecord = Readonly<{
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  submodule?: { name?: string; color?: string };
}>;

export type TicketSubmoduleChildrenListPageParams = Readonly<{
  page: number;
  perPage: number;
  search: string;
}>;

export type TicketSubmoduleChildrenListPayload = Readonly<{
  data: TicketSubmoduleChildRecord[];
  total: number;
}>;

export const fetchTicketSubmoduleChildrenListPage = (
  params: TicketSubmoduleChildrenListPageParams,
): Promise<TicketSubmoduleChildrenListPayload> =>
  fetchTicketResourcePage<TicketSubmoduleChildRecord>(ListSubmoduleChildren, params);

export const getTicketSubmoduleChildrenListQueryOptions = (
  params: TicketSubmoduleChildrenListPageParams,
) => ({
  queryKey: ticketsKeys.submoduleChildrenList.list({
    page: params.page,
    perPage: params.perPage,
    search: params.search,
    filtersKey: "",
  }),
  queryFn: () => fetchTicketSubmoduleChildrenListPage(params),
});

export const GetAllSubmoduleChildren = async () => {
  const response = await axiosInstance.get(`/tickets/submodule-children/all`);
  return handleFetchOneOrAllResponse(
    response,
    "Failed to fetch submodule children",
  );
};

export const CreateSubmoduleChild = (
  name: string,
  description: string,
  module_id: string,
  submodule_id: string,
  user_extension?: string | null,
) =>
  postCreateRequest(
    "/tickets/create-submodule-child",
    { name, description, module_id, submodule_id, user_extension },
    {
      entity: "submodule child",
      successMessage: "Submodule child created successfully",
      failureMessage: "Failed to create submodule child",
    },
  );

export const UpdateSubmoduleChild = (
  id: string,
  name: string,
  description: string,
  submodule_id: string,
  color: string,
  user_extension?: string | null,
) =>
  postWriteRequest(
    `/tickets/update-submodule-child`,
    { id, name, description, submodule_id, color, user_extension },
    {
      successMessage: "Submodule child updated successfully",
      failureMessage: "Failed to update submodule child",
    },
  );

export const DeleteSubmoduleChild = (id: string) =>
  postWriteRequest(
    `/tickets/delete-submodule-child`,
    { id },
    {
      successMessage: "Submodule child deleted successfully",
      failureMessage: "Failed to delete submodule child",
      requireDataSuccess: true,
    },
  );
