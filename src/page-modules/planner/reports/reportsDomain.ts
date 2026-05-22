import type { Session } from "next-auth";
import type {
  TaskReportsAssigneeRow,
  TaskReportsActiveIssueRow,
  TaskReportsActivityRow,
  TaskReportsListLimitFlag,
  TaskReportsListLimits,
  TaskReportsMemberTrendRow,
  TaskReportsOverview,
  TaskReportsPeriodDelta,
  TaskReportsProjectBreakdownRow,
  TaskReportsStatusRow,
  TaskReportsSummary,
  TaskReportsTaskRow,
  TaskReportsTrendPoint,
  TaskReportsWeeklyTrendPoint,
} from "@utils/taskReports";
import { TASK_REPORTS_MAX_DATE_RANGE_DAYS } from "@utils/reportsApiConstants";
import {
  isExtensionPlaceholderLabel,
  lookupHierarchyExtensionDisplayName,
} from "@components/planner/plannerTasksListing/plannerTasksListingDomain";
import {
  formatWorkloadIsoDate,
  formatWorkloadMemberLabel,
} from "@page-modules/planner/workload/workloadDomain";

export type ReportsDatePreset = "last_7" | "last_30" | "this_month" | "custom";

export type ReportsProjectFilter = "all" | number;

export type ReportsNormalizeContext = Readonly<{
  statusNamesById?: ReadonlyMap<number, string>;
  memberFilter?: string;
  sessionExtension?: string;
  hierarchyExtensions?: unknown[] | null;
  hierarchyUsers?: unknown[] | null;
}>;

const STATUS_SLUG_LABELS: Record<string, string> = {
  todo: "To Do",
  to_do: "To Do",
  in_progress: "In Progress",
  inprogress: "In Progress",
  done: "Done",
  completed: "Completed",
  overdue: "Overdue",
};

function readTenantIdCandidate(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.floor(value));
  }
  return "";
}

function readTenantIdFromUser(user: unknown): string {
  if (user == null || typeof user !== "object") return "";
  const record = user as Record<string, unknown>;
  const candidates = [
    record.tenant_id,
    record.tenant,
    record.company_id,
    record.company_identifier,
  ];
  for (const raw of candidates) {
    const resolved = readTenantIdCandidate(raw);
    if (resolved) return resolved;
  }
  return "";
}

export function getPlannerTenantId(session: Session | null | undefined): string {
  return readTenantIdFromUser(session?.user);
}

export function getReportsDateRangeForPreset(
  preset: ReportsDatePreset,
  customStart: string,
  customEnd: string,
): { start: string; end: string; wasClamped: boolean } {
  const today = new Date();
  const end = formatWorkloadIsoDate(today);
  if (preset === "custom" && customStart && customEnd) {
    return clampReportsDateRange(customStart, customEnd);
  }
  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return clampReportsDateRange(formatWorkloadIsoDate(start), end);
  }
  const days = preset === "last_7" ? 6 : 29;
  const start = new Date(today);
  start.setDate(start.getDate() - days);
  return clampReportsDateRange(formatWorkloadIsoDate(start), end);
}

export function clampReportsDateRange(
  start: string,
  end: string,
  maxDays: number = TASK_REPORTS_MAX_DATE_RANGE_DAYS,
): { start: string; end: string; wasClamped: boolean } {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { start, end, wasClamped: false };
  }
  const maxEnd = new Date(startDate);
  maxEnd.setDate(maxEnd.getDate() + maxDays);
  if (endDate.getTime() <= maxEnd.getTime()) {
    return { start, end, wasClamped: false };
  }
  return {
    start,
    end: formatWorkloadIsoDate(maxEnd),
    wasClamped: true,
  };
}

function normalizeListLimitFlag(raw: unknown): TaskReportsListLimitFlag | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const truncated = record.truncated === true || record.is_truncated === true;
  const limit =
    readNumber(record.limit) ??
    readNumber(record.members_limit) ??
    readNumber(record.periods_limit);
  const total =
    readNumber(record.total_in_scope) ??
    readNumber(record.total) ??
    readNumber(record.total_count);
  const returned = readNumber(record.returned);
  if (!truncated && limit == null && total == null && returned == null) return undefined;
  return { truncated, limit, total, returned, total_in_scope: total };
}

function normalizeListLimits(raw: unknown): TaskReportsListLimits | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const source = raw as Record<string, unknown>;
  const keys: (keyof TaskReportsListLimits)[] = [
    "pending_tasks",
    "top_assignees",
    "member_report",
    "member_trends",
    "completion_trends",
    "trends",
    "project_breakdown",
    "recent_activity",
    "stale_in_progress_tasks",
    "transfer_tasks",
  ];
  const camelAliases: Record<keyof TaskReportsListLimits, string> = {
    pending_tasks: "pendingTasks",
    top_assignees: "topAssignees",
    member_report: "memberReport",
    member_trends: "memberTrends",
    completion_trends: "completionTrends",
    trends: "trends",
    project_breakdown: "projectBreakdown",
    recent_activity: "recentActivity",
    stale_in_progress_tasks: "staleInProgressTasks",
    transfer_tasks: "transferTasks",
  };

  const limits: Record<string, TaskReportsListLimitFlag> = {};
  for (const key of keys) {
    const flag = normalizeListLimitFlag(source[key] ?? source[camelAliases[key]]);
    if (flag) limits[key] = flag;
  }
  return hasPopulatedListLimits(limits) ? limits : undefined;
}

function hasPopulatedListLimits(
  limits: Record<string, TaskReportsListLimitFlag>,
): limits is TaskReportsListLimits {
  return Object.keys(limits).length > 0;
}

export function hasTruncatedReportLists(limits: TaskReportsListLimits | undefined): boolean {
  if (!limits) return false;
  return Object.values(limits).some((entry) => entry?.truncated === true);
}

export function formatTruncatedReportListLabels(
  limits: TaskReportsListLimits | undefined,
): string[] {
  if (!limits) return [];
  const labels: Record<keyof TaskReportsListLimits, string> = {
    pending_tasks: "Pending tasks",
    top_assignees: "Top assignees",
    member_report: "Member report",
    member_trends: "Member trends",
    completion_trends: "Completion trends",
    trends: "Trends",
    project_breakdown: "Project breakdown",
    recent_activity: "Recent activity",
    stale_in_progress_tasks: "Stale in progress",
    transfer_tasks: "Transfer tasks",
  };
  return (Object.keys(labels) as (keyof TaskReportsListLimits)[])
    .filter((key) => limits[key]?.truncated === true)
    .map((key) => labels[key]);
}

export function formatReportsDateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatReportsPeriodLabel(start: string, end: string): string {
  return `${formatReportsDateLabel(start)} – ${formatReportsDateLabel(end)}`;
}

function readNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : undefined;
  }
  return undefined;
}

function readExtensionCandidate(value: unknown): string | undefined {
  const asString = readString(value);
  if (asString) return asString;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.floor(value));
  }
  return undefined;
}

function readStringFromRecord(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const resolved = readString(record[key]);
    if (resolved) return resolved;
  }
  return undefined;
}

function readNestedRecord(value: unknown): Record<string, unknown> | undefined {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function readExtensionFromRecord(
  record: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const resolved = readExtensionCandidate(record[key]);
    if (resolved) return resolved;
  }
  return undefined;
}

function readFirstExtensionFromArray(value: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return readExtensionCandidate(value[0]);
}

export function resolveReportsAssigneeExtension(row: Record<string, unknown>): string {
  const direct = readExtensionFromRecord(row, [
    "extension_number",
    "extension",
    "assignee_extension",
    "assignee_extension_number",
    "member_extension",
    "primary_extension",
    "primary_extension_number",
    "phone",
    "assignee_phone",
  ]);
  if (direct) return direct;

  const scalarUser = readExtensionCandidate(row.user);
  if (scalarUser) return scalarUser;

  const fromArray =
    readFirstExtensionFromArray(row.extension_numbers) ??
    readFirstExtensionFromArray(row.assignee_extensions) ??
    readFirstExtensionFromArray(row.extensions) ??
    readFirstExtensionFromArray(row.assignees);
  if (fromArray) return fromArray;

  for (const key of ["assignee", "member", "user"] as const) {
    const nested = readNestedRecord(row[key]);
    if (!nested) continue;
    const ext = readExtensionFromRecord(nested, [
      "extension_number",
      "extension",
      "phone",
      "assignee_phone",
    ]);
    if (ext) return ext;
  }
  return "";
}

function isPlaceholderExtensionLabel(
  label: string | null | undefined,
  extension: string,
): boolean {
  return isExtensionPlaceholderLabel(label?.trim() ?? "", extension);
}

function readHierarchyPersonName(
  record: Record<string, unknown>,
  extension: string,
): string | undefined {
  const direct = readStringFromRecord(record, [
    "display_name",
    "name",
    "label",
    "full_name",
    "user_name",
  ]);
  if (direct && !isPlaceholderExtensionLabel(direct, extension)) return direct;
  const user = readNestedRecord(record.user);
  if (!user) return undefined;
  const fromUser = readStringFromRecord(user, [
    "display_name",
    "name",
    "full_name",
    "user_name",
  ]);
  if (fromUser && !isPlaceholderExtensionLabel(fromUser, extension)) return fromUser;
  return undefined;
}

function extensionMatchesRecord(ext: string, record: Record<string, unknown>): boolean {
  const candidates = [
    readExtensionFromRecord(record, ["extension_number", "extension", "phone", "id"]),
    readString(record.extension_number),
    readString(record.extension),
    readString(record.id),
  ].filter((value): value is string => Boolean(value));
  return candidates.includes(ext);
}

function readHierarchyUserDisplayName(record: Record<string, unknown>): string | undefined {
  const direct = readStringFromRecord(record, [
    "display_name",
    "name",
    "label",
    "full_name",
    "user_name",
  ]);
  if (direct && !/^\d+$/.test(direct)) return direct;
  const user = readNestedRecord(record.user);
  if (!user) return undefined;
  const fromUser = readStringFromRecord(user, [
    "display_name",
    "name",
    "full_name",
    "user_name",
  ]);
  if (fromUser && !/^\d+$/.test(fromUser)) return fromUser;
  return undefined;
}

function lookupHierarchyUserById(
  userId: string,
  hierarchyUsers?: unknown[] | null,
): string | undefined {
  if (!userId || !Array.isArray(hierarchyUsers)) return undefined;
  for (const row of hierarchyUsers) {
    if (row == null || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const id = readString(record.id);
    if (!id || id !== userId) continue;
    return readHierarchyUserDisplayName(record);
  }
  return undefined;
}

function tryResolveNameFromExtensionRecord(
  ext: string,
  record: Record<string, unknown>,
  hierarchyUsers?: unknown[] | null,
): string | undefined {
  const name = readHierarchyPersonName(record, ext);
  if (name) return name;
  const userId = readString(record.user_id);
  if (!userId) return undefined;
  const fromLinkedUser = lookupHierarchyUserById(userId, hierarchyUsers);
  if (fromLinkedUser && !isPlaceholderExtensionLabel(fromLinkedUser, ext)) {
    return fromLinkedUser;
  }
  return undefined;
}

function findMemberNameInExtensionRows(
  ext: string,
  hierarchyExtensions: unknown[],
  hierarchyUsers?: unknown[] | null,
): string | undefined {
  for (const row of hierarchyExtensions) {
    if (row == null || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    if (!extensionMatchesRecord(ext, record)) continue;
    const resolved = tryResolveNameFromExtensionRecord(ext, record, hierarchyUsers);
    if (resolved) return resolved;
  }
  return undefined;
}

function findMemberNameInUserRows(
  ext: string,
  hierarchyUsers: unknown[],
): string | undefined {
  for (const row of hierarchyUsers) {
    if (row == null || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    if (!extensionMatchesRecord(ext, record)) continue;
    const name = readHierarchyPersonName(record, ext);
    if (name) return name;
  }
  return undefined;
}

function resolveHierarchyExtensionFallback(
  ext: string,
  fromExtensions: string,
): string {
  if (fromExtensions && !isPlaceholderExtensionLabel(fromExtensions, ext)) {
    return fromExtensions;
  }
  return "";
}

export function lookupHierarchyMemberDisplayName(
  extensionNumber: string,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): string {
  const ext = extensionNumber.trim();
  if (!ext) return "";

  const fromExtensions = lookupHierarchyExtensionDisplayName(ext, hierarchyExtensions);
  if (fromExtensions && !isPlaceholderExtensionLabel(fromExtensions, ext)) {
    return fromExtensions;
  }

  if (Array.isArray(hierarchyExtensions)) {
    const fromExtensionRows = findMemberNameInExtensionRows(
      ext,
      hierarchyExtensions,
      hierarchyUsers,
    );
    if (fromExtensionRows) return fromExtensionRows;
  }

  if (Array.isArray(hierarchyUsers)) {
    const fromUserRows = findMemberNameInUserRows(ext, hierarchyUsers);
    if (fromUserRows) return fromUserRows;
  }

  return resolveHierarchyExtensionFallback(ext, fromExtensions);
}

function lookupHierarchyExtensionByDisplayName(
  displayName: string,
  hierarchyExtensions?: unknown[] | null,
): string {
  const target = displayName.trim().toLowerCase();
  if (!target || !Array.isArray(hierarchyExtensions)) return "";
  for (const row of hierarchyExtensions) {
    if (row == null || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const ext = readExtensionFromRecord(record, [
      "extension_number",
      "extension",
      "id",
    ]);
    const label = readStringFromRecord(record, [
      "display_name",
      "name",
      "label",
      "full_name",
    ]);
    if (ext && label?.toLowerCase() === target) return ext;
  }
  return "";
}

function resolveStatusSlugLabel(row: Record<string, unknown>): string | undefined {
  const slug = readStringFromRecord(row, ["status_slug", "slug", "status_key", "key"]);
  if (!slug) return undefined;
  return STATUS_SLUG_LABELS[slug.toLowerCase().replace(/\s+/g, "_")];
}

function resolveReportsStatusName(
  row: Record<string, unknown>,
  statusNamesById?: ReadonlyMap<number, string>,
): string {
  const direct = readStringFromRecord(row, [
    "label",
    "status_name",
    "statusName",
    "name",
    "title",
    "status_label",
    "status_title",
    "status_text",
  ]);
  if (direct) return direct;

  const statusId =
    readNumber(row.status_id) ??
    readNumber(row.id) ??
    (readNestedRecord(row.status) ? readNumber(readNestedRecord(row.status)!.id) : undefined);
  if (statusId != null && statusNamesById?.has(statusId)) {
    return statusNamesById.get(statusId) ?? "Unknown";
  }

  const fromSlug = resolveStatusSlugLabel(row);
  if (fromSlug) return fromSlug;

  const statusValue = row.status;
  if (typeof statusValue === "string") {
    const trimmed = statusValue.trim();
    if (trimmed) return trimmed;
  }
  const statusRecord = readNestedRecord(statusValue);
  if (statusRecord) {
    const nested = resolveReportsStatusName(statusRecord, statusNamesById);
    if (nested !== "Unknown" && !nested.startsWith("Status ")) return nested;
  }
  return statusId == null ? "Unknown" : `Status ${statusId}`;
}

export function buildPlannerStatusNamesMap(
  statuses: ReadonlyArray<{ id: number; name: string }> | undefined,
): Map<number, string> {
  const map = new Map<number, string>();
  if (!statuses) return map;
  for (const status of statuses) {
    const name = status.name?.trim();
    if (Number.isFinite(status.id) && name) {
      map.set(Math.floor(status.id), name);
    }
  }
  return map;
}

function listHierarchyExtensionNumbers(
  hierarchyExtensions?: unknown[] | null,
): string[] {
  if (!Array.isArray(hierarchyExtensions)) return [];
  const exts: string[] = [];
  for (const row of hierarchyExtensions) {
    if (row == null || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const ext = readExtensionFromRecord(record, [
      "extension_number",
      "extension",
      "id",
    ]);
    if (ext) exts.push(ext);
  }
  return exts;
}

export function enrichAssigneeRows(
  rows: TaskReportsAssigneeRow[],
  context: ReportsNormalizeContext,
): TaskReportsAssigneeRow[] {
  const hierarchyExts = listHierarchyExtensionNumbers(context.hierarchyExtensions);
  return rows.map((row, index) => {
    let ext = row.extension_number?.trim() ?? "";
    if (!ext && context.memberFilter && context.memberFilter !== "all") {
      ext = context.memberFilter.trim();
    }
    if (!ext && context.sessionExtension?.trim()) {
      ext = context.sessionExtension.trim();
    }
    if (!ext && hierarchyExts[index]) {
      ext = hierarchyExts[index];
    }
    if (!ext && rows.length === 1 && hierarchyExts.length === 1) {
      ext = hierarchyExts[0];
    }

    const existingName = row.display_name?.trim() || row.name?.trim();
    const hasRealName = existingName && !isPlaceholderExtensionLabel(existingName, ext);
    const hierarchyName =
      ext && !hasRealName
        ? lookupHierarchyMemberDisplayName(
            ext,
            context.hierarchyExtensions,
            context.hierarchyUsers,
          )
        : "";

    const enriched: TaskReportsAssigneeRow = ext ? { ...row, extension_number: ext } : { ...row };
    if (hierarchyName && !isPlaceholderExtensionLabel(hierarchyName, ext)) {
      enriched.name = hierarchyName;
      enriched.display_name = hierarchyName;
    } else if (hasRealName) {
      enriched.name = enriched.name ?? existingName;
      enriched.display_name = enriched.display_name ?? existingName;
    }
    return enriched;
  });
}

function resolveReportsStatusColor(row: Record<string, unknown>): string | null {
  const direct =
    readString(row.status_color) ??
    readString(row.color) ??
    readString(row.status_colour);
  if (direct) return direct;
  const statusRecord = readNestedRecord(row.status);
  if (!statusRecord) return null;
  return (
    readString(statusRecord.color) ??
    readString(statusRecord.status_color) ??
    readString(statusRecord.colour) ??
    null
  );
}

export function formatReportsMemberLabel(
  row: TaskReportsAssigneeRow,
  hierarchyExtensions?: unknown[] | null,
  hierarchyUsers?: unknown[] | null,
): string {
  let ext = row.extension_number?.trim() ?? "";
  const apiName = row.display_name?.trim() || row.name?.trim() || "";
  let name =
    apiName && !isPlaceholderExtensionLabel(apiName, ext)
      ? apiName
      : lookupHierarchyMemberDisplayName(ext, hierarchyExtensions, hierarchyUsers);
  if (!ext && name) {
    ext = lookupHierarchyExtensionByDisplayName(name, hierarchyExtensions);
  }
  if (ext) {
    const memberSource = name
      ? { name, display_name: row.display_name ?? name }
      : row;
    return formatWorkloadMemberLabel(ext, hierarchyExtensions, memberSource);
  }
  return name || "Unknown";
}

function parsePeriodDeltaDirection(
  value: unknown,
): TaskReportsPeriodDelta["direction"] {
  const raw = readString(value);
  if (raw === "up" || raw === "down" || raw === "flat") return raw;
  return undefined;
}

function resolveSignedDeltaDirection(
  value: number,
): TaskReportsPeriodDelta["direction"] {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

function normalizeNumericPeriodDelta(value: number): TaskReportsPeriodDelta {
  return {
    value,
    percent: Math.abs(value),
    direction: resolveSignedDeltaDirection(value),
  };
}

function normalizeObjectPeriodDelta(
  row: Record<string, unknown>,
): TaskReportsPeriodDelta | undefined {
  const percent =
    readNumber(row.percent) ??
    readNumber(row.change_percent) ??
    readNumber(row.changePercent);
  const value = readNumber(row.value) ?? percent;
  let direction = parsePeriodDeltaDirection(row.direction);
  if (!direction && percent != null) {
    direction = resolveSignedDeltaDirection(percent);
  }
  const label = readString(row.label);
  if (percent == null && value == null && !label) return undefined;
  return {
    value,
    percent: percent == null ? undefined : Math.abs(percent),
    direction,
    label,
  };
}

function normalizePeriodDelta(raw: unknown): TaskReportsPeriodDelta | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return normalizeNumericPeriodDelta(raw);
  }
  if (raw == null || typeof raw !== "object") return undefined;
  return normalizeObjectPeriodDelta(raw as Record<string, unknown>);
}

function normalizeVsPreviousPeriod(
  vsRaw: unknown,
): Record<string, TaskReportsPeriodDelta> | undefined {
  if (vsRaw == null || typeof vsRaw !== "object") return undefined;
  const vs = vsRaw as Record<string, unknown>;
  const out: Record<string, TaskReportsPeriodDelta> = {};

  const flatMappings: ReadonlyArray<readonly [string, string]> = [
    ["total_tasks_created_change_percent", "total_tasks"],
    ["total_tasks_change_percent", "total_tasks"],
    ["completion_rate_change_percent", "completion_rate"],
    ["completed_tasks_change_percent", "completed_tasks"],
    ["pending_tasks_change_percent", "pending_tasks"],
    ["overdue_tasks_change_percent", "overdue_tasks"],
    ["in_progress_tasks_change_percent", "in_progress_tasks"],
  ];

  for (const [sourceKey, targetKey] of flatMappings) {
    const delta = normalizePeriodDelta(vs[sourceKey]);
    if (delta) out[targetKey] = delta;
  }

  for (const [key, val] of Object.entries(vs)) {
    if (key.endsWith("_change_percent")) continue;
    const delta = normalizePeriodDelta(val);
    if (delta) out[key] = delta;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function normalizeReportsSummary(raw: unknown): TaskReportsSummary {
  if (raw == null || typeof raw !== "object") return {};
  const row = raw as Record<string, unknown>;
  return {
    total_tasks:
      readNumber(row.total_tasks) ?? readNumber(row.total_tasks_created),
    completed_tasks: readNumber(row.completed_tasks),
    completed_in_period: readNumber(row.completed_in_period),
    overdue_tasks: readNumber(row.overdue_tasks),
    pending_tasks: readNumber(row.pending_tasks),
    in_progress_tasks:
      readNumber(row.in_progress_tasks) ?? readNumber(row.in_progress_count),
    in_review_tasks: readNumber(row.in_review_tasks),
    todo_tasks: readNumber(row.todo_tasks),
    stale_in_progress_tasks: readNumber(row.stale_in_progress_tasks),
    total_hours: readNumber(row.total_hours),
    completion_rate:
      readNumber(row.completion_rate) ??
      readNumber(row.completion_rate_percent),
    vs_previous_period: normalizeVsPreviousPeriod(row.vs_previous_period),
  };
}

function normalizeStatusRow(
  raw: unknown,
  statusNamesById?: ReadonlyMap<number, string>,
): TaskReportsStatusRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const statusRecord = readNestedRecord(row.status);
  const statusId =
    readNumber(row.status_id) ?? (statusRecord ? readNumber(statusRecord.id) : undefined);
  const name = resolveReportsStatusName(row, statusNamesById);
  const count =
    readNumber(row.count) ??
    readNumber(row.task_count) ??
    readNumber(row.tasks_count) ??
    0;
  return {
    status_id: statusId,
    status_name: name,
    status_color: resolveReportsStatusColor(row),
    count,
    percent: readNumber(row.percent) ?? readNumber(row.percentage),
  };
}

function normalizeAssigneeRow(raw: unknown): TaskReportsAssigneeRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const ext = resolveReportsAssigneeExtension(row);
  const nestedAssignee =
    readNestedRecord(row.assignee) ??
    readNestedRecord(row.member) ??
    readNestedRecord(row.user);
  return {
    extension_number: ext,
    name:
      readString(row.name) ??
      readString(row.assignee_name) ??
      readString(row.user_name) ??
      readString(row.full_name) ??
      (nestedAssignee ? readString(nestedAssignee.name) : undefined) ??
      (nestedAssignee ? readString(nestedAssignee.user_name) : undefined),
    display_name:
      readString(row.display_name) ??
      (nestedAssignee ? readString(nestedAssignee.display_name) : undefined) ??
      (nestedAssignee ? readString(nestedAssignee.name) : undefined),
    total_tasks: readNumber(row.total_tasks) ?? readNumber(row.task_count),
    completed_tasks:
      readNumber(row.completed_tasks) ??
      readNumber(row.completed_count) ??
      readNumber(row.done_count),
    task_count: readNumber(row.task_count),
    todo_count: readNumber(row.todo_count) ?? readNumber(row.pending_count),
    pending_count: readNumber(row.pending_count) ?? readNumber(row.todo_count),
    in_progress_count: readNumber(row.in_progress_count),
    done_count: readNumber(row.done_count) ?? readNumber(row.completed_count),
    completed_count: readNumber(row.completed_count) ?? readNumber(row.done_count),
    overdue_count: readNumber(row.overdue_count),
    completion_percent:
      readNumber(row.completion_percent) ?? readNumber(row.completion_rate_percent),
  };
}

function normalizeTaskRow(raw: unknown): TaskReportsTaskRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = readNumber(row.id);
  const title = readString(row.title);
  if (id == null || !title) return null;
  const statusRecord = readNestedRecord(row.status);
  const statusName =
    readString(row.status_name) ??
    (statusRecord ? resolveReportsStatusName(statusRecord) : undefined);
  return {
    id,
    title,
    priority: readString(row.priority),
    status_name: statusName,
    status_color:
      readString(row.status_color) ??
      (statusRecord ? resolveReportsStatusColor({ status: statusRecord }) : undefined),
    due_date: readString(row.due_date),
    project_name: readString(row.project_name),
    days_in_progress: readNumber(row.days_in_progress),
    last_updated_at: readString(row.last_updated_at) ?? readString(row.updated_at),
    transferred_at: readString(row.transferred_at),
    from_extension: readString(row.from_extension),
    to_extension: readString(row.to_extension),
    phase: readString(row.phase),
    is_overdue: row.is_overdue === true,
    is_completed: row.is_completed === true,
    assignee_name: readString(row.assignee_name) ?? readString(row.user),
    assignee_extension:
      readString(row.primary_assignee_extension) ??
      readString(row.assignee_extension) ??
      readString(row.extension_number) ??
      readString(row.assignee_phone),
  };
}

function normalizeWeeklyTrendPoint(raw: unknown): TaskReportsWeeklyTrendPoint | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const weekIndex = readNumber(row.week_index);
  const weekLabel =
    readString(row.week_label) ??
    readString(row.label) ??
    (weekIndex == null ? undefined : `Wk ${weekIndex}`);
  if (!weekLabel) return null;
  const overdueCount =
    readNumber(row.overdue_count) ?? readNumber(row.overdue) ?? readNumber(row.count);
  const completionRate =
    readNumber(row.completion_rate_percent) ??
    readNumber(row.completion_rate) ??
    readNumber(row.percent);
  const value = overdueCount ?? completionRate ?? 0;
  return {
    week_index: readNumber(row.week_index),
    week_label: weekLabel,
    date:
      readString(row.date) ??
      readString(row.period_start) ??
      readString(row.start_date),
    period_start: readString(row.period_start),
    period_end: readString(row.period_end),
    value: Math.max(0, value),
    completion_rate_percent: completionRate,
    overdue_count: overdueCount,
  };
}

function normalizeWeeklyTrends(raw: unknown): TaskReportsWeeklyTrendPoint[] {
  return normalizeList(raw, normalizeWeeklyTrendPoint);
}

function normalizeTrendPoint(raw: unknown): TaskReportsTrendPoint | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const date =
    readString(row.date) ??
    readString(row.day) ??
    readString(row.period) ??
    readString(row.label) ??
    readString(row.start_date);
  if (!date) return null;
  const created = readNumber(row.created) ?? readNumber(row.created_count);
  const completed =
    readNumber(row.completed) ??
    readNumber(row.completed_count) ??
    readNumber(row.done_count);
  const pending = readNumber(row.pending) ?? readNumber(row.pending_count);
  const count =
    created ??
    readNumber(row.count) ??
    readNumber(row.total_tasks) ??
    readNumber(row.tasks) ??
    readNumber(row.executed_count) ??
    readNumber(row.value) ??
    readNumber(row.task_count) ??
    0;
  const completionRate =
    readNumber(row.completion_rate) ??
    readNumber(row.completion_rate_percent) ??
    readNumber(row.completion_percent) ??
    readNumber(row.percent);
  return {
    date,
    count,
    total_tasks: count,
    tasks: count,
    created,
    pending,
    completion_rate: completionRate,
    completed_count: completed,
    executed_count: readNumber(row.executed_count) ?? count,
  };
}

function normalizeProjectBreakdownRow(raw: unknown): TaskReportsProjectBreakdownRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name =
    readString(row.project_name) ?? readString(row.name) ?? readString(row.title);
  if (!name) return null;
  const progress = readNumber(row.progress_percent) ?? readNumber(row.progress);
  const delay = readNumber(row.delay_percent) ?? readNumber(row.delay);
  return {
    project_id: readNumber(row.project_id) ?? readNumber(row.id),
    project_name: name,
    color: readString(row.color),
    total_tasks:
      readNumber(row.total_tasks) ??
      readNumber(row.total) ??
      readNumber(row.task_count),
    completed_tasks:
      readNumber(row.completed_tasks) ?? readNumber(row.completed),
    pending_tasks: readNumber(row.pending_tasks) ?? readNumber(row.pending),
    overdue_tasks: readNumber(row.overdue_tasks) ?? readNumber(row.overdue),
    progress_percent: progress,
    delay_percent: delay,
    health: readString(row.health),
    health_label: readString(row.health_label) ?? readString(row.healthLabel),
  };
}

function normalizeActivityRow(raw: unknown): TaskReportsActivityRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title =
    readString(row.task_title) ??
    readString(row.title) ??
    readString(row.message) ??
    readString(row.description) ??
    readString(row.action);
  if (!title) return null;
  const idRaw = row.id;
  const id =
    typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : undefined;
  return {
    id,
    title,
    description: readString(row.description) ?? readString(row.message),
    subtitle: readString(row.subtitle),
    actor_name:
      readString(row.actor_name) ??
      readString(row.user_name) ??
      readString(row.user),
    actor_extension:
      readString(row.actor_extension) ??
      readString(row.extension_number) ??
      readString(row.extension),
    project_name: readString(row.project_name),
    occurred_at:
      readString(row.occurred_at) ??
      readString(row.created_at) ??
      readString(row.timestamp),
    badge: readString(row.badge) ?? readString(row.action) ?? readString(row.status),
    badge_tone: readString(row.badge_tone) ?? readString(row.badgeTone),
  };
}

function normalizeActiveIssueRow(raw: unknown): TaskReportsActiveIssueRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const title = readString(row.title) ?? readString(row.name);
  if (!title) return null;
  const idRaw = row.id;
  const id =
    typeof idRaw === "string" || typeof idRaw === "number" ? String(idRaw) : undefined;
  return {
    id,
    title,
    description: readString(row.description),
    subtitle: readString(row.subtitle),
    severity: readString(row.severity) ?? readString(row.level),
    priority: readString(row.priority),
    project_name: readString(row.project_name),
  };
}

function normalizeMemberTrendPeriods(
  row: Record<string, unknown>,
): TaskReportsMemberTrendRow["periods"] {
  const periodsRaw = row.periods ?? row.columns;
  if (Array.isArray(periodsRaw)) {
    return periodsRaw
      .map((item) => {
        if (item == null || typeof item !== "object") return null;
        const p = item as Record<string, unknown>;
        const value = readNumber(p.value) ?? readNumber(p.percent);
        const weekLabel = readString(p.week_label) ?? readString(p.label);
        return {
          date: readString(p.date) ?? readString(p.day),
          label: weekLabel,
          week_label: weekLabel,
          week_index: readNumber(p.week_index),
          value,
          percent: readNumber(p.percent) ?? value,
          delta_label: readString(p.delta_label) ?? readString(p.delta),
          completed: readNumber(p.completed),
          created: readNumber(p.created),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p != null);
  }

  const weeksRaw = row.weeks;
  if (weeksRaw != null && typeof weeksRaw === "object" && !Array.isArray(weeksRaw)) {
    const weeksRecord = weeksRaw as Record<string, unknown>;
    return Object.entries(weeksRecord).map(([label, rawValue], index) => {
      const percent = readNumber(rawValue) ?? 0;
      return {
        label,
        week_label: label,
        week_index: index + 1,
        percent,
        value: percent,
      };
    });
  }

  return undefined;
}

function normalizeMemberTrendRow(raw: unknown): TaskReportsMemberTrendRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const ext = resolveReportsAssigneeExtension(row);
  const periods = normalizeMemberTrendPeriods(row);
  const trendRecord = readNestedRecord(row.trend);
  const trend = trendRecord
    ? {
        delta_percent: readNumber(trendRecord.delta_percent),
        label: readString(trendRecord.label),
        direction: parsePeriodDeltaDirection(trendRecord.direction),
      }
    : undefined;
  const weeksRaw = row.weeks;
  const weeks =
    weeksRaw != null && typeof weeksRaw === "object" && !Array.isArray(weeksRaw)
      ? Object.fromEntries(
          Object.entries(weeksRaw as Record<string, unknown>)
            .map(([key, value]) => {
              const percent = readNumber(value);
              return percent == null ? null : [key, percent];
            })
            .filter((entry): entry is [string, number] => entry != null),
        )
      : undefined;

  return {
    extension_number: ext,
    name: readString(row.name),
    display_name: readString(row.display_name),
    periods,
    weeks,
    trend,
  };
}

function normalizeTrends(raw: unknown): TaskReportsTrendPoint[] {
  if (Array.isArray(raw)) {
    return normalizeList(raw, normalizeTrendPoint);
  }
  const record = readNestedRecord(raw);
  if (!record) return [];
  for (const key of ["points", "data", "series", "items", "days"] as const) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return normalizeList(nested, normalizeTrendPoint);
    }
  }
  return [];
}

function pickOverviewSection(
  source: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function normalizeList<T>(
  raw: unknown,
  mapRow: (item: unknown) => T | null,
): T[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(mapRow).filter((row): row is T => row != null);
}

function isResolvableStatusName(name: string): boolean {
  return name !== "Unknown" && !name.startsWith("Status ");
}

function mergeStatusNamesFromFilterStatuses(
  map: Map<number, string>,
  filters: Record<string, unknown>,
): void {
  const statuses = filters.statuses;
  if (!Array.isArray(statuses)) return;
  for (const item of statuses) {
    if (item == null || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = readNumber(row.id) ?? readNumber(row.status_id);
    const name = resolveReportsStatusName(row, map);
    if (id != null && isResolvableStatusName(name)) {
      map.set(id, name);
    }
  }
}

function mergeStatusNamesFromTaskList(
  map: Map<number, string>,
  list: unknown,
): void {
  if (!Array.isArray(list)) return;
  for (const item of list) {
    if (item == null || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const statusRecord = readNestedRecord(row.status);
    const id =
      readNumber(row.status_id) ?? (statusRecord ? readNumber(statusRecord.id) : undefined);
    const name =
      readString(row.status_name) ??
      (statusRecord ? resolveReportsStatusName(statusRecord, map) : undefined);
    if (id != null && name) map.set(id, name);
  }
}

function mergeStatusNamesFromBreakdown(
  map: Map<number, string>,
  breakdown: unknown,
): void {
  if (!Array.isArray(breakdown)) return;
  for (const item of breakdown) {
    if (item == null || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const statusRecord = readNestedRecord(row.status);
    const id =
      readNumber(row.status_id) ??
      readNumber(row.id) ??
      (statusRecord ? readNumber(statusRecord.id) : undefined);
    const name = resolveReportsStatusName(row, map);
    if (id != null && isResolvableStatusName(name)) {
      map.set(id, name);
    }
  }
}

function buildStatusNamesByIdMap(
  source: Record<string, unknown>,
  external?: ReadonlyMap<number, string>,
): Map<number, string> {
  const map = new Map<number, string>(external);
  const filters = source.filters;
  if (filters != null && typeof filters === "object") {
    mergeStatusNamesFromFilterStatuses(map, filters as Record<string, unknown>);
  }

  const taskLists = [
    pickOverviewSection(source, ["pending_tasks", "pendingTasks"]),
    pickOverviewSection(source, ["transfer_tasks", "transferTasks"]),
    pickOverviewSection(source, ["stale_in_progress_tasks", "staleInProgressTasks"]),
  ];
  for (const list of taskLists) {
    mergeStatusNamesFromTaskList(map, list);
  }

  mergeStatusNamesFromBreakdown(
    map,
    pickOverviewSection(source, ["status_breakdown", "statusBreakdown"]),
  );
  return map;
}

export function normalizeReportsOverview(
  raw: TaskReportsOverview | Record<string, unknown>,
  context: ReportsNormalizeContext = {},
): TaskReportsOverview {
  const source =
    raw != null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const statusNamesById = buildStatusNamesByIdMap(source, context.statusNamesById);

  const topAssigneesRaw = normalizeList(
    pickOverviewSection(source, ["top_assignees", "topAssignees"]),
    normalizeAssigneeRow,
  );
  const memberReportRaw = normalizeList(
    pickOverviewSection(source, [
      "member_report",
      "memberReport",
      "members",
      "member_breakdown",
      "assignee_breakdown",
    ]),
    normalizeAssigneeRow,
  );
  const memberReportSource =
    memberReportRaw.length > 0 ? memberReportRaw : topAssigneesRaw;

  return {
    filters: (source.filters as TaskReportsOverview["filters"]) ?? undefined,
    list_limits: normalizeListLimits(
      pickOverviewSection(source, ["list_limits", "listLimits"]),
    ),
    summary: normalizeReportsSummary(source.summary),
    status_breakdown: normalizeList(
      pickOverviewSection(source, ["status_breakdown", "statusBreakdown"]),
      (item) => normalizeStatusRow(item, statusNamesById),
    ),
    top_assignees: enrichAssigneeRows(topAssigneesRaw, context),
    member_report: enrichAssigneeRows(memberReportSource, context),
    pending_tasks: normalizeList(
      pickOverviewSection(source, ["pending_tasks", "pendingTasks"]),
      normalizeTaskRow,
    ),
    transfer_tasks: normalizeList(
      pickOverviewSection(source, ["transfer_tasks", "transferTasks"]),
      normalizeTaskRow,
    ),
    stale_in_progress_tasks: normalizeList(
      pickOverviewSection(source, [
        "stale_in_progress_tasks",
        "staleInProgressTasks",
      ]),
      normalizeTaskRow,
    ),
    trends: normalizeTrends(
      pickOverviewSection(source, ["trends", "trend", "workload_trend", "task_trends"]),
    ),
    completion_trends: normalizeTrends(
      pickOverviewSection(source, [
        "completion_trends",
        "completion_trend",
        "completion_rate_trend",
      ]),
    ),
    weekly_completion_trends: normalizeWeeklyTrends(
      pickOverviewSection(source, [
        "weekly_completion_trends",
        "weeklyCompletionTrends",
        "weekly_completion_trend",
      ]),
    ),
    overdue_trends: normalizeWeeklyTrends(
      pickOverviewSection(source, [
        "overdue_trends",
        "overdueTrends",
        "overdue_trend",
      ]),
    ),
    member_trends: normalizeList(
      pickOverviewSection(source, ["member_trends", "memberTrends", "member_trend"]),
      normalizeMemberTrendRow,
    ),
    project_breakdown: normalizeList(
      pickOverviewSection(source, ["project_breakdown", "projectBreakdown"]),
      normalizeProjectBreakdownRow,
    ),
    recent_activity: normalizeList(
      pickOverviewSection(source, ["recent_activity", "recentActivity", "activity"]),
      normalizeActivityRow,
    ),
    active_issues: normalizeList(
      pickOverviewSection(source, ["active_issues", "activeIssues", "issues"]),
      normalizeActiveIssueRow,
    ),
  };
}

export function resolveSummaryMetric(
  summary: TaskReportsSummary,
  key: keyof TaskReportsSummary,
  fallback = 0,
): number {
  const value = summary[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function statusCountByKeyword(
  rows: TaskReportsStatusRow[],
  keywords: readonly string[],
): number {
  for (const row of rows) {
    const name = row.status_name.toLowerCase();
    if (keywords.some((keyword) => name.includes(keyword))) {
      return row.count;
    }
  }
  return 0;
}

/** In-progress count from summary or status_breakdown (Postman overview). */
export function resolveInProgressCount(
  summary: TaskReportsSummary,
  statusRows: TaskReportsStatusRow[],
): number {
  const fromSummary = resolveSummaryMetric(summary, "in_progress_tasks", -1);
  if (fromSummary >= 0) return fromSummary;

  const fromStatus = statusCountByKeyword(statusRows, ["in progress", "in_progress", "inprogress"]);
  if (fromStatus > 0) return fromStatus;

  const total = resolveSummaryMetric(summary, "total_tasks");
  const completed = resolveSummaryMetric(summary, "completed_tasks");
  const pending = resolveSummaryMetric(summary, "pending_tasks");
  const overdue = resolveSummaryMetric(summary, "overdue_tasks");
  return Math.max(0, total - completed - pending - overdue);
}

export function resolveStaleStatusCount(statusRows: TaskReportsStatusRow[]): number {
  return statusCountByKeyword(statusRows, ["stale"]);
}

export function resolveAverageTimeLabel(summary: TaskReportsSummary): string {
  const hours = summary.total_hours;
  const completed = resolveSummaryMetric(summary, "completed_tasks");
  if (hours == null || !Number.isFinite(hours) || hours <= 0 || completed <= 0) {
    return "0h 0m";
  }
  return formatReportsHours(hours / completed);
}

export function resolveTaskAssigneeDisplay(
  task: TaskReportsTaskRow,
  hierarchyExtensions?: unknown[] | null,
): string {
  const ext = task.assignee_extension?.trim();
  if (ext) {
    return formatWorkloadMemberLabel(ext, hierarchyExtensions, {
      name: task.assignee_name,
      display_name: task.assignee_name,
    });
  }
  return task.assignee_name?.trim() || "Unassigned";
}

function formatReportsDeltaDirection(direction: TaskReportsPeriodDelta["direction"]): string {
  if (direction === "down") return "↓";
  if (direction === "up") return "↑";
  return "•";
}

export function formatReportsDelta(delta: TaskReportsPeriodDelta | undefined): string | null {
  if (!delta) return null;
  if (delta.label?.trim()) return delta.label.trim();
  const pct = delta.percent;
  if (pct == null || !Number.isFinite(pct)) return null;
  const dir = formatReportsDeltaDirection(delta.direction);
  return `${dir} ${Math.abs(pct).toFixed(0)}% vs last period`;
}

export function statusRowPercent(row: TaskReportsStatusRow, total: number): number {
  if (row.percent != null && Number.isFinite(row.percent)) return row.percent;
  if (total <= 0) return 0;
  return (row.count / total) * 100;
}

export function priorityBadgeClass(priority: string | null | undefined): string {
  const p = (priority ?? "").toLowerCase();
  if (p.includes("urgent") || p.includes("critical") || p.includes("high")) {
    return "reports-priority--high";
  }
  if (p.includes("medium") || p.includes("normal")) return "reports-priority--medium";
  if (p.includes("low")) return "reports-priority--low";
  return "reports-priority--default";
}

export function formatReportsHours(hours: number | undefined): string {
  if (hours == null || !Number.isFinite(hours) || hours <= 0) return "0h";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
