import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getDefaultCallAnalysisFilters } from "./defaults";

export interface CallAnalysisTranscriptionSummary {
  total_transcriptions: number;
  incomplete_transcriptions: number;
  in_progress_transcriptions: number;
  analyzing_transcriptions: number;
  analyzed_transcriptions: number;
  transribing_transcriptions: number;
  transcribed_transcriptions: number;
  completed_transcriptions: number;
  failed_transcriptions: number;
  queued_transcriptions: number;
  reanalysis_calls: number;
}

export interface CallAnalysisPagination {
  totalRows: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

const initialSummary: CallAnalysisTranscriptionSummary = {
  total_transcriptions: 0,
  incomplete_transcriptions: 0,
  in_progress_transcriptions: 0,
  analyzing_transcriptions: 0,
  reanalysis_calls: 0,
  analyzed_transcriptions: 0,
  transribing_transcriptions: 0,
  transcribed_transcriptions: 0,
  completed_transcriptions: 0,
  failed_transcriptions: 0,
  queued_transcriptions: 0,
};

const initialPagination: CallAnalysisPagination = {
  totalRows: 0,
  totalPages: 0,
  currentPage: 1,
  perPage: 15,
};

const defaultFilters = getDefaultCallAnalysisFilters();

export interface CallAnalysisListState {
  showPageLoader: boolean;
  refreshKey: number;
  filters: Record<string, unknown>;
  searchValue: string;
  tableData: Record<string, unknown>[];
  tableLoading: boolean;
  pagination: CallAnalysisPagination;
  summary: CallAnalysisTranscriptionSummary;
}

const initialState: CallAnalysisListState = {
  showPageLoader: false,
  refreshKey: 0,
  filters: { ...defaultFilters },
  searchValue: "",
  tableData: [],
  tableLoading: false,
  pagination: initialPagination,
  summary: { ...initialSummary },
};

/** Fallback if the slice is missing from state (stale client or bad hydration). */
export const callAnalysisListInitialState = initialState;

const callAnalysisListSlice = createSlice({
  name: "callAnalysisList",
  initialState,
  reducers: {
    setShowPageLoader(state, action: PayloadAction<boolean>) {
      state.showPageLoader = action.payload;
    },
    setSearchValue(state, action: PayloadAction<string>) {
      state.searchValue = action.payload;
    },
    applyCallAnalysisFilters(
      state,
      action: PayloadAction<Record<string, unknown>>,
    ) {
      state.filters = action.payload;
      state.refreshKey += 1;
      state.pagination.currentPage = 1;
    },
    setCallAnalysisPagination(
      state,
      action: PayloadAction<CallAnalysisPagination>,
    ) {
      state.pagination = action.payload;
    },
    hydrateCallAnalysisFetchResult(
      state,
      action: PayloadAction<{
        tableData: Record<string, unknown>[];
        pagination: CallAnalysisPagination;
        summary?: CallAnalysisTranscriptionSummary;
      }>,
    ) {
      state.tableData = action.payload.tableData;
      state.pagination = action.payload.pagination;
      if (action.payload.summary) {
        state.summary = action.payload.summary;
      }
    },
    setTableLoading(state, action: PayloadAction<boolean>) {
      state.tableLoading = action.payload;
    },
  },
});

export const {
  setShowPageLoader,
  setSearchValue,
  applyCallAnalysisFilters,
  setCallAnalysisPagination,
  hydrateCallAnalysisFetchResult,
  setTableLoading,
} = callAnalysisListSlice.actions;

export default callAnalysisListSlice.reducer;
