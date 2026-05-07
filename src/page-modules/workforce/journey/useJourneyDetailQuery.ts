import { useQuery } from "@tanstack/react-query";
import { workforceKeys } from "../../../query/keys";
import { getJourney } from "@utils/staffManagement";
import { readJourneyStartDateFromPayload, type JourneyStepRecord } from "./journeyDomain";

export interface JourneyDetailSelection {
  steps: JourneyStepRecord[];
  startDateIso: string | null;
}

export function parseJourneyDetail(raw: unknown): JourneyDetailSelection {
  const rawSteps = raw != null && typeof raw === "object" ? (raw as { steps?: unknown }).steps : undefined;
  const steps = Array.isArray(rawSteps) ? (rawSteps as JourneyStepRecord[]) : [];
  const startDateIso = readJourneyStartDateFromPayload(raw);
  return { steps, startDateIso };
}

export function useJourneyDetailQuery(journeyId: number, enabled: boolean) {
  return useQuery({
    queryKey: workforceKeys.journey.detail(journeyId),
    queryFn: async () => getJourney(journeyId),
    enabled: enabled && Number.isInteger(journeyId) && journeyId > 0,
    select: (raw: unknown) => parseJourneyDetail(raw),
  });
}
