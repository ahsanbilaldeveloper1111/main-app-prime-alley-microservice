import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";

import type { ChatbotsTenantDashboardModel } from "./types";
import { useChatTenantDashboardQuery } from "./useChatTenantDashboardQuery";

export type CostQueriesLineSeries = { name: string; data: number[] }[];

const emptyTrend = {
  categories: [] as string[],
  costSeries: [] as number[],
  queriesSeries: [] as number[],
};

export type ChatbotsTenantDashboardCtx = Readonly<{
  model: ChatbotsTenantDashboardModel | null;
  companyName: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  dailyCostQueriesChart: {
    options: ApexOptions;
    series: CostQueriesLineSeries;
  };
}>;

function buildCostQueriesChart(
  dailyCostQueriesLast30Days: ChatbotsTenantDashboardModel["dailyCostQueriesLast30Days"],
): ChatbotsTenantDashboardCtx["dailyCostQueriesChart"] {
  const { categories, costSeries, queriesSeries } = dailyCostQueriesLast30Days;
  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: true },
      zoom: { enabled: false },
      redrawOnParentResize: true,
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

export function useChatbotsTenantDashboard(): ChatbotsTenantDashboardCtx {
  const dashboardQuery = useChatTenantDashboardQuery();
  const { model, isPending, isError, error, refetch } = dashboardQuery;

  const trendSource = model?.dailyCostQueriesLast30Days ?? emptyTrend;

  const dailyCostQueriesChart = useMemo(
    () => buildCostQueriesChart(trendSource),
    [trendSource],
  );

  return {
    model,
    companyName: model?.companyName?.trim() ?? "",
    isLoading: isPending,
    isError,
    error: error ?? null,
    refetch: () => {
      refetch().catch(() => undefined);
    },
    dailyCostQueriesChart,
  };
}
