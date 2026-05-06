/**
 * Work Planner projects page — shared types, API→UI mappers, and expanded-row task fetch.
 */
import type { ElementType } from "react";
import {
  Folder,
  Palette,
  Smartphone,
  Megaphone,
  Monitor,
  Users,
  Headphones,
  Rocket,
  Settings,
} from "lucide-react";
import {
  getAutoTimezone,
  formatDateGlobal,
  formatDateTimeGlobal,
} from "@utils/Helper";
import { getProject } from "@utils/tasks";
import { WORK_PLANNER_PROJECT_DETAIL_RELATIONS } from "@planner/workPlannerProjectRelations";

﻿export interface ApiProject {
  id: number;
  name: string;
  description?: string;
  color: string;
  status: string;
  owner_extension_number?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
  created_at: string;
  updated_at: string;
  tasks?: Array<any>;
  members?: Array<{
    id?: number;
    extension_number: string;
    role: string;
    user?: any;
  }>;
  labels?: Array<any>;
  statuses?: Array<any>;
}

export type ProjectStatusFilter = "active" | "completed" | "archived" | "all";

export type ProjectFormStatus = "active" | "archived" | "completed";

export const PROJECT_NAME_MAX_LENGTH = 150;

export interface ProjectFormState {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  color: string;
  status: ProjectFormStatus;
  timezone: string;
}

export function createEmptyProjectForm(): ProjectFormState {
  return {
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    color: "#3b82f6",
    status: "active",
    timezone: getAutoTimezone(),
  };
}

export function formatApiDateForProjectInput(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const trimmed = String(value).trim();
  /** `new Date("YYYY-MM-DD")` is UTC and shifts the local calendar day in many timezones. */
  const isoDay = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoDay) {
    const y = Number(isoDay[1]);
    const mo = Number(isoDay[2]);
    const day = Number(isoDay[3]);
    if (
      Number.isFinite(y) &&
      Number.isFinite(mo) &&
      Number.isFinite(day) &&
      mo >= 1 &&
      mo <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const local = new Date(y, mo - 1, day);
      if (local.getFullYear() === y && local.getMonth() === mo - 1 && local.getDate() === day) {
        return `${y}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Formats API date strings for the project detail sidebar (`formatDateGlobal` / `GlobalDateFormat`).
 * Returns `null` when missing or invalid so callers can show "—".
 */
export function formatProjectSidebarDate(iso: string | null | undefined): string | null {
  if (iso == null) return null;
  const s = String(iso).trim();
  if (s === "") return null;
  const formatted = formatDateGlobal(s);
  return formatted === "" ? null : formatted;
}

/**
 * Formats API datetime strings for the project detail sidebar (`formatDateTimeGlobal` / `GlobalDateTimeFormat`).
 * Returns `null` when missing or invalid so callers can fall back or show "—".
 */
export function formatProjectSidebarDateTime(iso: string | null | undefined): string | null {
  if (iso == null) return null;
  const s = String(iso).trim();
  if (s === "") return null;
  const formatted = formatDateTimeGlobal(s);
  return formatted === "" ? null : formatted;
}

/** `YYYY-MM-DD` for today's local calendar date (for `<input type="date" min>`). */
export function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function apiStatusToProjectFormStatus(api: string | undefined): ProjectFormStatus {
  const s = (api ?? "active").toLowerCase();
  if (s === "archived") return "archived";
  if (s === "completed") return "completed";
  return "active";
}

export interface Project {
  id: string;
  name: string;
  icon: ElementType;
  iconColor: string;
  members: Array<{ name: string; initials: string; color: string }>;
  open: number;
  overdue: number;
  lastUpdate: string;
  status: "Active" | "Completed" | "Archived";
  owner: string;
  team: string;
  apiData?: ApiProject;
}

type ProjectIconComponent = typeof Folder;

const PROJECT_ICON_MAP: Record<string, ProjectIconComponent> = {
  website: Palette,
  mobile: Smartphone,
  marketing: Megaphone,
  it: Monitor,
  client: Users,
  support: Headphones,
  product: Rocket,
  crm: Settings,
};

function resolveProjectIconFromName(projectName: string): ProjectIconComponent {
  const projectNameLower = projectName.toLowerCase();
  for (const key in PROJECT_ICON_MAP) {
    if (projectNameLower.includes(key)) {
      return PROJECT_ICON_MAP[key];
    }
  }
  return Folder;
}

export function mapApiProjectToProject(apiProject: ApiProject): Project {
  const tasks = apiProject.tasks || [];
  const openTasks = tasks.filter((t: any) => !t.is_completed).length;
  const overdueTasks = tasks.filter((t: any) => {
    if (!t.due_date) return false;
    return !t.is_completed && new Date(t.due_date) < new Date();
  }).length;

  const members = (apiProject.members || []).map((member, idx) => {
    const colors = ["#667eea", "#f56565", "#48bb78", "#ed64a6", "#4299e1", "#9f7aea", "#fc8181"];
    return {
      name: member.extension_number,
      initials: member.extension_number.substring(0, 2).toUpperCase(),
      color: colors[idx % colors.length],
    };
  });

  const lastUpdate = apiProject.updated_at
    ? formatDateGlobal(apiProject.updated_at) || "N/A"
    : "N/A";

  const Icon = resolveProjectIconFromName(apiProject.name);

  return {
    id: apiProject.id.toString(),
    name: apiProject.name,
    icon: Icon,
    iconColor: apiProject.color || "#3b82f6",
    members,
    open: openTasks,
    overdue: overdueTasks,
    lastUpdate,
    status: getProjectStatusFromApiStatus(apiProject.status),
    owner: members[0]?.name || "N/A",
    team: "Team",
    apiData: apiProject,
  };
}

export const getProjectStatusFromApiStatus = (apiStatus: string | undefined): Project["status"] => {
  if (apiStatus === "active") return "Active";
  if (apiStatus === "completed") return "Completed";
  return "Archived";
};

export const getProjectStatusVariant = (status: Project["status"]): "success" | "secondary" | "warning" => {
  if (status === "Active") return "success";
  if (status === "Archived") return "warning";
  return "secondary";
};

export const coerceProjectStatusFilter = (value: unknown): ProjectStatusFilter => {
  if (value === "all" || value === "active" || value === "completed" || value === "archived") return value;
  return "active";
};

export function isProjectStatusFilterActive(status: ProjectStatusFilter): boolean {
  return status === "active" || status === "completed" || status === "archived";
}

export interface SubTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "overdue";
  assignee?: string;
  dueDate?: string;
  description?: string;
  /** From API `assignees[].extension_number` when row was mapped from a nested task */
  assigneeExtensionNumbers?: string[];
  watcherExtensionNumbers?: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: "todo" | "in_progress" | "done" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  assignee?: string;
  dueDate?: string;
  description?: string;
  /** Nested tasks from API `children` (same shape as top-level tasks, may nest) */
  children?: Task[];
  subtasks?: SubTask[];
  labels?: string[];
  /** From API when `sub_task_count` is requested */
  sub_task_count?: number;
  /** From API when `sub_task_count` is requested */
  completed_sub_task_count?: number;
  /** `assignees[].extension_number` for table display */
  assigneeExtensionNumbers?: string[];
  /** `watchers` + optional `watcher_numbers` */
  watcherExtensionNumbers?: string[];
}

/** Safe string for API scalar fields; avoids `[object Object]` from `String(object)`. */
function stringifyApiScalar(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return String(value);
  if (typeof value === "boolean") return String(value);
  return fallback;
}

function stringifyApiDueDateRaw(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "bigint") return String(value);
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  return undefined;
}

function mapApiPriorityToTaskPriority(raw: unknown): Task["priority"] {
  const p = stringifyApiScalar(raw, "medium").toLowerCase();
  if (p === "urgent") return "urgent";
  if (p === "high") return "high";
  if (p === "low") return "low";
  if (p === "normal" || p === "medium") return "medium";
  return "medium";
}

function readApiNumericCount(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function extensionStringFromApiField(value: unknown): string | null {
  const s = stringifyApiScalar(value).trim();
  return s === "" ? null : s;
}

function collectAssigneeExtensionNumbers(
  assignees: Array<Record<string, unknown>> | undefined,
): string[] {
  if (!Array.isArray(assignees)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of assignees) {
    const ext = extensionStringFromApiField(row?.extension_number);
    if (ext != null && !seen.has(ext)) {
      seen.add(ext);
      out.push(ext);
    }
  }
  return out;
}

function collectWatcherExtensionNumbers(api: Record<string, unknown>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (ext: string | null) => {
    if (ext != null && !seen.has(ext)) {
      seen.add(ext);
      out.push(ext);
    }
  };
  const watchers = api.watchers as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(watchers)) {
    for (const w of watchers) {
      push(extensionStringFromApiField(w?.extension_number));
    }
  }
  const flat = api.watcher_numbers;
  if (Array.isArray(flat)) {
    for (const n of flat) {
      push(extensionStringFromApiField(n));
    }
  }
  return out;
}

/** Distinct assignee extensions from API, or 1 when only a legacy display name exists. */
export function countAssignees(
  extensionNumbers: string[] | undefined,
  assigneeDisplayLabel: string | undefined,
): number {
  const n = extensionNumbers?.length ?? 0;
  if (n > 0) return n;
  if (assigneeDisplayLabel != null && assigneeDisplayLabel.trim() !== "") return 1;
  return 0;
}

export function mapApiTaskToPlannerTask(
  api: Record<string, unknown>,
  projectId: string,
  statuses: Array<Record<string, unknown>>,
): Task {
  const id = stringifyApiScalar(api.id);
  const statusMap: Record<string, string> = {};
  statuses.forEach((s) => {
    if (s?.id != null && s.name != null) {
      const mapId = stringifyApiScalar(s.id);
      const mapName = stringifyApiScalar(s.name);
      if (mapId !== "" && mapName !== "") statusMap[mapId] = mapName;
    }
  });

  const statusNameFromApi = (): string => {
    const st = api.status as { name?: string } | undefined;
    if (st?.name) return stringifyApiScalar(st.name);
    const sid = api.status_id == null ? "" : stringifyApiScalar(api.status_id);
    return statusMap[sid] ?? "";
  };

  const statusName = statusNameFromApi().toLowerCase();
  const isCompleted = Boolean(api.is_completed);
  const dueRaw = stringifyApiDueDateRaw(api.due_date);

  let rowStatus: Task["status"];
  if (isCompleted) {
    rowStatus = "done";
  } else if (dueRaw) {
    const due = new Date(dueRaw);
    const dueValid = Number.isFinite(due.getTime());
    const isPastDue = dueValid && due < new Date();
    if (isPastDue) {
      rowStatus = "overdue";
    } else if (statusName.includes("progress")) {
      rowStatus = "in_progress";
    } else {
      rowStatus = "todo";
    }
  } else if (statusName.includes("progress")) {
    rowStatus = "in_progress";
  } else {
    rowStatus = "todo";
  }

  const assignees = (api.assignees as Array<Record<string, unknown>> | undefined) ?? [];
  const first = assignees[0];
  const user = first?.user as { name?: string; display_name?: string } | undefined;
  const assignee =
    user?.name || user?.display_name || (first?.extension_number as string | undefined);

  const assigneeExtensionNumbers = collectAssigneeExtensionNumbers(assignees);
  const watcherExtensionNumbers = collectWatcherExtensionNumbers(api);

  const labelObjs = (api.labels as Array<{ name?: string }> | undefined) ?? [];
  const labels = labelObjs.map((l) => l.name).filter((n): n is string => Boolean(n));

  const rawChildren = api.children;
  const children =
    Array.isArray(rawChildren) && rawChildren.length > 0
      ? rawChildren
          .filter((c): c is Record<string, unknown> => c !== null && typeof c === "object")
          .map((c) => mapApiTaskToPlannerTask(c, projectId, statuses))
      : undefined;

  return {
    id,
    projectId,
    title: stringifyApiScalar(api.title),
    description: typeof api.description === "string" ? api.description : "",
    status: rowStatus,
    priority: mapApiPriorityToTaskPriority(api.priority),
    assignee,
    dueDate: dueRaw,
    labels: labels.length > 0 ? labels : undefined,
    subtasks: undefined,
    children,
    sub_task_count: readApiNumericCount(api.sub_task_count),
    completed_sub_task_count: readApiNumericCount(api.completed_sub_task_count),
    assigneeExtensionNumbers:
      assigneeExtensionNumbers.length > 0 ? assigneeExtensionNumbers : undefined,
    watcherExtensionNumbers:
      watcherExtensionNumbers.length > 0 ? watcherExtensionNumbers : undefined,
  };
}

export async function fetchTasksForExpandedProject(projectId: string): Promise<Task[]> {
  const data = await getProject(projectId, Array.from(WORK_PLANNER_PROJECT_DETAIL_RELATIONS), {
    sub_task_count: true,
  });
  if (!data || typeof data !== "object") return [];
  const payload = data as { tasks?: unknown[]; statuses?: Array<Record<string, unknown>> };
  const rawTasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const statuses = Array.isArray(payload.statuses) ? payload.statuses : [];
  return rawTasks
    .filter((t): t is Record<string, unknown> => t !== null && typeof t === "object")
    .map((t) => mapApiTaskToPlannerTask(t, projectId, statuses));
}
