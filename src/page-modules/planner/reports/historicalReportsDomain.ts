import type {
  TaskReportsAssigneeRow,
  TaskReportsMemberTrendRow,
  TaskReportsProjectBreakdownRow,
  TaskReportsSummary,
  TaskReportsTrendPoint,
  TaskReportsWeeklyTrendPoint,
} from "@utils/taskReports";
import {
  formatReportsDateLabel,
  formatReportsMemberLabel,
} from "@page-modules/planner/reports/reportsDomain";
import {
  workloadMemberAvatarColor,
  workloadMemberBaseName,
  workloadMemberInitials,
} from "@page-modules/planner/workload/workloadDomain";

export type HistoricalTaskFilter = "all" | "completed" | "in_progress";

export type ProjectBreakdownBarSegment = Readonly<{
  name: string;
  value: number;
  color: string;
}>;

export type MemberWeekPercentTone = "high" | "medium" | "low";

export type MemberWeekCell = Readonly<{
  label: string;
  percent: number;
  display: string;
  tone: MemberWeekPercentTone;
}>;

export type MemberTrendDelta = Readonly<{
  label: string;
  direction: "up" | "down" | "flat";
}>;

export type HistoricalMemberTrendRow = Readonly<{
  key: string;
  memberLabel: string;
  displayName: string;
  initials: string;
  avatarColor: string;
  weekCells: MemberWeekCell[];
  trend: MemberTrendDelta;
}>;

export type HistoricalPeriodBucket = Readonly<{
  date: string;
  label: string;
}>;

export type HistoricalChartPoint = Readonly<{
  label: string;
  value: number;
}>;

export type MemberTrendCell = Readonly<{
  label: string;
  display: string;
  isDelta?: boolean;
}>;

export type MemberTrendTableRow = Readonly<{
  key: string;
  extension: string;
  memberLabel: string;
  initials: string;
  avatarColor: string;
  cells: MemberTrendCell[];
}>;

function parseIsoDate(iso: string): Date | null {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatHistoricalBucketLabel(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function buildHistoricalPeriodBuckets(
  start: string,
  end: string,
  maxBuckets = 5,
): HistoricalPeriodBucket[] {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate || maxBuckets < 1) {
    return [];
  }
  const buckets: HistoricalPeriodBucket[] = [];
  const spanMs = endDate.getTime() - startDate.getTime();
  const steps = Math.max(1, maxBuckets - 1);
  for (let i = 0; i < maxBuckets; i += 1) {
    const ratio = steps === 0 ? 0 : i / steps;
    const at = new Date(startDate.getTime() + spanMs * ratio);
    const y = at.getFullYear();
    const m = String(at.getMonth() + 1).padStart(2, "0");
    const day = String(at.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${day}`;
    buckets.push({ date, label: formatHistoricalBucketLabel(date) });
  }
  return buckets;
}

function resolveSummaryCompletionRate(summary: TaskReportsSummary): number {
  if (summary.completion_rate != null && Number.isFinite(summary.completion_rate)) {
    return Math.min(100, Math.max(0, Math.round(summary.completion_rate)));
  }
  const total = summary.total_tasks ?? 0;
  const done = summary.completed_tasks ?? 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

function trendSeriesHasValues(
  points: TaskReportsTrendPoint[],
  pickValue: (point: TaskReportsTrendPoint) => number,
): boolean {
  return points.some((point) => pickValue(point) > 0);
}

function mapTrendPointsToChart(
  points: TaskReportsTrendPoint[],
  pickValue: (point: TaskReportsTrendPoint) => number,
): HistoricalChartPoint[] {
  return points.map((point) => ({
    label: formatHistoricalBucketLabel(point.date),
    value: Math.max(0, pickValue(point)),
  }));
}

function buildFallbackChartFromBuckets(
  buckets: HistoricalPeriodBucket[],
  value: number,
): HistoricalChartPoint[] {
  return buckets.map((bucket) => ({ label: bucket.label, value }));
}

function sortWeeklyTrendPoints(
  points: TaskReportsWeeklyTrendPoint[],
): TaskReportsWeeklyTrendPoint[] {
  return [...points].sort((a, b) => {
    const ai = a.week_index ?? Number.MAX_SAFE_INTEGER;
    const bi = b.week_index ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return (a.date ?? "").localeCompare(b.date ?? "");
  });
}

export function mapWeeklyTrendsToChartPoints(
  points: TaskReportsWeeklyTrendPoint[],
  pickValue: (point: TaskReportsWeeklyTrendPoint) => number = (point) => point.value,
): HistoricalChartPoint[] {
  return sortWeeklyTrendPoints(points).map((point) => ({
    label: point.week_label.trim() || formatHistoricalBucketLabel(point.date ?? ""),
    value: Math.max(0, Math.round(pickValue(point))),
  }));
}

export function buildHistoricalWeeksChartSubtitle(weekCount: number): string {
  if (weekCount <= 0) return "Selected period";
  return weekCount === 1 ? "Last week" : `Last ${weekCount} weeks`;
}

export function buildCompletionRateChartPoints(
  trends: TaskReportsTrendPoint[],
  completionTrends: TaskReportsTrendPoint[],
  weeklyCompletionTrends: TaskReportsWeeklyTrendPoint[] | undefined,
  summary: TaskReportsSummary,
  range: { start: string; end: string },
): HistoricalChartPoint[] {
  const weeklyPoints = weeklyCompletionTrends ?? [];
  if (weeklyPoints.length > 0) {
    const fromWeekly = mapWeeklyTrendsToChartPoints(weeklyPoints, (point) =>
      point.completion_rate_percent ?? point.value,
    );
    if (fromWeekly.some((point) => point.value > 0)) {
      return fromWeekly;
    }
    if (fromWeekly.length > 0) return fromWeekly;
  }

  const pickCompletion = (point: TaskReportsTrendPoint) =>
    point.completion_rate ??
    (point.completed_count != null && (point.count ?? 0) > 0
      ? Math.round(((point.completed_count ?? 0) / (point.count ?? 1)) * 100)
      : 0);

  if (trendSeriesHasValues(completionTrends, pickCompletion)) {
    return mapTrendPointsToChart(completionTrends, pickCompletion);
  }
  if (trendSeriesHasValues(trends, pickCompletion)) {
    return mapTrendPointsToChart(trends, pickCompletion);
  }

  const buckets = buildHistoricalPeriodBuckets(range.start, range.end, 4);
  if (buckets.length === 0) return [];
  return buildFallbackChartFromBuckets(buckets, resolveSummaryCompletionRate(summary));
}

export function buildOverdueTrendChartPoints(
  overdueTrends: TaskReportsWeeklyTrendPoint[] | undefined,
  summary: TaskReportsSummary,
  range: { start: string; end: string },
): HistoricalChartPoint[] {
  const weeklyPoints = overdueTrends ?? [];
  if (weeklyPoints.length > 0) {
    return mapWeeklyTrendsToChartPoints(weeklyPoints, (point) =>
      point.overdue_count ?? point.value,
    );
  }

  const buckets = buildHistoricalPeriodBuckets(range.start, range.end, 4);
  if (buckets.length === 0) return [];
  const overdue = summary.overdue_tasks ?? 0;
  const perBucket =
    buckets.length > 0 ? Math.max(0, Math.round(overdue / buckets.length)) : 0;
  return buildFallbackChartFromBuckets(buckets, perBucket);
}

export function buildExecutionChartPoints(
  trends: TaskReportsTrendPoint[],
  summary: TaskReportsSummary,
  range: { start: string; end: string },
): HistoricalChartPoint[] {
  const pickExecution = (point: TaskReportsTrendPoint) =>
    point.executed_count ?? point.count ?? point.tasks ?? point.total_tasks ?? 0;

  if (trendSeriesHasValues(trends, pickExecution)) {
    return mapTrendPointsToChart(trends, pickExecution);
  }

  const buckets = buildHistoricalPeriodBuckets(range.start, range.end);
  if (buckets.length === 0) return [];
  const total = summary.total_tasks ?? summary.completed_tasks ?? 0;
  const perBucket = buckets.length > 0 ? Math.max(0, Math.round(total / buckets.length)) : 0;
  return buildFallbackChartFromBuckets(buckets, perBucket);
}

function memberCompletionPercent(member: TaskReportsAssigneeRow): number {
  const total = member.total_tasks ?? member.task_count ?? 0;
  const done = member.completed_tasks ?? member.done_count ?? 0;
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

function formatPercentCell(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}%`;
}

function formatDeltaCell(label: string | null | undefined): string {
  if (!label?.trim()) return "—";
  const trimmed = label.trim();
  if (trimmed.startsWith("+") || trimmed.startsWith("-")) return trimmed;
  return `+${trimmed}`;
}

function findMemberTrendPeriod(
  periods: TaskReportsMemberTrendRow["periods"],
  bucket: HistoricalPeriodBucket,
  index: number,
) {
  if (!periods?.length) return undefined;
  return (
    periods[index] ??
    periods.find((p) => p.date?.slice(0, 10) === bucket.date) ??
    periods.find((p) => p.label === bucket.label)
  );
}

export function buildMemberTrendTable(
  members: TaskReportsAssigneeRow[],
  memberTrends: TaskReportsMemberTrendRow[] | undefined,
  buckets: HistoricalPeriodBucket[],
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): MemberTrendTableRow[] {
  const trendByExtension = new Map<string, TaskReportsMemberTrendRow>();
  for (const row of memberTrends ?? []) {
    const ext = row.extension_number?.trim();
    if (ext) trendByExtension.set(ext, row);
  }

  const periodBuckets = buckets.length > 1 ? buckets.slice(0, -1) : buckets;
  const deltaBucket = buckets.length > 1 ? (buckets.at(-1) ?? null) : null;

  return members.map((member) => {
    const ext = member.extension_number?.trim() ?? "";
    const memberLabel = formatReportsMemberLabel(
      member,
      hierarchyExtensions,
      hierarchyUsers,
    );
    const initials = workloadMemberInitials(ext, hierarchyExtensions, member);
    const avatarColor = workloadMemberAvatarColor(ext);
    const apiTrend = ext ? trendByExtension.get(ext) : undefined;
    const apiPeriods = apiTrend?.periods ?? [];
    const basePct = memberCompletionPercent(member);

    const periodValues: number[] = periodBuckets.map((bucket, index) => {
      const apiCell = findMemberTrendPeriod(apiPeriods, bucket, index);
      const value = apiCell?.percent ?? apiCell?.value;
      return value != null && Number.isFinite(value) ? Math.round(value) : basePct;
    });

    const cells: MemberTrendCell[] = periodBuckets.map((bucket, index) => ({
      label: bucket.label,
      display: formatPercentCell(periodValues[index]),
    }));

    if (deltaBucket) {
      const apiDelta = findMemberTrendPeriod(apiPeriods, deltaBucket, periodBuckets.length);
      let deltaDisplay = "—";
      if (apiDelta?.delta_label) {
        deltaDisplay = formatDeltaCell(apiDelta.delta_label);
      } else if (periodValues.length >= 2) {
        const change = (periodValues.at(-1) ?? 0) - (periodValues.at(0) ?? 0);
        deltaDisplay = formatPeriodValuesChange(change);
      }
      cells.push({
        label: deltaBucket.label,
        display: deltaDisplay,
        isDelta: true,
      });
    }

    return {
      key: ext || memberLabel,
      extension: ext,
      memberLabel,
      initials,
      avatarColor,
      cells,
    };
  });
}

export function buildHistoricalPeriodSubtitle(
  start: string,
  end: string,
): string {
  return `${formatReportsDateLabel(start)} – ${formatReportsDateLabel(end)}`;
}

const PROJECT_BAR_COLORS = ["#f59e0b", "#ef4444", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

export function buildProjectBreakdownBarSegments(
  rows: TaskReportsProjectBreakdownRow[],
): ProjectBreakdownBarSegment[] {
  return rows
    .map((row, index) => ({
      name: row.project_name,
      value: row.total_tasks ?? 0,
      color: row.color?.trim() || PROJECT_BAR_COLORS[index % PROJECT_BAR_COLORS.length],
    }))
    .filter((segment) => segment.value > 0);
}

function formatPeriodValuesChange(change: number): string {
  if (change === 0) return "0%";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change}%`;
}

/** Collapse runs of whitespace without regex alternation (ReDoS-safe). */
function collapseWhitespace(value: string): string {
  return value.trim().split(/\s+/).filter(Boolean).join(" ");
}

const VS_PRIOR_PERIOD_MARKER = "vs prior period";

function stripVsPriorPeriodSuffix(label: string): string {
  const lower = label.toLowerCase();
  const idx = lower.indexOf(VS_PRIOR_PERIOD_MARKER);
  if (idx < 0) return label.trim();
  return label.slice(0, idx).trim();
}

function resolveDeltaDirectionFromLabel(label: string): MemberTrendDelta["direction"] {
  if (label.startsWith("-")) return "down";
  if (label.startsWith("+") || label.includes("+")) return "up";
  return "flat";
}

function normalizeMemberTrendDeltaLabel(trimmed: string): string {
  const normalized = collapseWhitespace(trimmed);
  const shouldStripVsPrior =
    normalized.includes("%") ||
    normalized.startsWith("+") ||
    normalized.startsWith("-");
  if (shouldStripVsPrior) {
    return stripVsPriorPeriodSuffix(normalized);
  }
  return normalized;
}

function resolveDeltaFromLastPeriod(
  periods: TaskReportsMemberTrendRow["periods"] | undefined,
): MemberTrendDelta | null {
  const lastPeriod = periods?.at(-1);
  const deltaLabel = lastPeriod?.delta_label?.trim();
  if (!deltaLabel) return null;
  return {
    label: normalizeMemberTrendDeltaLabel(deltaLabel),
    direction: resolveDeltaDirectionFromLabel(deltaLabel),
  };
}

function resolveDeltaFromWeekCells(weekCells: MemberWeekCell[]): MemberTrendDelta | null {
  if (weekCells.length >= 2) {
    const prev = weekCells.at(-2)?.percent ?? 0;
    const current = weekCells.at(-1)?.percent ?? 0;
    const change = Math.round((current - prev) * 10) / 10;
    if (change === 0) {
      return { label: "0%", direction: "flat" };
    }
    return {
      label: formatPeriodValuesChange(change),
      direction: change > 0 ? "up" : "down",
    };
  }
  if (weekCells.length === 1) {
    return { label: formatWeekPercentDisplay(weekCells[0].percent), direction: "flat" };
  }
  return null;
}

function resolveCompletionPercentTone(percent: number): MemberWeekPercentTone {
  if (percent >= 75) return "high";
  if (percent >= 55) return "medium";
  return "low";
}

function formatWeekPercentDisplay(percent: number): string {
  const rounded = Math.round(percent * 10) / 10;
  return Number.isInteger(rounded) ? `${Math.round(rounded)}%` : `${rounded}%`;
}

function sortMemberTrendPeriods(
  periods: NonNullable<TaskReportsMemberTrendRow["periods"]>,
): NonNullable<TaskReportsMemberTrendRow["periods"]> {
  return [...periods].sort((a, b) => {
    const ai = a.week_index ?? Number.MAX_SAFE_INTEGER;
    const bi = b.week_index ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return (a.date ?? "").localeCompare(b.date ?? "");
  });
}

function selectMemberTrendWeekPeriods(
  periods: TaskReportsMemberTrendRow["periods"] | undefined,
  weeksLimit: number,
): NonNullable<TaskReportsMemberTrendRow["periods"]> {
  if (!periods?.length) return [];
  const sorted = sortMemberTrendPeriods(periods);
  return sorted.slice(-Math.max(1, weeksLimit));
}

function buildWeekCellsFromPeriods(
  periods: NonNullable<TaskReportsMemberTrendRow["periods"]>,
): MemberWeekCell[] {
  return periods.map((period) => {
    const label = period.week_label?.trim() || period.label?.trim() || "—";
    const percentRaw = period.percent ?? period.value ?? 0;
    const percent = Number.isFinite(percentRaw)
      ? Math.min(100, Math.max(0, percentRaw))
      : 0;
    return {
      label,
      percent,
      display: formatWeekPercentDisplay(percent),
      tone: resolveCompletionPercentTone(percent),
    };
  });
}

function resolveMemberTrendDelta(
  apiTrend: TaskReportsMemberTrendRow | undefined,
  weekCells: MemberWeekCell[],
): MemberTrendDelta {
  const apiDelta = apiTrend?.trend;
  if (apiDelta?.label?.trim()) {
    const direction = apiDelta.direction ?? "flat";
    return { label: apiDelta.label.trim(), direction };
  }

  const fromPeriod = resolveDeltaFromLastPeriod(apiTrend?.periods);
  if (fromPeriod) return fromPeriod;

  const fromWeekCells = resolveDeltaFromWeekCells(weekCells);
  if (fromWeekCells) return fromWeekCells;

  return { label: "—", direction: "flat" };
}

export function extractMemberTrendWeekHeaders(
  rows: HistoricalMemberTrendRow[],
): string[] {
  const first = rows.find((row) => row.weekCells.length > 0);
  return first?.weekCells.map((cell) => cell.label) ?? [];
}

export function buildHistoricalMemberTrendRows(
  members: TaskReportsAssigneeRow[],
  memberTrends: TaskReportsMemberTrendRow[] | undefined,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
  filter: HistoricalTaskFilter = "all",
  weeksLimit = 4,
): HistoricalMemberTrendRow[] {
  const memberByExtension = new Map<string, TaskReportsAssigneeRow>();
  for (const member of members) {
    const ext = member.extension_number?.trim();
    if (ext) memberByExtension.set(ext, member);
  }

  const trendSources =
    memberTrends && memberTrends.length > 0
      ? memberTrends
      : members.map((member) => ({
          extension_number: member.extension_number,
          display_name: member.display_name,
          name: member.name,
          periods: [] as TaskReportsMemberTrendRow["periods"],
        }));

  return trendSources
    .filter((trendRow) => {
      const ext = trendRow.extension_number?.trim() ?? "";
      const member = memberByExtension.get(ext);
      if (!member) return true;
      const done = member.done_count ?? member.completed_tasks ?? 0;
      const inProgress = member.in_progress_count ?? 0;
      if (filter === "completed") return done > 0;
      if (filter === "in_progress") return inProgress > 0;
      return true;
    })
    .map((trendRow) => {
      const ext = trendRow.extension_number?.trim() ?? "";
      const member =
        memberByExtension.get(ext) ??
        ({
          extension_number: ext,
          display_name: trendRow.display_name,
          name: trendRow.name,
        } satisfies TaskReportsAssigneeRow);
      const memberLabel = formatReportsMemberLabel(
        member,
        hierarchyExtensions,
        hierarchyUsers,
      );
      const displayName = workloadMemberBaseName(ext, hierarchyExtensions, member);
      const initials = workloadMemberInitials(ext, hierarchyExtensions, member);
      const avatarColor = workloadMemberAvatarColor(ext);
      const weekPeriods = selectMemberTrendWeekPeriods(trendRow.periods, weeksLimit);
      const weekCells = buildWeekCellsFromPeriods(weekPeriods);
      const trend = resolveMemberTrendDelta(trendRow, weekCells);
      return {
        key: ext || memberLabel,
        memberLabel,
        displayName: displayName === ext ? memberLabel : displayName,
        initials,
        avatarColor,
        weekCells,
        trend,
      };
    });
}
