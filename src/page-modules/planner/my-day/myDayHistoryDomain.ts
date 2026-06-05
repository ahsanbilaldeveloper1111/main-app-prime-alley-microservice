import {
  readMyDayTaskCompletedFromRow,
  resolveEstimateMinutesFromRow,
  resolveMyDayTaskCount,
  resolveProjectFromRow,
  toMinutesDisplay,
} from "@page-modules/planner/my-day/myDayDomain";
import type {
  MyDayCapacityPayload,
  MyDayDailyLogPayload,
  MyDayHistorySource,
  MyDayTasksMeta,
  MyDayTasksPayload,
} from "@utils/tasks";
import {
  getMyDayCapacity,
  getMyDayDailyLogByDate,
  getMyDayPastDaySnapshot,
  listMyDayTasks,
  parseMyDayHistorySource,
} from "@utils/tasks";

export type MyDayHistoryTaskRow = Readonly<{
  rowKey: string;
  id: number | null;
  title: string;
  status: "Active" | "Completed" | "Deleted";
  estimateLabel: string;
  projectName: string;
  isDeleted: boolean;
}>;

export type MyDayPastDayStats = Readonly<{
  tasksPlanned: number;
  tasksCompleted: number;
  plannedMinutes: number;
  completedMinutes: number;
  originalCapacityMinutes: number;
  capacityUsedPercent: number;
  completionRatePercent: number;
}>;

export function resolveMyDayCompletionRatePercent(
  tasksPlanned: number,
  tasksCompleted: number,
): number {
  if (tasksPlanned <= 0) return 0;
  return Math.round((tasksCompleted / tasksPlanned) * 1000) / 10;
}

/** Live stats for the current My Day plan (bottom-of-page daily summary). */
export function buildLiveMyDayStats(
  tasks: ReadonlyArray<{ isCompleted: boolean; estimateMinutes: number }>,
  meta: MyDayTasksMeta,
  capacityMinutes: number,
  plannedMinutesFromApi: number,
  options?: Readonly<{ capacityUsedPercent?: number | null }>,
): MyDayPastDayStats {
  const completedRows = tasks.filter((task) => task.isCompleted);
  const tasksPlanned = resolveMyDayTaskCount(tasks.length, meta);
  const tasksCompleted = readNumber(
    meta.tasks_completed,
    meta.completed_count,
    completedRows.length,
  );
  const plannedFromEstimates = tasks.reduce(
    (sum, task) => sum + Math.max(0, task.estimateMinutes),
    0,
  );
  const plannedMinutes = readNumber(
    meta.planned_minutes,
    plannedFromEstimates > 0 ? plannedFromEstimates : plannedMinutesFromApi,
  );
  const completedMinutes = completedRows.reduce(
    (sum, task) => sum + Math.max(0, task.estimateMinutes),
    0,
  );
  const originalCapacityMinutes = Math.max(1, capacityMinutes);
  const fromApi = options?.capacityUsedPercent;
  let capacityUsedPercent =
    fromApi != null && Number.isFinite(fromApi) ? Math.max(0, Number(fromApi)) : 0;
  if (capacityUsedPercent <= 0) {
    capacityUsedPercent = Math.round((plannedMinutes / originalCapacityMinutes) * 1000) / 10;
  }

  return {
    tasksPlanned,
    tasksCompleted,
    plannedMinutes,
    completedMinutes,
    originalCapacityMinutes,
    capacityUsedPercent,
    completionRatePercent: resolveMyDayCompletionRatePercent(tasksPlanned, tasksCompleted),
  };
}

function readTitle(row: Record<string, unknown>, id: number | null): string {
  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (title) return title;
  if (id != null && id > 0) return `Task #${id}`;
  return "Deleted task";
}

function readTaskId(row: Record<string, unknown>): number | null {
  const raw = row.task_id ?? row.id;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

function isDeletedHistoryRow(row: Record<string, unknown>): boolean {
  return (
    row.is_deleted === true ||
    row.deleted === true ||
    row.was_deleted === true ||
    row.status === "deleted"
  );
}

export function mapHistoryTaskRow(
  row: unknown,
  status: "Active" | "Completed" | "Deleted",
): MyDayHistoryTaskRow | null {
  if (row == null || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const deleted = status === "Deleted" || isDeletedHistoryRow(record);
  const id = readTaskId(record);
  const title = readTitle(record, id);
  if (!title && id == null) return null;

  const minutes = resolveEstimateMinutesFromRow(record);
  const estimateLabel = minutes > 0 ? toMinutesDisplay(minutes) : "No estimate";
  const project = resolveProjectFromRow(record);
  const rowKey =
    id == null ? `deleted-${title.replace(/\s+/g, "-").slice(0, 40)}` : `${status}-${id}`;

  return {
    rowKey,
    id,
    title,
    status: deleted ? "Deleted" : status,
    estimateLabel,
    projectName: project.label,
    isDeleted: deleted,
  };
}

function collectTaskArrays(payload: Record<string, unknown>): unknown[] {
  const chunks: unknown[] = [];
  const keys = ["tasks", "snapshots", "task_snapshots", "entries"];
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) chunks.push(...value);
  }
  const deleted = payload.deleted_tasks;
  if (Array.isArray(deleted)) chunks.push(...deleted);
  return chunks;
}

function appendUniqueHistoryRows(
  rows: MyDayHistoryTaskRow[],
  seen: Set<string>,
  mapped: MyDayHistoryTaskRow | null,
): void {
  if (mapped == null || seen.has(mapped.rowKey)) return;
  seen.add(mapped.rowKey);
  rows.push(mapped);
}

export function mapHistoryRowsFromDailyLog(log: MyDayDailyLogPayload): MyDayHistoryTaskRow[] {
  const body = log as Record<string, unknown>;
  const rows: MyDayHistoryTaskRow[] = [];
  const seen = new Set<string>();
  const push = (mapped: MyDayHistoryTaskRow | null) => appendUniqueHistoryRows(rows, seen, mapped);

  for (const item of collectTaskArrays(body)) {
    if (item == null || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const deleted = isDeletedHistoryRow(record);
    if (deleted) {
      push(mapHistoryTaskRow(record, "Deleted"));
      continue;
    }
    const completed = readMyDayTaskCompletedFromRow(record);
    push(mapHistoryTaskRow(record, completed ? "Completed" : "Active"));
  }

  return rows;
}

export function mapHistoryRowsFromTasksPayload(
  active: unknown[],
  completed: unknown[],
  deletedTasks: unknown[] = [],
): MyDayHistoryTaskRow[] {
  const rows: MyDayHistoryTaskRow[] = [];
  const seen = new Set<string>();
  const push = (mapped: MyDayHistoryTaskRow | null) => appendUniqueHistoryRows(rows, seen, mapped);

  for (const row of active) push(mapHistoryTaskRow(row, "Active"));
  for (const row of completed) push(mapHistoryTaskRow(row, "Completed"));
  for (const row of deletedTasks) {
    push(mapHistoryTaskRow(row, "Deleted"));
  }

  return rows;
}

export function mapHistoryFromPastDaySnapshot(payload: MyDayTasksPayload): MyDayHistoryTaskRow[] {
  return mapHistoryRowsFromTasksPayload(
    payload.active ?? [],
    payload.completed ?? [],
    payload.deleted_tasks ?? [],
  );
}

export function pastDayPayloadToDailyLogShape(payload: MyDayTasksPayload): MyDayDailyLogPayload {
  const root = payload as MyDayTasksPayload & Record<string, unknown>;
  const meta = payload.meta ?? {};
  return {
    log_date: payload.plan_date,
    plan_date: payload.plan_date,
    tasks_planned: meta.tasks_planned,
    tasks_completed: meta.tasks_completed,
    planned_minutes: meta.planned_minutes,
    completed_minutes: meta.completed_minutes,
    effective_capacity_minutes:
      typeof root.effective_capacity_minutes === "number"
        ? root.effective_capacity_minutes
        : undefined,
    capacity_used_percent:
      typeof root.capacity_used_percent === "number" ? root.capacity_used_percent : undefined,
    deleted_tasks: payload.deleted_tasks,
    meta,
    history_source: payload.history_source ?? undefined,
  };
}

export function formatHistorySourceLabel(source: MyDayHistorySource | null | undefined): string {
  if (!source) return "";
  if (source === "daily_log") return "End-of-day snapshot";
  return "My Day plan entries";
}

export type MyDayHistoryLoadResult = Readonly<{
  rows: MyDayHistoryTaskRow[];
  stats: MyDayPastDayStats;
  historySource: MyDayHistorySource | null;
  historySourceLabel: string;
  deletedCount: number;
  readOnly: boolean;
}>;

function isNotFoundError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 404;
}

/** Postman: `past-days` primary; rebuilds from `daily_logs` when `history_source: daily_log`. */
export async function loadMyDayHistoryForDate(date: string): Promise<MyDayHistoryLoadResult> {
  let capacityPayload: MyDayCapacityPayload | null = null;
  try {
    capacityPayload = await getMyDayCapacity({ date });
  } catch {
    capacityPayload = null;
  }

  try {
    const past = await getMyDayPastDaySnapshot(date);
    if (pastDayHasHistoryContent(past)) {
      const rows = mapHistoryFromPastDaySnapshot(past);
      const historySource = parseMyDayHistorySource(past.history_source) ?? "daily_log";
      const logShape = historySource === "daily_log" ? pastDayPayloadToDailyLogShape(past) : null;
      return buildHistoryLoadResult(
        rows,
        past.meta ?? {},
        capacityPayload,
        logShape,
        historySource,
        past.read_only === true,
      );
    }
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  try {
    const log = await getMyDayDailyLogByDate(date);
    const rows = mapHistoryRowsFromDailyLog(log);
    if (rows.length > 0 || log.tasks_planned != null) {
      return buildHistoryLoadResult(
        rows,
        log.meta ?? {},
        capacityPayload,
        log,
        parseMyDayHistorySource(log.history_source) ?? "daily_log",
        true,
      );
    }
  } catch (error) {
    if (!isNotFoundError(error)) throw error;
  }

  const tasks = await listMyDayTasks({ date });
  const rows = mapHistoryRowsFromTasksPayload(
    tasks.active ?? [],
    tasks.completed ?? [],
    tasks.deleted_tasks ?? [],
  );
  return buildHistoryLoadResult(
    rows,
    tasks.meta ?? {},
    capacityPayload,
    null,
    parseMyDayHistorySource(tasks.history_source) ?? "my_day_entries",
    tasks.read_only === true,
  );
}

export function pastDayHasHistoryContent(payload: MyDayTasksPayload): boolean {
  const active = payload.active?.length ?? 0;
  const completed = payload.completed?.length ?? 0;
  const deleted = payload.deleted_tasks?.length ?? 0;
  if (active + completed + deleted > 0) return true;
  if (payload.history_source === "daily_log") return true;
  const meta = payload.meta ?? {};
  return meta.tasks_planned != null || meta.planned_minutes != null;
}

export function buildHistoryLoadResult(
  rows: MyDayHistoryTaskRow[],
  meta: MyDayTasksMeta,
  capacity: MyDayCapacityPayload | null,
  log: MyDayDailyLogPayload | null,
  historySource: MyDayHistorySource | null,
  readOnly = false,
): MyDayHistoryLoadResult {
  const deletedCount = rows.filter((row) => row.isDeleted).length;
  return {
    rows,
    stats: buildPastDayStats(meta, capacity, log),
    historySource,
    historySourceLabel: formatHistorySourceLabel(historySource),
    deletedCount,
    readOnly,
  };
}


function readNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return 0;
}

export function buildPastDayStats(
  meta: MyDayTasksMeta,
  capacity?: MyDayCapacityPayload | null,
  log?: MyDayDailyLogPayload | null,
): MyDayPastDayStats {
  const logRecord = (log ?? {}) as Record<string, unknown>;
  const tasksPlanned = readNumber(
    logRecord.tasks_planned,
    meta.tasks_planned,
    meta.active_count != null && meta.completed_count != null
      ? meta.active_count + meta.completed_count
      : undefined,
  );
  const tasksCompleted = readNumber(
    logRecord.tasks_completed,
    meta.tasks_completed,
    meta.completed_count,
  );
  const plannedMinutes = readNumber(
    logRecord.planned_minutes,
    meta.planned_minutes,
    capacity?.planned_minutes,
  );
  const completedMinutes = readNumber(
    logRecord.completed_minutes,
    meta.completed_minutes,
    capacity?.completed_minutes,
  );
  const originalCapacityMinutes = readNumber(
    logRecord.effective_capacity_minutes,
    logRecord.original_capacity_minutes,
    capacity?.effective_capacity_minutes,
    capacity?.override_capacity_minutes,
    capacity?.default_capacity_minutes,
    logRecord.default_capacity_minutes,
    logRecord.override_capacity_minutes,
  ) || 8 * 60;

  let capacityUsedPercent = readNumber(
    logRecord.capacity_used_percent,
    logRecord.load_percent,
  );
  if (capacityUsedPercent <= 0 && originalCapacityMinutes > 0) {
    capacityUsedPercent = Math.round((plannedMinutes / originalCapacityMinutes) * 1000) / 10;
  }

  return {
    tasksPlanned,
    tasksCompleted,
    plannedMinutes,
    completedMinutes,
    originalCapacityMinutes,
    capacityUsedPercent,
    completionRatePercent: resolveMyDayCompletionRatePercent(tasksPlanned, tasksCompleted),
  };
}

export function formatPastDayStatsLine(stats: MyDayPastDayStats): string {
  const pct =
    stats.capacityUsedPercent > 0
      ? `${Math.round(stats.capacityUsedPercent)}% of capacity used`
      : "0% of capacity used";
  return `${stats.tasksPlanned} planned · ${stats.tasksCompleted} completed · ${toMinutesDisplay(stats.plannedMinutes)} used of ${toMinutesDisplay(stats.originalCapacityMinutes)} · ${pct}`;
}
