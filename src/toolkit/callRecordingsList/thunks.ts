import { createAsyncThunk } from "@reduxjs/toolkit";
import { ExportCallRecordings } from "@utils/calls";
import type { RootState } from "../index";
import {
  applyCommittedCallRecordingsFilters,
  clearCallRecordingsCharts,
  setShowPageLoader,
} from "./slice";
import { formatCallRecordingsFiltersForApi } from "./formatFilters";

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
