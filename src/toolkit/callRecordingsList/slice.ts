import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getDefaultCommunicationsDateFilterPair } from "@utils/communicationsDateUtils";
import type {
  DurationChartModel,
  DirectionChartModel,
} from "./chartBuilders";

export interface CallRecordingsSummary {
  numbers: number;
  extensions: number;
  inbound: number;
  outbound: number;
}

export interface CallRecordingsPagination {
  totalRows: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

const defaultPair = getDefaultCommunicationsDateFilterPair(
  "start_date",
  "end_date",
);

export interface CallRecordingsListState {
  showPageLoader: boolean;
  refreshKey: number;
  currentFilters: Record<string, unknown>;
  appliedFilters: Record<string, unknown>;
  defaultFiltersCurrent: Record<string, string>;
  searchValue: string;
  startDateTime: string;
  endDateTime: string;
  tableData: Record<string, unknown>[];
  tableLoading: boolean;
  pagination: CallRecordingsPagination;
  summary: CallRecordingsSummary;
  durationChart: DurationChartModel | null;
  directionChart: DirectionChartModel | null;
  chartLoading: boolean;
  callDurationBarChartModal: boolean;
  currentChartTitle: string;
}

const initialPagination: CallRecordingsPagination = {
  totalRows: 0,
  totalPages: 0,
  currentPage: 1,
  perPage: 15,
};

const initialState: CallRecordingsListState = {
  showPageLoader: false,
  refreshKey: 0,
  currentFilters: { ...defaultPair.current },
  appliedFilters: { ...defaultPair.applied },
  defaultFiltersCurrent: { ...defaultPair.current },
  searchValue: "",
  startDateTime: "",
  endDateTime: "",
  tableData: [],
  tableLoading: false,
  pagination: initialPagination,
  summary: {
    numbers: 0,
    extensions: 0,
    inbound: 0,
    outbound: 0,
  },
  durationChart: null,
  directionChart: null,
  chartLoading: true,
  callDurationBarChartModal: false,
  currentChartTitle: "",
};

const callRecordingsListSlice = createSlice({
  name: "callRecordingsList",
  initialState,
  reducers: {
    setShowPageLoader(state, action: PayloadAction<boolean>) {
      state.showPageLoader = action.payload;
    },
    setSearchValue(state, action: PayloadAction<string>) {
      state.searchValue = action.payload;
    },
    setCallRecordingsCurrentFilters(
      state,
      action: PayloadAction<Record<string, unknown>>,
    ) {
      state.currentFilters = action.payload;
    },
    applyCommittedCallRecordingsFilters(
      state,
      action: PayloadAction<{
        raw: Record<string, unknown>;
        formatted: Record<string, unknown>;
      }>,
    ) {
      state.currentFilters = action.payload.raw;
      state.appliedFilters = action.payload.formatted;
      state.refreshKey += 1;
      state.pagination.currentPage = 1;
    },
    setCallRecordingsPagination(
      state,
      action: PayloadAction<CallRecordingsPagination>,
    ) {
      state.pagination = action.payload;
    },
    setCallDurationBarChartModal(state, action: PayloadAction<boolean>) {
      state.callDurationBarChartModal = action.payload;
    },
    setCurrentChartTitle(state, action: PayloadAction<string>) {
      state.currentChartTitle = action.payload;
    },
    clearCallRecordingsCharts(state) {
      state.durationChart = null;
      state.directionChart = null;
      state.chartLoading = false;
    },
    hydrateCallRecordingsFetchResult(
      state,
      action: PayloadAction<{
        tableData: Record<string, unknown>[];
        summary?: CallRecordingsSummary;
        dataFilters?: { start_date?: string; end_date?: string };
        pagination: CallRecordingsPagination;
        durationChart: DurationChartModel | null;
        directionChart: DirectionChartModel | null;
        chartLoading: boolean;
      }>,
    ) {
      const {
        tableData,
        summary,
        dataFilters,
        pagination,
        durationChart,
        directionChart,
        chartLoading,
      } = action.payload;

      state.tableData = tableData;
      state.pagination = pagination;
      if (summary) {
        state.summary = summary;
      }
      if (dataFilters?.start_date) {
        state.startDateTime = dataFilters.start_date;
      }
      if (dataFilters?.end_date) {
        state.endDateTime = dataFilters.end_date;
      }
      state.durationChart = durationChart;
      state.directionChart = directionChart;
      state.chartLoading = chartLoading;
    },
    setTableLoading(state, action: PayloadAction<boolean>) {
      state.tableLoading = action.payload;
    },
  },
});

export const {
  setShowPageLoader,
  setSearchValue,
  setCallRecordingsCurrentFilters,
  applyCommittedCallRecordingsFilters,
  setCallRecordingsPagination,
  setCallDurationBarChartModal,
  setCurrentChartTitle,
  clearCallRecordingsCharts,
  hydrateCallRecordingsFetchResult,
  setTableLoading,
} = callRecordingsListSlice.actions;

export default callRecordingsListSlice.reducer;
