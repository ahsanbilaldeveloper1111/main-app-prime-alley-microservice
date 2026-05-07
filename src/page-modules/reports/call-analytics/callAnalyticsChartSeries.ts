export type ChartBarSeriesBundle = {
  series: { name: string; data: number[] }[];
  categories: string[];
};

export type CallAnalyticsBarChartBundle = {
  chartCalls: ChartBarSeriesBundle | null;
  chartRingTime: ChartBarSeriesBundle | null;
  chartCost: ChartBarSeriesBundle | null;
  chartDuration: ChartBarSeriesBundle | null;
};

type MutableBuckets = {
  country: string[];
  answered_calls: number[];
  unanswered_calls: number[];
  total_calls: number[];
  max_ring_time: number[];
  avg_ring_time: number[];
  min_ring_time: number[];
  min_cost: number[];
  avg_cost: number[];
  max_cost: number[];
  min_duration: number[];
  avg_duration: number[];
  max_duration: number[];
};

function emptyBuckets(): MutableBuckets {
  return {
    country: [],
    answered_calls: [],
    unanswered_calls: [],
    total_calls: [],
    max_ring_time: [],
    avg_ring_time: [],
    min_ring_time: [],
    min_cost: [],
    avg_cost: [],
    max_cost: [],
    min_duration: [],
    avg_duration: [],
    max_duration: [],
  };
}

function pushRow(item: Record<string, unknown>, acc: MutableBuckets): void {
  const label = item.label;
  if (typeof label !== "string" || label.trim() === "") return;
  acc.country.push(label);
  acc.answered_calls.push(Number(item.answered_calls) || 0);
  acc.unanswered_calls.push(Number(item.unanswered_calls) || 0);
  acc.total_calls.push(Number(item.total_calls) || 0);
  acc.max_ring_time.push(Number(item.max_ring_time) || 0);
  acc.avg_ring_time.push(Number(item.avg_ring_time) || 0);
  acc.min_ring_time.push(Number(item.min_ring_time) || 0);
  acc.min_cost.push(Number(item.min_cost) || 0);
  acc.avg_cost.push(Number(item.avg_cost) || 0);
  acc.max_cost.push(Number(item.max_cost) || 0);
  acc.min_duration.push(Number(item.min_duration) || 0);
  acc.avg_duration.push(Number(item.avg_duration) || 0);
  acc.max_duration.push(Number(item.max_duration) || 0);
}

function lengthsAligned(acc: MutableBuckets, len: number): boolean {
  return (
    len > 0 &&
    acc.answered_calls.length === len &&
    acc.unanswered_calls.length === len &&
    acc.total_calls.length === len
  );
}

/** Maps `chart_data` arrays from call analytics APIs into ChartBar props. */
export function parseCallAnalyticsChartRows(
  chartData: unknown,
): CallAnalyticsBarChartBundle | null {
  if (!Array.isArray(chartData) || chartData.length === 0) return null;

  const acc = emptyBuckets();
  for (const raw of chartData) {
    if (raw && typeof raw === "object") {
      pushRow(raw as Record<string, unknown>, acc);
    }
  }

  const dataLength = acc.country.length;
  if (!lengthsAligned(acc, dataLength)) return null;

  return {
    chartCalls: {
      series: [
        { name: "Total", data: acc.total_calls },
        { name: "Answered", data: acc.answered_calls },
        { name: "Unanswered", data: acc.unanswered_calls },
      ],
      categories: acc.country,
    },
    chartRingTime: {
      series: [
        { name: "Max Ring Time", data: acc.max_ring_time },
        { name: "Avg Ring Time", data: acc.avg_ring_time },
        { name: "Min Ring Time", data: acc.min_ring_time },
      ],
      categories: acc.country,
    },
    chartCost: {
      series: [
        { name: "Max Cost", data: acc.max_cost },
        { name: "Avg Cost", data: acc.avg_cost },
        { name: "Min Cost", data: acc.min_cost },
      ],
      categories: acc.country,
    },
    chartDuration: {
      series: [
        { name: "Max Duration", data: acc.max_duration },
        { name: "Avg Duration", data: acc.avg_duration },
        { name: "Min Duration", data: acc.min_duration },
      ],
      categories: acc.country,
    },
  };
}
