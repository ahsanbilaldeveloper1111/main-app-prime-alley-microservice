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
  return EMPTY_PAYLOAD;
}

type NormalizeOptions = Readonly<{ fallbackToRoot?: boolean }>;

/** Normalize a raw list response into `{ data, total }`. */
export function normalizeListResponse<T = unknown>(
  response: unknown,
  options: NormalizeOptions = {},
): ListPayload<T> {
  if (!response) return emptyListPayload<T>();
  const obj = response as { data?: unknown; total?: number };
  const resolved =
    obj.data === undefined && options.fallbackToRoot ? response : obj.data;
  const data = Array.isArray(resolved) ? (resolved as T[]) : [];
  const total = obj.total ?? (options.fallbackToRoot ? data.length : 0);
  return { data, total };
}

type RawPaginatedFetcher = (input: {
  page: number;
  perPage: number;
  search: string;
  filters: Record<string, unknown>;
}) => Promise<unknown>;

/** Build a `fetchPage` for {@link usePaginatedListQuery} from a `Listxxx` helper. */
export function makePaginatedListFetcher<T = unknown>(
  fetcher: RawPaginatedFetcher,
  options?: NormalizeOptions,
): (args: PaginatedListArgs) => Promise<ListPayload<T>> {
  return async ({ page, perPage, search }) =>
    normalizeListResponse<T>(
      await fetcher({ page, perPage, search, filters: {} }),
      options,
    );
}

/**
 * Run a `queryFn` body that, on failure, toasts a single message and falls back
 * to a typed default. Centralizes the shared error envelope used by every list
 * hook below so the boilerplate doesn't repeat per resource.
 */
const runWithToastFallback = async <T>(
  fetch: () => Promise<T>,
  fallback: T,
  errorLabel: string,
  toastId: string,
): Promise<T> => {
  try {
    return await fetch();
  } catch (error) {
    toast.error(`Failed to load ${errorLabel}: ${getErrorMessage(error)}`, {
      toastId,
    });
    return fallback;
  }
};

export type UsePaginatedListQueryOptions<T> = Readonly<{
  args: PaginatedListArgs;
  queryKey: QueryKey;
  fetchPage: (args: PaginatedListArgs) => Promise<ListPayload<T>>;
  errorLabel: string;
  toastId: string;
}>;

/** Generic TanStack hook for paginated list endpoints (`{ data, total }`). */
export function usePaginatedListQuery<T = unknown>(
  options: UsePaginatedListQueryOptions<T>,
) {
  const { queryKey, fetchPage, args, errorLabel, toastId } = options;
  return useQuery({
    queryKey,
    queryFn: () =>
      runWithToastFallback(
        () => fetchPage(args),
        emptyListPayload<T>(),
        errorLabel,
        toastId,
      ),
  });
}

export type UseArrayListQueryOptions<T> = Readonly<{
  queryKey: QueryKey;
  fetch: () => Promise<unknown>;
  /** Optional projector for non-array responses or typed mapping. */
  select?: (raw: unknown) => T[];
  errorLabel: string;
  toastId: string;
  enabled?: boolean;
  staleTime?: number;
}>;

/** Generic TanStack hook for endpoints that return a flat array. */
export function useArrayListQuery<T>(options: UseArrayListQueryOptions<T>) {
  const { queryKey, fetch, select, errorLabel, toastId, enabled, staleTime } =
    options;
  return useQuery({
    queryKey,
    enabled,
    staleTime,
    queryFn: () =>
      runWithToastFallback(
        async () => {
          const raw = await fetch();
          if (select) return select(raw);
          return Array.isArray(raw) ? (raw as T[]) : [];
        },
        [] as T[],
        errorLabel,
        toastId,
      ),
  });
}
