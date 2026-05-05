import { createAsyncThunk } from "@reduxjs/toolkit";
import { ListCallLogs, ExportCallRecordings } from "@utils/calls";
import { ModuleSlug } from "@utils/Helper";
import { isExactPhoneMatch, normalizePhoneValue } from "@utils/phoneMatch";
import { shouldSkipCommunicationsListFetch } from "@utils/communicationsDateUtils";
import type { RootState } from "../index";
import type { CallRecordingsSummary } from "./slice";
import {
  applyCommittedCallRecordingsFilters,
  clearCallRecordingsCharts,
  hydrateCallRecordingsFetchResult,
  setShowPageLoader,
  setTableLoading,
} from "./slice";
import { formatCallRecordingsFiltersForApi } from "./formatFilters";
import {
  buildDirectionChartModel,
  buildDurationChartFromExtension,
} from "./chartBuilders";

let fetchIsFetching = false;
let lastFetchParamsKey = "";
let lastFetchTime = 0;

function getRowsArray(response: unknown): Record<string, unknown>[] {
  const r = response as Record<string, unknown> | undefined;
  const rawData = r?.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray(rawData)) return rawData as Record<string, unknown>[];
  if (
    rawData &&
    typeof rawData === "object" &&
    Array.isArray((rawData as { data?: unknown[] }).data)
  ) {
    return (rawData as { data: Record<string, unknown>[] }).data;
  }
  if (Array.isArray(r?.dataList)) {
    return r.dataList as Record<string, unknown>[];
  }
  return [];
}

function buildPaginationFromResponse(
  response: unknown,
  rowsArray: unknown[],
  page: number,
  perPage: number,
) {
  const r = response as Record<string, unknown>;
  const rawData = r?.data as Record<string, unknown> | undefined;
  const paginationData =
    (rawData?.pagination as Record<string, unknown> | undefined) ??
    (r?.pagination as Record<string, unknown> | undefined) ??
    r;
  const total =
    (r.recordsTotal as number | undefined) ??
    (r.total as number | undefined) ??
    (rawData?.recordsTotal as number | undefined) ??
    (rawData?.total as number | undefined) ??
    (paginationData as { total?: number })?.total ??
    rowsArray.length;

  const currentPage =
    (r.current_page as number | undefined) ??
    (paginationData as { current_page?: number })?.current_page ??
    page;
  const perPageVal =
    (r.per_page as number | undefined) ??
    (paginationData as { per_page?: number })?.per_page ??
    perPage;

  const totalNum = Number(total) || 0;
  const lastPage =
    (paginationData as { last_page?: number })?.last_page ??
    (r.last_page as number | undefined) ??
    Math.max(1, Math.ceil(totalNum / perPageVal));

  return {
    totalRows: totalNum,
    totalPages: Number(lastPage) || 1,
    currentPage,
    perPage: perPageVal,
  };
}

export const commitCallRecordingsFiltersThunk = createAsyncThunk<
  void,
  Record<string, unknown>,
  { state: RootState }
>("callRecordingsList/commitFilters", async (filters, { dispatch }) => {
  const { applied, normalizedRemotePartyNumber } =
    formatCallRecordingsFiltersForApi(filters);

  const raw: Record<string, unknown> = {
    ...filters,
    remote_party_number: normalizedRemotePartyNumber,
  };
  dispatch(applyCommittedCallRecordingsFilters({ raw, formatted: applied }));

  if (!filters || Object.keys(filters).length === 0) {
    dispatch(clearCallRecordingsCharts());
  }
});

export const resetCallRecordingsFiltersThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("callRecordingsList/resetFilters", async (_, { dispatch, getState }) => {
  const raw = getState().callRecordingsList.defaultFiltersCurrent as Record<
    string,
    unknown
  >;
  await dispatch(commitCallRecordingsFiltersThunk(raw));
});

export const fetchCallRecordingsThunk = createAsyncThunk<
  void,
  { page: number; perPage: number; search: string },
  { state: RootState }
>(
  "callRecordingsList/fetch",
  async ({ page, perPage, search }, { dispatch, getState }) => {
    const appliedFilters = getState().callRecordingsList.appliedFilters;
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
          reportType: "recordings",
          moduleSlug: ModuleSlug.CALL_RECORDINGS,
        },
        "call-logs/recordings",
      );

      const resp = response as Record<string, unknown>;
      const summary = resp.summary as CallRecordingsSummary | undefined;
      const dataFilters = resp.filters as
        | { start_date?: string; end_date?: string }
        | undefined;

      let rowsArray = getRowsArray(response);

      const rawRemoteFilter = appliedFilters.remote_party_number;
      const exactRemoteFilter = Array.isArray(rawRemoteFilter)
        ? normalizePhoneValue(String(rawRemoteFilter[0]))
        : normalizePhoneValue(rawRemoteFilter as string | undefined);
      if (exactRemoteFilter) {
        rowsArray = rowsArray.filter((row) =>
          isExactPhoneMatch(
            row.RemotePartyNumber as string | undefined,
            exactRemoteFilter,
          ),
        );
      }

      const pagination = buildPaginationFromResponse(
        response,
        rowsArray,
        page,
        perPage,
      );

      const chart = resp.chart as
        | { extension?: unknown[]; date?: unknown[] }
        | undefined;

      const durationChart = buildDurationChartFromExtension(
        chart?.extension ?? [],
      );
      const directionChart = buildDirectionChartModel(chart?.date ?? []);

      dispatch(
        hydrateCallRecordingsFetchResult({
          tableData: rowsArray,
          summary,
          dataFilters,
          pagination,
          durationChart,
          directionChart,
          chartLoading: false,
        }),
      );
    } finally {
      dispatch(setShowPageLoader(false));
      dispatch(setTableLoading(false));
      fetchIsFetching = false;
    }
  },
);

export const runCallRecordingsFetchForRefreshKeyThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("callRecordingsList/fetchForRefreshKey", async (_, { dispatch, getState }) => {
  const { pagination, searchValue } = getState().callRecordingsList;
  await dispatch(
    fetchCallRecordingsThunk({
      page: pagination.currentPage,
      perPage: pagination.perPage,
      search: searchValue.trim(),
    }),
  );
});

export const exportCallRecordingsExcelThunk = createAsyncThunk<
  void,
  undefined,
  { state: RootState }
>("callRecordingsList/exportExcel", async (_, { dispatch, getState }) => {
  dispatch(setShowPageLoader(true));
  try {
    const filters = getState().callRecordingsList.appliedFilters;
    await ExportCallRecordings(filters);
  } catch (error) {
    console.error("Export failed:", error);
  } finally {
    dispatch(setShowPageLoader(false));
  }
});
