import { QueryClient } from "@tanstack/react-query";

/**
 * Shared defaults for the app shell (aligned with SessionProvider: no refetch on window focus).
 * See `src/query/README.md` for conventions.
 */
export const APP_QUERY_DEFAULTS = {
  queries: {
    staleTime: 60_000,
    /** Keep inactive query data longer so switching tabs/routes revisits cache instead of evicting quickly. */
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false as const,
    refetchOnReconnect: true as const,
  },
} as const;

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: APP_QUERY_DEFAULTS,
  });
}
