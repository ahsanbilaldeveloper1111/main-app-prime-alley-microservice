import axiosInstance from "@utils/axios";
import {
  buildCdrQueryParams,
  type AppliedFilters,
  type CDRResponse,
} from "@components/compliance/cdr-records/cdrRecordsDomain";

function cdrListErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: { message?: unknown } } }).response
      ?.data?.message === "string"
  ) {
    const msg = (err as { response?: { data?: { message?: string } } }).response
      ?.data?.message;
    if (msg) return msg;
  }
  return fallback;
}

/** Fetches CDR list for TanStack Query; throws so the query enters error state. */
export async function fetchComplianceCdrList(input: {
  currentPage: number;
  recordsPerPage: number;
  appliedFilters: AppliedFilters;
}): Promise<CDRResponse> {
  try {
    const params = buildCdrQueryParams(
      input.currentPage,
      input.recordsPerPage,
      input.appliedFilters,
    );
    const response = await axiosInstance.get<CDRResponse>("/dncr/cdr/v1", {
      params,
    });

    if (response.data?.status === "success") {
      return response.data;
    }
    throw new Error("Failed to fetch CDR records");
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Failed to fetch CDR records") {
      throw err;
    }
    throw new Error(cdrListErrorMessage(err, "Failed to fetch CDR records"));
  }
}
