/**
 * Planner tasks listing — shared types, constants, and pure helpers (no React tree).
 */
import type { Dispatch, SetStateAction } from "react";
import moment from "moment";
import type { ListTasksSummary } from "@utils/tasks";
import { extensionOrIdToTrimmedString } from "@planner/projectTabsContentUtils";
import { ALL_STATUS_VALUE } from "@utils/taskListing/plannerTasksQueryParams";
import {
  isStoredAsUtcMidnightCalendarDue,
  parseApiDueTimeToTimeInput,
  shouldSuppressDueTimeInListCell,
} from "@utils/plannerTaskDueTime";

export interface Task {
  id: number;
  title: string;
  task_type: string;
  assigned_to: string | null;
  assigned_to_name?: string;
  priority: "low" | "medium" | "high" | "urgent" | null;
  due_date: string | null;
  notes: string | null;
  repeat_status: string | null;
  status: "pending" | "completed" | "overdue";
  workflowStatus: { id: number; name: string; color?: string } | null;
  rawData?: any;
}

export interface ApiTask {
  id: number;
  task_id?: string;
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  due_time?: string;
  project?: {
    id: number;
    name: string;
    members?: unknown[];
    owner_extension_number?: string | null;
  } | null;
  status?: { id: number; name: string } | null;
  assignees?: Array<{ extension_number?: string | number | null }>;
  extension_number?: string;
  owner_extension_number?: string | null;
  created_by_extension_number?: string | null;
  extension_numbers?: string[];
  is_completed?: boolean;
  type?: string;
  estimated_duration_minutes?: number | null;
  estimated_minutes?: number | null;
  already_in_my_day?: boolean;
  is_in_my_day?: boolean;
  in_my_day?: boolean;
}

export interface TasksListingPageProps {
  omitTodoTaskType?: boolean;
  sidebarProject?: {
    id: number;
    name: string;
    color?: string;
    statuses?: any[];
    labels?: any[];
    members?: unknown[];
    owner_extension_number?: string | null;
  };
  hierarchyExtensionsFromParent?: unknown[];
  embeddedListRefreshSignal?: number;
  onEmbeddedListSummary?: (summary: ListTasksSummary | undefined) => void;
}

export function apiDueTimeFromPlannerTaskRow(row: Task): string | undefined {
  const raw = row.rawData;
  if (raw == null || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const t = o.due_time ?? o.dueTime;
  if (typeof t === "string" && t.trim() !== "") return t;
  return undefined;
}

export function resolvePlannerListTaskDueDate(apiTask: ApiTask): string | null {
  if (!apiTask.due_date) return null;
  const raw = apiTask.due_date;
  const timePart = apiTask.due_time?.trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  if (timePart && isDateOnly) {
    return `${raw}T${timePart}`;
  }
  if (
    timePart &&
    isStoredAsUtcMidnightCalendarDue(raw) &&
    !shouldSuppressDueTimeInListCell(raw, timePart)
  ) {
    const ymd = moment.utc(raw).format("YYYY-MM-DD");
    const wall = parseApiDueTimeToTimeInput(timePart);
    return wall ? `${ymd}T${wall}:00` : raw;
  }
  return raw;
}

export type HierarchyExtension = {
  id?: string;
  extension_number?: string;
  extension?: string | number;
  name?: string;
  display_name?: string;
  user_id?: string | number;
  user?: {
    name?: string | null;
    display_name?: string | null;
  } | null;
};

export function isExtensionPlaceholderLabel(label: string, extension: string): boolean {
  const normalized = label.trim();
  const ext = extension.trim();
  if (!normalized) return true;
  if (ext && normalized === ext) return true;
  return /^\d+$/.test(normalized);
}

export function lookupHierarchyExtensionDisplayName(
  extNumber: string | number | null | undefined,
  hierarchyDataExtensions: unknown[] | null | undefined,
): string {
  const trimmed =
    extNumber == null || extNumber === "" ? "" : String(extNumber).trim();
  if (!trimmed) return "";
  if (!Array.isArray(hierarchyDataExtensions)) return trimmed;
  const ext = hierarchyDataExtensions.find((e) => {
    const item = e as HierarchyExtension & { extension?: string | number };
    const id = item.id == null ? "" : String(item.id).trim();
    const en =
      item.extension_number == null ? "" : String(item.extension_number).trim();
    const extension =
      item.extension == null ? "" : String(item.extension).trim();
    return id === trimmed || en === trimmed || extension === trimmed;
  }) as HierarchyExtension | undefined;
  const name =
    ext?.user?.name?.trim() ||
    ext?.user?.display_name?.trim() ||
    ext?.display_name?.trim() ||
    ext?.name?.trim();
  if (name && name.length > 0 && !isExtensionPlaceholderLabel(name, trimmed)) {
    return name;
  }
  return trimmed;
}

export function assigneeDisplayNamesForTaskRow(
  row: Task,
  hierarchyDataExtensions: unknown[] | null | undefined,
): string[] {
  const raw = row.rawData as ApiTask | undefined;
  const assignees = raw?.assignees;
  if (Array.isArray(assignees) && assignees.length > 0) {
    const names = assignees
      .map((a) =>
        lookupHierarchyExtensionDisplayName(
          a?.extension_number,
          hierarchyDataExtensions,
        ),
      )
      .filter((n) => n.length > 0);
    if (names.length > 0) return names;
  }
  if (row.assigned_to) {
    const resolved =
      row.assigned_to_name ||
      lookupHierarchyExtensionDisplayName(row.assigned_to, hierarchyDataExtensions);
    return resolved ? [resolved] : [];
  }
  return [];
}

/** Full list; table column still shows To-do for existing rows when `omitTodoTaskType` is on. */
export const TASK_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "todo", label: "To-do" },
  { value: "recurring", label: "Recurring" },
] as const;

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

export type PlannerWorkflowStatusRow = { id: number; name: string };

export function normalizePlannerStatusesFromApi(raw: unknown): PlannerWorkflowStatusRow[] {
  if (!Array.isArray(raw)) return [];
  const out: PlannerWorkflowStatusRow[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const idNum = typeof o.id === "number" ? o.id : Number(o.id);
    if (!Number.isFinite(idNum)) continue;
    const name = extensionOrIdToTrimmedString(o.name);
    out.push({ id: idNum, name: name || String(idNum) });
  }
  return out;
}

export const PROJECT_DETAILS_STATUS_WITH = ["statuses", "statuses.tasks"] as const;

export const INITIAL_FILTER_FORM = {
  task_type: null as any,
  priority: null as any,
  assigned_to: null as string | null,
  due_date_from: "",
  due_date_to: "",
  project: "All Projects",
  assignee: [] as string[],
  status: ALL_STATUS_VALUE,
};

export const TASKS_TABLE_COLUMN_STORAGE_KEY = "planner-tasks-listing-visible-columns-v1";

export const DEFAULT_TASK_TABLE_COLUMN_KEYS: string[] = [
  "complete",
  "title",
  "task_type",
  "assigned_to",
  "priority",
  "due_date",
  "notes",
  "workflow_status",
  "repeat_status",
  "actions",
];

export function parseStoredTaskTableColumns(
  raw: string | null,
  allowedKeys: string[],
): string[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const keys = parsed.filter((c): c is string => typeof c === "string");
    if (keys.length === 0) return null;
    const allowed = new Set(allowedKeys);
    const valid = keys.filter((k) => allowed.has(k));
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

export function orderTaskColumnKeysByDefault(keys: string[]): string[] {
  const order = new Map(DEFAULT_TASK_TABLE_COLUMN_KEYS.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => (order.get(a) ?? 9999) - (order.get(b) ?? 9999));
}

export function readVisibleTaskColumnKeysFromStorage(): string[] {
  if (globalThis.window === undefined) return [...DEFAULT_TASK_TABLE_COLUMN_KEYS];
  const stored = parseStoredTaskTableColumns(
    globalThis.localStorage.getItem(TASKS_TABLE_COLUMN_STORAGE_KEY),
    DEFAULT_TASK_TABLE_COLUMN_KEYS,
  );
  const base = stored ?? [...DEFAULT_TASK_TABLE_COLUMN_KEYS];
  return orderTaskColumnKeysByDefault(base);
}

export function persistVisibleTaskColumnKeys(keys: string[]) {
  try {
    globalThis.localStorage.setItem(
      TASKS_TABLE_COLUMN_STORAGE_KEY,
      JSON.stringify(keys),
    );
  } catch {
    // ignore quota / private mode
  }
}

export const TOTAL_VIEWS = 6;

export const POSSIBLE_TABS = [
  { id: "all", label: "All" },
  { id: "due_today", label: "Due today" },
  { id: "overdue", label: "Overdue" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
] as const;

export const TASK_VIEW_TAB_IDS = new Set<string>(POSSIBLE_TABS.map((t) => t.id));

export const DEFAULT_VISIBLE_TAB_IDS = ["all", "due_today", "overdue", "upcoming"];
export const SAVED_VIEW_STORAGE_KEY = "planner_tasks_visible_tabs";

export function stripHtmlTags(input: string): string {
  const out: string[] = [];
  const tagBuffer: string[] = [];
  let inTag = false;

  for (const ch of input) {
    if (!inTag) {
      if (ch === "<") {
        inTag = true;
        tagBuffer.push(ch);
      } else {
        out.push(ch);
      }
      continue;
    }

    tagBuffer.push(ch);
    if (ch === ">") {
      inTag = false;
      tagBuffer.length = 0;
    }
  }

  if (inTag && tagBuffer.length) out.push(...tagBuffer);
  return out.join("");
}

export function taskStatusColumnLabel(row: Task): string {
  const workflowName = row.workflowStatus?.name?.trim();
  if (workflowName) return workflowName;
  if (row.status === "completed") return "Completed";
  if (row.status === "overdue") return "Overdue";
  return "Pending";
}

export function formatRepeatStatusLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/_+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function resolveTaskActionsMenuOpenState(
  taskId: number,
  nextShow: boolean,
  previousOpenId: number | null,
): number | null {
  if (nextShow) {
    return taskId;
  }
  return previousOpenId === taskId ? null : previousOpenId;
}

export function createTaskRowActionsToggleHandler(
  taskId: number,
  setOpenTaskActionsId: Dispatch<SetStateAction<number | null>>,
): (nextShow: boolean) => void {
  return (nextShow: boolean) => {
    setOpenTaskActionsId((prev) =>
      resolveTaskActionsMenuOpenState(taskId, nextShow, prev),
    );
  };
}

export function normalizeVisibleTabIdsForStorage(ids: string[]): string[] {
  const set = new Set(ids);
  return POSSIBLE_TABS.map((t) => t.id).filter((id) => set.has(id));
}

export function persistVisibleTabIds(ids: string[]) {
  const normalized = normalizeVisibleTabIdsForStorage(ids);
  try {
    globalThis.localStorage.setItem(SAVED_VIEW_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore quota / private mode
  }
}

export function getInitialVisibleTabIds(): string[] {
  if (globalThis.window === undefined) return [...DEFAULT_VISIBLE_TAB_IDS];
  try {
    const raw = globalThis.localStorage.getItem(SAVED_VIEW_STORAGE_KEY);
    if (!raw) return [...DEFAULT_VISIBLE_TAB_IDS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_VISIBLE_TAB_IDS];
    const validIds = new Set<string>(POSSIBLE_TABS.map((t) => t.id));
    const filtered = parsed.filter((id): id is string => typeof id === "string" && validIds.has(id));
    if (filtered.length === 0) return [...DEFAULT_VISIBLE_TAB_IDS];
    return normalizeVisibleTabIdsForStorage(filtered);
  } catch {
    return [...DEFAULT_VISIBLE_TAB_IDS];
  }
}
