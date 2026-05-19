import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "@query/keys";
import { getJourneys } from "@utils/staffManagement";
import {
  buildGetJourneysRequestParams,
  serializeJourneyListFiltersKey,
  type JourneyListAppliedFilters,
  type JourneyRecord,
  type JourneysPagination,
} from "./journeyDomain";

async function fetchJourneysListPayload(args: {
  page: number;
  limit: number;
  filters: JourneyListAppliedFilters;
}): Promise<{ data: JourneyRecord[]; pagination: JourneysPagination | null }> {
  try {
    const params = buildGetJourneysRequestParams(args.page, args.limit, args.filters);
    const res = await getJourneys(params);
    const data = Array.isArray(res?.data) ? (res.data as JourneyRecord[]) : [];
    const pagination = (res?.pagination as JourneysPagination) ?? null;
    return { data, pagination };
  } catch (e) {
    console.error("[Onboarding] fetch journeys error:", e);
    return { data: [], pagination: null };
  }
}

export function useJourneysListQuery(args: {
  enabled: boolean;
  page: number;
  limit: number;
  filters: JourneyListAppliedFilters;
}) {
  const filtersKey = serializeJourneyListFiltersKey(args.filters);
  return useQuery({
    queryKey: workforceKeys.journey.list({
      page: args.page,
      limit: args.limit,
      filtersKey,
    }),
    queryFn: () =>
      fetchJourneysListPayload({
        page: args.page,
        limit: args.limit,
        filters: args.filters,
      }),
    enabled: args.enabled,
  });
}
