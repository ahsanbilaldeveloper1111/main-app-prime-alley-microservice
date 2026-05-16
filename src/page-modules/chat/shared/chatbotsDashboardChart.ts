import type { ApexOptions } from "apexcharts";

export function resolveLineChartHeight(
  isMobile: boolean,
  isTablet: boolean,
  desktopHeight = 280,
): number {
  if (isMobile) return 220;
  if (isTablet) return desktopHeight > 300 ? 280 : 260;
  return desktopHeight;
}

export function resolveDonutChartHeight(
  isMobile: boolean,
  isTablet: boolean,
  desktopHeight = 320,
): number {
  if (isMobile) return 260;
  if (isTablet) return 300;
  return desktopHeight;
}

function resolveChartLabelRotate(
  isMobile: boolean,
  categoryCount: number,
): number {
  if (isMobile) return -60;
  if (categoryCount > 14) return -45;
  return 0;
}

export function buildResponsiveLineChartOptions(
  base: ApexOptions,
  isMobile: boolean,
): ApexOptions {
  const categories = base.xaxis?.categories;
  const categoryCount = Array.isArray(categories) ? categories.length : 0;
  const labelRotate = resolveChartLabelRotate(isMobile, categoryCount);
  const legendPosition: "bottom" | "top" = isMobile ? "bottom" : "top";

  return {
    ...base,
    chart: {
      ...base.chart,
      toolbar: { show: !isMobile },
    },
    legend: {
      ...base.legend,
      position: legendPosition,
    },
    xaxis: {
      ...base.xaxis,
      labels: {
        ...base.xaxis?.labels,
        rotate: labelRotate,
        style: { fontSize: isMobile ? "10px" : "11px" },
      },
    },
    yaxis: Array.isArray(base.yaxis)
      ? base.yaxis.map((axis) => ({
          ...axis,
          title: isMobile
            ? { ...axis.title, style: { fontSize: "11px" } }
            : axis.title,
        }))
      : base.yaxis,
  };
}
