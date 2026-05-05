import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { GetImagicalTranscriptions } from "@utils/aiml";
import type { RootState } from "../index";
import type { CallAnalysisTranscriptionSummary } from "./slice";
import {
  callAnalysisListInitialState,
  hydrateCallAnalysisFetchResult,
  setShowPageLoader,
  setTableLoading,
} from "./slice";
import { getDatesFromFilters } from "./formatParams";

type TranscriptionApiResponse = {
  success?: boolean;
  data?: unknown[];
  summary?: Partial<CallAnalysisTranscriptionSummary>;
  pagination?: {
    total?: number;
    last_page?: number;
    page?: number;
  };
};

const pendingByKey = new Map<string, Promise<void>>();

function buildOtherFilterParams(filters: Record<string, unknown>): Record<
  string,
  unknown
> {
  const filterParams: Record<string, unknown> = {};
  for (const key of Object.keys(filters)) {
    if (key !== "start_datetime" && key !== "end_datetime") {
      filterParams[key] = filters[key];
    }
  }
  return filterParams;
}

function summaryFromResponse(
  raw: Partial<CallAnalysisTranscriptionSummary> | undefined,
): CallAnalysisTranscriptionSummary {
  return {
    total_transcriptions: raw?.total_transcriptions ?? 0,
    incomplete_transcriptions: raw?.incomplete_transcriptions ?? 0,
    in_progress_transcriptions: raw?.in_progress_transcriptions ?? 0,
    analyzing_transcriptions: raw?.analyzing_transcriptions ?? 0,
    reanalysis_calls: raw?.reanalysis_calls ?? 0,
    analyzed_transcriptions: raw?.analyzed_transcriptions ?? 0,
    transribing_transcriptions: raw?.transribing_transcriptions ?? 0,
    transcribed_transcriptions: raw?.transcribed_transcriptions ?? 0,
    completed_transcriptions: raw?.completed_transcriptions ?? 0,
    failed_transcriptions: raw?.failed_transcriptions ?? 0,
    queued_transcriptions: raw?.queued_transcriptions ?? 0,
  };
}

export const fetchCallAnalysisListThunk = createAsyncThunk<
  void,
  { page: number; limit: number; search: string },
  { state: RootState }
>("callAnalysisList/fetch", async ({ page, limit, search }, { dispatch, getState }) => {
  const list = getState().callAnalysisList ?? callAnalysisListInitialState;
  const filters = list.filters as Record<string, unknown>;
  const { startDate, endDate } = getDatesFromFilters(filters);

  const filterParams = buildOtherFilterParams(filters);
  const requestKey = `${page}-${limit}-${search}-${startDate}-${endDate}-${JSON.stringify(
    filterParams,
  )}`;

  const existing = pendingByKey.get(requestKey);
  if (existing !== undefined) {
    await existing;
    return;
  }

  const run = (async () => {
    dispatch(setShowPageLoader(true));
    dispatch(setTableLoading(true));
    try {
      const start_datetime =
        (typeof filters.start_datetime === "string" && filters.start_datetime
          ? filters.start_datetime
          : startDate) ?? startDate;
      const end_datetime =
        (typeof filters.end_datetime === "string" && filters.end_datetime
          ? filters.end_datetime
          : endDate) ?? endDate;

      const response = (await GetImagicalTranscriptions({
        page,
        limit,
        search,
        start_datetime,
        end_datetime,
        filters: filterParams,
      })) as TranscriptionApiResponse | false;

      dispatch(setShowPageLoader(false));

      if (response && response.success === true) {
        const rows = Array.isArray(response.data) ? response.data : [];
        const pagination = {
          totalRows: response.pagination?.total ?? 0,
          totalPages: response.pagination?.last_page ?? 0,
          currentPage: response.pagination?.page ?? page,
          perPage: limit,
        };
        dispatch(
          hydrateCallAnalysisFetchResult({
            tableData: rows as Record<string, unknown>[],
            pagination,
            summary: summaryFromResponse(response.summary),
          }),
        );
      } else {
        toast.error("Failed to get transcriptions");
        dispatch(
          hydrateCallAnalysisFetchResult({
            tableData: [],
            pagination: {
              totalRows: 0,
              totalPages: 0,
              currentPage: 1,
              perPage: limit,
            },
          }),
        );
      }
    } catch (error) {
      console.error("Failed to fetch call analysis records:", error);
      toast.error("Failed to load call analysis records");
      dispatch(setShowPageLoader(false));
      dispatch(
        hydrateCallAnalysisFetchResult({
          tableData: [],
          pagination: {
            totalRows: 0,
            totalPages: 0,
            currentPage: 1,
            perPage: limit,
          },
        }),
      );
    } finally {
      dispatch(setTableLoading(false));
      pendingByKey.delete(requestKey);
    }
  })();

  pendingByKey.set(requestKey, run);
  await run;
});

export const runCallAnalysisFetchForRefreshKeyThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("callAnalysisList/fetchForRefreshKey", async (_, { dispatch, getState }) => {
  const list = getState().callAnalysisList ?? callAnalysisListInitialState;
  const { pagination, searchValue } = list;
  await dispatch(
    fetchCallAnalysisListThunk({
      page: pagination.currentPage,
      limit: pagination.perPage,
      search: searchValue.trim(),
    }),
  );
});
