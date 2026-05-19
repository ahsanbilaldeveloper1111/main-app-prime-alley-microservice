/**
 * Planner task detail page — types, constants, and pure helpers (no React tree).
 */

export const PLANNER_TASK_DETAIL_WITH_RELATIONS = [
  "project",
  "project.members",
  "status",
  "assignees",
  "labels",
  "comments",
  "parent",
  "parent.status",
  "parent.project",
  "children",
  "children.status",
  "children.assignees",
] as const;

export function readNestedRecurringRecord(
  task: Record<string, unknown>,
): Record<string, unknown> | null {
  const top = task.recurring;
  if (top && typeof top === "object" && !Array.isArray(top)) {
    return top as Record<string, unknown>;
  }
  return null;
}

export function pickTaskScalar(task: Record<string, unknown>, key: string): unknown {
  const top = task[key];
  if (top != null && top !== "") return top;
  const nested = readNestedRecurringRecord(task);
  if (nested) {
    const nv = nested[key];
    if (nv != null && nv !== "") return nv;
  }
  return undefined;
}

/** Coerce API values for display/type checks; objects become '' to avoid '[object Object]'. */
export function plannerDetailScalarString(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  return "";
}

export function getStatusVariant(status: string | { name?: string } | null | undefined): string {
  const raw =
    typeof status === "object" && status != null
      ? plannerDetailScalarString(status.name)
      : plannerDetailScalarString(status);
  const s = raw.toLowerCase();
  if (s.includes("progress")) return "warning";
  if (s.includes("review")) return "secondary";
  if (s.includes("overdue")) return "danger";
  if (s.includes("complete")) return "success";
  return "info";
}

export function plannerTaskTypeFromTask(
  task: Record<string, unknown> | null | undefined,
): "todo" | "regular" | "recurring" {
  if (task == null) return "regular";
  const t = plannerDetailScalarString(task.type ?? task.task_type).toLowerCase();
  if (t === "todo") return "todo";
  if (t === "recurring") return "recurring";
  if (t === "regular") return "regular";
  if (task.is_recurring === true || task.is_recurring === 1) return "recurring";
  const nested = readNestedRecurringRecord(task);
  if (nested) {
    const nt = plannerDetailScalarString(nested.type).toLowerCase();
    if (nt === "recurring") return "recurring";
    if (nested.is_recurring === true || nested.is_recurring === 1) return "recurring";
  }
  const freq = pickTaskScalar(task, "frequency");
  const hasRecurringSignals =
    (typeof freq === "string" && freq.trim() !== "") ||
    pickTaskScalar(task, "repeat_interval") != null ||
    pickTaskScalar(task, "last_run_at") != null ||
    pickTaskScalar(task, "next_run_at") != null;
  if (hasRecurringSignals && t !== "todo") return "recurring";
  return "regular";
}

export function readTaskScheduleField(
  task: Record<string, unknown>,
  field: "last_run_at" | "next_run_at",
): string | undefined {
  const from = (o: Record<string, unknown> | null | undefined): string | undefined => {
    if (!o) return undefined;
    const v = o[field];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  return from(task) ?? from(readNestedRecurringRecord(task));
}

const PLANNER_DETAIL_LONG_DATE: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export function formatPlannerDetailDateLong(value: string | null | undefined): string {
  if (value == null || String(value).trim() === "") return "—";
  const s = String(value).trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})(?:$|[^\d])/.exec(s);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    const local = new Date(y, m, day);
    if (!Number.isNaN(local.getTime())) {
      return local.toLocaleDateString("en-GB", PLANNER_DETAIL_LONG_DATE);
    }
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", PLANNER_DETAIL_LONG_DATE);
}

export function formatPlannerDetailDateTime(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === "") return "—";
  const d = new Date(String(iso).trim());
  if (Number.isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString("en-GB", PLANNER_DETAIL_LONG_DATE);
  const timePart = d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

export function taskTypeBadgeLabel(kind: "todo" | "regular" | "recurring"): string {
  if (kind === "todo") return "Todo";
  if (kind === "recurring") return "Recurring";
  return "Regular";
}

export function formatFrequencyLabel(raw: unknown): string {
  const s = plannerDetailScalarString(raw).trim().toLowerCase();
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatRepeatOnForDetail(frequency: unknown, repeatOn: unknown): string {
  const f = plannerDetailScalarString(frequency).toLowerCase();
  const ro = plannerDetailScalarString(repeatOn).trim();
  if (!ro) return "—";
  if (f === "weekly") {
    const day = ro.toLowerCase();
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  if (f === "monthly") return `Day ${ro} of month`;
  return ro;
}

export function formatDueTimeForDetail(raw: unknown): string {
  if (raw == null || raw === "") return "—";
  const s = plannerDetailScalarString(raw).trim();
  if (!s) return "—";
  if (s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
  }
  return s;
}

export function getPriorityVariant(priority: string): string {
  const p = (priority || "").toLowerCase();
  if (p === "urgent" || p === "high") return "danger";
  if (p === "normal") return "warning";
  return "success";
}

export function formatPriorityLabel(priority: string): string {
  const p = String(priority || "").trim().toLowerCase();
  if (!p) return "—";
  if (p === "normal") return "Medium";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function formatActivityDate(dateString: string): string {
  return formatPlannerDetailDateTime(dateString);
}

type HierarchyExtRow = Readonly<{
  id?: string | number;
  extension_number?: string | number;
  name?: string;
}>;

export function getExtensionDisplay(
  extNumber: string,
  hierarchyDataExtensions: unknown,
): { name: string; initials: string } {
  if (!hierarchyDataExtensions || !extNumber) {
    return { name: extNumber, initials: (extNumber || "UN").toUpperCase().slice(0, 2) };
  }
  const list = hierarchyDataExtensions as HierarchyExtRow[];
  const extension = list.find(
    (ext) =>
      String(ext.id) === extNumber || String(ext.extension_number ?? "") === extNumber,
  );
  const name = extension?.name || extNumber;
  if (name === extNumber) {
    return { name, initials: (extNumber || "UN").toUpperCase().slice(0, 2) };
  }
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  return { name, initials };
}

export function recurringIntervalSuffix(frequencyRaw: unknown): string {
  const f = plannerDetailScalarString(frequencyRaw).toLowerCase();
  if (f === "daily") return "day(s)";
  if (f === "weekly") return "week(s)";
  if (f === "monthly") return "month(s)";
  if (f === "yearly") return "year(s)";
  return "";
}

export type PlannerTaskDetailKind = ReturnType<typeof plannerTaskTypeFromTask>;

export type PlannerTaskDetailViewModel = Readonly<{
  taskId: string;
  statusName: string;
  priorityVal: string;
  projectName: string;
  watchers: unknown[];
  taskRecord: Record<string, unknown>;
  detailTaskKind: PlannerTaskDetailKind;
  showRecurringBlock: boolean;
  startDateDisplay: string | null;
  endDateDisplay: string | null;
  dueTimeDetailLabel: string;
  lastRunAt: string | undefined;
  nextRunAt: string | undefined;
}>;

/** Loose API task shape for detail VM builder (relations vary by API). */
export type PlannerTaskDetailApiTask = Record<string, unknown> & {
  id?: number;
  task_id?: string;
  title?: string;
  priority?: string;
  due_date?: string;
  due_time?: unknown;
  start_date?: string;
  status?: unknown;
  project?: unknown;
  assignees?: unknown[];
  watchers?: unknown;
  watcher_numbers?: string[];
};

function resolvePlannerDetailTaskId(task: PlannerTaskDetailApiTask): string {
  if (task.task_id) {
    return String(task.task_id);
  }
  if (task.id !== undefined && task.id !== null) {
    return `#${task.id}`;
  }
  return "—";
}

function resolvePlannerDetailStatusName(statusObj: unknown): string {
  if (typeof statusObj === "object" && statusObj != null && "name" in statusObj) {
    const fromName = plannerDetailScalarString((statusObj as { name?: unknown }).name);
    return fromName || "N/A";
  }
  if (typeof statusObj === "string" && statusObj.trim() !== "") {
    return statusObj;
  }
  const fallback = plannerDetailScalarString(statusObj);
  return fallback || "N/A";
}

function resolvePlannerDetailProjectName(proj: unknown): string {
  if (typeof proj === "object" && proj != null && "name" in proj) {
    const fromName = plannerDetailScalarString((proj as { name?: unknown }).name);
    return fromName || "No Project";
  }
  return "No Project";
}

export function resolvePlannerDetailDateDisplay(
  primary: string | null | undefined,
  fallback: unknown,
): string | null {
  if (typeof primary === "string" && primary.trim() !== "") return primary;
  if (typeof fallback === "string" && fallback.trim() !== "") return fallback;
  return null;
}

export type PlannerTaskParentRef = Readonly<{
  id: number;
  title?: string;
  reference?: string;
}>;

export function resolvePlannerTaskParentRef(parent: unknown): PlannerTaskParentRef | null {
  if (typeof parent !== "object" || parent == null) return null;
  const id = (parent as { id?: unknown }).id;
  if (typeof id !== "number" || !Number.isFinite(id)) return null;
  const row = parent as { title?: unknown; reference?: unknown };
  return {
    id,
    title: typeof row.title === "string" ? row.title : undefined,
    reference: typeof row.reference === "string" ? row.reference : undefined,
  };
}

function resolvePlannerDetailWatchers(
  watchersRaw: unknown,
  watcherNumbers: string[] | undefined,
): unknown[] {
  if (Array.isArray(watchersRaw)) {
    return watchersRaw;
  }
  if (Array.isArray(watcherNumbers)) {
    return watcherNumbers.map((extNum: string) => ({ extension_number: extNum }));
  }
  return [];
}

export function buildPlannerTaskDetailViewModel(task: PlannerTaskDetailApiTask): PlannerTaskDetailViewModel {
  const taskId = resolvePlannerDetailTaskId(task);
  const statusName = resolvePlannerDetailStatusName(task.status);
  const priorityVal = String(task.priority || "normal");
  const projectName = resolvePlannerDetailProjectName(task.project);
  const watchers = resolvePlannerDetailWatchers(task.watchers, task.watcher_numbers);

  const taskRecord = task as Record<string, unknown>;
  const detailTaskKind = plannerTaskTypeFromTask(taskRecord);
  const pickScalar = (key: string) => pickTaskScalar(taskRecord, key);
  const lastRunAt = readTaskScheduleField(taskRecord, "last_run_at");
  const nextRunAt = readTaskScheduleField(taskRecord, "next_run_at");
  const freqScalar = pickScalar("frequency");
  const showRecurringBlock =
    detailTaskKind === "recurring" ||
    lastRunAt != null ||
    nextRunAt != null ||
    (typeof freqScalar === "string" && freqScalar.trim() !== "");
  const pickedStartDate = pickScalar("start_date");
  const startDateDisplay = resolvePlannerDetailDateDisplay(task.start_date, pickedStartDate);
  const pickedEndDate = pickScalar("end_date");
  const endDateDisplay = resolvePlannerDetailDateDisplay(task.due_date, pickedEndDate);
  const dueTimeDetailLabel = formatDueTimeForDetail(task.due_time);

  return {
    taskId,
    statusName,
    priorityVal,
    projectName,
    watchers,
    taskRecord,
    detailTaskKind,
    showRecurringBlock,
    startDateDisplay,
    endDateDisplay,
    dueTimeDetailLabel,
    lastRunAt,
    nextRunAt,
  };
}

/** Normalizes task comments API (bare array or `{ data: [] }`). */
export function normalizeTaskCommentsResponse(
  response: unknown,
): Array<{
  id: number;
  extension_number?: string;
  user?: { extension_number?: string };
  created_at?: string;
  comment?: string;
}> {
  if (Array.isArray(response)) {
    return response as Array<{
      id: number;
      extension_number?: string;
      user?: { extension_number?: string };
      created_at?: string;
      comment?: string;
    }>;
  }
  if (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    return (response as { data: unknown[] }).data as Array<{
      id: number;
      extension_number?: string;
      user?: { extension_number?: string };
      created_at?: string;
      comment?: string;
    }>;
  }
  return [];
}
