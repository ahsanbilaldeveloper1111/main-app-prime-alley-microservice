import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Form, Row, Col } from "react-bootstrap";
import {
  X,
  Calendar,
  Clock,
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
import {
  formatPlannerDueTimeAsUtcIso,
  parseApiDueTimeToTimeInput,
} from "@utils/plannerTaskDueTime";
import RichTextEditor from "../../pages/help-center/partials/RichTextEditor";
import TaskSecondaryTabs from "@pages/planner/partials/TaskSecondaryTabs";
import type { PlannerTaskEditScope } from "@planner/taskRowPermissions";

// ─── Types (from createtask-modal) ─────────────────────────────────────────────

type PlannerTaskType = "todo" | "regular" | "recurring";

type RecurringEndStrategy = "never" | "end_date" | "occurrences";

type CustomFrequencyUnit = "days" | "weeks" | "months" | "years";

const TASK_TYPE_SELECT_LABELS: Record<PlannerTaskType, string> = {
  todo: "Todo",
  regular: "Regular",
  recurring: "Recurring",
};

const ALL_PLANNER_TASK_TYPES: PlannerTaskType[] = ["todo", "regular", "recurring"];

const TASK_TITLE_MAX_LENGTH = 150;

/** Shared visual tokens for create / edit task sidebar */
const PLANNER_TASK_SIDEBAR = {
  accent: "#141414",
  accentSoft: "rgba(20, 20, 20, 0.06)",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  text: "#141414",
  textMuted: "#6b7280",
  shadow: "-8px 0 20px rgba(0, 0, 0, 0.08)",
  radiusLg: 0,
} as const;

function clampTaskTitleLength(value: string): string {
  return value.slice(0, TASK_TITLE_MAX_LENGTH);
}

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

/** Create flow: no type chosen yet (shows “Select type” in the dropdown). */
type PlannerTaskTypeOrUnset = PlannerTaskType | "";

function taskTypeSelectHtmlValue(
  current: PlannerTaskTypeOrUnset,
  allowed: readonly PlannerTaskType[],
): string {
  if (current === "") return "";
  return clampTaskTypeToAllowed(current, allowed);
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
  taskTypeChoices?: readonly PlannerTaskType[];
  /** When true (e.g. project details / board), the project dropdown is disabled — task stays on the current project. */
  lockProjectSelection?: boolean;
  /**
   * `limited`: non-admin / non-owner — assignees and watchers are read-only; all other fields can be saved from the form.
   */
  taskEditScope?: PlannerTaskEditScope;
  /**
   * When opening edit for a to-do or regular task, seed the form as recurring so the user can save a conversion in one step.
   */
  openAsRecurringConversion?: boolean;
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
  is_active?: boolean;
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
  /** From project or list-statuses API; drives default dropdown selection when creating. */
  is_default?: boolean;
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
  taskType: PlannerTaskTypeOrUnset;
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
  /** Local `HH:mm` for API `due_time`: with start date when recurring, with due date for regular and to-do tasks. */
  dueTime: string;
  /** Recurring tasks only; maps to API `is_active`. */
  recurringIsActive: boolean;
  recurringEndStrategy: RecurringEndStrategy;
  /** When `recurringEndStrategy === "end_date"` (YYYY-MM-DD). */
  recurringEndDate: string;
  /** When `recurringEndStrategy === "occurrences"`; max materialized child tasks. */
  recurringOccurrences: number;
  estimatedDurationMinutes: string;
  recurringReminderEnabled: boolean;
  recurringReminderMinutes: number;
  recurringAutoCreateNextOnComplete: boolean;
  recurringCreateNextIfPreviousIncomplete: boolean;
  /** Used when `frequency === "custom"`. */
  customIntervalUnit: CustomFrequencyUnit;
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
  if (data.taskType === "recurring") {
    return data;
  }
  const min = minDueDateFromTodayAndStart(data.startDate);
  return { ...data, dueDate: clampDueDateToMin(data.dueDate, min) };
}

function parsePositiveIntFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.trim());
    if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  }
  return null;
}

function normalizeCustomIntervalUnitFromApi(raw: unknown): CustomFrequencyUnit {
  const s = unknownToPrimitiveString(raw).trim().toLowerCase();
  if (s === "days" || s === "day") return "days";
  if (s === "weeks" || s === "week") return "weeks";
  if (s === "months" || s === "month") return "months";
  if (s === "years" || s === "year") return "years";
  return "days";
}

function readFrequencyConfigFromEdit(editTask: PlannerEditTask | undefined): {
  unit: CustomFrequencyUnit;
  interval: number;
} | null {
  const raw = pickRecurringScalar(editTask, "frequency_config");
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    unit: normalizeCustomIntervalUnitFromApi(o.unit),
    interval: Math.max(1, parsePositiveIntFromUnknown(o.interval) ?? 1),
  };
}

function resolveRecurringEndStrategyFromScalars(
  occurrences: number | null,
  endDateIso: string,
): RecurringEndStrategy {
  if (occurrences != null) return "occurrences";
  if (endDateIso.trim() !== "") return "end_date";
  return "never";
}

function coalesceFiniteNumberFromUnknown(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function seedRecurringFieldsWhenSwitchingToRecurring(
  prev: CreateTaskFormData,
): Pick<
  CreateTaskFormData,
  | "startDate"
  | "dueDate"
  | "frequency"
  | "repeatInterval"
  | "repeatOn"
  | "dueTime"
  | "recurringIsActive"
  | "recurringEndStrategy"
  | "recurringEndDate"
  | "recurringOccurrences"
  | "estimatedDurationMinutes"
  | "recurringReminderEnabled"
  | "recurringReminderMinutes"
  | "recurringAutoCreateNextOnComplete"
  | "recurringCreateNextIfPreviousIncomplete"
  | "customIntervalUnit"
> {
  const start =
    prev.startDate.trim() ||
    prev.dueDate.trim() ||
    todayLocalIsoDate();
  return {
    startDate: start,
    dueDate: "",
    frequency: "weekly",
    repeatInterval: 1,
    repeatOn: "monday",
    dueTime: prev.dueTime,
    recurringIsActive: true,
    recurringEndStrategy: "never",
    recurringEndDate: "",
    recurringOccurrences: 12,
    estimatedDurationMinutes: "",
    recurringReminderEnabled: false,
    recurringReminderMinutes: 30,
    recurringAutoCreateNextOnComplete: false,
    recurringCreateNextIfPreviousIncomplete: false,
    customIntervalUnit: "days",
  };
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

/**
 * Edit mode: recurring templates cannot downgrade to one-off types.
 * One-off tasks may only move to recurring, not swap between the two one-off kinds.
 */
function restrictPlannerTaskTypeOptionsForEdit(
  editMode: boolean,
  editTask: PlannerEditTask | undefined,
  allowedFromProps: readonly PlannerTaskType[],
): PlannerTaskType[] {
  if (!editMode || editTask == null) {
    return [...allowedFromProps];
  }
  const origin = normalizeEditTaskType(editTask);
  if (origin === "recurring") {
    if (allowedFromProps.includes("recurring")) {
      return ["recurring"];
    }
    return [...allowedFromProps];
  }
  if (origin === "todo") {
    const next = allowedFromProps.filter((t) => t === "todo" || t === "recurring");
    return next.length > 0 ? [...next] : ["todo"];
  }
  if (origin === "regular") {
    const next = allowedFromProps.filter((t) => t === "regular" || t === "recurring");
    return next.length > 0 ? [...next] : ["regular"];
  }
  return [...allowedFromProps];
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

function readRecurringIsActiveFromEditTask(editTask: PlannerEditTask): boolean {
  const top = (editTask as Record<string, unknown>).is_active;
  if (top === false) return false;
  if (top === true) return true;
  const nested = pickRecurringScalar(editTask, "is_active");
  if (nested === false) return false;
  if (nested === true) return true;
  return true;
}

function readRecurringReminderStateFromEdit(
  editTask: PlannerEditTask,
  isRecurringTemplate: boolean,
): { enabled: boolean; minutes: number } {
  const reminderRaw = pickRecurringScalar(editTask, "reminder_minutes");
  const reminderNum = coalesceFiniteNumberFromUnknown(reminderRaw);
  const safeReminder =
    reminderNum != null && Number.isFinite(reminderNum)
      ? Math.max(0, Math.floor(reminderNum))
      : 0;
  const enabled = isRecurringTemplate && safeReminder > 0;
  return {
    enabled,
    minutes: enabled ? Math.max(1, safeReminder) : 30,
  };
}

function readEstimatedDurationFormStringFromEdit(
  editTask: PlannerEditTask,
  isRecurringTemplate: boolean,
): string {
  if (!isRecurringTemplate) return "";
  const estRaw = pickRecurringScalar(editTask, "estimated_duration_minutes");
  const estNum = coalesceFiniteNumberFromUnknown(estRaw);
  if (estNum == null || !Number.isFinite(estNum) || estNum <= 0) return "";
  return String(Math.floor(estNum));
}

function readRecurringBooleanFlag(editTask: PlannerEditTask, key: string): boolean {
  const raw = pickRecurringScalar(editTask, key);
  return raw === true || raw === 1;
}

type RecurringTemplateSlice = Pick<
  CreateTaskFormData,
  | "frequency"
  | "repeatInterval"
  | "repeatOn"
  | "recurringEndStrategy"
  | "recurringEndDate"
  | "recurringOccurrences"
  | "estimatedDurationMinutes"
  | "recurringReminderEnabled"
  | "recurringReminderMinutes"
  | "recurringAutoCreateNextOnComplete"
  | "recurringCreateNextIfPreviousIncomplete"
  | "customIntervalUnit"
  | "recurringIsActive"
>;

function readRecurringTemplateFormSlice(editTask: PlannerEditTask): RecurringTemplateSlice {
  const isRecurringTemplate = normalizeEditTaskType(editTask) === "recurring";
  const freqRaw = pickRecurringScalar(editTask, "frequency");
  const freqStr = unknownToPrimitiveString(freqRaw).trim();
  const frequency = freqStr === "" ? "weekly" : freqStr;
  const freqConfig = readFrequencyConfigFromEdit(editTask);
  const customIntervalUnit: CustomFrequencyUnit = freqConfig?.unit ?? "days";
  const repeatIntervalBase = Math.max(1, Number(pickRecurringScalar(editTask, "repeat_interval")) || 1);
  const repeatInterval =
    frequency === "custom" && freqConfig ? freqConfig.interval : repeatIntervalBase;
  const repeatOn = repeatOnForEditTask(editTask, frequency);
  const occParsed = parsePositiveIntFromUnknown(pickRecurringScalar(editTask, "occurrences"));
  const endDateScalar =
    pickRecurringScalar(editTask, "end_date") ?? pickRecurringScalar(editTask, "due_date");
  const endDateFormatted = formatDateForInput(
    typeof endDateScalar === "string" ? endDateScalar : undefined,
  );
  const recurringEndStrategy = resolveRecurringEndStrategyFromScalars(
    occParsed,
    isRecurringTemplate ? endDateFormatted : "",
  );
  const recurringEndDate =
    isRecurringTemplate && recurringEndStrategy === "end_date" ? endDateFormatted : "";
  const recurringOccurrences =
    isRecurringTemplate && recurringEndStrategy === "occurrences" && occParsed != null
      ? occParsed
      : 12;
  const reminderState = readRecurringReminderStateFromEdit(editTask, isRecurringTemplate);
  const estimatedDurationMinutes = readEstimatedDurationFormStringFromEdit(
    editTask,
    isRecurringTemplate,
  );
  const recurringAutoCreateNextOnComplete =
    isRecurringTemplate && readRecurringBooleanFlag(editTask, "recurring_auto_create_next_on_complete");
  const recurringCreateNextIfPreviousIncomplete =
    isRecurringTemplate &&
    readRecurringBooleanFlag(editTask, "recurring_create_next_if_previous_incomplete");
  return {
    frequency,
    repeatInterval,
    repeatOn,
    recurringEndStrategy,
    recurringEndDate,
    recurringOccurrences,
    estimatedDurationMinutes,
    recurringReminderEnabled: reminderState.enabled,
    recurringReminderMinutes: reminderState.minutes,
    recurringAutoCreateNextOnComplete,
    recurringCreateNextIfPreviousIncomplete,
    customIntervalUnit,
    recurringIsActive: readRecurringIsActiveFromEditTask(editTask),
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
  const isRecurringTemplate = taskTypeVal === "recurring";
  const recurringSlice = readRecurringTemplateFormSlice(editTask);
  const dueTimeRaw = pickRecurringScalar(editTask, "due_time");
  const dueTime =
    typeof dueTimeRaw === "string"
      ? parseApiDueTimeToTimeInput(dueTimeRaw)
      : "";
  const startDateRaw =
    (pickRecurringScalar(editTask, "start_date") as string | undefined) ?? editTask.start_date;
  const topDueForNonRecurring =
    typeof editTask.due_date === "string" && editTask.due_date.trim() !== ""
      ? editTask.due_date
      : undefined;
  const dueDateForRegularTodo = formatDateForInput(
    isRecurringTemplate ? undefined : topDueForNonRecurring,
  );
  return {
    title: clampTaskTitleLength(String(editTask.title ?? "")),
    description: editTask.description || "",
    taskType: taskTypeVal,
    projectId: projectIdRaw ? Number(projectIdRaw) : null,
    statusId: statusIdRaw ? Number(statusIdRaw) : null,
    priorityId: mapPriorityStringToId(editTask.priority),
    assigneeIds,
    watcherIds,
    dueDate: dueDateForRegularTodo,
    startDate: formatDateForInput(startDateRaw),
    labelIds: editTask.label_ids ?? editTask.labels?.map((l) => l.id) ?? [],
    linkedRecordIds: (() => {
      const link = resolveParentTaskLinkFromEditTask(editTask);
      return link ? [link.id] : [];
    })(),
    ...recurringSlice,
    dueTime,
  };
}

function buildInitialFormForCreate(
  taskType: PlannerTaskTypeOrUnset,
  propProject: Project | undefined,
  propStatuses: Status[],
  selectedStatusForTask: number | null,
): CreateTaskFormData {
  return {
    title: "",
    description: "",
    taskType,
    projectId: propProject?.id ?? null,
    statusId: resolvePreferredStatusId(propStatuses, selectedStatusForTask),
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
    recurringIsActive: true,
    recurringEndStrategy: "never",
    recurringEndDate: "",
    recurringOccurrences: 12,
    estimatedDurationMinutes: "",
    recurringReminderEnabled: false,
    recurringReminderMinutes: 30,
    recurringAutoCreateNextOnComplete: false,
    recurringCreateNextIfPreviousIncomplete: false,
    customIntervalUnit: "days",
  };
}

function computeFrequencyChangeState(
  prev: Pick<CreateTaskFormData, "frequency" | "repeatOn">,
  nextFreq: string,
): Pick<CreateTaskFormData, "frequency" | "repeatOn"> {
  let nextRepeatOn: string;
  if (nextFreq === "weekly") {
    const normalized = normalizeWeeklyRepeatOnFromApi(prev.repeatOn);
    nextRepeatOn = normalized || "monday";
  } else if (nextFreq === "monthly") {
    nextRepeatOn = /^\d+$/.test(prev.repeatOn.trim())
      ? prev.repeatOn.trim()
      : "1";
  } else if (nextFreq === "custom") {
    nextRepeatOn = "";
  } else {
    nextRepeatOn = "";
  }
  return { frequency: nextFreq, repeatOn: nextRepeatOn };
}

/** Normalize API flag (handles occasional `is_deefault` typo in responses). */
function readIsDefaultFromApiStatusRow(row: unknown): boolean {
  if (row == null || typeof row !== "object") return false;
  const o = row as Record<string, unknown>;
  return o.is_default === true || o.is_deefault === true;
}

/**
 * Board column / explicit `selectedStatusForTask` wins; else first status with `is_default`;
 * else first in list.
 */
function resolvePreferredStatusId(
  statuses: Status[],
  selectedStatusForTask: number | null,
): number | null {
  if (statuses.length === 0) return null;
  if (selectedStatusForTask != null) {
    return selectedStatusForTask;
  }
  const def = statuses.find((s) => s.is_default === true);
  if (def) return def.id;
  return statuses[0].id;
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

function resolveSidebarStatusesForProject(
  projectId: number | null,
  fetchedProjects: Project[],
  genericStatuses: Status[],
  fallbackPropStatuses: Status[],
): Status[] {
  if (projectId) {
    const selectedProject = fetchedProjects.find((p) => p.id === projectId);
    if (selectedProject?.statuses && Array.isArray(selectedProject.statuses)) {
      return selectedProject.statuses.map((status) => ({
        id: status.id,
        name: status.name,
        icon: "",
        color: status.color || "#3b82f6",
        is_default: readIsDefaultFromApiStatusRow(status),
      }));
    }
    return [];
  }
  if (genericStatuses.length > 0) {
    return genericStatuses;
  }
  return fallbackPropStatuses;
}

function resolveSidebarLabelsForProject(
  projectId: number | null,
  fetchedProjects: Project[],
  fallbackPropLabels: Label[],
): Label[] {
  if (!projectId) {
    return fallbackPropLabels;
  }
  const selectedProject = fetchedProjects.find((p) => p.id === projectId);
  if (selectedProject?.labels && Array.isArray(selectedProject.labels)) {
    return selectedProject.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color || "#3b82f6",
      description: label.description || "",
    }));
  }
  return fallbackPropLabels;
}

/** Normalizes `listStatuses()` responses (array or `{ data: [] }`) into sidebar `Status` rows. */
function mapListStatusesResponseToSidebarStatuses(response: unknown): Status[] {
  if (response && Array.isArray(response)) {
    return response.map((status: Status) => ({
      id: status.id,
      name: status.name,
      icon: "",
      color: status.color || "#3b82f6",
      is_default: readIsDefaultFromApiStatusRow(status),
    }));
  }
  const withData = response as { data?: unknown } | null | undefined;
  if (withData?.data && Array.isArray(withData.data)) {
    return (withData.data as Status[]).map((status: Status) => ({
      id: status.id,
      name: status.name,
      icon: "",
      color: status.color || "#3b82f6",
      is_default: readIsDefaultFromApiStatusRow(status),
    }));
  }
  return [];
}

function getSidebarTitle(taskType: PlannerTaskTypeOrUnset, isEdit: boolean): string {
  const defaultLabel = isEdit ? "Edit Task" : "Create Task";
  const typeLabelMap: Partial<Record<PlannerTaskType, string>> = {
    todo: isEdit ? "Edit Todo" : "Create Todo",
    recurring: isEdit ? "Edit Recurring" : "Create Recurring",
  };
  if (taskType === "") return defaultLabel;
  return typeLabelMap[taskType] ?? defaultLabel;
}

function linkedRecordsEmptyMessage(hasSearchQuery: boolean): string {
  if (hasSearchQuery) {
    return "No tasks found matching your search";
  }
  return "No tasks available";
}

function primarySubmitButtonLabel(isSubmitting: boolean, isEdit: boolean, isRecurringConversionMode: boolean): string {
  if (isSubmitting) return "Processing...";
  if (isRecurringConversionMode) return "Convert to Recurring";
  if (isEdit) return "Update";
  return "Create";
}

function LimitedTaskEditBanner({ visible }: { readonly visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="planner-sidebar-hint mb-3"
      style={{
        borderLeft: `4px solid ${PLANNER_TASK_SIDEBAR.accent}`,
        background: PLANNER_TASK_SIDEBAR.accentSoft,
      }}
    >
      <strong>Assignees</strong> and <strong>watchers</strong> cannot be changed for your role;
      all other fields can be updated.
    </div>
  );
}

function PlannerSidebarLinkedRecordChipsStrip({
  records,
  onRemove,
}: Readonly<{
  records: LinkedRecord[];
  onRemove: (id: number) => void;
}>): React.ReactNode {
  if (records.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 8,
      }}
    >
      {records.map((r) => (
        <SelectedLinkedRecordChip key={r.id} record={r} onRemove={onRemove} />
      ))}
    </div>
  );
}

function PlannerSidebarCreateAndOpenButton({
  isEdit,
  isSubmitting,
  onCreateAndOpen,
  onSubmit,
}: Readonly<{
  isEdit: boolean;
  isSubmitting: boolean;
  onCreateAndOpen?: (data: CreateTaskFormData) => void;
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
}>): React.ReactNode {
  if (isEdit || onCreateAndOpen == null) return null;
  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={isSubmitting}
      style={{
        padding: "10px 20px",
        fontSize: 14,
        fontWeight: 600,
        backgroundColor: PLANNER_TASK_SIDEBAR.surface,
        border: `2px solid ${PLANNER_TASK_SIDEBAR.accent}`,
        borderRadius: 10,
        color: PLANNER_TASK_SIDEBAR.accent,
        cursor: isSubmitting ? "not-allowed" : "pointer",
        opacity: isSubmitting ? 0.65 : 1,
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      {isSubmitting ? "Processing..." : "Create & open"}
    </button>
  );
}

function PlannerSidebarFooter({
  isEdit,
  isSubmitting,
  onClose,
  onCreateAndOpen,
  onCreate,
  onCreateAndOpenSubmit,
  isRecurringConversionMode,
}: Readonly<{
  isEdit: boolean;
  isSubmitting: boolean;
  onClose?: () => void;
  onCreateAndOpen?: (data: CreateTaskFormData) => void;
  onCreate: () => void;
  onCreateAndOpenSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isRecurringConversionMode: boolean;
  }>): React.ReactNode {
  return (
    <div
      className="create-task-sidebar-footer"
      style={{
        padding: "16px 24px 20px",
        display: "flex",
        gap: 10,
        justifyContent: "flex-end",
        flexShrink: 0,
        alignItems: "center",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: "10px 22px",
          fontSize: 14,
          fontWeight: 600,
          border: `1px solid ${PLANNER_TASK_SIDEBAR.border}`,
          borderRadius: 10,
          background: PLANNER_TASK_SIDEBAR.surface,
          color: PLANNER_TASK_SIDEBAR.text,
          cursor: "pointer",
          transition: "background 0.15s ease, border-color 0.15s ease",
        }}
      >
        Cancel
      </button>
      <PlannerSidebarCreateAndOpenButton
        isEdit={isEdit}
        isSubmitting={isSubmitting}
        onCreateAndOpen={onCreateAndOpen}
        onSubmit={onCreateAndOpenSubmit}
      />
      <button
        type="button"
        onClick={onCreate}
        disabled={isSubmitting}
        style={{
          padding: "10px 24px",
          fontSize: 14,
          fontWeight: 600,
          ...(isSubmitting
            ? { backgroundColor: "#94a3b8" }
            : {
                backgroundImage: `linear-gradient(135deg, ${PLANNER_TASK_SIDEBAR.accent} 0%, #4338ca 100%)`,
              }),
          border: "none",
          borderRadius: 10,
          color: "#fff",
          cursor: isSubmitting ? "not-allowed" : "pointer",
          boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(79, 70, 229, 0.35)",
        }}
      >
        {primarySubmitButtonLabel(isSubmitting, isEdit, isRecurringConversionMode)} 
      </button>
    </div>
  );
}

function PlannerSidebarRecurringRunAtReadOnlyRow({
  visible,
  editTask,
  groupClass,
  labelStyle,
}: Readonly<{
  visible: boolean;
  editTask: PlannerEditTask | undefined;
  groupClass: string;
  labelStyle: React.CSSProperties;
}>): React.ReactNode {
  if (!visible) return null;
  return (
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
            className="py-2 px-3"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor: PLANNER_TASK_SIDEBAR.surfaceMuted,
              color: PLANNER_TASK_SIDEBAR.text,
              cursor: "default",
              borderRadius: 10,
              border: `1px solid ${PLANNER_TASK_SIDEBAR.border}`,
              minHeight: 42,
              display: "flex",
              alignItems: "center",
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
            className="py-2 px-3"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor: PLANNER_TASK_SIDEBAR.surfaceMuted,
              color: PLANNER_TASK_SIDEBAR.text,
              cursor: "default",
              borderRadius: 10,
              border: `1px solid ${PLANNER_TASK_SIDEBAR.border}`,
              minHeight: 42,
              display: "flex",
              alignItems: "center",
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
  );
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

function PlannerSidebarLinkedRecordsBody({
  loadingLinkedRecords,
  linkedRecordsForDisplay,
  searchQuery,
  linkedRecordIds,
  toggleLinkedRecord,
}: Readonly<{
  loadingLinkedRecords: boolean;
  linkedRecordsForDisplay: LinkedRecord[];
  searchQuery: string;
  linkedRecordIds: number[];
  toggleLinkedRecord: (recordId: number) => void;
}>) {
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
      selected={linkedRecordIds.includes(record.id)}
      onToggle={toggleLinkedRecord}
    />
  ));
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

function plannerPriorityIdToApiString(priorityId: number | null): string | undefined {
  if (!priorityId || priorityId === 0) return "";
  const priorityMap: Record<number, string> = {
    1: "low",
    2: "normal",
    3: "high",
    4: "urgent",
  };
  return priorityMap[priorityId] || undefined;
}

function plannerPriorityDisplayName(name: string | null | undefined): string {
  const raw = String(name ?? "").trim();
  if (!raw) return "";
  return raw.toLowerCase() === "normal" ? "Medium" : raw;
}

function applyPlannerSidebarParentTaskId(
  payload: Record<string, unknown>,
  fd: CreateTaskFormData,
  isEdit: boolean,
): void {
  if (isEdit) {
    payload.parent_task_id =
      fd.linkedRecordIds.length > 0 ? fd.linkedRecordIds[0] : null;
    return;
  }
  if (fd.linkedRecordIds.length > 0) {
    payload.parent_task_id = fd.linkedRecordIds[0];
  }
}

function applyRecurringRepeatAndFrequencyConfig(
  payload: Record<string, unknown>,
  fd: CreateTaskFormData,
  isEdit: boolean,
): void {
  payload.frequency = fd.frequency;
  payload.repeat_interval = Math.max(1, fd.repeatInterval);
  if (fd.frequency === "weekly" && fd.repeatOn.trim()) {
    payload.repeat_on = fd.repeatOn.trim().toLowerCase();
  } else if (fd.frequency === "monthly" && fd.repeatOn.trim()) {
    payload.repeat_on = fd.repeatOn.trim();
  }
  if (fd.frequency === "custom") {
    payload.frequency_config = {
      unit: fd.customIntervalUnit,
      interval: Math.max(1, fd.repeatInterval),
    };
  } else if (isEdit) {
    payload.frequency_config = null;
  }
}

function applyRecurringDueTimeToPayload(
  payload: Record<string, unknown>,
  fd: CreateTaskFormData,
  isEdit: boolean,
): void {
  const dueTimeUtc = formatPlannerDueTimeAsUtcIso(fd.startDate, fd.dueTime);
  if (dueTimeUtc) {
    payload.due_time = dueTimeUtc;
    return;
  }
  if (isEdit) {
    payload.due_time = null;
  }
}

function applyRecurringEndStrategyToPayload(payload: Record<string, unknown>, fd: CreateTaskFormData): void {
  if (fd.recurringEndStrategy === "end_date") {
    payload.end_date = fd.recurringEndDate.trim() || null;
    payload.occurrences = null;
    return;
  }
  if (fd.recurringEndStrategy === "occurrences") {
    payload.occurrences = Math.max(1, Math.floor(fd.recurringOccurrences));
    payload.end_date = null;
    return;
  }
  payload.end_date = null;
  payload.occurrences = null;
}

function applyRecurringOptionalNumericFields(
  payload: Record<string, unknown>,
  fd: CreateTaskFormData,
  isEdit: boolean,
): void {
  payload.reminder_minutes =
    fd.recurringReminderEnabled && fd.recurringReminderMinutes > 0
      ? Math.max(1, Math.floor(fd.recurringReminderMinutes))
      : 0;
}

function applyEstimatedDurationMinutesToPayload(
  payload: Record<string, unknown>,
  fd: CreateTaskFormData,
  isEdit: boolean,
): void {
  const estTrim = fd.estimatedDurationMinutes.trim();
  if (estTrim !== "") {
    const est = Math.min(525600, Math.max(0, Math.floor(Number(estTrim))));
    if (Number.isFinite(est)) {
      payload.estimated_duration_minutes = est;
    }
  } else if (isEdit) {
    payload.estimated_duration_minutes = null;
  }
}

function applyPlannerSidebarRecurringPayload(
  payload: Record<string, unknown>,
  fd: CreateTaskFormData,
  isEdit: boolean,
): void {
  applyRecurringRepeatAndFrequencyConfig(payload, fd, isEdit);
  applyRecurringDueTimeToPayload(payload, fd, isEdit);
  applyRecurringEndStrategyToPayload(payload, fd);
  payload.is_active = fd.recurringIsActive;
  payload.timezone = getAutoTimezone();
  applyRecurringOptionalNumericFields(payload, fd, isEdit);
  payload.recurring_auto_create_next_on_complete = fd.recurringAutoCreateNextOnComplete;
  payload.recurring_create_next_if_previous_incomplete =
    fd.recurringCreateNextIfPreviousIncomplete;
}

function applyPlannerSidebarRegularTodoDueTime(
  payload: Record<string, unknown>,
  fd: CreateTaskFormData,
  isEdit: boolean,
): void {
  const dueTimeUtc = formatPlannerDueTimeAsUtcIso(fd.dueDate, fd.dueTime);
  if (dueTimeUtc) {
    payload.due_time = dueTimeUtc;
  } else if (isEdit) {
    payload.due_time = null;
  }
}

function buildPlannerSidebarPayloadRecord(
  fd: CreateTaskFormData,
  extensions: Extension[],
  taskTypeOptions: readonly PlannerTaskType[],
  isEdit: boolean,
): Record<string, unknown> {
  if (fd.taskType === "") {
    throw new Error("Task type must be selected before building payload");
  }
  const taskTypeEff = clampTaskTypeToAllowed(fd.taskType, taskTypeOptions);
  const payload: Record<string, unknown> = {
    title: clampTaskTitleLength(fd.title.trim()),
    description: fd.description || "",
    priority: plannerPriorityIdToApiString(fd.priorityId) || undefined,
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
  applyPlannerSidebarParentTaskId(payload, fd, isEdit);
  if (taskTypeEff === "recurring") {
    applyPlannerSidebarRecurringPayload(payload, fd, isEdit);
  } else if (taskTypeEff === "regular" || taskTypeEff === "todo") {
    payload.due_date = fd.dueDate || "";
    applyPlannerSidebarRegularTodoDueTime(payload, fd, isEdit);
  }
  applyEstimatedDurationMinutesToPayload(payload, fd, isEdit);
  return payload;
}

function validateRecurringEndAndOccurrences(formData: CreateTaskFormData): boolean {
  if (formData.recurringEndStrategy === "end_date") {
    if (!formData.recurringEndDate.trim()) {
      toast.error("Please set an end date or choose a different end condition");
      return false;
    }
    if (formData.startDate.trim() && formData.recurringEndDate < formData.startDate.trim()) {
      toast.error("Schedule end date cannot be before the start date");
      return false;
    }
    return true;
  }
  if (formData.recurringEndStrategy !== "occurrences") {
    return true;
  }
  if (!Number.isFinite(formData.recurringOccurrences) || formData.recurringOccurrences < 1) {
    toast.error("Occurrences must be at least 1");
    return false;
  }
  return true;
}

function validateRecurringDurationAndReminder(formData: CreateTaskFormData): boolean {
  if (formData.recurringReminderEnabled && formData.recurringReminderMinutes < 1) {
    toast.error("Reminder minutes must be at least 1 when reminders are enabled");
    return false;
  }
  return true;
}

function validateEstimatedDurationMinutes(formData: CreateTaskFormData): boolean {
  const estTrim = formData.estimatedDurationMinutes.trim();
  if (estTrim === "") {
    return true;
  }
  const n = Number(estTrim);
  if (!Number.isFinite(n) || n < 0 || n > 525600) {
    toast.error("Estimated duration must be between 0 and 525600 minutes");
    return false;
  }
  return true;
}

function validatePlannerSidebarRecurringSubmit(formData: CreateTaskFormData): boolean {
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
  if (formData.frequency === "custom" && formData.repeatInterval < 1) {
    toast.error("Custom repeat interval must be at least 1");
    return false;
  }
  if (!validateRecurringEndAndOccurrences(formData)) {
    return false;
  }
  return validateRecurringDurationAndReminder(formData);
}

function validatePlannerSidebarDueTimeRequiresDueDate(
  formData: CreateTaskFormData,
  taskTypeEff: PlannerTaskType,
): boolean {
  const requiresDueDateForDueTime =
    (taskTypeEff === "regular" || taskTypeEff === "todo") &&
    formData.dueTime.trim() !== "" &&
    formData.dueDate.trim() === "";
  if (!requiresDueDateForDueTime) {
    return true;
  }
  toast.error("Please set a due date when adding a due time");
  return false;
}

function validatePlannerSidebarDueDateMinBoundary(
  formData: CreateTaskFormData,
): boolean {
  if (formData.taskType === "recurring") {
    return true;
  }
  if (!formData.dueDate.trim()) {
    return true;
  }
  const minDue = minDueDateFromTodayAndStart(formData.startDate);
  if (formData.dueDate < minDue) {
    toast.error("Due date cannot be before today or before the start date");
    return false;
  }
  return true;
}

function validatePlannerSidebarFormForSubmit(
  formData: CreateTaskFormData,
  isEdit: boolean,
  taskTypeOptions: readonly PlannerTaskType[],
): boolean {
  if (!formData.title.trim()) {
    toast.error("Please enter a task title");
    return false;
  }
  if (!isEdit && formData.taskType === "") {
    toast.error("Please select a task type");
    return false;
  }
  if (!formData.priorityId || formData.priorityId === 0) {
    toast.error("Please select a priority");
    return false;
  }
  const taskTypeEff = clampTaskTypeToAllowed(
    formData.taskType as PlannerTaskType,
    taskTypeOptions,
  );
  if (taskTypeEff === "recurring" && !validatePlannerSidebarRecurringSubmit(formData)) {
    return false;
  }
  if (!validateEstimatedDurationMinutes(formData)) {
    return false;
  }
  if (!validatePlannerSidebarDueTimeRequiresDueDate(formData, taskTypeEff)) {
    return false;
  }
  if (!validatePlannerSidebarDueDateMinBoundary(formData)) {
    return false;
  }
  return true;
}

type PersistPlannerSidebarContext = {
  formData: CreateTaskFormData;
  taskTypeOptions: readonly PlannerTaskType[];
  isEdit: boolean;
  taskEditScope: PlannerTaskEditScope;
  limitedEditBaselineForm: CreateTaskFormData | null;
  editTask: PlannerEditTask | undefined;
  extensions: Extension[];
};

async function persistPlannerSidebarEditTask(
  editTaskId: PlannerApiId,
  taskTypeEff: PlannerTaskType,
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (taskTypeEff === "recurring") {
    return Boolean(
      await updateRecurringTask(
        editTaskId,
        payload as Parameters<typeof updateRecurringTask>[1],
      ),
    );
  }
  return Boolean(
    await updateTask(
      editTaskId,
      payload as Parameters<typeof updateTask>[1],
    ),
  );
}

async function persistPlannerSidebarCreateTask(
  ctx: PersistPlannerSidebarContext,
  taskTypeEff: PlannerTaskType,
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (taskTypeEff === "recurring") {
    const recurringPayload: Parameters<typeof createRecurringTask>[0] = {
      ...(payload as unknown as Parameters<typeof createRecurringTask>[0]),
      status_id: ctx.formData.statusId as number,
      start_date: ctx.formData.startDate,
      type: "recurring",
    };
    if (ctx.formData.projectId != null && ctx.formData.projectId > 0) {
      recurringPayload.project_id = ctx.formData.projectId;
      recurringPayload.label_ids = ctx.formData.labelIds || [];
    }
    return Boolean(await createRecurringTask(recurringPayload));
  }
  const withTz = { ...payload, timezone: getAutoTimezone() };
  return Boolean(await createTask(withTz as Parameters<typeof createTask>[0]));
}

async function persistPlannerSidebarTaskFromPayload(
  payloadInput: Record<string, unknown>,
  ctx: PersistPlannerSidebarContext,
): Promise<boolean> {
  const taskTypeEff = clampTaskTypeToAllowed(
    ctx.formData.taskType as PlannerTaskType,
    ctx.taskTypeOptions,
  );
  let payload: Record<string, unknown> = { ...payloadInput };
  if (
    ctx.isEdit &&
    ctx.taskEditScope === "limited" &&
    ctx.limitedEditBaselineForm &&
    ctx.editTask?.id != null
  ) {
    const locked = buildPlannerSidebarPayloadRecord(
      ctx.limitedEditBaselineForm,
      ctx.extensions,
      ctx.taskTypeOptions,
      ctx.isEdit,
    );
    payload = applyLimitedEditLockAssigneesAndWatchers(payload, locked);
  }
  if (ctx.isEdit && ctx.editTask?.id != null) {
    return persistPlannerSidebarEditTask(ctx.editTask.id, taskTypeEff, payload);
  }
  return persistPlannerSidebarCreateTask(ctx, taskTypeEff, payload);
}

function getSidebarInitialFormData(
  editMode: boolean,
  editTask: PlannerEditTask | undefined,
  extensions: Extension[],
  propProject: Project | undefined,
  propStatuses: Status[],
  selectedStatusForTask: number | null,
): CreateTaskFormData {
  if (editMode && editTask) {
    return buildInitialFormFromEdit(editTask, extensions);
  }
  return buildInitialFormForCreate("", propProject, propStatuses, selectedStatusForTask);
}

function linkedRecordsFromListTasksForSidebar(
  response: unknown,
  editMode: boolean,
  editTask: PlannerEditTask | undefined,
): LinkedRecord[] {
  const res = response as { data?: unknown } | null | undefined;
  if (!res?.data || !Array.isArray(res.data)) {
    return [];
  }
  const taskRows = res.data as TaskListRow[];
  const selfIdRaw = editTask?.rawData?.id ?? editTask?.id;
  const selfIdNum =
    selfIdRaw != null && String(selfIdRaw).trim() !== ""
      ? Number(selfIdRaw)
      : Number.NaN;
  const currentTaskId =
    editMode && Number.isFinite(selfIdNum) && selfIdNum > 0 ? selfIdNum : null;
  return taskRows
    .filter((t) => currentTaskId == null || Number(t.id) !== currentTaskId)
    .map((t) => ({
      id: Number(t.id),
      type: "task" as const,
      title: t.title || "",
      reference: t.reference || `#${t.id}`,
    }));
}

function resolveLinkedRecordsForSidebarDisplay(
  linkedRecordsFromApi: LinkedRecord[],
  linkedRecordIds: number[],
  isEdit: boolean,
  editTask: PlannerEditTask | undefined,
): LinkedRecord[] {
  const fallbackParent =
    isEdit && editTask ? resolveParentTaskLinkFromEditTask(editTask) : null;
  const extras: LinkedRecord[] = [];
  for (const sid of linkedRecordIds) {
    if (linkedRecordsFromApi.some((r) => r.id === sid)) {
      continue;
    }
    if (fallbackParent?.id === sid) {
      extras.push(fallbackParent);
      continue;
    }
    extras.push({
      id: sid,
      type: "task",
      title: `Task #${sid}`,
      reference: `#${sid}`,
    });
  }
  const extraIds = new Set(extras.map((e) => e.id));
  const rest = linkedRecordsFromApi.filter((r) => !extraIds.has(r.id));
  return [...extras, ...rest];
}

function resolveSelectedLinkedRecordsForSidebar(
  linkedRecordsForDisplay: LinkedRecord[],
  linkedRecordIds: number[],
): LinkedRecord[] {
  const byId = new Map(linkedRecordsForDisplay.map((r) => [r.id, r]));
  const out: LinkedRecord[] = [];
  for (const id of linkedRecordIds) {
    const row = byId.get(id);
    if (row) {
      out.push(row);
    }
  }
  return out;
}

function resolveSidebarEditTaskId(
  isEdit: boolean,
  editTask: PlannerEditTask | undefined,
): PlannerApiId | null {
  if (!isEdit || !editTask) {
    return null;
  }
  return editTask.id ?? editTask.rawData?.id ?? null;
}

function shouldDeferPlannerSidebarOpenUntilProjectsLoaded(
  editMode: boolean,
  task: PlannerEditTask | undefined,
  fetchedProjectsCount: number,
  loadingProjects: boolean,
): boolean {
  return (
    editMode &&
    Boolean(task) &&
    fetchedProjectsCount === 0 &&
    loadingProjects
  );
}

function mergeOpenedPlannerSidebarFormData(
  rawInitial: CreateTaskFormData,
  taskTypeOptions: readonly PlannerTaskType[],
): CreateTaskFormData {
  const mergedOpen = mergeFormDataWithDueDateClamp(rawInitial);
  return {
    ...mergedOpen,
    taskType:
      mergedOpen.taskType === ""
        ? ""
        : clampTaskTypeToAllowed(mergedOpen.taskType, taskTypeOptions),
  };
}

function applyOpenAsRecurringConversionToInitialForm(
  base: CreateTaskFormData,
  openAsRecurringConversion: boolean,
  editMode: boolean,
  editTask: PlannerEditTask | undefined,
): CreateTaskFormData {
  if (!openAsRecurringConversion || !editMode || editTask == null) {
    return base;
  }
  const typ = normalizeEditTaskType(editTask);
  if (typ !== "todo" && typ !== "regular") {
    return base;
  }
  const merged = mergeFormDataWithDueDateClamp(base);
  return {
    ...merged,
    taskType: "recurring",
    ...seedRecurringFieldsWhenSwitchingToRecurring(merged),
  };
}

type PlannerSidebarPayload = ReturnType<typeof buildPlannerSidebarPayloadRecord>;

async function submitPlannerSidebarTask(params: {
  e?: React.MouseEvent;
  isSubmitting: boolean;
  validateBeforeSubmit: () => boolean;
  setIsSubmitting: (value: boolean) => void;
  buildPayload: () => PlannerSidebarPayload;
  persistTaskFromPayload: (payload: PlannerSidebarPayload) => Promise<boolean>;
  onSuccess?: (data: CreateTaskFormData) => void;
  formData: CreateTaskFormData;
  onClose?: () => void;
  isEdit: boolean;
}): Promise<void> {
  const {
    e,
    isSubmitting,
    validateBeforeSubmit,
    setIsSubmitting,
    buildPayload,
    persistTaskFromPayload,
    onSuccess,
    formData,
    onClose,
    isEdit,
  } = params;

  e?.preventDefault();
  e?.stopPropagation();
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
}

function computePlannerSidebarStartDateChange(
  prev: CreateTaskFormData,
  newStart: string,
): CreateTaskFormData {
  if (prev.taskType === "recurring") {
    return { ...prev, startDate: newStart };
  }
  const minDue = minDueDateFromTodayAndStart(newStart);
  const nextDue = clampDueDateToMin(prev.dueDate, minDue);
  return { ...prev, startDate: newStart, dueDate: nextDue };
}

function emptyPlannerSidebarFormWhenClosed(
  propProject: Project | undefined,
  selectedStatusForTask: number | null,
  propStatuses: Status[],
): CreateTaskFormData {
  return {
    title: "",
    description: "",
    taskType: "",
    projectId: propProject?.id || null,
    statusId: resolvePreferredStatusId(propStatuses, selectedStatusForTask),
    priorityId: 0,
    assigneeIds: [],
    watcherIds: [],
    dueDate: "",
    startDate: "",
    labelIds: [],
    linkedRecordIds: [],
    frequency: "weekly",
    repeatInterval: 1,
    repeatOn: "",
    dueTime: "",
    recurringIsActive: true,
    recurringEndStrategy: "never",
    recurringEndDate: "",
    recurringOccurrences: 12,
    estimatedDurationMinutes: "",
    recurringReminderEnabled: false,
    recurringReminderMinutes: 30,
    recurringAutoCreateNextOnComplete: false,
    recurringCreateNextIfPreviousIncomplete: false,
    customIntervalUnit: "days",
  };
}

type PlannerSidebarTaskTypeSelectContext = {
  editMode: boolean;
  taskTypeOptions: PlannerTaskType[];
  propProject: Project | undefined;
  propStatuses: Status[];
  selectedStatusForTask: number | null;
  setFormData: React.Dispatch<React.SetStateAction<CreateTaskFormData>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setAssigneeSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setShowAssigneeDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  setWatcherSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setShowWatcherDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  fetchLinkRecordsForSearch: (
    query: string,
    currentProjectId?: number | null,
  ) => Promise<void>;
};

function applyPlannerSidebarTaskTypeSelectChange(
  raw: string,
  ctx: Readonly<PlannerSidebarTaskTypeSelectContext>,
): void {
  if (raw === "") {
    if (ctx.editMode) {
      return;
    }
    ctx.setFormData((prev) => ({ ...prev, taskType: "" }));
    return;
  }
  const nextType = raw as PlannerTaskType;
  const clamped = clampTaskTypeToAllowed(nextType, ctx.taskTypeOptions);
  if (ctx.editMode) {
    ctx.setFormData((prev) => {
      if (clamped === "recurring" && prev.taskType !== "recurring") {
        return {
          ...prev,
          taskType: "recurring",
          ...seedRecurringFieldsWhenSwitchingToRecurring(prev),
        };
      }
      return { ...prev, taskType: clamped };
    });
    return;
  }
  const fresh = buildInitialFormForCreate(
    clamped,
    ctx.propProject,
    ctx.propStatuses,
    ctx.selectedStatusForTask,
  );
  const mergedOpen = mergeFormDataWithDueDateClamp(fresh);
  ctx.setFormData((prev) => ({
    ...mergedOpen,
    taskType: clamped,
    title: prev.title,
    priorityId: prev.priorityId,
  }));
  ctx.setSearchQuery("");
  ctx.setAssigneeSearchQuery("");
  ctx.setShowAssigneeDropdown(false);
  ctx.setWatcherSearchQuery("");
  ctx.setShowWatcherDropdown(false);
  ctx.fetchLinkRecordsForSearch("", mergedOpen.projectId).catch(() => undefined);
}

function usePlannerSidebarReferenceLists(isOpen: boolean) {
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [genericStatuses, setGenericStatuses] = useState<Status[]>([]);
  const [loadingGenericStatuses, setLoadingGenericStatuses] = useState(false);

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
            }),
          );
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
        setGenericStatuses(mapListStatusesResponseToSidebarStatuses(response));
      } catch (error) {
        console.error("Error fetching generic statuses:", error);
        setGenericStatuses([]);
      } finally {
        setLoadingGenericStatuses(false);
      }
    };
    fetchGenericStatuses();
  }, [isOpen]);

  return {
    fetchedProjects,
    loadingProjects,
    genericStatuses,
    loadingGenericStatuses,
  };
}

type PlannerSidebarCreateModeStatusSyncParams = Readonly<{
  isOpen: boolean;
  isEdit: boolean;
  formDataProjectId: number | null;
  formDataTaskType: PlannerTaskTypeOrUnset;
  fetchedProjects: Project[];
  genericStatuses: Status[];
  loadingGenericStatuses: boolean;
  selectedStatusForTask: number | null;
  propStatuses: Status[];
  setFormData: React.Dispatch<React.SetStateAction<CreateTaskFormData>>;
}>;

function usePlannerSidebarCreateModeStatusSync(
  params: PlannerSidebarCreateModeStatusSyncParams,
): void {
  useEffect(() => {
    const {
      isOpen,
      isEdit,
      formDataProjectId,
      fetchedProjects,
      genericStatuses,
      loadingGenericStatuses,
      selectedStatusForTask,
      propStatuses,
      setFormData,
    } = params;
    if (!isOpen || isEdit) return;
    if (formDataProjectId && fetchedProjects.length === 0) return;
    if (!formDataProjectId && loadingGenericStatuses) return;

    const availableStatuses = resolveSidebarStatusesForProject(
      formDataProjectId,
      fetchedProjects,
      genericStatuses,
      propStatuses,
    );
    if (availableStatuses.length === 0) return;

    const idInList = (id: number | null): boolean =>
      id != null &&
      availableStatuses.some((s) => String(s.id) === String(id));

    setFormData((prev) => {
      if (
        selectedStatusForTask != null &&
        idInList(selectedStatusForTask)
      ) {
        if (prev.statusId === selectedStatusForTask) return prev;
        return { ...prev, statusId: selectedStatusForTask };
      }

      if (idInList(prev.statusId)) {
        return prev;
      }

      const preferred = resolvePreferredStatusId(availableStatuses, null);
      if (preferred == null || prev.statusId === preferred) return prev;
      return { ...prev, statusId: preferred };
    });
  }, [
    params.isOpen,
    params.isEdit,
    params.formDataProjectId,
    params.formDataTaskType,
    params.fetchedProjects,
    params.genericStatuses,
    params.loadingGenericStatuses,
    params.selectedStatusForTask,
    params.propStatuses,
    params.setFormData,
  ]);
}

function useNormalizedPlannerTaskTypeOptions(
  taskTypeChoices: readonly PlannerTaskType[] | undefined,
): PlannerTaskType[] {
  return useMemo(
    () => normalizeTaskTypeOptions(taskTypeChoices),
    [taskTypeChoices],
  );
}

function usePlannerSidebarWeeklyRepeatOnGuard(
  isOpen: boolean,
  taskType: PlannerTaskTypeOrUnset,
  frequency: string,
  repeatOn: string,
  setFormData: React.Dispatch<React.SetStateAction<CreateTaskFormData>>,
): void {
  useEffect(() => {
    if (!isOpen || taskType !== "recurring" || frequency !== "weekly") {
      return;
    }
    const v = repeatOn.trim().toLowerCase();
    if (!isWeeklyRepeatOnValue(v)) {
      setFormData((prev) => ({ ...prev, repeatOn: "monday" }));
    }
  }, [isOpen, taskType, frequency, repeatOn, setFormData]);
}

function usePlannerSidebarBodyScrollLock(isOpen: boolean): void {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
}

type PlannerSidebarFormOpenLifecycleParams = Readonly<{
  isOpen: boolean;
  isEdit: boolean;
  editTask: PlannerEditTask | undefined;
  fetchedProjectsLength: number;
  loadingProjects: boolean;
  selectedStatusForTask: number | null;
  taskTypeOptions: PlannerTaskType[];
  propProject: Project | undefined;
  propStatuses: Status[];
  getInitialFormData: () => CreateTaskFormData;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setFormData: React.Dispatch<React.SetStateAction<CreateTaskFormData>>;
  openAsRecurringConversion: boolean;
}>;

function usePlannerSidebarFormOpenLifecycle(
  params: PlannerSidebarFormOpenLifecycleParams,
): void {
  useEffect(() => {
    const {
      isOpen,
      isEdit,
      editTask,
      getInitialFormData,
      taskTypeOptions,
      propProject,
      selectedStatusForTask,
      propStatuses,
      setSearchQuery,
      setFormData,
    } = params;
    if (isOpen) {
      setSearchQuery("");
      if (
        shouldDeferPlannerSidebarOpenUntilProjectsLoaded(
          isEdit,
          editTask,
          params.fetchedProjectsLength,
          params.loadingProjects,
        )
      ) {
        return;
      }
      setFormData(
        mergeOpenedPlannerSidebarFormData(getInitialFormData(), taskTypeOptions),
      );
    } else {
      setSearchQuery("");
      setFormData(
        emptyPlannerSidebarFormWhenClosed(
          propProject,
          selectedStatusForTask,
          propStatuses,
        ),
      );
    }
  }, [
    params.isOpen,
    params.editTask,
    params.isEdit,
    params.fetchedProjectsLength,
    params.loadingProjects,
    params.selectedStatusForTask,
    params.taskTypeOptions,
    params.openAsRecurringConversion,
  ]);
}

function mapExtensionsToPlannerUsers(extensions: Extension[]): UserType[] {
  return extensions.map((ext) => ({
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
}

function resolveSidebarTaskTypeOptions(
  isEdit: boolean,
  editTask: PlannerEditTask | undefined,
  normalizedTaskTypeOptions: readonly PlannerTaskType[],
  openAsRecurringConversion: boolean,
): PlannerTaskType[] {
  const restricted = restrictPlannerTaskTypeOptionsForEdit(
    isEdit,
    editTask,
    normalizedTaskTypeOptions,
  );
  if (openAsRecurringConversion === false || isEdit === false) {
    return restricted;
  }
  return restricted.includes("recurring")
    ? (["recurring"] as PlannerTaskType[])
    : restricted;
}

function buildLimitedEditBaselineFormData(
  isEdit: boolean,
  editTask: PlannerEditTask | undefined,
  taskEditScope: "none" | "limited" | "full",
  extensions: Extension[],
  taskTypeOptions: readonly PlannerTaskType[],
): CreateTaskFormData | null {
  if (!isEdit || !editTask || taskEditScope !== "limited") return null;
  const merged = mergeFormDataWithDueDateClamp(
    buildInitialFormFromEdit(editTask, extensions),
  );
  const baselineType: PlannerTaskType =
    merged.taskType === "" ? "regular" : merged.taskType;
  return {
    ...merged,
    taskType: clampTaskTypeToAllowed(baselineType, taskTypeOptions),
  };
}

function resolveLinkedRecordsProjectId(
  currentProjectId: number | null | undefined,
  isEdit: boolean,
  editTask: PlannerEditTask | undefined,
): number | null {
  if (currentProjectId != null) return currentProjectId;
  if (isEdit === false) return null;
  return editTask?.project_id ?? editTask?.project?.id ?? null;
}

function isEditingRecurringTaskTemplate(
  isEdit: boolean,
  editTask: PlannerEditTask | undefined,
): boolean {
  if (!isEdit || editTask == null) return false;
  return normalizeEditTaskType(editTask) === "recurring";
}

function shouldShowOneWayTaskConversionHint(
  isEdit: boolean,
  editTask: PlannerEditTask | undefined,
  isEditingRecurringTemplate: boolean,
): boolean {
  if (!isEdit || editTask == null) return false;
  return !isEditingRecurringTemplate;
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
  taskTypeChoices,
  lockProjectSelection = false,
  taskEditScope = "full",
  openAsRecurringConversion = false,
}) => {
  const normalizedTaskTypeOptions = useNormalizedPlannerTaskTypeOptions(taskTypeChoices);
  const taskTypeOptions = useMemo<PlannerTaskType[]>(
    (): PlannerTaskType[] =>
      resolveSidebarTaskTypeOptions(
        isEdit,
        editTask,
        normalizedTaskTypeOptions,
        openAsRecurringConversion,
      ),
    [isEdit, editTask, normalizedTaskTypeOptions, openAsRecurringConversion],
  );

  const getInitialFormData = useCallback((): CreateTaskFormData => {
    const base = getSidebarInitialFormData(
      isEdit,
      editTask,
      extensions,
      propProject,
      propStatuses,
      selectedStatusForTask,
    );
    return applyOpenAsRecurringConversionToInitialForm(
      base,
      openAsRecurringConversion,
      isEdit,
      editTask,
    );
  }, [
    isEdit,
    editTask,
    extensions,
    propProject,
    propStatuses,
    selectedStatusForTask,
    openAsRecurringConversion,
  ]);

  const [formData, setFormData] = useState<CreateTaskFormData>(getInitialFormData());
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [watcherSearchQuery, setWatcherSearchQuery] = useState("");
  const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);
  const {
    fetchedProjects,
    loadingProjects,
    genericStatuses,
    loadingGenericStatuses,
  } = usePlannerSidebarReferenceLists(isOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedRecordsFromApi, setLinkedRecordsFromApi] = useState<LinkedRecord[]>([]);
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState(false);

  const fetchLinkRecordsForSearch = useCallback(
    async (query: string, currentProjectId?: number | null) => {
      setLoadingLinkedRecords(true);
      try {
        const projectId = resolveLinkedRecordsProjectId(
          currentProjectId,
          isEdit,
          editTask,
        );
        const response = await listTasks({
          page: 1,
          limit: 30,
          search: query.trim() || undefined,
          ...(projectId != null && projectId > 0 ? { project_id: projectId } : {}),
        });
        setLinkedRecordsFromApi(
          linkedRecordsFromListTasksForSidebar(response, isEdit, editTask),
        );
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
      applyPlannerSidebarTaskTypeSelectChange(e.target.value, {
        editMode: isEdit,
        taskTypeOptions,
        propProject,
        propStatuses,
        selectedStatusForTask,
        setFormData,
        setSearchQuery,
        setAssigneeSearchQuery,
        setShowAssigneeDropdown,
        setWatcherSearchQuery,
        setShowWatcherDropdown,
        fetchLinkRecordsForSearch,
      });
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

  usePlannerSidebarFormOpenLifecycle({
    isOpen,
    isEdit,
    editTask,
    fetchedProjectsLength: fetchedProjects.length,
    loadingProjects,
    selectedStatusForTask,
    taskTypeOptions,
    propProject,
    propStatuses,
    getInitialFormData,
    setSearchQuery,
    setFormData,
    openAsRecurringConversion,
  });

  usePlannerSidebarBodyScrollLock(isOpen);

  const users: UserType[] = mapExtensionsToPlannerUsers(extensions);

  const projects: Project[] = resolveSidebarProjects(fetchedProjects, propProject);

  const statuses: Status[] = resolveSidebarStatusesForProject(
    formData.projectId,
    fetchedProjects,
    genericStatuses,
    propStatuses,
  );

  usePlannerSidebarCreateModeStatusSync({
    isOpen,
    isEdit,
    formDataProjectId: formData.projectId,
    formDataTaskType: formData.taskType,
    fetchedProjects,
    genericStatuses,
    loadingGenericStatuses,
    selectedStatusForTask,
    propStatuses,
    setFormData,
  });

  usePlannerSidebarWeeklyRepeatOnGuard(
    isOpen,
    formData.taskType,
    formData.frequency,
    formData.repeatOn,
    setFormData,
  );

  const priorities: Priority[] = [
    { id: 0, name: "Select Priority", icon: "", color: "#6c757d" },
    { id: 1, name: "Low", icon: "🟢", color: "#10b981" },
    { id: 2, name: "Medium", icon: "🟡", color: "#eab308" },
    { id: 3, name: "High", icon: "🟠", color: "#f97316" },
    { id: 4, name: "Urgent", icon: "🔴", color: "#ef4444" },
  ];

  const labels: Label[] = resolveSidebarLabelsForProject(
    formData.projectId,
    fetchedProjects,
    propLabels,
  );

  const isLimitedTaskEdit = Boolean(isEdit && taskEditScope === "limited");
  const isRecurringConversionMode = Boolean(isEdit && openAsRecurringConversion);
  const isEditingRecurringTemplate = isEditingRecurringTaskTemplate(
    isEdit,
    editTask,
  );
  const showOneWayConversionHint = shouldShowOneWayTaskConversionHint(
    isEdit,
    editTask,
    isEditingRecurringTemplate,
  );

  const limitedEditBaselineForm = useMemo((): CreateTaskFormData | null => {
    return buildLimitedEditBaselineFormData(
      isEdit,
      editTask,
      taskEditScope,
      extensions,
      taskTypeOptions,
    );
  }, [isEdit, editTask, taskEditScope, extensions, taskTypeOptions]);

  const buildPayloadForForm = (fd: CreateTaskFormData) =>
    buildPlannerSidebarPayloadRecord(fd, extensions, taskTypeOptions, isEdit);

  const buildPayload = () => buildPayloadForForm(formData);

  const validateBeforeSubmit = (): boolean =>
    validatePlannerSidebarFormForSubmit(formData, isEdit, taskTypeOptions);

  const persistTaskFromPayload = async (
    payloadInput: ReturnType<typeof buildPayload>,
  ): Promise<boolean> =>
    persistPlannerSidebarTaskFromPayload(payloadInput, {
      formData,
      taskTypeOptions,
      isEdit,
      taskEditScope,
      limitedEditBaselineForm,
      editTask,
      extensions,
    });

  const submitPlannerTask = async (
    e: React.MouseEvent | undefined,
    onSuccess: ((data: CreateTaskFormData) => void) | undefined,
  ) =>
    submitPlannerSidebarTask({
      e,
      onSuccess,
      isSubmitting,
      validateBeforeSubmit,
      setIsSubmitting,
      buildPayload,
      persistTaskFromPayload,
      formData,
      onClose,
      isEdit,
    });

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
      setFormData((prev) => computePlannerSidebarStartDateChange(prev, newStart));
    },
    [],
  );

  const handleDueDateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setFormData((prev) => {
        const nextDue = v
          ? clampDueDateToMin(v, minDueDateFromTodayAndStart(prev.startDate))
          : "";
        const clearTimeBecauseNoDueDate =
          nextDue.trim() === "" && prev.taskType !== "recurring";
        return {
          ...prev,
          dueDate: nextDue,
          dueTime: clearTimeBecauseNoDueDate ? "" : prev.dueTime,
        };
      });
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

  const linkedRecordsForDisplay = useMemo(
    () =>
      resolveLinkedRecordsForSidebarDisplay(
        linkedRecordsFromApi,
        formData.linkedRecordIds,
        isEdit,
        editTask,
      ),
    [linkedRecordsFromApi, formData.linkedRecordIds, isEdit, editTask],
  );

  const selectedLinkedRecords = useMemo(
    () =>
      resolveSelectedLinkedRecordsForSidebar(
        linkedRecordsForDisplay,
        formData.linkedRecordIds,
      ),
    [linkedRecordsForDisplay, formData.linkedRecordIds],
  );

  if (!isOpen) return null;

  const handleRecurringFrequencySelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const nextFreq = e.target.value;
    setFormData((prev) => ({
      ...prev,
      ...computeFrequencyChangeState(prev, nextFreq),
    }));
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

  const sidebarEditTaskId = resolveSidebarEditTaskId(isEdit, editTask);

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    color: PLANNER_TASK_SIDEBAR.text,
    fontWeight: 600,
    marginBottom: 6,
    letterSpacing: "0.01em",
  };
  const dueTimeFieldLabelStyle: React.CSSProperties = {
    ...labelStyle,
    display: "flex",
    alignItems: "center",
    gap: 6,
  };
  const groupClass = "mb-3 planner-sidebar-field";
  const dueDateMin = minDueDateFromTodayAndStart(formData.startDate);
  const conversionHeaderTone = PLANNER_TASK_SIDEBAR.surface;
  const conversionBodyTone = PLANNER_TASK_SIDEBAR.surface;

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        className="create-task-sidebar-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "rgba(15, 23, 42, 0.25)",
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
          width: 560,
          maxWidth: "100vw",
          height: "100vh",
          backgroundColor: PLANNER_TASK_SIDEBAR.surface,
          boxShadow: PLANNER_TASK_SIDEBAR.shadow,
          borderTopLeftRadius: PLANNER_TASK_SIDEBAR.radiusLg,
          borderBottomLeftRadius: PLANNER_TASK_SIDEBAR.radiusLg,
          borderLeft: `1px solid ${PLANNER_TASK_SIDEBAR.border}`,
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            background: conversionHeaderTone,
            borderBottom: `1px solid ${PLANNER_TASK_SIDEBAR.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 30,
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: PLANNER_TASK_SIDEBAR.text,
              letterSpacing: "0",
            }}
          >
            <ListTodo size={20} color={PLANNER_TASK_SIDEBAR.textMuted} strokeWidth={2} />
            {getSidebarTitle(formData.taskType, isEdit)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            style={{
              background: PLANNER_TASK_SIDEBAR.surfaceMuted,
              border: `1px solid ${PLANNER_TASK_SIDEBAR.border}`,
              borderRadius: 6,
              width: 32,
              height: 32,
              padding: 0,
              cursor: "pointer",
              color: PLANNER_TASK_SIDEBAR.textMuted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = PLANNER_TASK_SIDEBAR.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = PLANNER_TASK_SIDEBAR.surface;
              e.currentTarget.style.color = PLANNER_TASK_SIDEBAR.textMuted;
            }}
          >
            <X size={20} strokeWidth={2} />
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
              padding: "14px 18px 22px",
              backgroundColor: conversionBodyTone,
            }}
          >
          <Form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>

            <LimitedTaskEditBanner visible={isLimitedTaskEdit} />
            

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
                maxLength={TASK_TITLE_MAX_LENGTH}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: clampTaskTitleLength(e.target.value),
                  }))
                }
                className="py-2"
                style={{ fontSize: "14px" }}
                required
              />
              <div
                className="d-flex justify-content-between align-items-baseline gap-2 mt-1"
              >
                <Form.Text className="text-muted mb-0">
                  Maximum {TASK_TITLE_MAX_LENGTH} characters.
                </Form.Text>
                <Form.Text
                  className="text-muted mb-0 small text-nowrap"
                  aria-live="polite"
                >
                  {formData.title.length}/{TASK_TITLE_MAX_LENGTH}
                </Form.Text>
              </div>
            </Form.Group>
              </Col>

              {!isRecurringConversionMode && (
                <Col xs={12} md={6}>
                  <Form.Group className={groupClass}>
                    <Form.Label style={labelStyle}>
                      Task Type <span style={{ color: "#ef4444" }}>*</span>
                    </Form.Label>
                    <Form.Select
                      value={taskTypeSelectHtmlValue(formData.taskType, taskTypeOptions)}
                      onChange={handleTaskTypeChange}
                      disabled={isEditingRecurringTemplate}
                      className="py-2"
                      style={{ fontSize: "14px" }}
                    >
                      {!isEdit && (
                        <option value="">Select type</option>
                      )}
                      {taskTypeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {TASK_TYPE_SELECT_LABELS[opt]}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              {!isRecurringConversionMode && (
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
                          {plannerPriorityDisplayName(priority.name)}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              {!isRecurringConversionMode && showOneWayConversionHint && (
                  <Col xs={12}>
                    <div className="planner-sidebar-hint mb-3">
                      You can convert this task to <strong>Recurring</strong> only (not to the other
                      non-recurring type). Recurring templates cannot be turned into Todo or Regular.
                    </div>
                  </Col>
                )}

              {!isRecurringConversionMode && (
              <Col xs={12}>
              <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    Associate with records
                  </Form.Label>
                  <PlannerSidebarLinkedRecordChipsStrip
                    records={selectedLinkedRecords}
                    onRemove={removeLinkedRecordById}
                  />
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
                    <PlannerSidebarLinkedRecordsBody
                      loadingLinkedRecords={loadingLinkedRecords}
                      linkedRecordsForDisplay={linkedRecordsForDisplay}
                      searchQuery={searchQuery}
                      linkedRecordIds={formData.linkedRecordIds}
                      toggleLinkedRecord={toggleLinkedRecord}
                    />
                  </div>
                </Form.Group>
              </Col>
              )}

              <Col xs={12}>
              {!isRecurringConversionMode && formData.taskType !== "todo" && (
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
              {!isRecurringConversionMode && formData.taskType !== "todo" && (
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

              {!isRecurringConversionMode && (
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
              )}
              {formData.taskType !== "recurring" && (
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
              )}
              {(formData.taskType === "regular" || formData.taskType === "todo") && (
                <Col xs={12} md={6}>
                  <Form.Group className={groupClass}>
                    <Form.Label
                      style={dueTimeFieldLabelStyle}
                      title="Optional — leave empty for no specific time"
                    >
                      <Clock size={16} style={{ flexShrink: 0 }} aria-hidden />
                      <span>
                        Due time{" "}
                        <span
                          style={{
                            fontWeight: 500,
                            color: "#64748b",
                            fontSize: "12px",
                          }}
                        >
                          (optional)
                        </span>
                      </span>
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
                </Col>
              )}
              {formData.taskType !== "recurring" && (
                <Col xs={12} md={6}>
                  <Form.Group className={groupClass}>
                    <Form.Label style={labelStyle}>
                      Estimated duration (optional)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      max={525600}
                      placeholder="Minutes"
                      value={formData.estimatedDurationMinutes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          estimatedDurationMinutes: e.target.value,
                        }))
                      }
                      className="py-2"
                      style={{ fontSize: "14px" }}
                    />
                  </Form.Group>
                </Col>
              )}

            </Row>

            {formData.taskType === "recurring" && (
              <div className="planner-sidebar-section">
                <div className="planner-sidebar-section__title">Recurring schedule</div>
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
                    <option value="custom">Custom</option>
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
                        {formData.frequency === "custom" && "custom interval"}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  {formData.frequency === "custom" && (
                    <Col xs={12} md={6}>
                      <Form.Group className={groupClass}>
                        <Form.Label style={labelStyle}>Custom unit</Form.Label>
                        <Form.Select
                          value={formData.customIntervalUnit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customIntervalUnit: e.target.value as CustomFrequencyUnit,
                            })
                          }
                          className="py-2"
                          style={{ fontSize: "14px" }}
                        >
                          <option value="days">Day(s)</option>
                          <option value="weeks">Week(s)</option>
                          <option value="months">Month(s)</option>
                          <option value="years">Year(s)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
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
                              const num =
                                v === "" ? "" : String(Math.max(1, Math.min(31, Number(v) || 1)));
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
                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className={groupClass}>
                      <Form.Label style={labelStyle}>
                        Estimated duration (optional)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        max={525600}
                        placeholder="Minutes"
                        value={formData.estimatedDurationMinutes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            estimatedDurationMinutes: e.target.value,
                          }))
                        }
                        className="py-2"
                        style={{ fontSize: "14px" }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group className={groupClass}>
                      <Form.Label style={labelStyle}>Timezone</Form.Label>
                      <div
                        className="planner-sidebar-readonly-value"
                        title="Detected from your browser"
                        aria-live="polite"
                      >
                        {getAutoTimezone()}
                      </div>
                    
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>End condition</Form.Label>
                  <div className="d-flex flex-column gap-2">
                    <Form.Check
                      type="radio"
                      id="rec-end-never"
                      name="planner-recurring-end"
                      label="Never — open-ended until you deactivate the template"
                      checked={formData.recurringEndStrategy === "never"}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, recurringEndStrategy: "never" }))
                      }
                    />
                    <Form.Check
                      type="radio"
                      id="rec-end-date"
                      name="planner-recurring-end"
                      label="End by date"
                      checked={formData.recurringEndStrategy === "end_date"}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, recurringEndStrategy: "end_date" }))
                      }
                    />
                    {formData.recurringEndStrategy === "end_date" && (
                      <Form.Control
                        type="date"
                        className="py-2 ms-4"
                        style={{ maxWidth: 280, fontSize: "14px" }}
                        value={formData.recurringEndDate}
                        min={formData.startDate || undefined}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            recurringEndDate: e.target.value,
                          }))
                        }
                      />
                    )}
                    <Form.Check
                      type="radio"
                      id="rec-end-occ"
                      name="planner-recurring-end"
                      label="End after N occurrences"
                      checked={formData.recurringEndStrategy === "occurrences"}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, recurringEndStrategy: "occurrences" }))
                      }
                    />
                    {formData.recurringEndStrategy === "occurrences" && (
                      <div className="d-flex align-items-center gap-2 ms-4 flex-wrap">
                        <Form.Control
                          type="number"
                          min={1}
                          max={10000}
                          style={{ maxWidth: 120, fontSize: "14px" }}
                          value={formData.recurringOccurrences}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              recurringOccurrences: Math.max(
                                1,
                                Math.min(10000, Number(e.target.value) || 1),
                              ),
                            }))
                          }
                          className="py-2"
                        />
                        <span className="text-muted small">occurrences</span>
                      </div>
                    )}
                  </div>
                </Form.Group>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>Reminders</Form.Label>
                  <Form.Check
                    type="switch"
                    id="rec-reminder-switch"
                    label="Send reminder before each occurrence is due"
                    checked={formData.recurringReminderEnabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurringReminderEnabled: e.target.checked,
                      }))
                    }
                  />
                  {formData.recurringReminderEnabled && (
                    <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                      <span className="small text-muted">Minutes before due</span>
                      <Form.Control
                        type="number"
                        min={1}
                        max={10080}
                        style={{ maxWidth: 120, fontSize: "14px" }}
                        value={formData.recurringReminderMinutes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            recurringReminderMinutes: Math.max(
                              1,
                              Math.min(10080, Number(e.target.value) || 1),
                            ),
                          }))
                        }
                        className="py-2"
                      />
                    </div>
                  )}
                </Form.Group>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>Automation</Form.Label>
                  <Form.Check
                    type="switch"
                    id="rec-auto-next"
                    className="mb-2"
                    label="Auto-create next occurrence when one is completed"
                    checked={formData.recurringAutoCreateNextOnComplete}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurringAutoCreateNextOnComplete: e.target.checked,
                      }))
                    }
                  />
                  <Form.Check
                    type="switch"
                    id="rec-create-if-prev-open"
                    label="Allow new occurrences while a previous one is still incomplete"
                    checked={formData.recurringCreateNextIfPreviousIncomplete}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurringCreateNextIfPreviousIncomplete: e.target.checked,
                      }))
                    }
                  />
                </Form.Group>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>Is Active</Form.Label>
                  <Form.Select
                    value={formData.recurringIsActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recurringIsActive: e.target.value === "true",
                      }))
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  >
                    <option value="true">Active</option>
                    <option value="false">Not Active</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Inactive templates do not generate new occurrences.
                  </Form.Text>
                </Form.Group>
                <PlannerSidebarRecurringRunAtReadOnlyRow
                  visible={isEdit}
                  editTask={editTask}
                  groupClass={groupClass}
                  labelStyle={labelStyle}
                />
              </div>
            )}




            

            

            

            {!isRecurringConversionMode && (
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
            )}

            {!isRecurringConversionMode && (
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
            )}

            

            
            
          </Form>
          </div>
          <TaskSecondaryTabs
            taskId={sidebarEditTaskId}
            extensions={extensions}
            visible={Boolean(sidebarEditTaskId) && !isRecurringConversionMode}
          />
        </div>

        <PlannerSidebarFooter
          isEdit={isEdit}
          isSubmitting={isSubmitting}
          onClose={onClose}
          onCreateAndOpen={onCreateAndOpen}
          onCreate={handleCreate}
          onCreateAndOpenSubmit={(e) => {
            void submitPlannerTask(e, onCreateAndOpen).catch(() => undefined);
          }}
          isRecurringConversionMode={isRecurringConversionMode}
        />
      </div>
    </>
  );
};

export default CreateTaskSidebar;
