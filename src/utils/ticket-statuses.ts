import { toast } from "react-toastify";
import axiosInstance from "./axios";
import { ticketsKeys } from "../query/keys";

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

interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
}

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

export const ListStatuses = async (params: PaginationParams = {}) => {
  try {
    const {
      page = 1,
      perPage = 15,
      search = "",
      draw = 1,
      filters = {},
      isExport = false,
      exportType = "",
    } = params;

    const response = await axiosInstance.post(
      `/tickets/statuses`,
      {
        page,
        perPage,
        search,
        draw,
        ...filters,
        isExport,
        exportType,
      },
      {
        responseType: isExport ? "blob" : "json",
        headers: isExport
          ? {
              Accept: "*/*",
              "Content-Type": "application/json",
            }
          : undefined,
      },
    );

    return response?.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

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
  try {
    const response = await axiosInstance.post(`/tickets/statuses`, {
      all: true,
    });
    if (response.data) {
      return response.data?.data;
    } else {
      toast.error("Failed to fetch statuses");
    }
  } catch (error) {
    throw error;
  }
};

export const UpdateStatus = async (id: string, name: string, color: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/update-status`, {
      id: id,
      name: name,
      color: color,
    });
    if (response.data) {
      const responseData = response.data;
      if (responseData.code == 200) {
        toast.success("Status updated successfully");
        return true;
      } else {
        toast.error(responseData.message);
        return false;
      }
    } else {
      toast.error("Failed to update status");
      return false;
    }
  } catch (error) {
    throw error;
  }
};

export const DeleteStatus = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/delete-status`, {
      id: id,
    });
    if (response.data) {
      const responseData = response.data;
      if (responseData.code == 200) {
        if (responseData?.data?.success == true) {
          toast.success("Status deleted successfully");
          return true;
        } else {
          toast.error(responseData?.data?.message);
          return false;
        }
      } else {
        toast.error(responseData.message);
        return false;
      }
    } else {
      toast.error("Failed to delete status");
      return false;
    }
  } catch (error) {
    throw error;
  }
};

export const CreateStatus = async (name: string, color: string) => {
  try {
    const response = await axiosInstance.post("/tickets/create-status", {
      name: name,
      color: color,
    });

    if (response) {
      const responseData = response.data;
      if (responseData.code == 200) {
        if (responseData?.data?.success == true) {
          toast.success("Status created successfully");
          return true;
        } else {
          toast.error(responseData?.data?.message);
          return false;
        }
      } else {
        toast.error(responseData.message);
        return false;
      }
    } else {
      toast.error("Failed to create status");
      return false;
    }
  } catch (error) {
    console.error("Error creating status:", error);
    throw error;
  }
};

export const GetStatus = async (id: string) => {
  try {
    const response = await axiosInstance.post(`/tickets/view-status`, {
      id: id,
    });
    if (response.data) {
      return response.data?.data;
    } else {
      toast.error("Failed to fetch status");
    }
  } catch (error) {
    throw error;
  }
};
