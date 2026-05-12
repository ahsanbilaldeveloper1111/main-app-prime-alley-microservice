import { createAsyncThunk } from "@reduxjs/toolkit";
import NProgress from "nprogress";
import { ListCallLogs } from "@utils/calls";
import { ModuleSlug } from "@utils/Helper";
import type { RootState } from "../index";
import type { TrendByCountry } from "@components/communications/types";
import {
  applyGeneralStatsApiSuccess,
  setCurrentFilters,
  setExtensionData,
  setLoading,
  setShowPageLoader,
  setTrendByCountryData,
} from "./slice";
import type { CallDashboardFilters } from "./dateRange";
import { formatDateRangeToUtc } from "./dateRange";

const listPage = 1;
const listPerPage = 5;

export const fetchGeneralStatsThunk = createAsyncThunk<
  void,
  CallDashboardFilters | undefined,
  { state: RootState }
>("callDashboard/fetchGeneralStats", async (overrideFilters, { dispatch, getState }) => {
  const filtersToUse =
    overrideFilters ?? getState().callDashboard.currentFilters;
  dispatch(setShowPageLoader(true));
  try {
    const response = await ListCallLogs(
      {
        page: listPage,
        perPage: listPerPage,
        search: "",
        filters: filtersToUse,
        reportType: "statsDashboard",
        moduleSlug: ModuleSlug.CALL_LOGS,
      },
      "call-logs/generalStats",
    );

    if (response.success && response.data) {
      dispatch(applyGeneralStatsApiSuccess(response.data));
    }
  } finally {
    dispatch(setShowPageLoader(false));
  }
});

export const fetchExtensionStatsThunk = createAsyncThunk<
  void,
  CallDashboardFilters | undefined,
  { state: RootState }
>("callDashboard/fetchExtensionStats", async (overrideFilters, { dispatch, getState }) => {
  const filtersToUse =
    overrideFilters ?? getState().callDashboard.currentFilters;
  const response = await ListCallLogs(
    {
      page: listPage,
      perPage: listPerPage,
      search: "",
      filters: filtersToUse,
      reportType: "statsExtension",
      moduleSlug: ModuleSlug.CALL_LOGS,
    },
    "call-logs/statsByExtension",
  );
  if (response?.dataList?.length > 0) {
    dispatch(
      setExtensionData(response.dataList as Record<string, unknown>[]),
    );
  } else {
    dispatch(setExtensionData([]));
  }
});

export const fetchTrendByCountryThunk = createAsyncThunk<
  void,
  CallDashboardFilters | undefined,
  { state: RootState }
>("callDashboard/fetchTrendByCountry", async (overrideFilters, { dispatch, getState }) => {
  const filtersToUse =
    overrideFilters ?? getState().callDashboard.currentFilters;
  const response = await ListCallLogs(
    {
      page: listPage,
      perPage: listPerPage,
      search: "",
      filters: filtersToUse,
      reportType: "statsCountry",
      moduleSlug: ModuleSlug.CALL_LOGS,
    },
    "call-logs/statsByCountry",
  );
  if (response?.dataList?.length > 0) {
    dispatch(setTrendByCountryData(response.dataList as TrendByCountry[]));
  } else {
    dispatch(setTrendByCountryData([]));
  }
});

export const refreshCallDashboardThunk = createAsyncThunk<
  void,
  CallDashboardFilters | undefined,
  { state: RootState }
>("callDashboard/refresh", async (overrideFilters, { dispatch }) => {
  dispatch(setLoading(true));
  NProgress.start();
  try {
    await Promise.all([
      dispatch(fetchGeneralStatsThunk(overrideFilters)).unwrap(),
      dispatch(fetchExtensionStatsThunk(overrideFilters)).unwrap(),
      dispatch(fetchTrendByCountryThunk(overrideFilters)).unwrap(),
    ]);
    if (overrideFilters) {
      dispatch(setCurrentFilters(overrideFilters));
    }
  } finally {
    dispatch(setLoading(false));
    NProgress.done();
  }
});

export const loadCallDashboardInitialThunk = createAsyncThunk<
  void,
  void,
  { state: RootState }
>("callDashboard/loadInitial", async (_, { dispatch }) => {
  await Promise.all([
    dispatch(fetchGeneralStatsThunk(undefined)).unwrap(),
    dispatch(fetchExtensionStatsThunk(undefined)).unwrap(),
    dispatch(fetchTrendByCountryThunk(undefined)).unwrap(),
  ]);
});

export const applyCallDashboardDateRangeThunk = createAsyncThunk<
  void,
  void,
  { state: RootState }
>("callDashboard/applyDateRange", async (_, { dispatch, getState }) => {
  const { pendingDateStart, pendingDateEnd } = getState().callDashboard;
  const formatted = formatDateRangeToUtc(pendingDateStart, pendingDateEnd);
  await dispatch(refreshCallDashboardThunk(formatted)).unwrap();
});
