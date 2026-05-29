import type { CrmExtensionLookup } from "@crm/shared/crmListExtensionDisplayName";
import { getCrmExtensionDisplayNameForUserExtension } from "@crm/shared/crmListExtensionDisplayName";
import { apiDateToDisplayDate } from "./mainDashboardDateRanges";
import type {
  CrmCreatedCountsBundle,
  CrmCreatedCountRow,
  CrmDailyCreationCounts,
  CrmListCounts,
  MainDashboardAttendanceActivityBundle,
} from "./mainDashboard";

export interface ActivityCategoryRow {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

const WORKFORCE_ACTIVITY_CATEGORY_DEFS = [
  { key: "activities", name: "Activities", color: "#CE93D8" },
  { key: "pendingTasks", name: "Pending tasks", color: "#F4A57A" },
  { key: "approvals", name: "Approval requests", color: "#90CAF9" },
] as const;

const CRM_ACTIVITY_CATEGORY_DEFS = [
  { key: "leads", name: "Leads", color: "#F4A57A" },
  { key: "deals", name: "Deals", color: "#90CAF9" },
  { key: "orders", name: "Orders", color: "#A5D6A7" },
  { key: "companies", name: "Companies", color: "#4ECDC4" },
  { key: "meetings", name: "Meetings", color: "#F4D47A" },
] as const satisfies ReadonlyArray<{
  key: keyof CrmListCounts;
  name: string;
  color: string;
}>;

export const CRM_ACTIVITY_LEGEND_ITEMS = [
  ...WORKFORCE_ACTIVITY_CATEGORY_DEFS.map(({ name, color }) => ({ label: name, color })),
  ...CRM_ACTIVITY_CATEGORY_DEFS.map(({ name, color }) => ({ label: name, color })),
];

export interface TopActivitiesLeaderboardRow {
  name: string;
  userExtension: string;
  prospects: number;
  leads: number;
  deals: number;
}

function countRowsByExtension(rows: readonly CrmCreatedCountRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.user_extension, row.count);
  }
  return map;
}

export interface DailyCreationLineChartRow {
  date: string;
  label: string;
  leads: number;
  deals: number;
  orders: number;
}

export const DAILY_CREATION_LINE_SERIES = [
  { key: "leads", name: "Leads", color: "#90CAF9" },
  { key: "deals", name: "Deals", color: "#F4A57A" },
  { key: "orders", name: "Orders", color: "#A5D6A7" },
] as const satisfies ReadonlyArray<{
  key: keyof Pick<DailyCreationLineChartRow, "leads" | "deals" | "orders">;
  name: string;
  color: string;
}>;

export type DailyCreationRangePill = "daily" | "weekly" | "monthly";

type DailyCreationAggregateRow = DailyCreationLineChartRow & { sortKey: number };

function parseApiDayDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function mapDailyCreationDays(
  days: readonly CrmDailyCreationCounts["days"][number][],
): DailyCreationAggregateRow[] {
  return days
    .map((day) => {
      const dateObj = parseApiDayDate(day.date);
      if (!dateObj) return null;
      return {
        date: apiDateToDisplayDate(day.date),
        label: apiDateToDisplayDate(day.date),
        leads: day.leads,
        deals: day.deals,
        orders: day.orders,
        sortKey: dateObj.getTime(),
      };
    })
    .filter((row): row is DailyCreationAggregateRow => row != null)
    .sort((a, b) => a.sortKey - b.sortKey);
}

function aggregateDailyCreationByWeek(
  rows: readonly DailyCreationAggregateRow[],
): DailyCreationLineChartRow[] {
  const groups = new Map<
    number,
    DailyCreationLineChartRow & { sortKey: number }
  >();

  for (const row of rows) {
    const dateObj = new Date(row.sortKey);
    const startOfWeek = new Date(dateObj);
    startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const key = startOfWeek.getTime();
    const dateLabel = `${startOfWeek.getDate()} ${startOfWeek.toLocaleString("en", { month: "short" })}`;
    const existing = groups.get(key);
    if (existing) {
      existing.leads += row.leads;
      existing.deals += row.deals;
      existing.orders += row.orders;
      continue;
    }
    groups.set(key, {
      date: dateLabel,
      label: dateLabel,
      leads: row.leads,
      deals: row.deals,
      orders: row.orders,
      sortKey: key,
    });
  }

  return Array.from(groups.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ sortKey: _sortKey, ...rest }) => rest);
}

function aggregateDailyCreationByMonth(
  rows: readonly DailyCreationAggregateRow[],
): DailyCreationLineChartRow[] {
  const groups = new Map<
    string,
    DailyCreationLineChartRow & { sortKey: number }
  >();

  for (const row of rows) {
    const dateObj = new Date(row.sortKey);
    const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
    const dateLabel = `${dateObj.toLocaleString("en", { month: "short" })} ${dateObj.getFullYear()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.leads += row.leads;
      existing.deals += row.deals;
      existing.orders += row.orders;
      continue;
    }
    groups.set(key, {
      date: dateLabel,
      label: dateLabel,
      leads: row.leads,
      deals: row.deals,
      orders: row.orders,
      sortKey: new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime(),
    });
  }

  return Array.from(groups.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ sortKey: _sortKey, ...rest }) => rest);
}

export function buildDailyCreationLineChartRows(
  payload: CrmDailyCreationCounts | null | undefined,
  pill: DailyCreationRangePill = "daily",
  scale = 1,
): DailyCreationLineChartRow[] {
  if (!payload?.days?.length) return [];

  const dailyRows = mapDailyCreationDays(payload.days);
  let rows: DailyCreationLineChartRow[];

  if (pill === "weekly") {
    rows = aggregateDailyCreationByWeek(dailyRows);
  } else if (pill === "monthly") {
    rows = aggregateDailyCreationByMonth(dailyRows);
  } else {
    rows = dailyRows.map(({ sortKey: _sortKey, ...rest }) => rest);
  }

  return rows.map((row) => ({
    ...row,
    leads: scaleNumber(row.leads, scale),
    deals: scaleNumber(row.deals, scale),
    orders: scaleNumber(row.orders, scale),
  }));
}

export function buildTopActivitiesLeaderboardRows(
  bundle: CrmCreatedCountsBundle | null | undefined,
  extensions: readonly CrmExtensionLookup[],
  scale = 1,
): TopActivitiesLeaderboardRow[] {
  if (!bundle) return [];

  const prospectsByExtension = countRowsByExtension(bundle.prospects);
  const leadsByExtension = countRowsByExtension(bundle.leads);
  const dealsByExtension = countRowsByExtension(bundle.deals);

  const extensionKeys = new Set<string>([
    ...prospectsByExtension.keys(),
    ...leadsByExtension.keys(),
    ...dealsByExtension.keys(),
  ]);

  const rows = Array.from(extensionKeys, (userExtension) => {
    const prospects = scaleNumber(prospectsByExtension.get(userExtension) ?? 0, scale);
    const leads = scaleNumber(leadsByExtension.get(userExtension) ?? 0, scale);
    const deals = scaleNumber(dealsByExtension.get(userExtension) ?? 0, scale);
    return {
      userExtension,
      name: getCrmExtensionDisplayNameForUserExtension(extensions, userExtension),
      prospects,
      leads,
      deals,
    };
  });

  return rows.sort(
    (a, b) => b.prospects + b.leads + b.deals - (a.prospects + a.leads + a.deals),
  );
}

function scaleNumber(value: number, scale: number) {
  return Math.round(value * scale);
}

function withActivityPercentages(
  rows: ReadonlyArray<{ name: string; color: string; count: number }>,
): ActivityCategoryRow[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  return rows.map((row) => ({
    ...row,
    percentage: (row.count / total) * 100,
  }));
}

export function buildCrmActivityCategoryRows(
  counts: CrmListCounts | null | undefined,
  scale = 1,
): ActivityCategoryRow[] {
  const rows = CRM_ACTIVITY_CATEGORY_DEFS.map(({ key, name, color }) => ({
    name,
    color,
    count: Math.round((counts?.[key] ?? 0) * scale),
  }));
  return withActivityPercentages(rows);
}

/** Workforce metrics first, then CRM list-count categories (User activity by category chart). */
export function buildUserActivityByCategoryRows(
  counts: CrmListCounts | null | undefined,
  attendanceBundle: MainDashboardAttendanceActivityBundle | null | undefined,
  scale = 1,
): ActivityCategoryRow[] {
  const attendance = attendanceBundle?.attendance;
  const workforceRows = WORKFORCE_ACTIVITY_CATEGORY_DEFS.map(({ key, name, color }) => {
    let count = 0;
    if (key === "activities") {
      count = attendance?.attendance_count ?? 0;
    } else if (key === "approvals") {
      count = attendance?.approval_request_count ?? 0;
    } else {
      count = attendanceBundle?.pendingTasksCount ?? 0;
    }
    return { name, color, count: Math.round(count * scale) };
  });

  const crmRows = CRM_ACTIVITY_CATEGORY_DEFS.map(({ key, name, color }) => ({
    name,
    color,
    count: Math.round((counts?.[key] ?? 0) * scale),
  }));

  return withActivityPercentages([...workforceRows, ...crmRows]);
}
