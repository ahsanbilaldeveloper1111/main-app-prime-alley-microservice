import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getDefaultCommunicationsDateFilterPair } from "@utils/communicationsDateUtils";
import type { CallLogRow, CallLogsSummary } from "@components/communications/callLogTypes";

export interface CallLogsTablePaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  pageSizeOptions: number[];
}

const defaultPair = getDefaultCommunicationsDateFilterPair(
  "start_datetime",
  "end_datetime",
);

export interface CallLogsListState {
  showPageLoader: boolean;
  isExporting: boolean;
  showDateRange: boolean;
  startDateTime: string;
  endDateTime: string;
  callLogData: CallLogRow[];
  tablePagination: CallLogsTablePaginationState;
  refreshKey: number;
  currentFilters: Record<string, unknown>;
  appliedFilters: Record<string, unknown>;
  defaultFiltersCurrent: Record<string, string>;
  searchValue: string;
  summary: CallLogsSummary;
  totalCalls: number;
  tableLoading: boolean;
}

const initialState: CallLogsListState = {
  showPageLoader: false,
  isExporting: false,
  showDateRange: false,
  startDateTime: "",
  endDateTime: "",
  callLogData: [],
  tablePagination: {
    currentPage: 1,
    rowsPerPage: 15,
    totalRows: 0,
    pageSizeOptions: [10, 15, 25, 50, 100],
  },
  refreshKey: 0,
  currentFilters: { ...defaultPair.current },
  appliedFilters: { ...defaultPair.applied },
  defaultFiltersCurrent: { ...defaultPair.current },
  searchValue: "",
  summary: {
    users: 0,
    totalCalls: 0,
    extensions: 0,
    inbound: 0,
    outbound: 0,
  },
  totalCalls: 0,
  tableLoading: false,
};

const callLogsListSlice = createSlice({
  name: "callLogsList",
  initialState,
  reducers: {
    setShowPageLoader(state, action: PayloadAction<boolean>) {
      state.showPageLoader = action.payload;
    },
    setIsExporting(state, action: PayloadAction<boolean>) {
      state.isExporting = action.payload;
    },
    setSearchValue(state, action: PayloadAction<string>) {
      state.searchValue = action.payload;
    },
    setCallLogsCurrentFilters(state, action: PayloadAction<Record<string, unknown>>) {
      state.currentFilters = action.payload;
    },
    applyCommittedCallLogsFilters(
      state,
      action: PayloadAction<{
        raw: Record<string, unknown>;
        formatted: Record<string, unknown>;
      }>,
    ) {
      state.currentFilters = action.payload.raw;
      state.appliedFilters = action.payload.formatted;
      state.refreshKey += 1;
      state.tablePagination.currentPage = 1;
    },
    setTablePagination(state, action: PayloadAction<CallLogsTablePaginationState>) {
      state.tablePagination = action.payload;
    },
    hydrateCallLogsFetchResult(
      state,
      action: PayloadAction<{
        rows: CallLogRow[];
        currentPage: number;
        rowsPerPage: number;
        totalRows: number;
        totalCalls: number;
        responseSummary?: CallLogsSummary & Record<string, unknown>;
        dataFilters?: { start_datetime?: string; end_datetime?: string };
        selectedExtensionFilter: string[];
      }>,
    ) {
      const {
        rows,
        currentPage,
        rowsPerPage,
        totalRows,
        totalCalls,
        responseSummary,
        dataFilters,
        selectedExtensionFilter,
      } = action.payload;

      state.callLogData = rows;
      state.tablePagination = {
        ...state.tablePagination,
        currentPage,
        rowsPerPage,
        totalRows,
      };
      state.totalCalls = totalCalls;

      if (
        responseSummary &&
        dataFilters?.start_datetime &&
        dataFilters?.end_datetime
      ) {
        state.showDateRange = true;
        state.startDateTime = dataFilters.start_datetime;
        state.endDateTime = dataFilters.end_datetime;
        let extensionsMetric = responseSummary.extensions;
        if (rows.length === 0) {
          extensionsMetric = 0;
        } else if (selectedExtensionFilter.length > 0) {
          extensionsMetric = selectedExtensionFilter.length;
        }
        state.summary = {
          ...responseSummary,
          extensions: extensionsMetric,
        } as CallLogsSummary;
      }
    },
    setTableLoading(state, action: PayloadAction<boolean>) {
      state.tableLoading = action.payload;
    },
  },
});

export const {
  setShowPageLoader,
  setIsExporting,
  setSearchValue,
  setCallLogsCurrentFilters,
  applyCommittedCallLogsFilters,
  setTablePagination,
  hydrateCallLogsFetchResult,
  setTableLoading,
} = callLogsListSlice.actions;

export default callLogsListSlice.reducer;
