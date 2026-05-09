import axiosInstance from "./axios";
import { ticketsKeys } from "../query/keys";
import {
  handleCrudResponse,
  handleFetchOneOrAllResponse,
  postPaginatedListRequest,
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

export async function fetchTicketModulesListPage(
  params: TicketModulesListPageParams,
): Promise<TicketModulesListPayload> {
  const response = await ListModules({
    page: params.page,
    perPage: params.perPage,
    search: params.search,
    filters: { search: params.search },
  });
  return {
    data: (response?.data ?? []) as TicketModuleRecord[],
    total: response?.total ?? 0,
  };
}

export function getTicketModulesListQueryOptions(params: TicketModulesListPageParams) {
  return {
    queryKey: ticketsKeys.modules.list({
      page: params.page,
      perPage: params.perPage,
      search: params.search,
    }),
    queryFn: () => fetchTicketModulesListPage(params),
  };
}

export const GetAllModules = async () => {
  const response = await axiosInstance.post(`/tickets/modules`, { all: true });
  return handleFetchOneOrAllResponse(response, "Failed to fetch modules");
};

export const UpdateModule = async (
  id: string,
  name: string,
  description: string,
  color: string,
  user_extension?: string | null,
) => {
  const response = await axiosInstance.post(`/tickets/update-module`, {
    id,
    name,
    description,
    color,
    user_extension,
  });
  return handleCrudResponse(response, {
    successMessage: "Module updated successfully",
    failureMessage: "Failed to update module",
  });
};

export const DeleteModule = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/delete-module`, { id });
  return handleCrudResponse(response, {
    successMessage: "Module deleted successfully",
    failureMessage: "Failed to delete module",
    requireDataSuccess: true,
  });
};

export const CreateModule = async (
  name: string,
  description: string,
  color: string,
  user_extension?: string | null,
) => {
  try {
    const response = await axiosInstance.post("/tickets/create-module", {
      name,
      description,
      color,
      user_extension,
    });
    return handleCrudResponse(response, {
      successMessage: "Module created successfully",
      failureMessage: "Failed to create module",
      requireDataSuccess: true,
    });
  } catch (error) {
    console.error("Error creating module:", error);
    throw error;
  }
};

export const GetModule = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/view-module`, { id });
  return handleFetchOneOrAllResponse(response, "Failed to fetch module");
};

/* ──────────────────────────────────────────────────────────────────────────
 * Submodules
 * ─────────────────────────────────────────────────────────────────────────*/

export const ListSubmodules = (params: PaginationParams = {}) =>
  postPaginatedListRequest("/tickets/submodules", params);

export const GetAllSubmodules = async () => {
  const response = await axiosInstance.get(`/tickets/submodules/all`);
  return handleFetchOneOrAllResponse(response, "Failed to fetch submodules");
};

export const CreateSubmodule = async (
  name: string,
  description: string,
  module_id: string,
  user_extension?: string | null,
) => {
  try {
    const response = await axiosInstance.post("/tickets/create-submodule", {
      name,
      description,
      module_id,
      user_extension,
    });
    return handleCrudResponse(response, {
      successMessage: "Submodule created successfully",
      failureMessage: "Failed to create submodule",
      requireDataSuccess: true,
    });
  } catch (error) {
    console.error("Error creating submodule:", error);
    throw error;
  }
};

export const UpdateSubmodule = async (
  id: string,
  name: string,
  description: string,
  module_id: string,
  color: string,
  user_extension?: string | null,
) => {
  const response = await axiosInstance.post(`/tickets/update-submodule`, {
    id,
    name,
    description,
    module_id,
    color,
    user_extension,
  });
  return handleCrudResponse(response, {
    successMessage: "Submodule updated successfully",
    failureMessage: "Failed to update submodule",
  });
};

export const DeleteSubmodule = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/delete-submodule`, { id });
  return handleCrudResponse(response, {
    successMessage: "Submodule deleted successfully",
    failureMessage: "Failed to delete submodule",
    requireDataSuccess: true,
  });
};

/* ──────────────────────────────────────────────────────────────────────────
 * Submodule children
 * ─────────────────────────────────────────────────────────────────────────*/

export const ListSubmoduleChildren = (params: PaginationParams = {}) =>
  postPaginatedListRequest("/tickets/submodule-children", params);

export const GetAllSubmoduleChildren = async () => {
  const response = await axiosInstance.get(`/tickets/submodule-children/all`);
  return handleFetchOneOrAllResponse(
    response,
    "Failed to fetch submodule children",
  );
};

export const CreateSubmoduleChild = async (
  name: string,
  description: string,
  module_id: string,
  submodule_id: string,
  user_extension?: string | null,
) => {
  try {
    const response = await axiosInstance.post("/tickets/create-submodule-child", {
      name,
      description,
      module_id,
      submodule_id,
      user_extension,
    });
    return handleCrudResponse(response, {
      successMessage: "Submodule child created successfully",
      failureMessage: "Failed to create submodule child",
      requireDataSuccess: true,
    });
  } catch (error) {
    console.error("Error creating submodule child:", error);
    throw error;
  }
};

export const UpdateSubmoduleChild = async (
  id: string,
  name: string,
  description: string,
  submodule_id: string,
  color: string,
  user_extension?: string | null,
) => {
  const response = await axiosInstance.post(`/tickets/update-submodule-child`, {
    id,
    name,
    description,
    submodule_id,
    color,
    user_extension,
  });
  return handleCrudResponse(response, {
    successMessage: "Submodule child updated successfully",
    failureMessage: "Failed to update submodule child",
  });
};

export const DeleteSubmoduleChild = async (id: string) => {
  const response = await axiosInstance.post(`/tickets/delete-submodule-child`, {
    id,
  });
  return handleCrudResponse(response, {
    successMessage: "Submodule child deleted successfully",
    failureMessage: "Failed to delete submodule child",
    requireDataSuccess: true,
  });
};
