import { useQuery, type QueryKey } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getErrorMessage } from "@utils/errors";

export type PaginatedListArgs = Readonly<{
  page: number;
  perPage: number;
  search: string;
}>;

export type ListPayload<T = unknown> = { data: T[]; total: number };

const EMPTY_PAYLOAD: ListPayload<never> = { data: [], total: 0 };

export function emptyListPayload<T = unknown>(): ListPayload<T> {
  return EMPTY_PAYLOAD as ListPayload<T>;
}

/**
 * Normalize a raw list response into `{ data, total }`.
 *
 * `fallbackToRoot=true` treats the whole response as `data` when no `.data`
 * field is present (used by the FAQ items endpoint, which historically returns
 * either `{ data, total }` or a bare array).
 */
export function normalizeListResponse<T = unknown>(
  response: unknown,
  options: Readonly<{ fallbackToRoot?: boolean }> = {},
): ListPayload<T> {
  if (!response) return emptyListPayload<T>();

  const responseAsObject = response as { data?: unknown; total?: number };

  let resolvedData: unknown = responseAsObject.data;
  if (resolvedData === undefined && options.fallbackToRoot) {
    resolvedData = response;
  }

  const dataArray = Array.isArray(resolvedData) ? (resolvedData as T[]) : [];
  const total =
    responseAsObject.total ??
    (options.fallbackToRoot ? dataArray.length : 0);

  return { data: dataArray, total };
}

export type UsePaginatedListQueryOptions<T> = Readonly<{
  args: PaginatedListArgs;
  queryKey: QueryKey;
  fetchPage: (args: PaginatedListArgs) => Promise<ListPayload<T>>;
  /** Human-readable noun used in the toast message ("FAQ modules", "ticket statuses", ...). */
  errorLabel: string;
  /** Stable `toastId` so the same failure does not stack up. */
  toastId: string;
}>;

/**
 * Generic TanStack hook for the paginated list pattern used across modules:
 * fetch a page, on failure show one toast and fall back to an empty payload.
 *
 * Eliminates ~20 lines of duplicated boilerplate per list resource.
 */
export function usePaginatedListQuery<T = unknown>(
  options: UsePaginatedListQueryOptions<T>,
) {
  const { queryKey, fetchPage, args, errorLabel, toastId } = options;
  return useQuery({
    queryKey,
    queryFn: async (): Promise<ListPayload<T>> => {
      try {
        return await fetchPage(args);
      } catch (error) {
        toast.error(`Failed to load ${errorLabel}: ${getErrorMessage(error)}`, {
          toastId,
        });
        return emptyListPayload<T>();
      }
    },
  });
}
