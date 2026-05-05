/** Serializable duration chart payload for Redux (extension chart from API). */
export interface DurationChartModel {
  series: { name: string; data: number[] }[];
  categories: string[];
}

export interface DirectionChartModel {
  inbound: number[];
  outbound: number[];
  labels: string[];
}

export function buildDurationChartFromExtension(
  dataExtension: unknown[],
): DurationChartModel | null {
  if (!Array.isArray(dataExtension) || dataExtension.length === 0) {
    return null;
  }

  const ms = 10000000;
  const label: string[] = [];
  const longest_call: number[] = [];
  const shortest_call: number[] = [];
  const average_call: number[] = [];

  for (const item of dataExtension as Array<Record<string, unknown>>) {
    label.push(String(item.label ?? ""));
    const longestCall =
      typeof item.longest_call === "string"
        ? Number.parseFloat(item.longest_call)
        : Number(item.longest_call) || 0;
    const shortestCall =
      typeof item.shortest_call === "string"
        ? Number.parseFloat(item.shortest_call)
        : Number(item.shortest_call) || 0;
    const averageCall =
      typeof item.average_call === "string"
        ? Number.parseFloat(item.average_call)
        : Number(item.average_call) || 0;
    longest_call.push(longestCall / ms);
    shortest_call.push(shortestCall / ms);
    average_call.push(averageCall / ms);
  }

  const dataLength = label.length;
  if (
    dataLength === 0 ||
    shortest_call.length !== dataLength ||
    longest_call.length !== dataLength ||
    average_call.length !== dataLength
  ) {
    return null;
  }

  return {
    series: [
      { name: "Short", data: shortest_call },
      { name: "Average", data: average_call },
      { name: "Long", data: longest_call },
    ],
    categories: label,
  };
}

export function buildDirectionChartModel(
  dateChart: unknown[],
): DirectionChartModel | null {
  if (!Array.isArray(dateChart) || dateChart.length === 0) {
    return null;
  }

  const inbound: number[] = [];
  const outbound: number[] = [];
  const labels: string[] = [];

  for (const item of dateChart as Array<Record<string, unknown>>) {
    inbound.push(Number(item.inbound) || 0);
    outbound.push(Number(item.outbound) || 0);
    labels.push(String(item.label ?? ""));
  }

  return { inbound, outbound, labels };
}
