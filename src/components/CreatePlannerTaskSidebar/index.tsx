import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Row, Col } from "react-bootstrap";
import {
  X,
  Calendar,
  FileText,
  Tag,
  Users,
  Eye,
  ListTodo,
  Plus,
  FolderOpen,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  listProjects,
  createTask,
  updateTask,
  listTasks,
  createRecurringTask,
  updateRecurringTask,
} from "@utils/tasks";
import { listStatuses } from "@utils/work-planner";
import { getAutoTimezone } from "@utils/Helper";
import RichTextEditor from "../../pages/help-center/partials/RichTextEditor";
import TaskSecondaryTabs from "@pages/planner/partials/TaskSecondaryTabs";
import type { PlannerTaskEditScope } from "@planner/taskRowPermissions";

// ─── Types (from createtask-modal) ─────────────────────────────────────────────

type PlannerTaskType = "todo" | "regular" | "recurring";

const TASK_TYPE_SELECT_LABELS: Record<PlannerTaskType, string> = {
  todo: "Todo",
  regular: "Regular",
  recurring: "Recurring",
};

const ALL_PLANNER_TASK_TYPES: PlannerTaskType[] = ["todo", "regular", "recurring"];

function normalizeTaskTypeOptions(
  choices: readonly PlannerTaskType[] | undefined,
): PlannerTaskType[] {
  if (choices == null || choices.length === 0) {
    return [...ALL_PLANNER_TASK_TYPES];
  }
  const filtered = choices.filter((t): t is PlannerTaskType =>
    ALL_PLANNER_TASK_TYPES.includes(t),
  );
  return filtered.length > 0 ? filtered : [...ALL_PLANNER_TASK_TYPES];
}

function clampTaskTypeToAllowed(
  current: PlannerTaskType,
  allowed: readonly PlannerTaskType[],
): PlannerTaskType {
  if (allowed.length === 0) return "regular";
  if (allowed.includes(current)) return current;
  if (allowed.includes("regular")) return "regular";
  return allowed[0];
}

/** Task / parent ids as returned by the planner API (numeric or string). */
type PlannerApiId = string | number;
/** API fields that may be string, number, or null (e.g. parent_task_id, repeat_on). */
type PlannerApiNullableScalar = string | number | null;

interface Extension {
  id: string;
  name: string;
  extension_number?: string;
}

interface CreateTaskSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCreate?: (data: CreateTaskFormData) => void;
  onCreateAndOpen?: (data: CreateTaskFormData) => void;
  extensions?: Extension[];
  labels?: Label[];
  project?: Project;
  statuses?: Status[];
  task?: PlannerEditTask;
  isEdit?: boolean;
  selectedStatusForTask?: number | null;
  taskType?: PlannerTaskType;
  taskTypeChoices?: readonly PlannerTaskType[];
  /** When true (e.g. project details / board), the project dropdown is disabled — task stays on the current project. */
  lockProjectSelection?: boolean;
  /**
   * `limited`: non-admin / non-owner — assignees and watchers are read-only; all other fields can be saved from the form.
   */
  taskEditScope?: PlannerTaskEditScope;
}

/** Minimal task shape used when editing in the sidebar (API / normalized task). */
interface PlannerEditTask {
  id?: PlannerApiId;
  parent_task_id?: PlannerApiNullableScalar;
  parent_task?: { id?: number; title?: string; reference?: string };
  rawData?: {
    id?: PlannerApiId;
    last_run_at?: string;
    next_run_at?: string;
    parent_task_id?: PlannerApiNullableScalar;
    parent_task?: { id?: number; title?: string; reference?: string };
  };
  project_id?: number;
  project?: { id?: number };
  status_id?: number;
  status?: { id?: number; name?: string };
  status_name?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  assignees?: Array<{ extension_number?: string }>;
  watchers?: Array<{ extension_number?: string }>;
  extension_numbers?: string[];
  watcher_numbers?: string[];
  due_date?: string;
  start_date?: string;
  label_ids?: number[];
  labels?: Array<{ id: number }>;
  frequency?: string;
  repeat_interval?: number;
  repeat_on?: PlannerApiNullableScalar;
  due_time?: unknown;
  last_run_at?: string;
  next_run_at?: string;
}

interface UserType {
  id: number;
  name: string;
  avatar: string;
  initials: string;
}

interface Project {
  id: number;
  name: string;
  icon: string;
  color: string;
  statuses?: Array<{
    id: number;
    name: string;
    color: string;
    order: string;
    is_default: boolean;
    is_completed: boolean;
  }>;
  labels?: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
}

interface Label {
  id: number;
  name: string;
  color: string;
}

interface Status {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface Priority {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface LinkedRecord {
  id: number;
  type: "task" | "crm";
  title: string;
  reference: string;
}

interface TaskListRow {
  id: PlannerApiId;
  title?: string;
  reference?: string;
}

interface CreateTaskFormData {
  title: string;
  description: string;
  taskType: PlannerTaskType;
  projectId: number | null;
  statusId: number | null;
  priorityId: number | null;
  assigneeIds: number[];
  watcherIds: number[];
  dueDate: string;
  startDate: string;
  labelIds: number[];
  linkedRecordIds: number[];
  // Recurring-only
  frequency: string;
  repeatInterval: number;
  repeatOn: string;
  dueTime: string;
}

function mapPriorityStringToId(priority: string | null | undefined): number {
  const priorityMap: Record<string, number> = {
    low: 1,
    normal: 2,
    medium: 2,
    high: 3,
    urgent: 4,
  };
  return priorityMap[priority?.toLowerCase() || "normal"] || 2;
}

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/** Read-only display for API schedule timestamps (e.g. `2026-03-28T08:30:03+00:00`). */
function formatDateTimeForDisplay(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === "") return "—";
  const d = new Date(String(iso).trim());
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function readNestedRecurring(editTask: PlannerEditTask | undefined): Record<string, unknown> | null {
  if (!editTask) return null;
  const top = (editTask as unknown as Record<string, unknown>).recurring;
  if (top && typeof top === "object" && !Array.isArray(top)) {
    return top as Record<string, unknown>;
  }
  const raw = editTask.rawData;
  if (raw && typeof raw === "object") {
    const ro = raw as Record<string, unknown>;
    const nested = ro.recurring;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return null;
}

function pickRecurringScalar(editTask: PlannerEditTask | undefined, key: string): unknown {
  if (!editTask) return undefined;
  const top = (editTask as unknown as Record<string, unknown>)[key];
  if (top != null && top !== "") return top;
  const raw = editTask.rawData;
  if (raw && typeof raw === "object") {
    const rv = (raw as Record<string, unknown>)[key];
    if (rv != null && rv !== "") return rv;
  }
  const nested = readNestedRecurring(editTask);
  if (nested) {
    const nv = nested[key];
    if (nv != null && nv !== "") return nv;
  }
  return undefined;
}

function recurringScheduleField(
  task: PlannerEditTask | undefined,
  field: "last_run_at" | "next_run_at",
): string | undefined {
  if (!task) return undefined;
  const fromRecord = (rec: Record<string, unknown> | null | undefined): string | undefined => {
    if (!rec) return undefined;
    const v = rec[field];
    if (typeof v === "string" && v.trim()) return v.trim();
    return undefined;
  };
  const direct = fromRecord(task as unknown as Record<string, unknown>);
  if (direct) return direct;
  const raw = task.rawData;
  if (raw && typeof raw === "object") {
    const got = fromRecord(raw as Record<string, unknown>);
    if (got) return got;
  }
  return fromRecord(readNestedRecurring(task));
}

/**
 * Interprets recurring task start date + local time in the user's timezone,
 * returns UTC ISO-8601 for API `due_time` (e.g. `2026-03-27T18:30:00.000Z`).
 */
function formatRecurringDueTimeAsUtcIso(
  startDate: string | null | undefined,
  dueTimeLocal: string | null | undefined,
): string | undefined {
  const dateStr = startDate?.trim() ?? "";
  const timeRaw = dueTimeLocal?.trim() ?? "";
  if (!dateStr || !timeRaw) return undefined;
  const time = timeRaw.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(time)) return undefined;
  const local = new Date(`${dateStr}T${time}:00`);
  if (Number.isNaN(local.getTime())) return undefined;
  return local.toISOString();
}

/** Fill `<input type="time">` from API `due_time` (UTC ISO string or plain HH:mm). */
function parseRecurringDueTimeForInput(dueTimeRaw: string | null | undefined): string {
  if (dueTimeRaw == null || dueTimeRaw === "") return "";
  const s = String(dueTimeRaw).trim();
  if (s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }
  const timePattern = /(\d{1,2}):(\d{2})(?::\d{2})?/;
  const timeMatch = timePattern.exec(s);
  if (timeMatch) {
    const h = Math.min(23, Math.max(0, Number.parseInt(timeMatch[1], 10)));
    const m = Math.min(59, Math.max(0, Number.parseInt(timeMatch[2], 10)));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return "";
}

/** Local calendar today as YYYY-MM-DD for `<input type="date" min>`. */
function todayLocalIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Earliest allowed due date: not before today, and not before start date when set.
 * ISO date strings compare lexicographically.
 */
function minDueDateFromTodayAndStart(startDate: string): string {
  const today = todayLocalIsoDate();
  const start = startDate?.trim() ?? "";
  if (!start) return today;
  const later = [today, start].sort((a, b) => a.localeCompare(b));
  return later.at(-1) ?? today;
}

function clampDueDateToMin(dueDate: string, minStr: string): string {
  if (!dueDate.trim()) return dueDate;
  return dueDate < minStr ? minStr : dueDate;
}

function mergeFormDataWithDueDateClamp(data: CreateTaskFormData): CreateTaskFormData {
  const min = minDueDateFromTodayAndStart(data.startDate);
  return { ...data, dueDate: clampDueDateToMin(data.dueDate, min) };
}

function resolveExtensionUserId(extensions: Extension[], extRef: string | undefined): number {
  if (extRef == null || extRef === "") return Number.NaN;
  const extension = extensions.find(
    (ext) => String(ext.id) === String(extRef) || ext.extension_number === extRef,
  );
  return extension ? Number(extension.id) : Number(extRef);
}

function mapAssigneeIdsFromEditTask(editTask: PlannerEditTask, extensions: Extension[]): number[] {
  if (editTask.assignees?.length) {
    return editTask.assignees.map((a) => resolveExtensionUserId(extensions, a.extension_number));
  }
  if (editTask.extension_numbers?.length) {
    return editTask.extension_numbers.map((extNum) => resolveExtensionUserId(extensions, extNum));
  }
  return [];
}

function mapWatcherIdsFromEditTask(editTask: PlannerEditTask, extensions: Extension[]): number[] {
  if (editTask.watchers?.length) {
    return editTask.watchers.map((w) => resolveExtensionUserId(extensions, w.extension_number));
  }
  if (editTask.watcher_numbers?.length) {
    return editTask.watcher_numbers.map((extNum) => resolveExtensionUserId(extensions, extNum));
  }
  return [];
}

/** Stringify type-like API values without producing `[object Object]`. */
function unknownToPrimitiveString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  if (typeof value === "bigint") return String(value);
  return "";
}

function plannerTypeFromLowerString(raw: unknown): PlannerTaskType | null {
  const t = unknownToPrimitiveString(raw).trim().toLowerCase();
  if (t === "todo") return "todo";
  if (t === "recurring") return "recurring";
  if (t === "regular") return "regular";
  return null;
}

function isTruthyRecurringFlag(value: unknown): boolean {
  return value === true || value === 1;
}

function inferRecurringFromScheduleScalars(editTask: PlannerEditTask): boolean {
  const freq = pickRecurringScalar(editTask, "frequency");
  return (
    (typeof freq === "string" && freq.trim() !== "") ||
    pickRecurringScalar(editTask, "repeat_interval") != null ||
    pickRecurringScalar(editTask, "last_run_at") != null ||
    pickRecurringScalar(editTask, "next_run_at") != null
  );
}

function taskTypeHintFromRawData(raw: unknown): PlannerTaskType | null {
  if (raw == null || typeof raw !== "object") return null;
  const ro = raw as Record<string, unknown>;
  const fromRaw = plannerTypeFromLowerString(ro.type ?? ro.task_type);
  if (fromRaw) return fromRaw;
  if (isTruthyRecurringFlag(ro.is_recurring)) return "recurring";
  return null;
}

function normalizeEditTaskType(editTask: PlannerEditTask): PlannerTaskType {
  const fromTop = plannerTypeFromLowerString(editTask.type);
  if (fromTop) return fromTop;

  const fromRawHint = taskTypeHintFromRawData(editTask.rawData);
  if (fromRawHint) return fromRawHint;

  const asRecord = editTask as Record<string, unknown>;
  const fromTaskTypeField = plannerTypeFromLowerString(asRecord.task_type);
  if (fromTaskTypeField) return fromTaskTypeField;
  if (isTruthyRecurringFlag(asRecord.is_recurring)) return "recurring";

  const nested = readNestedRecurring(editTask);
  if (nested) {
    const fromNested = plannerTypeFromLowerString(nested.type);
    if (fromNested) return fromNested;
    if (isTruthyRecurringFlag(nested.is_recurring)) return "recurring";
  }

  if (!inferRecurringFromScheduleScalars(editTask)) return "regular";
  const t = unknownToPrimitiveString(editTask.type).trim().toLowerCase();
  const tt = unknownToPrimitiveString(asRecord.task_type).trim().toLowerCase();
  if (t === "todo" || tt === "todo") return "regular";
  return "recurring";
}

/** API expects lowercase full weekday names, e.g. `"tuesday"`. */
const WEEKLY_REPEAT_ON_VALUES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type WeeklyRepeatOnValue = (typeof WEEKLY_REPEAT_ON_VALUES)[number];

const WEEKLY_REPEAT_ON_OPTIONS: { label: string; value: WeeklyRepeatOnValue }[] = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

/** Legacy UI used 0–6 with Sunday = 0 (aligned with `Date.getUTCDay` / local getDay). */
const LEGACY_DAY_INDEX_TO_WEEKDAY: Record<number, WeeklyRepeatOnValue> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function isWeeklyRepeatOnValue(s: string): s is WeeklyRepeatOnValue {
  return (WEEKLY_REPEAT_ON_VALUES as readonly string[]).includes(s);
}

function normalizeWeeklyRepeatOnFromApi(raw: unknown): string {
  if (raw == null || raw === "") return "";
  let asString: string;
  if (typeof raw === "string") {
    asString = raw;
  } else if (typeof raw === "number" && Number.isFinite(raw)) {
    asString = String(raw);
  } else if (typeof raw === "bigint") {
    asString = String(raw);
  } else if (typeof raw === "boolean") {
    asString = String(raw);
  } else {
    return "";
  }
  const s = asString.trim().toLowerCase();
  if (isWeeklyRepeatOnValue(s)) return s;
  const shortMap: Record<string, WeeklyRepeatOnValue> = {
    sun: "sunday",
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
  };
  if (shortMap[s]) return shortMap[s];
  if (s.includes(",")) {
    const first = s.split(",")[0]?.trim() ?? "";
    if (first) return normalizeWeeklyRepeatOnFromApi(first);
    return "";
  }
  const n = Number(s);
  if (s !== "" && Number.isInteger(n) && n >= 0 && n <= 6) {
    return LEGACY_DAY_INDEX_TO_WEEKDAY[n] ?? "";
  }
  return "";
}

function repeatOnForEditTask(editTask: PlannerEditTask, frequency: string): string {
  const freq = (frequency || "weekly").toLowerCase();
  const rawOn = pickRecurringScalar(editTask, "repeat_on");
  if (freq === "weekly") {
    return normalizeWeeklyRepeatOnFromApi(rawOn);
  }
  if (rawOn == null) return "";
  return unknownToPrimitiveString(rawOn);
}

function readParentTaskFromRaw(
  raw: unknown,
): PlannerEditTask["parent_task"] | undefined {
  if (raw == null || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const p = o.parent_task ?? o.parent;
  if (p == null || typeof p !== "object") return undefined;
  const pt = p as Record<string, unknown>;
  const id = pt.id;
  const idNum = typeof id === "number" ? id : Number(id);
  return {
    id: Number.isFinite(idNum) ? idNum : undefined,
    title: typeof pt.title === "string" ? pt.title : undefined,
    reference: typeof pt.reference === "string" ? pt.reference : undefined,
  };
}

/** Parent / "associate with" task for edit mode (`parent_task_id` from API). */
function resolveParentTaskLinkFromEditTask(editTask: PlannerEditTask): LinkedRecord | null {
  const raw: unknown = editTask.rawData ?? editTask;
  const rawParent = readParentTaskFromRaw(raw);
  const nestedParent = editTask.parent_task ?? rawParent;
  let idRaw: unknown = editTask.parent_task_id ?? nestedParent?.id;
  if (idRaw == null && raw != null && typeof raw === "object") {
    const ro = raw as Record<string, unknown>;
    idRaw = ro.parent_task_id ?? ro.parent_id;
  }
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) return null;
  const title = String(nestedParent?.title ?? "").trim();
  const refRaw = nestedParent?.reference;
  const reference =
    typeof refRaw === "string" && refRaw.trim() !== "" ? refRaw.trim() : `#${id}`;
  return {
    id,
    type: "task",
    title: title || `Task #${id}`,
    reference,
  };
}

function buildInitialFormFromEdit(
  editTask: PlannerEditTask,
  extensions: Extension[],
): CreateTaskFormData {
  const projectIdRaw = editTask.project_id ?? editTask.project?.id;
  const statusIdRaw = editTask.status_id ?? editTask.status?.id;
  const assigneeIds = mapAssigneeIdsFromEditTask(editTask, extensions);
  const watcherIds = mapWatcherIdsFromEditTask(editTask, extensions);
  const taskTypeVal = normalizeEditTaskType(editTask);
  const freqRaw = pickRecurringScalar(editTask, "frequency");
  const freqStr = unknownToPrimitiveString(freqRaw).trim();
  const frequency = freqStr === "" ? "weekly" : freqStr;
  const repeatInterval = Math.max(1, Number(pickRecurringScalar(editTask, "repeat_interval")) || 1);
  const repeatOn = repeatOnForEditTask(editTask, frequency);
  const dueTimeRaw = pickRecurringScalar(editTask, "due_time");
  const dueTime =
    typeof dueTimeRaw === "string"
      ? parseRecurringDueTimeForInput(dueTimeRaw)
      : "";
  const topDue =
    typeof editTask.due_date === "string" && editTask.due_date.trim() !== ""
      ? editTask.due_date
      : undefined;
  const endDateRaw =
    topDue ??
    pickRecurringScalar(editTask, "end_date") ??
    pickRecurringScalar(editTask, "due_date");
  const startDateRaw =
    (pickRecurringScalar(editTask, "start_date") as string | undefined) ?? editTask.start_date;
  return {
    title: editTask.title || "",
    description: editTask.description || "",
    taskType: taskTypeVal,
    projectId: projectIdRaw ? Number(projectIdRaw) : null,
    statusId: statusIdRaw ? Number(statusIdRaw) : null,
    priorityId: mapPriorityStringToId(editTask.priority),
    assigneeIds,
    watcherIds,
    dueDate: formatDateForInput(typeof endDateRaw === "string" ? endDateRaw : undefined),
    startDate: formatDateForInput(startDateRaw),
    labelIds: editTask.label_ids ?? editTask.labels?.map((l) => l.id) ?? [],
    linkedRecordIds: (() => {
      const link = resolveParentTaskLinkFromEditTask(editTask);
      return link ? [link.id] : [];
    })(),
    frequency,
    repeatInterval,
    repeatOn,
    dueTime,
  };
}

function buildInitialFormForCreate(
  taskType: PlannerTaskType,
  propProject: Project | undefined,
  propStatuses: Status[],
  selectedStatusForTask: number | null,
): CreateTaskFormData {
  return {
    title: "",
    description: "",
    taskType,
    projectId: propProject?.id ?? null,
    statusId: selectedStatusForTask || (propStatuses.length > 0 ? propStatuses[0].id : null),
    priorityId: 0,
    assigneeIds: [],
    watcherIds: [],
    dueDate: "",
    startDate: "",
    labelIds: [],
    linkedRecordIds: [],
    frequency: "weekly",
    repeatInterval: 1,
    repeatOn: taskType === "recurring" ? "monday" : "",
    dueTime: "",
  };
}

function resolveSidebarProjects(fetchedProjects: Project[], propProject: Project | undefined): Project[] {
  if (fetchedProjects.length > 0) {
    return fetchedProjects;
  }
  if (propProject) {
    return [propProject];
  }
  return [];
}

function getSidebarTitle(taskType: PlannerTaskType, isEdit: boolean): string {
  if (taskType === "todo") {
    return isEdit ? "Edit Todo" : "Create Todo";
  }
  if (taskType === "recurring") {
    return isEdit ? "Edit Recurring" : "Create Recurring";
  }
  return isEdit ? "Edit Task" : "Create Task";
}

function linkedRecordsEmptyMessage(hasSearchQuery: boolean): string {
  if (hasSearchQuery) {
    return "No tasks found matching your search";
  }
  return "No tasks available";
}

function primarySubmitButtonLabel(isSubmitting: boolean, isEdit: boolean): string {
  if (isSubmitting) return "Processing...";
  if (isEdit) return "Update";
  return "Create";
}

interface StatusSelectOptionsProps {
  formDataProjectId: number | null;
  loadingProjects: boolean;
  loadingGenericStatuses: boolean;
  statuses: Status[];
  isEdit: boolean;
  statusId: number | null;
  editTask: PlannerEditTask | undefined;
}

function StatusSelectOptions({
  formDataProjectId,
  loadingProjects,
  loadingGenericStatuses,
  statuses,
  isEdit,
  statusId,
  editTask,
}: Readonly<StatusSelectOptionsProps>): React.ReactNode {
  const isLoadingStatuses =
    Boolean(formDataProjectId && loadingProjects) ||
    Boolean(!formDataProjectId && loadingGenericStatuses);
  if (isLoadingStatuses) {
    return <option value="">Loading statuses...</option>;
  }
  if (statuses.length === 0) {
    if (isEdit && statusId != null) {
      const label =
        editTask?.status?.name ||
        editTask?.status_name ||
        `Status #${statusId}`;
      return <option value={statusId}>{label}</option>;
    }
    return <option value="">No statuses available</option>;
  }
  const missingFromList =
    isEdit &&
    statusId != null &&
    !statuses.some((s) => String(s.id) === String(statusId));
  return (
    <>
      <option value="">Select status</option>
      {missingFromList && (
        <option value={statusId}>
          {editTask?.status?.name ||
            editTask?.status_name ||
            `Status #${statusId}`}
        </option>
      )}
      {statuses.map((status) => (
        <option key={status.id} value={status.id}>
          {status.name}
        </option>
      ))}
    </>
  );
}

function renderProjectSelectChildren(loadingProjects: boolean, projects: Project[]): React.ReactNode {
  if (loadingProjects) {
    return <option value="">Loading projects...</option>;
  }
  if (projects.length === 0) {
    return <option value="">No projects available</option>;
  }
  return (
    <>
      <option value="">Select project</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </>
  );
}

interface LinkedRecordListRowProps {
  record: LinkedRecord;
  selected: boolean;
  onToggle: (recordId: number) => void;
  interactionDisabled?: boolean;
}

function LinkedRecordListRow({
  record,
  selected,
  onToggle,
  interactionDisabled = false,
}: Readonly<LinkedRecordListRowProps>) {
  return (
    <button
      type="button"
      onClick={() => {
        if (interactionDisabled) return;
        onToggle(record.id);
      }}
      aria-disabled={interactionDisabled}
      style={{
        display: "flex",
        alignItems: "center",
        padding: 12,
        cursor: interactionDisabled ? "not-allowed" : "pointer",
        opacity: interactionDisabled ? 0.6 : 1,
        backgroundColor: selected ? "#edf6ff" : "white",
        border: "none",
        borderBottom: "1px solid #f1f5f9",
        width: "100%",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          backgroundColor: record.type === "crm" ? "#4e6fa5" : "#6B7280",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          flexShrink: 0,
        }}
      >
        {record.type === "crm" ? (
          <FolderOpen size={18} color="#fff" />
        ) : (
          <ListTodo size={18} color="#fff" />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#141414",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record.title}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "#718096",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record.reference}
        </div>
      </div>
      {selected && (
        <Check
          size={18}
          style={{
            color: "#3b82f6",
            marginLeft: 8,
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}

function SelectedLinkedRecordChip({
  record,
  onRemove,
  readOnly = false,
}: Readonly<{
  record: LinkedRecord;
  onRemove: (id: number) => void;
  readOnly?: boolean;
}>) {
  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 6,
    backgroundColor: "#edf6ff",
    border: "1px solid #bfdbfe",
    fontSize: "0.875rem",
    font: "inherit",
    maxWidth: "100%",
  };
  if (readOnly) {
    return (
      <div style={{ ...chipStyle, cursor: "default" }}>
        <ListTodo size={14} color="#4e6fa5" style={{ flexShrink: 0 }} />
        <span
          style={{
            color: "#141414",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
          title={`${record.title}`}
        >
          {record.title}
        </span>
        <span
          style={{
            color: "#64748b",
            fontSize: "0.8rem",
            flexShrink: 0,
          }}
        >
          {record.reference}
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onRemove(record.id)}
      style={{
        ...chipStyle,
        cursor: "pointer",
      }}
    >
      <ListTodo size={14} color="#4e6fa5" style={{ flexShrink: 0 }} />
      <span
        style={{
          color: "#141414",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
        title={`${record.title}`}
      >
        {record.title}
      </span>
      <span
        style={{
          color: "#64748b",
          fontSize: "0.8rem",
          flexShrink: 0,
        }}
      >
        {record.reference}
      </span>
      <X size={14} style={{ color: "#64748b", flexShrink: 0 }} />
    </button>
  );
}

/** Limited (non-admin, non-owner): keep baseline assignees/watchers; all other fields from the form payload. */
function applyLimitedEditLockAssigneesAndWatchers(
  payload: Record<string, unknown>,
  locked: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...payload,
    extension_numbers: locked.extension_numbers,
    watchers: locked.watchers,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

const CreateTaskSidebar: React.FC<CreateTaskSidebarProps> = ({
  isOpen = false,
  onClose,
  onCreate,
  onCreateAndOpen,
  extensions = [],
  labels: propLabels = [],
  project: propProject,
  statuses: propStatuses = [],
  task: editTask,
  isEdit = false,
  selectedStatusForTask = null,
  taskType = "regular",
  taskTypeChoices,
  lockProjectSelection = false,
  taskEditScope = "full",
}) => {
  const taskTypeOptions = useMemo(
    () => normalizeTaskTypeOptions(taskTypeChoices),
    [taskTypeChoices],
  );

  const getInitialFormData = (): CreateTaskFormData => {
    if (isEdit && editTask) {
      return buildInitialFormFromEdit(editTask, extensions);
    }
    return buildInitialFormForCreate(
      clampTaskTypeToAllowed(taskType, taskTypeOptions),
      propProject,
      propStatuses,
      selectedStatusForTask,
    );
  };

  const [formData, setFormData] = useState<CreateTaskFormData>(getInitialFormData());
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [watcherSearchQuery, setWatcherSearchQuery] = useState("");
  const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [genericStatuses, setGenericStatuses] = useState<Status[]>([]);
  const [loadingGenericStatuses, setLoadingGenericStatuses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedRecordsFromApi, setLinkedRecordsFromApi] = useState<LinkedRecord[]>([]);
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await listProjects({ page: 1, limit: 100 });
        if (response?.success === true && Array.isArray(response.data)) {
          const projectsList = response.data.map(
            (project: {
              id: number;
              name: string;
              color?: string;
              statuses?: Project["statuses"];
              labels?: Project["labels"];
            }) => ({
            id: project.id,
            name: project.name,
            icon: "",
            color: project.color || "#3b82f6",
            statuses: project.statuses || [],
            labels: project.labels || [],
          }));
          setFetchedProjects(projectsList);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setFetchedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchGenericStatuses = async () => {
      try {
        setLoadingGenericStatuses(true);
        const response = await listStatuses();
        if (response && Array.isArray(response)) {
          const statusesList = response.map((status: Status) => ({
            id: status.id,
            name: status.name,
            icon: "",
            color: status.color || "#3b82f6",
          }));
          setGenericStatuses(statusesList);
        } else if (response?.data && Array.isArray(response.data)) {
          const statusesList = response.data.map((status: Status) => ({
            id: status.id,
            name: status.name,
            icon: "",
            color: status.color || "#3b82f6",
          }));
          setGenericStatuses(statusesList);
        } else {
          setGenericStatuses([]);
        }
      } catch (error) {
        console.error("Error fetching generic statuses:", error);
        setGenericStatuses([]);
      } finally {
        setLoadingGenericStatuses(false);
      }
    };
    fetchGenericStatuses();
  }, [isOpen]);

  const fetchLinkRecordsForSearch = useCallback(
    async (query: string, currentProjectId?: number | null) => {
      setLoadingLinkedRecords(true);
      try {
        const projectId =
          currentProjectId ??
          (isEdit ? editTask?.project_id ?? editTask?.project?.id : null);
        const response = await listTasks({
          page: 1,
          limit: 30,
          type: "regular",
          search: query.trim() || undefined,
          ...(projectId != null && projectId > 0 ? { project_id: projectId } : {}),
        });
        if (response?.data && Array.isArray(response.data)) {
          const taskRows = response.data as TaskListRow[];
          const selfIdRaw = editTask?.rawData?.id ?? editTask?.id;
          const selfIdNum =
            selfIdRaw != null && String(selfIdRaw).trim() !== ""
              ? Number(selfIdRaw)
              : Number.NaN;
          const currentTaskId =
            isEdit && Number.isFinite(selfIdNum) && selfIdNum > 0 ? selfIdNum : null;
          const records: LinkedRecord[] = taskRows
            .filter(
              (t) =>
                currentTaskId == null || Number(t.id) !== currentTaskId,
            )
            .map((t) => ({
              id: Number(t.id),
              type: "task" as const,
              title: t.title || "",
              reference: t.reference || `#${t.id}`,
            }));
          setLinkedRecordsFromApi(records);
        } else {
          setLinkedRecordsFromApi([]);
        }
      } catch (error) {
        console.error("Error fetching link records:", error);
        setLinkedRecordsFromApi([]);
      } finally {
        setLoadingLinkedRecords(false);
      }
    },
    [
      isEdit,
      editTask?.rawData?.id,
      editTask?.id,
      editTask?.project_id,
      editTask?.project?.id,
    ]
  );

  const handleTaskTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const nextType = e.target.value as PlannerTaskType;
      const clamped = clampTaskTypeToAllowed(nextType, taskTypeOptions);
      if (isEdit) {
        setFormData((prev) => ({ ...prev, taskType: clamped }));
        return;
      }
      const fresh = buildInitialFormForCreate(
        clamped,
        propProject,
        propStatuses,
        selectedStatusForTask,
      );
      const mergedOpen = mergeFormDataWithDueDateClamp(fresh);
      const nextForm: CreateTaskFormData = {
        ...mergedOpen,
        taskType: clampTaskTypeToAllowed(mergedOpen.taskType, taskTypeOptions),
      };
      setFormData(nextForm);
      setSearchQuery("");
      setAssigneeSearchQuery("");
      setShowAssigneeDropdown(false);
      setWatcherSearchQuery("");
      setShowWatcherDropdown(false);
      fetchLinkRecordsForSearch("", nextForm.projectId).catch(() => undefined);
    },
    [
      isEdit,
      taskTypeOptions,
      propProject,
      propStatuses,
      selectedStatusForTask,
      fetchLinkRecordsForSearch,
    ],
  );

  useEffect(() => {
    if (!isOpen) return;
    fetchLinkRecordsForSearch(searchQuery, formData.projectId).catch(() => undefined);
  }, [isOpen, fetchLinkRecordsForSearch]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      if (
        isEdit &&
        editTask &&
        fetchedProjects.length === 0 &&
        loadingProjects
      ) {
        return;
      }
      const mergedOpen = mergeFormDataWithDueDateClamp(getInitialFormData());
      setFormData({
        ...mergedOpen,
        taskType: clampTaskTypeToAllowed(mergedOpen.taskType, taskTypeOptions),
      });
    } else {
      setSearchQuery("");
      const defaultTaskType = clampTaskTypeToAllowed(taskType, taskTypeOptions);
      setFormData({
        title: "",
        description: "",
        taskType: defaultTaskType,
        projectId: propProject?.id || null,
        statusId:
          selectedStatusForTask ||
          (propStatuses.length > 0 ? propStatuses[0].id : null),
        priorityId: 0,
        assigneeIds: [],
        watcherIds: [],
        dueDate: "",
        startDate: "",
        labelIds: [],
        linkedRecordIds: [],
        frequency: "weekly",
        repeatInterval: 1,
        repeatOn: defaultTaskType === "recurring" ? "monday" : "",
        dueTime: "",
      });
    }
  }, [
    isOpen,
    editTask,
    isEdit,
    fetchedProjects.length,
    loadingProjects,
    selectedStatusForTask,
    taskType,
    taskTypeOptions,
  ]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const users: UserType[] = extensions.map((ext) => ({
    id: Number(ext.id),
    name: ext.name,
    avatar: "",
    initials: ext.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase(),
  }));

  const projects: Project[] = resolveSidebarProjects(fetchedProjects, propProject);

  const getStatusesForSelectedProject = (): Status[] => {
    if (formData.projectId) {
      const selectedProject = fetchedProjects.find(
        (p) => p.id === formData.projectId
      );
      if (
        selectedProject?.statuses &&
        Array.isArray(selectedProject.statuses)
      ) {
        return selectedProject.statuses.map((status) => ({
          id: status.id,
          name: status.name,
          icon: "",
          color: status.color || "#3b82f6",
        }));
      }
      return [];
    }
    if (genericStatuses.length > 0) return genericStatuses;
    return propStatuses;
  };

  const statuses: Status[] = getStatusesForSelectedProject();

  useEffect(() => {
    if (isEdit) return;
    if (formData.projectId && fetchedProjects.length === 0) return;
    if (!formData.projectId && loadingGenericStatuses) return;
    const availableStatuses = getStatusesForSelectedProject();
    if (!formData.statusId && availableStatuses.length > 0) {
      setFormData((prev) => ({
        ...prev,
        statusId: selectedStatusForTask || availableStatuses[0].id,
      }));
    }
  }, [
    formData.projectId,
    fetchedProjects,
    genericStatuses,
    loadingGenericStatuses,
    isEdit,
    selectedStatusForTask,
  ]);

  useEffect(() => {
    if (
      !isOpen ||
      formData.taskType !== "recurring" ||
      formData.frequency !== "weekly"
    ) {
      return;
    }
    const v = formData.repeatOn.trim().toLowerCase();
    if (!isWeeklyRepeatOnValue(v)) {
      setFormData((prev) => ({ ...prev, repeatOn: "monday" }));
    }
  }, [isOpen, formData.taskType, formData.frequency, formData.repeatOn]);

  const priorities: Priority[] = [
    { id: 0, name: "Select Priority", icon: "", color: "#6c757d" },
    { id: 1, name: "Low", icon: "🟢", color: "#10b981" },
    { id: 2, name: "Medium", icon: "🟡", color: "#eab308" },
    { id: 3, name: "High", icon: "🟠", color: "#f97316" },
    { id: 4, name: "Urgent", icon: "🔴", color: "#ef4444" },
  ];

  const getLabelsForSelectedProject = (): Label[] => {
    if (!formData.projectId) return propLabels;
    const selectedProject = fetchedProjects.find(
      (p) => p.id === formData.projectId
    );
    if (selectedProject?.labels && Array.isArray(selectedProject.labels)) {
      return selectedProject.labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color || "#3b82f6",
        description: label.description || "",
      }));
    }
    return propLabels;
  };

  const labels: Label[] = getLabelsForSelectedProject();

  const isLimitedTaskEdit = Boolean(isEdit && taskEditScope === "limited");

  const limitedEditBaselineForm = useMemo((): CreateTaskFormData | null => {
    if (!isEdit || !editTask || taskEditScope !== "limited") return null;
    const merged = mergeFormDataWithDueDateClamp(
      buildInitialFormFromEdit(editTask, extensions),
    );
    return {
      ...merged,
      taskType: clampTaskTypeToAllowed(merged.taskType, taskTypeOptions),
    };
  }, [isEdit, editTask, taskEditScope, extensions, taskTypeOptions]);

  const mapPriorityIdToString = (priorityId: number | null): string | undefined => {
    if (!priorityId || priorityId === 0) return "";
    const priorityMap: Record<number, string> = {
      1: "low",
      2: "normal",
      3: "high",
      4: "urgent",
    };
    return priorityMap[priorityId] || undefined;
  };

  const buildPayloadForForm = (fd: CreateTaskFormData) => {
    const taskTypeEff = clampTaskTypeToAllowed(fd.taskType, taskTypeOptions);
    const payload: Record<string, unknown> = {
      title: fd.title,
      description: fd.description || "",
      priority: mapPriorityIdToString(fd.priorityId) || undefined,
      due_date: fd.dueDate || "",
      start_date: fd.startDate || "",
      extension_numbers:
        fd.assigneeIds?.map((id: number) => {
          const extension = extensions.find((ext) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
      watchers:
        fd.watcherIds?.map((id: number) => {
          const extension = extensions.find((ext) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
      type: taskTypeEff,
    };
    if (fd.projectId) {
      payload.project_id = fd.projectId;
      payload.label_ids = fd.labelIds || [];
    }
    if (fd.statusId) payload.status_id = fd.statusId;
    if (isEdit) {
      payload.parent_task_id =
        fd.linkedRecordIds.length > 0 ? fd.linkedRecordIds[0] : null;
    } else if (fd.linkedRecordIds.length > 0) {
      payload.parent_task_id = fd.linkedRecordIds[0];
    }
    if (taskTypeEff === "recurring") {
      payload.frequency = fd.frequency;
      payload.repeat_interval = fd.repeatInterval;
      if (fd.frequency === "weekly" && fd.repeatOn.trim()) {
        payload.repeat_on = fd.repeatOn.trim().toLowerCase();
      } else if (fd.frequency === "monthly" && fd.repeatOn.trim()) {
        payload.repeat_on = fd.repeatOn.trim();
      }
      const dueTimeUtc = formatRecurringDueTimeAsUtcIso(fd.startDate, fd.dueTime);
      if (dueTimeUtc) payload.due_time = dueTimeUtc;
      payload.end_date = fd.dueDate || null;
    }
    return payload;
  };

  const buildPayload = () => buildPayloadForForm(formData);

  const validateBeforeSubmit = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return false;
    }

    if (!formData.priorityId || formData.priorityId === 0) {
      toast.error("Please select a priority");
      return false;
    }


    const taskTypeEff = clampTaskTypeToAllowed(formData.taskType, taskTypeOptions);
    if (taskTypeEff === "recurring") {
      if (!formData.statusId) {
        toast.error("Recurring tasks require a status");
        return false;
      }
      if (!formData.startDate) {
        toast.error("Recurring tasks require a start date");
        return false;
      }
      if (formData.frequency === "weekly" && !formData.repeatOn.trim()) {
        toast.error("Please select a day of the week");
        return false;
      }
    }
    if (formData.dueDate.trim()) {
      const minDue = minDueDateFromTodayAndStart(formData.startDate);
      if (formData.dueDate < minDue) {
        toast.error("Due date cannot be before today or before the start date");
        return false;
      }
    }
    return true;
  };

  const persistTaskFromPayload = async (
    payloadInput: ReturnType<typeof buildPayload>,
  ): Promise<boolean> => {
    const taskTypeEff = clampTaskTypeToAllowed(formData.taskType, taskTypeOptions);
    let payload: Record<string, unknown> = { ...payloadInput };
    if (
      isEdit &&
      taskEditScope === "limited" &&
      limitedEditBaselineForm &&
      editTask?.id != null
    ) {
      const locked = buildPayloadForForm(limitedEditBaselineForm);
      payload = applyLimitedEditLockAssigneesAndWatchers(payload, locked);
    }
    if (isEdit && editTask?.id != null) {
      if (taskTypeEff === "recurring") {
        return Boolean(
          await updateRecurringTask(
            editTask.id,
            payload as Parameters<typeof updateRecurringTask>[1],
          ),
        );
      }
      return Boolean(
        await updateTask(editTask.id, payload as Parameters<typeof updateTask>[1]),
      );
    }
    if (taskTypeEff === "recurring") {
      const recurringPayload: Parameters<typeof createRecurringTask>[0] = {
        ...(payload as unknown as Parameters<typeof createRecurringTask>[0]),
        status_id: formData.statusId as number,
        start_date: formData.startDate,
        end_date: formData.dueDate || null,
        type: "recurring",
      };
      if (formData.projectId != null && formData.projectId > 0) {
        recurringPayload.project_id = formData.projectId;
        recurringPayload.label_ids = formData.labelIds || [];
      }
      return Boolean(await createRecurringTask(recurringPayload));
    }
    const withTz = { ...payload, timezone: getAutoTimezone() };
    return Boolean(await createTask(withTz as Parameters<typeof createTask>[0]));
  };

  const submitPlannerTask = async (
    e: React.MouseEvent | undefined,
    onSuccess: ((data: CreateTaskFormData) => void) | undefined,
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmitting) return;
    if (!validateBeforeSubmit()) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const ok = await persistTaskFromPayload(payload);
      if (ok) {
        onSuccess?.(formData);
        onClose?.();
      }
    } catch (error) {
      console.error(`Error ${isEdit ? "updating" : "creating"} task:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e?: React.MouseEvent) => {
    await submitPlannerTask(e, onCreate);
  };

  const toggleLabel = (labelId: number) => {
    setFormData((prev) => ({
      ...prev,
      labelIds: prev.labelIds.includes(labelId)
        ? prev.labelIds.filter((id) => id !== labelId)
        : [...prev.labelIds, labelId],
    }));
  };

  const toggleAssignee = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...prev.assigneeIds, userId],
    }));
  };

  const toggleWatcher = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      watcherIds: prev.watcherIds.includes(userId)
        ? prev.watcherIds.filter((id) => id !== userId)
        : [...prev.watcherIds, userId],
    }));
  };

  const removeLinkedRecordById = useCallback((id: number) => {
    setFormData((prev) => ({
      ...prev,
      linkedRecordIds: prev.linkedRecordIds.filter((x) => x !== id),
    }));
  }, []);

  const toggleLinkedRecord = useCallback((recordId: number) => {
    setFormData((prev) => ({
      ...prev,
      linkedRecordIds: prev.linkedRecordIds.includes(recordId) ? [] : [recordId],
    }));
  }, []);

  const handleLinkedRecordsSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);
      fetchLinkRecordsForSearch(value, formData.projectId).catch(() => undefined);
    },
    [formData.projectId, fetchLinkRecordsForSearch],
  );

  const handleStartDateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = e.target.value;
      setFormData((prev) => {
        const minDue = minDueDateFromTodayAndStart(newStart);
        const nextDue = clampDueDateToMin(prev.dueDate, minDue);
        return { ...prev, startDate: newStart, dueDate: nextDue };
      });
    },
    [],
  );

  const handleDueDateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setFormData((prev) => ({
        ...prev,
        dueDate: v
          ? clampDueDateToMin(v, minDueDateFromTodayAndStart(prev.startDate))
          : "",
      }));
    },
    [],
  );

  const selectedAssignees = users.filter((u) =>
    formData.assigneeIds.includes(u.id)
  );
  const selectedWatchers = users.filter((u) =>
    formData.watcherIds.includes(u.id)
  );
  const selectedLabels = labels.filter((l) =>
    formData.labelIds.includes(l.id)
  );

  const linkedRecordsForDisplay = useMemo(() => {
    const api = linkedRecordsFromApi;
    const fallbackParent =
      isEdit && editTask ? resolveParentTaskLinkFromEditTask(editTask) : null;
    const extras: LinkedRecord[] = [];
    for (const sid of formData.linkedRecordIds) {
      if (api.some((r) => r.id === sid)) {
        continue;
      }
      if (fallbackParent?.id === sid) {
        extras.push(fallbackParent);
      } else {
        extras.push({
          id: sid,
          type: "task",
          title: `Task #${sid}`,
          reference: `#${sid}`,
        });
      }
    }
    const extraIds = new Set(extras.map((e) => e.id));
    const rest = api.filter((r) => !extraIds.has(r.id));
    return [...extras, ...rest];
  }, [linkedRecordsFromApi, formData.linkedRecordIds, isEdit, editTask]);

  const selectedLinkedRecords = useMemo((): LinkedRecord[] => {
    const byId = new Map(linkedRecordsForDisplay.map((r) => [r.id, r]));
    const out: LinkedRecord[] = [];
    for (const id of formData.linkedRecordIds) {
      const row = byId.get(id);
      if (row) out.push(row);
    }
    return out;
  }, [linkedRecordsForDisplay, formData.linkedRecordIds]);

  const renderLinkedRecordsList = (): React.ReactNode => {
    if (loadingLinkedRecords && linkedRecordsForDisplay.length === 0) {
      return (
        <div
          className="p-3 text-center text-muted"
          style={{ fontSize: "0.9rem" }}
        >
          Loading tasks...
        </div>
      );
    }
    if (linkedRecordsForDisplay.length === 0) {
      return (
        <div
          className="p-3 text-center text-muted"
          style={{ fontSize: "0.9rem" }}
        >
          {linkedRecordsEmptyMessage(Boolean(searchQuery))}
        </div>
      );
    }
    return linkedRecordsForDisplay.map((record) => (
      <LinkedRecordListRow
        key={record.id}
        record={record}
        selected={formData.linkedRecordIds.includes(record.id)}
        onToggle={toggleLinkedRecord}
      />
    ));
  };

  if (!isOpen) return null;

  const handleRecurringFrequencySelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextFreq = e.target.value;
    setFormData((prev) => {
      let nextRepeatOn: string;
      if (nextFreq === "weekly") {
        const normalized = normalizeWeeklyRepeatOnFromApi(prev.repeatOn);
        nextRepeatOn = normalized || "monday";
      } else if (nextFreq === "monthly") {
        nextRepeatOn = /^\d+$/.test(prev.repeatOn.trim())
          ? prev.repeatOn.trim()
          : "1";
      } else {
        nextRepeatOn = "";
      }
      return { ...prev, frequency: nextFreq, repeatOn: nextRepeatOn };
    });
  };

  const handleProjectSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newProjectId = e.target.value ? Number(e.target.value) : null;
    setFormData((prev) => ({
      ...prev,
      projectId: newProjectId,
      statusId: null,
    }));
    fetchLinkRecordsForSearch(searchQuery, newProjectId).catch(() => undefined);
  };

  const sidebarEditTaskId =
    isEdit && editTask
      ? (editTask.id ?? editTask.rawData?.id ?? null)
      : null;

  const labelStyle = {
    fontSize: "14px",
    color: "#141414",
    fontWeight: 600,
    marginBottom: 8,
  };
  const groupClass = "mb-3";
  const dueDateMin = minDueDateFromTodayAndStart(formData.startDate);

  return (
    <>
      <style>{`
        .create-task-sidebar-panel .form-control,
        .create-task-sidebar-panel .form-select {
          border-color: #8a8a8a !important;
          border-radius: 4px !important;
          height: 40px !important;
          font-size: 16px !important;
          font-weight: 300 !important;
        }

        .create-task-sidebar-panel .form-control::placeholder,
        .create-task-sidebar-panel textarea::placeholder,
        .create-task-sidebar-panel input::placeholder {
          font-size: 16px !important;
          font-weight: 300 !important;
        }
      `}</style>

      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.2)",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      />
      <div
        className="create-task-sidebar-panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 520,
          maxWidth: "100vw",
          height: "100vh",
          backgroundColor: "#fff",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.12)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e8eef5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ListTodo size={20} color="#4e6fa5" />
            {getSidebarTitle(formData.taskType, isEdit)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "#6c757d",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body: main form scrolls; existing task shows Activities / Comments / Documents above footer */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "24px",
            }}
          >
          <Form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>

            {isLimitedTaskEdit && (
              <p
                className="text-muted small mb-3"
                style={{ marginTop: -8, fontSize: 13 }}
              >
                <strong>Assignees</strong> and <strong>watchers</strong> cannot be changed for your
                role; all other fields can be updated.
              </p>
            )}

            <Row>

              <Col xs={12}>
              <Form.Group className={groupClass}>
              <Form.Label style={labelStyle}>
                <FileText size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                Title <span style={{ color: "#ef4444" }}>*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="py-2"
                style={{ fontSize: "14px" }}
                required
              />
            </Form.Group>
              </Col>

              <Col xs={12} md={6}>
              <Form.Group className={groupClass}>
              <Form.Label style={labelStyle}>
                Task Type <span style={{ color: "#ef4444" }}>*</span>
              </Form.Label>
              <Form.Select
                value={clampTaskTypeToAllowed(formData.taskType, taskTypeOptions)}
                onChange={handleTaskTypeChange}
                disabled={isEdit}
                className="py-2"
                style={{ fontSize: "14px" }}
              >
                {taskTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {TASK_TYPE_SELECT_LABELS[opt]}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
              </Col>
              <Col xs={12} md={6}>
              <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    Priority <span style={{ color: "#ef4444" }}>*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.priorityId || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priorityId: Number(e.target.value),
                      })
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  >
                    {priorities.map((priority) => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12}>
              <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    Associate with records
                  </Form.Label>
                  {selectedLinkedRecords.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      {selectedLinkedRecords.map((r) => (
                        <SelectedLinkedRecordChip
                          key={r.id}
                          record={r}
                          onRemove={removeLinkedRecordById}
                        />
                      ))}
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <Form.Control
                      type="text"
                      placeholder="Search task..."
                      value={searchQuery}
                      onChange={handleLinkedRecordsSearchChange}
                      className="py-2"
                      style={{ fontSize: "14px" }}
                    />
                  </div>
                  <div
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 4,
                    }}
                  >
                    {renderLinkedRecordsList()}
                  </div>
                </Form.Group>
              </Col>

              <Col xs={12}>
              {formData.taskType !== "todo" && (
              <fieldset
                disabled={isLimitedTaskEdit}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
              <Form.Group className={groupClass}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Form.Label style={{ ...labelStyle, marginBottom: 0 }}>
                    <Users size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Assigned To
                  </Form.Label>
                  {!isLimitedTaskEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssigneeDropdown(!showAssigneeDropdown);
                        if (!showAssigneeDropdown) setAssigneeSearchQuery("");
                      }}
                      style={{
                        backgroundColor: "rgb(255, 255, 255)",
                        borderColor: "rgb(138, 138, 138)",
                        color: "rgb(20, 20, 20)",
                        textDecoration: "none",
                        borderRadius: 4,
                        borderWidth: 1,
                        borderStyle: "solid",
                        verticalAlign: "middle",
                        paddingBlock: "8px",
                        paddingInline: "16px",
                        maxWidth: "100%",
                        fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
                        fontSize: "12px",
                        fontWeight: 300,
                        letterSpacing: "0px",
                        lineHeight: "14px",
                        textUnderlineOffset: "24%",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={14} />
                      Add Assignee
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {selectedAssignees.map((user) =>
                    isLimitedTaskEdit ? (
                      <span
                        key={user.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          borderRadius: 6,
                          backgroundColor: "#edf6ff",
                          border: "1px solid #bfdbfe",
                          fontSize: "0.875rem",
                          color: "#141414",
                          fontWeight: 500,
                        }}
                      >
                        {user.name}
                      </span>
                    ) : (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAssignee(user.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          borderRadius: 6,
                          backgroundColor: "#edf6ff",
                          border: "1px solid #bfdbfe",
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          font: "inherit",
                        }}
                      >
                        <span style={{ color: "#141414", fontWeight: 500 }}>
                          {user.name}
                        </span>
                        <X size={14} style={{ color: "#64748b" }} />
                      </button>
                    ),
                  )}
                </div>
                {showAssigneeDropdown && !isLimitedTaskEdit && (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 4,
                      backgroundColor: "#f8fafc",
                      maxHeight: 250,
                      overflowY: "auto",
                    }}
                  >
                    <div
                      className="p-2 border-bottom"
                      style={{ backgroundColor: "white" }}
                    >
                      <Form.Control
                        type="text"
                        placeholder="Search assignees..."
                        value={assigneeSearchQuery}
                        onChange={(e) =>
                          setAssigneeSearchQuery(e.target.value)
                        }
                        className="py-2"
                        style={{ paddingLeft: 40, fontSize: "14px" }}
                      />
                    </div>
                    {users
                      .filter((user) =>
                        user.name
                          .toLowerCase()
                          .includes(assigneeSearchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleAssignee(user.id)}
                          style={{
                            padding: "7px 12px",
                            cursor: "pointer",
                            backgroundColor: formData.assigneeIds.includes(user.id)
                              ? "#edf6ff"
                              : "white",
                            border: "none",
                            borderBottom: "1px solid #d5d5d5",
                            width: "100%",
                            textAlign: "left",
                            font: "inherit",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#141414",
                            }}
                          >
                            {user.name}
                          </span>
                          {formData.assigneeIds.includes(user.id) && (
                            <Check
                              size={18}
                              className="text-primary ms-2"
                              style={{ flexShrink: 0, display: "inline", verticalAlign: "middle" }}
                            />
                          )}
                        </button>
                      ))}
                    
                  </div>
                )}
              </Form.Group>
              </fieldset>
            )}
              </Col>

              <Col xs={12}>
              {formData.taskType !== "todo" && (
              <fieldset
                disabled={isLimitedTaskEdit}
                style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
              >
              <Form.Group className={groupClass}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Form.Label style={{ ...labelStyle, marginBottom: 0 }}>
                    <Eye size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Watchers
                  </Form.Label>
                  {!isLimitedTaskEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowWatcherDropdown(!showWatcherDropdown);
                        if (!showWatcherDropdown) setWatcherSearchQuery("");
                      }}
                      style={{
                        backgroundColor: "rgb(255, 255, 255)",
                        borderColor: "rgb(138, 138, 138)",
                        color: "rgb(20, 20, 20)",
                        textDecoration: "none",
                        borderRadius: 4,
                        borderWidth: 1,
                        borderStyle: "solid",
                        verticalAlign: "middle",
                        paddingBlock: "8px",
                        paddingInline: "16px",
                        maxWidth: "100%",
                        fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
                        fontSize: "12px",
                        fontWeight: 300,
                        letterSpacing: "0px",
                        lineHeight: "14px",
                        textUnderlineOffset: "24%",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={14} />
                      Add Watcher
                    </button>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {selectedWatchers.map((user) =>
                    isLimitedTaskEdit ? (
                      <span
                        key={user.id}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          borderRadius: 6,
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          fontSize: "0.875rem",
                          color: "#141414",
                          fontWeight: 500,
                        }}
                      >
                        {user.name}
                      </span>
                    ) : (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleWatcher(user.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 12px",
                          borderRadius: 6,
                          backgroundColor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          fontSize: "0.875rem",
                          cursor: "pointer",
                          font: "inherit",
                        }}
                      >
                        <span style={{ color: "#141414", fontWeight: 500 }}>
                          {user.name}
                        </span>
                        <X size={14} style={{ color: "#64748b" }} />
                      </button>
                    ),
                  )}
                </div>
                {showWatcherDropdown && !isLimitedTaskEdit && (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 4,
                      backgroundColor: "#f8fafc",
                      maxHeight: 250,
                      overflowY: "auto",
                    }}
                  >
                    <div
                      className="p-2 border-bottom"
                      style={{ backgroundColor: "white" }}
                    >
                      <Form.Control
                        type="text"
                        placeholder="Search watchers..."
                        value={watcherSearchQuery}
                        onChange={(e) =>
                          setWatcherSearchQuery(e.target.value)
                        }
                        className="py-2"
                        style={{ paddingLeft: 40, fontSize: "14px" }}
                      />
                    </div>
                    {users
                      .filter((user) =>
                        user.name
                          .toLowerCase()
                          .includes(watcherSearchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleWatcher(user.id)}
                          style={{
                            padding: "7px 12px",
                            cursor: "pointer",
                            backgroundColor: formData.watcherIds.includes(user.id)
                              ? "#f0fdf4"
                              : "white",
                            border: "none",
                            borderBottom: "1px solid #d5d5d5",
                            width: "100%",
                            textAlign: "left",
                            font: "inherit",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#141414",
                            }}
                          >
                            {user.name}
                          </span>
                          {formData.watcherIds.includes(user.id) && (
                            <Check
                              size={18}
                              style={{
                                flexShrink: 0,
                                display: "inline",
                                verticalAlign: "middle",
                                color: "#22c55e",
                              }}
                            />
                          )}
                        </button>
                      ))}
                    
                  </div>
                )}
              </Form.Group>
              </fieldset>
            )}

              </Col>

              <Col xs={12} md={6}>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Start Date
                    {formData.taskType === "recurring" && (
                      <span style={{ color: "#ef4444" }}> *</span>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={handleStartDateInputChange}
                    className="py-2"
                    style={{ fontSize: "14px" }}
                    required={formData.taskType === "recurring"}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Due Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    min={dueDateMin}
                    value={formData.dueDate}
                    onChange={handleDueDateInputChange}
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Group>
              </Col>

            </Row>


            {formData.taskType === "recurring" && (
              <>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Frequency
                  </Form.Label>
                  <Form.Select
                    value={formData.frequency}
                    onChange={handleRecurringFrequencySelectChange}
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className={groupClass}>
                      <Form.Label style={labelStyle}>
                        Repeat every
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        max={99}
                        value={formData.repeatInterval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            repeatInterval: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                          })
                        }
                        className="py-2"
                        style={{ fontSize: "14px" }}
                      />
                      <Form.Text className="text-muted">
                        {formData.frequency === "daily" && "day(s)"}
                        {formData.frequency === "weekly" && "week(s)"}
                        {formData.frequency === "monthly" && "month(s)"}
                        {formData.frequency === "yearly" && "year(s)"}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  {(formData.frequency === "weekly" || formData.frequency === "monthly") && (
                    <Col xs={12} md={6}>
                      <Form.Group className={groupClass}>
                        <Form.Label style={labelStyle}>
                          {formData.frequency === "weekly" ? "Repeat on" : "Day of month"}
                        </Form.Label>
                        {formData.frequency === "weekly" ? (
                          <Form.Select
                            value={
                              isWeeklyRepeatOnValue(formData.repeatOn.trim().toLowerCase())
                                ? formData.repeatOn.trim().toLowerCase()
                                : "monday"
                            }
                            onChange={(e) =>
                              setFormData({ ...formData, repeatOn: e.target.value })
                            }
                            className="py-2"
                            style={{ fontSize: "14px" }}
                          >
                            {WEEKLY_REPEAT_ON_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </Form.Select>
                        ) : (
                          <Form.Control
                            type="number"
                            min={1}
                            max={31}
                            placeholder="e.g. 15"
                            value={formData.repeatOn || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? "" : String(Math.max(1, Math.min(31, Number(v) || 1)));
                              setFormData({ ...formData, repeatOn: num });
                            }}
                            className="py-2"
                            style={{ fontSize: "14px" }}
                          />
                        )}
                      </Form.Group>
                    </Col>
                  )}
                </Row>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Time (optional)
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dueTime: e.target.value })
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Group>
                {isEdit && (
                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className={groupClass}>
                        <Form.Label style={labelStyle}>
                          <Calendar
                            size={16}
                            className="me-2"
                            style={{ verticalAlign: "middle" }}
                          />
                          Last run at
                        </Form.Label>
                        <div
                          className="form-control py-2"
                          style={{
                            fontSize: "14px",
                            fontWeight: 300,
                            backgroundColor: "#f8fafc",
                            color: "#374151",
                            cursor: "default",
                          }}
                          aria-readonly="true"
                        >
                          {formatDateTimeForDisplay(
                            recurringScheduleField(editTask, "last_run_at"),
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className={groupClass}>
                        <Form.Label style={labelStyle}>
                          <Calendar
                            size={16}
                            className="me-2"
                            style={{ verticalAlign: "middle" }}
                          />
                          Next run at
                        </Form.Label>
                        <div
                          className="form-control py-2"
                          style={{
                            fontSize: "14px",
                            fontWeight: 300,
                            backgroundColor: "#f8fafc",
                            color: "#374151",
                            cursor: "default",
                          }}
                          aria-readonly="true"
                        >
                          {formatDateTimeForDisplay(
                            recurringScheduleField(editTask, "next_run_at"),
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                )}
              </>
            )}




            

            

            

            <Form.Group className={groupClass}>
              <Form.Label style={labelStyle}>
                <FileText size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                Description
              </Form.Label>
              <RichTextEditor
                buttonSize="sm"
                value={formData.description || ""}
                onChange={(html: string) => {
                  setFormData({ ...formData, description: html });
                }}
                placeholder="Describe the task..."
                minHeight="100px"
                maxHeight="200px"
                maxLength={5000}
              />
            </Form.Group>

            <Row className="mb-3">
              {formData.taskType !== "todo" && (
                <Col xs={12} className="mb-3">
                  <Form.Group className={groupClass}>
                    <Form.Label style={labelStyle}>
                      <FolderOpen size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                      Project
                      {formData.taskType === "recurring" && (
                        <span style={{ fontWeight: 400, color: "#6b7280" }}> (optional)</span>
                      )}
                    </Form.Label>
                    <Form.Select
                      value={formData.projectId || ""}
                      onChange={handleProjectSelectChange}
                      className="py-2"
                      style={{ fontSize: "14px" }}
                      disabled={
                        lockProjectSelection ||
                        loadingProjects ||
                        projects.length === 0
                      }
                    >
                      {renderProjectSelectChildren(loadingProjects, projects)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

             
                <Col xs={6} className="mb-3">
                  <Form.Group className={groupClass}>
                    <Form.Label style={labelStyle}>
                      <ListTodo size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                      Status
                    </Form.Label>
                    <Form.Select
                      value={formData.statusId ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="py-2"
                      style={{ fontSize: "14px" }}
                      disabled={
                        (formData.projectId && loadingProjects) ||
                        (!formData.projectId && loadingGenericStatuses) ||
                        statuses.length === 0
                      }
                    >
                      <StatusSelectOptions
                        formDataProjectId={formData.projectId}
                        loadingProjects={loadingProjects}
                        loadingGenericStatuses={loadingGenericStatuses}
                        statuses={statuses}
                        isEdit={isEdit}
                        statusId={formData.statusId}
                        editTask={editTask}
                      />
                    </Form.Select>
                  </Form.Group>
                </Col>
             

{formData.taskType !== "todo" && (
                <Col xs={12} md={6}>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Tag size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Labels
                  </Form.Label>
                  {selectedLabels.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      {selectedLabels.map((label) => (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleLabel(label.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 12px",
                            backgroundColor: label.color,
                            color: "#141414",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            borderRadius: 6,
                            border: "none",
                            font: "inherit",
                          }}
                        >
                          <Tag size={12} />
                          {label.name}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      maxHeight: 140,
                      overflowY: "auto",
                      padding: 9,
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {labels.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#718096",
                          fontSize: "14px",
                        }}
                      >
                        No labels available
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {labels.map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => toggleLabel(label.id)}
                            style={{
                              backgroundColor: formData.labelIds.includes(
                                label.id
                              )
                                ? label.color
                                : "#ffffff",
                              color: "#141414",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              padding: "6px 12px",
                              cursor: "pointer",
                              border: formData.labelIds.includes(label.id)
                                ? "2px solid #3b82f6"
                                : "1px solid #e2e8f0",
                              borderRadius: 6,
                              font: "inherit",
                            }}
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Form.Group>
                </Col>
            )}

             
              
            </Row>

            

            
            
          </Form>
          </div>
          <TaskSecondaryTabs
            taskId={sidebarEditTaskId}
            extensions={extensions}
            visible={Boolean(sidebarEditTaskId)}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e8eef5",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          {onCreateAndOpen && !isEdit && (
            <button
              type="button"
              onClick={(e) => {
                submitPlannerTask(e, onCreateAndOpen).catch(() => undefined);
              }}
              disabled={isSubmitting}
              style={{
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: "#4f46e5",
                border: "none",
                borderRadius: 4,
                color: "#fff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Processing..." : "Create & open"}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleCreate()}
            disabled={isSubmitting}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: "#000000",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {primarySubmitButtonLabel(isSubmitting, isEdit)}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateTaskSidebar;
