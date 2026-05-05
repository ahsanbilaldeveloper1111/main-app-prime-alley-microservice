import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import moment from "moment";
import type { GeneralStats, TrendByCountry } from "@components/communications/types";
import {
  getInitialCountryChart,
  getInitialDepartmentChart,
  getInitialExtensionChart,
} from "@components/communications/callDashboardChartDefaults";
import {
  getInitialCallDashboardFilters,
  type CallDashboardFilters,
} from "./dateRange";

type CountryChartModel = ReturnType<typeof getInitialCountryChart>;
type DepartmentChartModel = ReturnType<typeof getInitialDepartmentChart>;
type ExtensionChartModel = ReturnType<typeof getInitialExtensionChart>;

export interface CallDashboardState {
  showPageLoader: boolean;
  showCountryChartModal: boolean;
  showDepartmentChartModal: boolean;
  showExtensionChartModal: boolean;
  loading: boolean;
  showDateRange: boolean;
  currentFilters: CallDashboardFilters;
  generalStats: GeneralStats;
  showExtensionChart: boolean;
  showDepartmentChart: boolean;
  showCountryChart: boolean;
  countryChartData: unknown[];
  departmentChartData: unknown[];
  extensionChartData: unknown[];
  pendingDateStart: string;
  pendingDateEnd: string;
  countryChart: CountryChartModel;
  departmentChart: DepartmentChartModel;
  extensionChart: ExtensionChartModel;
  trendByCountryData: TrendByCountry[];
  extensionData: Record<string, unknown>[];
}

function pendingFromFilters(filters: CallDashboardFilters): {
  pendingDateStart: string;
  pendingDateEnd: string;
} {
  let pendingStart = "";
  let pendingEnd = "";
  if (filters.start_datetime) {
    pendingStart = moment.utc(filters.start_datetime).local().format("YYYY-MM-DD");
  }
  if (filters.end_datetime) {
    pendingEnd = moment.utc(filters.end_datetime).local().format("YYYY-MM-DD");
  }
  return { pendingDateStart: pendingStart, pendingDateEnd: pendingEnd };
}

const initialFilters = getInitialCallDashboardFilters();
const initialPending = pendingFromFilters(initialFilters);

const initialState: CallDashboardState = {
  showPageLoader: false,
  showCountryChartModal: false,
  showDepartmentChartModal: false,
  showExtensionChartModal: false,
  loading: false,
  showDateRange: false,
  currentFilters: initialFilters,
  generalStats: {
    totalCalls: 0,
    totalInbound: 0,
    totalOutbound: 0,
    totalMissedIncoming: 0,
    totalMissedOutgoing: 0,
    totalAvgRingTime: 0,
    totalAvgDuration: 0,
    totalAvgCost: 0,
  },
  showExtensionChart: true,
  showDepartmentChart: true,
  showCountryChart: true,
  countryChartData: [],
  departmentChartData: [],
  extensionChartData: [],
  pendingDateStart: initialPending.pendingDateStart,
  pendingDateEnd: initialPending.pendingDateEnd,
  countryChart: getInitialCountryChart(),
  departmentChart: getInitialDepartmentChart(),
  extensionChart: getInitialExtensionChart(),
  trendByCountryData: [],
  extensionData: [],
};

const callDashboardSlice = createSlice({
  name: "callDashboard",
  initialState,
  reducers: {
    setShowPageLoader(state, action: PayloadAction<boolean>) {
      state.showPageLoader = action.payload;
    },
    setShowCountryChartModal(state, action: PayloadAction<boolean>) {
      state.showCountryChartModal = action.payload;
    },
    setShowDepartmentChartModal(state, action: PayloadAction<boolean>) {
      state.showDepartmentChartModal = action.payload;
    },
    setShowExtensionChartModal(state, action: PayloadAction<boolean>) {
      state.showExtensionChartModal = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setShowDateRange(state, action: PayloadAction<boolean>) {
      state.showDateRange = action.payload;
    },
    setCurrentFilters(state, action: PayloadAction<CallDashboardFilters>) {
      state.currentFilters = action.payload;
      const p = pendingFromFilters(action.payload);
      state.pendingDateStart = p.pendingDateStart;
      state.pendingDateEnd = p.pendingDateEnd;
    },
    setPendingDateStart(state, action: PayloadAction<string>) {
      state.pendingDateStart = action.payload;
    },
    setPendingDateEnd(state, action: PayloadAction<string>) {
      state.pendingDateEnd = action.payload;
    },
    setExtensionData(
      state,
      action: PayloadAction<Record<string, unknown>[]>,
    ) {
      state.extensionData = action.payload;
    },
    setTrendByCountryData(state, action: PayloadAction<TrendByCountry[]>) {
      state.trendByCountryData = action.payload;
    },
    applyGeneralStatsApiSuccess(
      state,
      action: PayloadAction<{
        total_calls: number;
        inbound_calls: number;
        outbound_calls: number;
        missed_incoming_calls: number;
        missed_outgoing_calls: number;
        avg_ring_time: number;
        avg_duration: number;
        avg_cost: number;
        chart_data?: {
          extension?: { label?: string; value?: string | number }[];
          department?: { label?: string; value?: string | number }[];
          country?: { label?: string; value?: string | number }[];
        };
      }>,
    ) {
      const responseData = action.payload;
      state.showDateRange = true;

      state.generalStats = {
        totalCalls: responseData.total_calls,
        totalInbound: responseData.inbound_calls,
        totalOutbound: responseData.outbound_calls,
        totalMissedIncoming: responseData.missed_incoming_calls,
        totalMissedOutgoing: responseData.missed_outgoing_calls,
        totalAvgRingTime: responseData.avg_ring_time,
        totalAvgDuration: responseData.avg_duration,
        totalAvgCost: responseData.avg_cost,
      };

      const chartExtension = responseData?.chart_data?.extension;
      if (chartExtension) {
        state.showExtensionChart = true;
        state.extensionChartData = chartExtension;

        const extensionLabels = chartExtension.map(
          (item: { label?: string }) => item.label || "Unknown",
        );
        const extValues = chartExtension.map((item: { value?: string | number }) =>
          item.value ? Number.parseInt(String(item.value), 10) : 0,
        );

        state.extensionChart = {
          series: [{ name: "Call Count", data: extValues }],
          options: {
            ...state.extensionChart.options,
            xaxis: {
              ...state.extensionChart.options.xaxis,
              categories: extensionLabels,
              labels: {
                show: true,
                style: { fontSize: "11px", colors: "#666" },
              },
            },
            tooltip: { ...state.extensionChart.options.tooltip },
          },
        };
      }

      const chartDepartment = responseData?.chart_data?.department;
      if (chartDepartment) {
        state.showDepartmentChart = true;
        state.departmentChartData = chartDepartment;

        const departmentLabels = chartDepartment.map(
          (item: { label?: string }) => item.label || "Unknown",
        );
        const deptValues = chartDepartment.map(
          (item: { value?: string | number }) =>
            item.value ? Number.parseInt(String(item.value), 10) : 0,
        );

        state.departmentChart = {
          series: [{ name: "Call Count", data: deptValues }],
          options: {
            ...state.departmentChart.options,
            xaxis: {
              ...state.departmentChart.options.xaxis,
              categories: departmentLabels,
              labels: {
                show: true,
                style: { fontSize: "11px", colors: "#666" },
              },
            },
            yaxis: {
              ...state.departmentChart.options.yaxis,
              show: true,
              labels: {
                show: true,
                style: { fontSize: "11px", colors: "#666" },
              },
            },
            chart: { ...state.departmentChart.options.chart },
            plotOptions: {
              bar: {
                borderRadius: 4,
                borderRadiusApplication: "end",
                horizontal: true,
                columnHeight: "2px",
              },
            },
            dataLabels: { enabled: false },
            tooltip: {},
          },
        };
      }

      const chartCountry = responseData?.chart_data?.country;
      if (chartCountry) {
        state.showCountryChart = true;
        state.countryChartData = chartCountry;

        const countryLabels = chartCountry.map(
          (item: { label?: string }) => item.label || "Unknown",
        );
        const countryValues = chartCountry.map(
          (item: { value?: string | number }) =>
            item.value ? Number.parseInt(String(item.value), 10) : 0,
        );

        state.countryChart = {
          series: [{ name: "Call Count", data: countryValues }],
          options: {
            ...state.countryChart.options,
            xaxis: {
              ...state.countryChart.options.xaxis,
              categories: countryLabels,
              labels: {
                show: true,
                style: { fontSize: "11px", colors: "#666" },
              },
            },
            tooltip: {},
          },
        };
      }
    },
  },
});

export const {
  setShowPageLoader,
  setShowCountryChartModal,
  setShowDepartmentChartModal,
  setShowExtensionChartModal,
  setLoading,
  setShowDateRange,
  setCurrentFilters,
  setPendingDateStart,
  setPendingDateEnd,
  setExtensionData,
  setTrendByCountryData,
  applyGeneralStatsApiSuccess,
} = callDashboardSlice.actions;

export type { CallDashboardFilters } from "./dateRange";
export default callDashboardSlice.reducer;
