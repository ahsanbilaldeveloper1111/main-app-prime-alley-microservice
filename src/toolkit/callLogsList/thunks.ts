import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { DownloadCallsExport } from "@utils/calls";
import {
  formatDateTimeFilterForApi,
  shouldSkipCommunicationsListFetch,
} from "@utils/communicationsDateUtils";
import { getAutoTimezone } from "@utils/Helper";
import { formatCallLogsFiltersForApi as formatCallLogsFiltersBase } from "@utils/communications/communicationsAppliedFiltersFormat";
import type { RootState } from "../index";
import { fetchCallLogsListPayload } from "./fetchCallLogsListPayload";
import {
  applyCommittedCallLogsFilters,
  hydrateCallLogsFetchResult,
  setIsExporting,
  setShowPageLoader,
  setTableLoading,
} from "./slice";

let fetchIsFetching = false;
let lastFetchParamsKey = "";
let lastFetchTime = 0;

function formatCallLogsFiltersForApi(
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const formattedFilters = formatCallLogsFiltersBase(filters);

  if (formattedFilters.start_datetime != null) {
    formattedFilters.start_datetime = formatDateTimeFilterForApi(
      String(formattedFilters.start_datetime as string),
      false,
    );
  }

  if (formattedFilters.end_datetime != null) {
    formattedFilters.end_datetime = formatDateTimeFilterForApi(
      String(formattedFilters.end_datetime as string),
      true,
    );
  }

  return formattedFilters;
}

export const commitCallLogsFiltersThunk = createAsyncThunk<
  void,
  Record<string, unknown>,
  { state: RootState }
>("callLogsList/commitFilters", async (filters, { dispatch }) => {
  const formatted = formatCallLogsFiltersForApi(filters);
  dispatch(
    applyCommittedCallLogsFilters({
      raw: filters,
      formatted,
    }),
  );
});

export const resetCallLogsFiltersThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("callLogsList/resetFilters", async (_, { dispatch, getState }) => {
  const raw = getState().callLogsList.defaultFiltersCurrent as Record<
    string,
    unknown
  >;
  await dispatch(commitCallLogsFiltersThunk(raw));
});

export const fetchCallLogsThunk = createAsyncThunk<
  void,
  { page: number; perPage: number; search: string },
  { state: RootState }
>(
  "callLogsList/fetch",
  async ({ page, perPage, search }, { dispatch, getState }) => {
    const appliedFilters = getState().callLogsList.appliedFilters;
    const paramsKey = `${page}-${perPage}-${search}-${JSON.stringify(appliedFilters)}`;
    const now = Date.now();

    if (
      shouldSkipCommunicationsListFetch(
        fetchIsFetching,
        paramsKey,
        lastFetchParamsKey,
        lastFetchTime,
        now,
      )
    ) {
      return;
    }

    fetchIsFetching = true;
    lastFetchTime = now;
    lastFetchParamsKey = paramsKey;

    dispatch(setShowPageLoader(true));
    dispatch(setTableLoading(true));
    try {
      const hydratePayload = await fetchCallLogsListPayload({
        page,
        perPage,
        search,
        appliedFilters,
      });

      dispatch(hydrateCallLogsFetchResult(hydratePayload));
    } finally {
      dispatch(setShowPageLoader(false));
      dispatch(setTableLoading(false));
      fetchIsFetching = false;
    }
  },
);

export const runCallLogsFetchForCurrentRefreshKeyThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("callLogsList/fetchForRefreshKey", async (_, { dispatch, getState }) => {
  const { tablePagination, searchValue } = getState().callLogsList;
  await dispatch(
    fetchCallLogsThunk({
      page: tablePagination.currentPage,
      perPage: tablePagination.rowsPerPage,
      search: searchValue.trim(),
    }),
  );
});

export const exportCallLogsThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("callLogsList/export", async (_, { getState, dispatch }) => {
  if (getState().callLogsList.isExporting) return;
  dispatch(setIsExporting(true));
  try {
    const { appliedFilters } = getState().callLogsList;
    const exportPayload = {
      ...appliedFilters,
      timezone: getAutoTimezone(),
    };
    await DownloadCallsExport(
      exportPayload,
      "call-logs/analytics/download",
    );
  } catch (error) {
    console.error("Export error:", error);
    toast.error("Export failed");
  } finally {
    dispatch(setIsExporting(false));
  }
});
