import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";

import type { ChatbotsAdminDashboardModel } from "./types";
import { useChatAdminDashboardQuery } from "./useChatAdminDashboardQuery";

export type CostQueriesLineSeries = { name: string; data: number[] }[];

const emptyTrend = {
  categories: [] as string[],
  costSeries: [] as number[],
  queriesSeries: [] as number[],
};

export type ChatbotsAdminDashboardCtx = Readonly<{
  model: ChatbotsAdminDashboardModel | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  costQueriesChart: {
    options: ApexOptions;
    series: CostQueriesLineSeries;
  };
}>;

function buildCostQueriesChart(
  costQueriesLast30Days: ChatbotsAdminDashboardModel["costQueriesLast30Days"],
): ChatbotsAdminDashboardCtx["costQueriesChart"] {
  const { categories, costSeries, queriesSeries } = costQueriesLast30Days;
  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: true },
      zoom: { enabled: false },
    },
    stroke: { width: [3, 3], curve: "smooth" },
    colors: ["#2563eb", "#059669"],
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      categories,
      labels: {
        rotate: categories.length > 14 ? -45 : 0,
        style: { fontSize: "11px" },
      },
    },
    yaxis: [
      {
        title: { text: "Cost (USD)" },
        labels: {
          formatter: (v: string | number) => `$${Number(v).toFixed(0)}`,
        },
      },
      {
        opposite: true,
        title: { text: "Queries" },
        labels: {
          formatter: (v: string | number) => `${Math.round(Number(v))}`,
        },
      },
    ],
    legend: { position: "top" },
    grid: { strokeDashArray: 4, borderColor: "#e5e7eb" },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter(val: number) {
            return `$${Number(val).toFixed(3)}`;
          },
        },
        {
          formatter(val: number) {
            return `${Math.round(Number(val))} queries`;
          },
        },
      ],
    },
  };

  const series: CostQueriesLineSeries = [
    { name: "Cost (USD)", data: costSeries },
    { name: "Queries", data: queriesSeries },
  ];

  return { options, series };
}

export function useChatbotsAdminDashboard(): ChatbotsAdminDashboardCtx {
  const dashboardQuery = useChatAdminDashboardQuery();
  const { model, isPending, isError, error, refetch } = dashboardQuery;

  const trendSource = model?.costQueriesLast30Days ?? emptyTrend;

  const costQueriesChart = useMemo(
    () => buildCostQueriesChart(trendSource),
    [trendSource],
  );

  return {
    model,
    isLoading: isPending,
    isError,
    error: error ?? null,
    refetch: () => {
      void refetch();
    },
    costQueriesChart,
  };
}
