import { toast } from "react-toastify";
import axiosInstance from "./axios";

/**
 * Shared transport + response helpers for the ticket admin endpoints
 * (statuses / types / modules / submodules / submodule-children).
 *
 * These are intentionally generic over the ticket resource shape — the
 * endpoint-specific files only declare URLs + display strings and delegate
 * here to keep the duplication ratio low.
 */

export interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: Record<string, unknown>;
  isExport?: boolean;
  exportType?: string;
}

const EXPORT_HEADERS = {
  Accept: "*/*",
  "Content-Type": "application/json",
} as const;

/**
 * POST a paginated list request. Mirrors the `Listxxx` helpers that previously
 * lived inline in every ticket util.
 */
export async function postPaginatedListRequest(
  url: string,
  params: PaginationParams = {},
) {
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
      url,
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
        headers: isExport ? EXPORT_HEADERS : undefined,
      },
    );

    return response?.data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/** Generic shape returned by the ticket CRUD endpoints. */
type CrudApiResponse =
  | undefined
  | null
  | {
      data?: {
        code?: number;
        message?: string;
        data?: { success?: boolean; message?: string };
      };
    };

export type CrudResponseConfig = Readonly<{
  successMessage: string;
  failureMessage: string;
  /**
   * When true, also requires `response.data.data.success === true` to count as
   * a success (matching the legacy create/delete handlers). Used for legacy
   * "double-wrapped" payloads.
   */
  requireDataSuccess?: boolean;
}>;

/**
 * Apply the `if(response.data){ if(code==200){...} else toast.error }` pattern
 * that the ticket CRUD verbs all share. Returns the boolean the caller used to
 * return inline.
 */
export function handleCrudResponse(
  response: CrudApiResponse,
  config: CrudResponseConfig,
): boolean {
  const payload = response?.data;
  if (!payload) {
    toast.error(config.failureMessage);
    return false;
  }

  if (payload.code !== 200) {
    toast.error(payload.message);
    return false;
  }

  if (config.requireDataSuccess) {
    if (payload?.data?.success === true) {
      toast.success(config.successMessage);
      return true;
    }
    toast.error(payload?.data?.message);
    return false;
  }

  toast.success(config.successMessage);
  return true;
}

/**
 * Apply the `if(response.data){ return data.data; } else toast.error(...)`
 * pattern used by the `GetAllXxx` / `GetXxx` helpers.
 */
export function handleFetchOneOrAllResponse<T = unknown>(
  response: { data?: { data?: T } } | undefined,
  failureMessage: string,
): T | undefined {
  if (response?.data) {
    return response.data?.data;
  }
  toast.error(failureMessage);
  return undefined;
}

/**
 * Generic POST + `handleCrudResponse` for the ticket admin write endpoints
 * (`update-*`, `delete-*`). The Update verbs use the bare-success branch; the
 * Delete verbs add `requireDataSuccess: true`.
 */
export async function postWriteRequest(
  url: string,
  payload: Record<string, unknown>,
  config: CrudResponseConfig,
): Promise<boolean> {
  const response = await axiosInstance.post(url, payload);
  return handleCrudResponse(response, config);
}

export type ListPageParams = Readonly<{
  page: number;
  perPage: number;
  search: string;
}>;

/**
 * Generic `fetchTicketXxxListPage` body. Calls the resource's `Listxxx` helper
 * and unwraps the `{ data, total }` envelope.
 *
 * `passSearchInFilters=true` mirrors the ticket-statuses / ticket-modules
 * convention of passing `filters: { search }`. Ticket types historically pass
 * `filters: {}`, so the default is `false`.
 */
export async function fetchTicketResourcePage<T>(
  list: (params: PaginationParams) => Promise<unknown>,
  args: ListPageParams,
  options: Readonly<{ passSearchInFilters?: boolean }> = {},
): Promise<{ data: T[]; total: number }> {
  const response = await list({
    page: args.page,
    perPage: args.perPage,
    search: args.search,
    filters: options.passSearchInFilters ? { search: args.search } : {},
  });
  return {
    data: ((response as { data?: unknown[] })?.data ?? []) as T[],
    total: (response as { total?: number })?.total ?? 0,
  };
}

/**
 * Like {@link postWriteRequest} but also catches transport failures, logs them
 * with an entity prefix, and rethrows — matching the legacy `CreateXxx`
 * behavior across the ticket utils.
 */
export async function postCreateRequest(
  url: string,
  payload: Record<string, unknown>,
  config: Readonly<{
    /** Entity noun used in the `console.error` prefix on failure ("status", "module", …). */
    entity: string;
    successMessage: string;
    failureMessage: string;
  }>,
): Promise<boolean> {
  try {
    return await postWriteRequest(url, payload, {
      successMessage: config.successMessage,
      failureMessage: config.failureMessage,
      requireDataSuccess: true,
    });
  } catch (error) {
    console.error(`Error creating ${config.entity}:`, error);
    throw error;
  }
}
