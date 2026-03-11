export const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  failed: "#f87171",
  timeout: "#fb923c",
  transferred: "#a78bfa",
  initiated: "#94a3b8",
  answered: "#34d399",
  dropped: "#fbbf24",
};

export const defaultStatusColor = "#94a3b8";

export const TIME_PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All Time" },
] as const;

export function getDateRange(period: string): { start_date?: string; end_date?: string } {
  if (period === "all") return {};
  const days = parseInt(period, 10);
  if (Number.isNaN(days) || days <= 0) return {};
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return {
    start_date: start.toISOString().slice(0, 19) + "Z",
    end_date: end.toISOString().slice(0, 19) + "Z",
  };
}

/** Returns YYYY-MM-DD for each day in the period (for volume chart X-axis). */
export function getDateKeysInRange(period: string): string[] {
  const { start_date, end_date } = getDateRange(period);
  if (!start_date || !end_date) return [];
  const start = new Date(start_date);
  const end = new Date(end_date);
  const keys: string[] = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setUTCHours(0, 0, 0, 0);
  while (cursor <= endDay) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export const DURATION_BUCKETS = [
  { key: "0-1", label: "0-1 min", min: 0, max: 60 },
  { key: "1-5", label: "1-5 min", min: 61, max: 300 },
  { key: "5-10", label: "5-10 min", min: 301, max: 600 },
  { key: "10-30", label: "10-30 min", min: 601, max: 1800 },
  { key: "30+", label: "30+ min", min: 1801, max: Infinity },
];
