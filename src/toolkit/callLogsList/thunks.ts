import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { DownloadCallsExport, ListCallLogs } from "@utils/calls";
import {
  formatDateTimeFilterForApi,
  shouldSkipCommunicationsListFetch,
} from "@utils/communicationsDateUtils";
import { ModuleSlug, getAutoTimezone } from "@utils/Helper";
import { isExactPhoneMatch, normalizePhoneValue } from "@utils/phoneMatch";
import {
  extractCallLogRows,
  normalizeCallLogRow,
} from "@components/communications/callLogRowUtils";
import type { CallLogRow, CallLogsSummary } from "@components/communications/callLogTypes";
import type { RootState } from "../index";
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
  const formattedFilters: Record<string, unknown> = { ...filters };

  const normalizedPhoneNumber = normalizePhoneValue(
    formattedFilters.phone_number as string | undefined,
  );
  formattedFilters.phone_number = normalizedPhoneNumber;
  if (normalizedPhoneNumber) {
    formattedFilters.phone_number_exact = normalizedPhoneNumber;
  } else {
    delete formattedFilters.phone_number_exact;
  }

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

  delete formattedFilters.timezone;

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
      const response = await ListCallLogs(
        {
          page,
          perPage,
          search,
          filters: appliedFilters,
          moduleSlug: ModuleSlug.CALL_LOGS,
        },
        "call-logs/list",
      );

      let rowsArray: CallLogRow[] = extractCallLogRows(response).map((r) =>
        normalizeCallLogRow(r as CallLogRow & Record<string, unknown>),
      );

      const exactPhoneFilter = normalizePhoneValue(
        appliedFilters.phone_number as string | undefined,
      );
      if (exactPhoneFilter) {
        rowsArray = rowsArray.filter((row) =>
          isExactPhoneMatch(row.phone_number, exactPhoneFilter),
        );
      }

      const rawData = response?.data as Record<string, unknown> | undefined;
      const paginationData =
        (rawData?.pagination as Record<string, unknown> | undefined) ??
        (response?.pagination as Record<string, unknown> | undefined) ??
        response;
      const total =
        (response as { recordsTotal?: number }).recordsTotal ??
        (response as { total?: number }).total ??
        (rawData?.recordsTotal as number | undefined) ??
        (rawData?.total as number | undefined) ??
        (paginationData as { total?: number })?.total ??
        Math.max(rowsArray.length, 0);
      const currentPage =
        (response as { current_page?: number }).current_page ??
        (paginationData as { current_page?: number })?.current_page ??
        page;
      const perPageVal =
        (response as { per_page?: number }).per_page ??
        (paginationData as { per_page?: number })?.per_page ??
        perPage;

      const selectedExtensionFilter = Array.isArray(
        appliedFilters.extension_number,
      )
        ? (appliedFilters.extension_number as string[])
        : [];

      const respSummary = (response as { summary?: CallLogsSummary }).summary;
      const dataFilters = (response as { filters?: { start_datetime?: string; end_datetime?: string } })
        .filters;

      dispatch(
        hydrateCallLogsFetchResult({
          rows: rowsArray,
          currentPage,
          rowsPerPage: perPageVal,
          totalRows: Number(total) || 0,
          totalCalls: Number(total) || 0,
          responseSummary: respSummary,
          dataFilters,
          selectedExtensionFilter,
        }),
      );
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
