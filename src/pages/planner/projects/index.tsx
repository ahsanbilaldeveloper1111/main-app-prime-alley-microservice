/**
 * WorkPlannerProjects - Enhanced with Expandable Task Tree
 * 
 * CHANGES MADE:
 * 1. Added expandable project rows that show tasks when clicked (chevron arrow)
 * 2. Tasks can also be expanded to show their subtasks
 * 3. Hovering on a task row shows a "Preview" button that opens a task detail sidebar
 * 4. Expanding a project row loads tasks via `getProject` (same relations as project detail).
 * 5. A `<TaskDetailPanel>` Offcanvas sidebar shows task details on Preview/click
 */

import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/datatable-style.scss";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  getProject,
  getTask,
  getRecentActivity,
  getOverdueTasks,
} from "@utils/tasks";
import {
  WORK_PLANNER_PROJECT_DETAIL_RELATIONS,
  WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS,
  mapGetTaskResponseToSidebarEditTask,
} from "@planner/workPlannerProjectRelations";
import {
  canAdministerProjectFromMembers,
  canManageProjectFromMembers,
  getSessionPhoneOrExtension,
} from "@planner/projectMemberRole";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import RichTextEditor from "@pages/help-center/partials/RichTextEditor";
import {
  ModuleSlug,
  getAutoTimezone,
  formatDateGlobal,
  formatDateTimeGlobal,
} from "@utils/Helper";
import { toast } from "react-toastify";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { StatsCardData } from "@components/GenericStatsCards";
import GenericFilterSidebar, { type FilterOption, FilterField } from "@components/GenericFilterSidebar";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import GenericSidebar from "@components/GenericSidebarNew";
import GenericTable, {
  TableColumn,
  TableAction,
  ToolbarConfig,
  FilterPill,
  TabConfig,
} from "@components/GenericTable";
import {
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  Nav,
  Offcanvas,
  ProgressBar,
  Row,
  Spinner,
} from "react-bootstrap";
import {
  FolderOpen,
  Folder,
  Plus,
  X,
  MoreVertical,
  Calendar,
  AlertCircle,
  CalendarDays,
  Users,
  Palette,
  Smartphone,
  Megaphone,
  Monitor,
  Headphones,
  Rocket,
  Settings,
  Trash2,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Circle,
  Clock,
  Eye,
} from "lucide-react";
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;
// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ApiProject {
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

type ProjectStatusFilter = "active" | "completed" | "archived" | "all";

type ProjectFormStatus = "active" | "archived" | "completed";

const PROJECT_NAME_MAX_LENGTH = 150;

interface ProjectFormState {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  color: string;
  status: ProjectFormStatus;
  timezone: string;
}

function createEmptyProjectForm(): ProjectFormState {
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

function formatApiDateForProjectInput(value: string | null | undefined): string {
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
function formatProjectSidebarDate(iso: string | null | undefined): string | null {
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
function formatProjectSidebarDateTime(iso: string | null | undefined): string | null {
  if (iso == null) return null;
  const s = String(iso).trim();
  if (s === "") return null;
  const formatted = formatDateTimeGlobal(s);
  return formatted === "" ? null : formatted;
}

/** `YYYY-MM-DD` for today's local calendar date (for `<input type="date" min>`). */
function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function apiStatusToProjectFormStatus(api: string | undefined): ProjectFormStatus {
  const s = (api ?? "active").toLowerCase();
  if (s === "archived") return "archived";
  if (s === "completed") return "completed";
  return "active";
}

interface Project {
  id: string;
  name: string;
  icon: React.ElementType;
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

function mapApiProjectToProject(apiProject: ApiProject): Project {
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

const getProjectStatusFromApiStatus = (apiStatus: string | undefined): Project["status"] => {
  if (apiStatus === "active") return "Active";
  if (apiStatus === "completed") return "Completed";
  return "Archived";
};

const getProjectStatusVariant = (status: Project["status"]): "success" | "secondary" | "warning" => {
  if (status === "Active") return "success";
  if (status === "Archived") return "warning";
  return "secondary";
};

const coerceProjectStatusFilter = (value: unknown): ProjectStatusFilter => {
  if (value === "all" || value === "active" || value === "completed" || value === "archived") return value;
  return "active";
};

function isProjectStatusFilterActive(status: ProjectStatusFilter): boolean {
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
function countAssignees(
  extensionNumbers: string[] | undefined,
  assigneeDisplayLabel: string | undefined,
): number {
  const n = extensionNumbers?.length ?? 0;
  if (n > 0) return n;
  if (assigneeDisplayLabel != null && assigneeDisplayLabel.trim() !== "") return 1;
  return 0;
}

function mapApiTaskToPlannerTask(
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

async function fetchTasksForExpandedProject(projectId: string): Promise<Task[]> {
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

// ============================================================
// HELPER COMPONENTS
// ============================================================

const statusConfig = {
  todo: { label: "To Do", color: "#6b7280", bg: "#f3f4f6", icon: Circle },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "#eff6ff", icon: Clock },
  done: { label: "Done", color: "#10b981", bg: "#ecfdf5", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "#ef4444", bg: "#fef2f2", icon: AlertCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "#6b7280" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#ef4444" },
  urgent: { label: "Urgent", color: "#7c3aed" },
};

interface TaskRowProps {
  task: Task;
  depth?: number;
  onPreview: (task: Task) => void | Promise<void>;
  expandedTasks: Set<string>;
  onToggleTask: (taskId: string) => void;
  canPreviewEditTask: boolean;
}

function computeOpenSubtaskCount(task: Task): number | null {
  if (task.children && task.children.length > 0) {
    return task.children.filter((c) => c.status !== "done").length;
  }
  if (task.subtasks && task.subtasks.length > 0) {
    return task.subtasks.filter((s) => s.status !== "done").length;
  }
  const total = task.sub_task_count;
  if (total == null || total <= 0) {
    return null;
  }
  return Math.max(0, total - (task.completed_sub_task_count ?? 0));
}

function getSubtaskBadgeCounts(task: Task): { completed: number; total: number } | null {
  if (task.children && task.children.length > 0) {
    const total = task.children.length;
    const completed = task.children.filter((c) => c.status === "done").length;
    return { completed, total };
  }
  const total = task.sub_task_count;
  if (total == null || total <= 0) {
    return null;
  }
  return { completed: task.completed_sub_task_count ?? 0, total };
}

function plannerChildTasksToSubTasks(children: Task[]): SubTask[] {
  return children.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    assignee: c.assignee,
    dueDate: c.dueDate,
    description: c.description,
    assigneeExtensionNumbers: c.assigneeExtensionNumbers,
    watcherExtensionNumbers: c.watcherExtensionNumbers,
  }));
}

/** Renders a single task row inside an expanded project, with optional subtask expansion */
const TaskRow: React.FC<TaskRowProps> = ({
  task,
  depth = 1,
  onPreview,
  expandedTasks,
  onToggleTask,
  canPreviewEditTask,
}) => {
  const [hovered, setHovered] = useState(false);
  const isExpanded = expandedTasks.has(task.id);
  const hasChildTasks = (task.children?.length ?? 0) > 0;
  const subtasksLoaded = Boolean(task.subtasks && task.subtasks.length > 0);
  const hasSubtaskCounts = task.sub_task_count != null && task.sub_task_count > 0;
  const hasSubtasks = hasChildTasks || subtasksLoaded || hasSubtaskCounts;
  const openSubtaskCount = computeOpenSubtaskCount(task);
  const subtaskBadge = getSubtaskBadgeCounts(task);
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const indentLeft = depth * 24;

  return (
    <>
      <tr
        className="task-tree-row"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ backgroundColor: hovered ? "#f8fafc" : "#fafbfc" }}
      >
        {/* Name column - indented (offset replaces former checkbox column) */}
        <td style={{ paddingLeft: 40 + indentLeft + 8, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Tree line indicator */}
            <span
              style={{
                width: 16,
                height: 16,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                flexShrink: 0,
              }}
            >
              {hasSubtasks ? (
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", color: "#6b7280" }}
                >
                  {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span style={{ width: 14, display: "inline-block" }} />
              )}
            </span>

            {/* Status icon */}
            <StatusIcon size={14} style={{ color: status.color, flexShrink: 0 }} />

            {/* Task title */}
            <button
              type="button"
              onClick={async () => {
                if (canPreviewEditTask) {
                  await onPreview(task);
                }
              }}
              style={{
                fontSize: "0.875rem",
                color: "#334155",
                fontWeight: 500,
                cursor: canPreviewEditTask ? "pointer" : "default",
                textDecoration: task.status === "done" ? "line-through" : "none",
                opacity: task.status === "done" ? 0.6 : 1,
                background: "none",
                border: "none",
                padding: 0,
                textAlign: "left",
              }}
            >
              {task.title}
            </button>

            {/* Subtask count badge (nested children or API counts) */}
            {subtaskBadge && (
              <span
                style={{
                  fontSize: "0.7rem",
                  backgroundColor: "#e5e7eb",
                  color: "#6b7280",
                  borderRadius: 10,
                  padding: "1px 6px",
                  fontWeight: 600,
                }}
              >
                {subtaskBadge.completed}/{subtaskBadge.total}
              </span>
            )}

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div style={{ display: "flex", gap: 4, marginLeft: 4 }}>
                {task.labels.slice(0, 2).map((label) => (
                  <span
                    key={label}
                    style={{
                      fontSize: "0.65rem",
                      backgroundColor: "#dbeafe",
                      color: "#3b82f6",
                      borderRadius: 4,
                      padding: "1px 5px",
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Preview button on hover */}
            {hovered && canPreviewEditTask && (
              <button
                onClick={(e) => { e.stopPropagation(); onPreview(task); }}
                style={{
                  marginLeft: "auto",
                  fontSize: "0.75rem",
                  padding: "3px 10px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #141414",
                  color: "#141414",
                  fontWeight: 400,
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                  position: "absolute",
                  right: 8,
                }}
              >
                {/* <Eye size={12} /> */}
                Preview/Edit
              </button>
            )}
          </div>
        </td>

        {/* Members column: assignee count for tasks (matches project member badge) */}
        <td>
          <div className="member-avatar bg-primary">
            {countAssignees(task.assigneeExtensionNumbers, task.assignee)}
          </div>
        </td>

        {/* Open (subtask count as "open") */}
        <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
          {openSubtaskCount ?? "—"}
        </td>

        {/* Overdue indicator */}
        <td style={{ fontSize: "0.8rem" }}>
          {task.status === "overdue" ? (
            <span style={{ color: "#ef4444", fontWeight: 600 }}>Overdue</span>
          ) : (
            <span style={{ color: "#9ca3af" }}>—</span>
          )}
        </td>

        {/* Due date */}
        <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
          {task.dueDate ? formatDateGlobal(task.dueDate) || "—" : "—"}
        </td>

        <td className="generic-table-actions-cell" />
      </tr>

      {/* Nested child task rows (API `children`) or legacy `subtasks` */}
      {isExpanded &&
        hasChildTasks &&
        task.children!.map((child) => (
          <TaskRow
            key={child.id}
            task={child}
            depth={depth + 1}
            onPreview={onPreview}
            expandedTasks={expandedTasks}
            onToggleTask={onToggleTask}
            canPreviewEditTask={canPreviewEditTask}
          />
        ))}
      {isExpanded && subtasksLoaded && !hasChildTasks &&
        task.subtasks!.map((sub) => (
          <SubtaskRow
            key={sub.id}
            subtask={sub}
            depth={depth + 1}
            canPreviewEditTask={canPreviewEditTask}
            onPreview={() => {
              onPreview({
                id: sub.id,
                projectId: task.projectId,
                title: sub.title,
                status: sub.status,
                priority: "medium",
                assignee: sub.assignee,
                dueDate: sub.dueDate,
                description: sub.title,
                subtasks: [],
                labels: [],
              });
            }}
          />
        ))}
    </>
  );
};

interface SubtaskRowProps {
  subtask: SubTask;
  depth: number;
  onPreview: () => void;
  canPreviewEditTask: boolean;
}

/** Renders a subtask row (leaf node, no further expansion) */
const SubtaskRow: React.FC<SubtaskRowProps> = ({
  subtask,
  depth,
  onPreview,
  canPreviewEditTask,
}) => {
  const [hovered, setHovered] = useState(false);
  const status = statusConfig[subtask.status];
  const StatusIcon = status.icon;
  const indentLeft = depth * 24;

  return (
    <tr
      className="task-tree-row subtask-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? "#f0f4ff" : "#f5f7fb" }}
    >
      <td style={{ paddingLeft: 40 + indentLeft + 8, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Indent spacer */}
          <span style={{ width: 14, display: "inline-block", flexShrink: 0 }} />
          <StatusIcon size={13} style={{ color: status.color, flexShrink: 0 }} />
          <button
            type="button"
            onClick={() => {
              if (canPreviewEditTask) onPreview();
            }}
            style={{
              fontSize: "0.825rem",
              color: "#475569",
              textDecoration: subtask.status === "done" ? "line-through" : "none",
              opacity: subtask.status === "done" ? 0.55 : 1,
              cursor: canPreviewEditTask ? "pointer" : "default",
              background: "none",
              border: "none",
              padding: 0,
              textAlign: "left",
            }}
          >
            {subtask.title}
          </button>

          {/* Preview button on hover */}
          {hovered && canPreviewEditTask && (
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              style={{
                marginLeft: "auto",
                fontSize: "0.75rem",
                padding: "2px 8px",
                backgroundColor: "#ffffff",
                border: "1px solid #141414",
                color: "#141414",
                fontWeight: 400,
                borderRadius: 4,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
                position: "absolute",
                right: 8,
              }}
            >
              <Eye size={11} />
              Preview
            </button>
          )}
        </div>
      </td>

      <td>
        <div className="member-avatar bg-primary">
          {countAssignees(subtask.assigneeExtensionNumbers, subtask.assignee)}
        </div>
      </td>
      <td style={{ fontSize: "0.8rem", color: "#9ca3af" }}>—</td>
      <td style={{ fontSize: "0.8rem" }}>
        {subtask.status === "overdue" ? (
          <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.8rem" }}>Overdue</span>
        ) : "—"}
      </td>
      <td style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
        {subtask.dueDate ? formatDateGlobal(subtask.dueDate) || "—" : "—"}
      </td>
      <td className="generic-table-actions-cell" />
    </tr>
  );
};

// ============================================================
// TASK DETAIL SIDEBAR
// Shows when clicking Preview on a task row
// ============================================================

interface TaskDetailPanelProps {
  task: Task | null;
  show: boolean;
  onHide: () => void;
}

function DetailBox({
  label,
  children,
  className,
}: Readonly<{ label: string; children: React.ReactNode; className?: string }>) {
  return (
    <div className={className} style={{ padding: 16, border: "1px solid #eaf0f6", borderRadius: 5 }}>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, show, onHide }) => {
  if (!task) return null;
  const subtasksForDetail =
    task.children && task.children.length > 0
      ? plannerChildTasksToSubTasks(task.children)
      : task.subtasks ?? [];
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const StatusIcon = status.icon;

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      style={{ width: 520 }}
    >
      <Offcanvas.Header style={{ padding: "16px 20px", borderBottom: "1px solid #eaf0f6" }}>
        <Offcanvas.Title>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusIcon size={20} style={{ color: status.color }} />
            <span style={{ fontSize: 18, fontWeight: 500, color: "#141414" }}>{task.title}</span>
          </div>
        </Offcanvas.Title>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onHide}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}
          >
            <X size={18} />
          </button>
        </div>
      </Offcanvas.Header>

      <Offcanvas.Body style={{ padding: 20, backgroundColor: "#ffffff" }}>
        {/* Status & Priority */}
        <Row className="g-2 mb-3">
          <Col xs={6}>
            <DetailBox label="Status">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: status.bg,
                  color: status.color,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <StatusIcon size={13} />
                {status.label}
              </span>
            </DetailBox>
          </Col>
          <Col xs={6}>
            <DetailBox label="Priority">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: priority.color,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: priority.color, display: "inline-block" }} />
                {priority.label}
              </span>
            </DetailBox>
          </Col>
        </Row>

        {/* Assignee & Due Date */}
        <Row className="g-2 mb-3">
          <Col xs={6}>
            <DetailBox label="Assignee">
              {task.assignee ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#667eea", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 600 }}>
                    {task.assignee.substring(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{task.assignee}</span>
                </div>
              ) : (
                <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Unassigned</span>
              )}
            </DetailBox>
          </Col>
          <Col xs={6}>
            <DetailBox label="Due Date">
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem", fontWeight: 500 }}>
                <Calendar size={14} style={{ color: "#6b7280" }} />
                {task.dueDate ? formatDateGlobal(task.dueDate) || "No due date" : "No due date"}
              </div>
            </DetailBox>
          </Col>
        </Row>

        {/* Description */}
        {task.description && (
          <DetailBox label="Description" className="mb-3">
            <p style={{ fontSize: "0.875rem", color: "#475569", margin: 0, lineHeight: 1.6 }}>
              {task.description}
            </p>
          </DetailBox>
        )}

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <DetailBox label="Labels" className="mb-3">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {task.labels.map((label) => (
                <span
                  key={label}
                  style={{ backgroundColor: "#dbeafe", color: "#3b82f6", borderRadius: 6, padding: "3px 10px", fontSize: "0.8rem", fontWeight: 500 }}
                >
                  {label}
                </span>
              ))}
            </div>
          </DetailBox>
        )}

        {/* Subtasks (API `children` or legacy `subtasks`) */}
        {subtasksForDetail.length > 0 && (
          <DetailBox
            label={`Subtasks (${subtasksForDetail.filter((s) => s.status === "done").length}/${subtasksForDetail.length} completed)`}
            className="mb-3"
          >
            {/* Progress */}
            <ProgressBar
              now={Math.round((subtasksForDetail.filter((s) => s.status === "done").length / subtasksForDetail.length) * 100)}
              style={{ height: 6, marginBottom: 12 }}
              variant="primary"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subtasksForDetail.map((sub) => {
                const subStatus = statusConfig[sub.status];
                const SubIcon = subStatus.icon;
                return (
                  <div
                    key={sub.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 6,
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <SubIcon size={14} style={{ color: subStatus.color, flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#475569",
                        flex: 1,
                        textDecoration: sub.status === "done" ? "line-through" : "none",
                        opacity: sub.status === "done" ? 0.6 : 1,
                      }}
                    >
                      {sub.title}
                    </span>
                    {sub.assignee && (
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{sub.assignee}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </DetailBox>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

// ============================================================
// EXPANDABLE PROJECT ROW WRAPPER
// Injects task rows below the project row when expanded
// ============================================================

interface ExpandableProjectTableProps {
  projects: Project[];
  loading: boolean;
  extensions: any[];
  // Pass through all the existing table props
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  /** Rank-level CRUD for projects (still combined with per-project membership in row actions). */
  sessionPlannerProjectCrud: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  // Pagination
  pagination: { page: number; limit: number; total: number; last_page: number; from: number; to: number };
  onPaginationChange: (page: number, rowsPerPage: number) => void;
  // Toolbar
  toolbarConfig: ToolbarConfig;
  statsCards: StatsCardData[];
  columns: TableColumn<Project>[];
  actions: TableAction<Project>[];
  /** `session.user.phone` (or `extension` fallback), normalized for matching `members[].extension_number`. */
  sessionUserPhoneOrExtension: string;
}

type CreatePlannerSidebarTaskProp = NonNullable<
  ComponentProps<typeof CreateTaskSidebar>["task"]
>;

/** `project` prop shape for `CreatePlannerTaskSidebar` (numeric API project id). */
function mapTableProjectToPlannerSidebarProject(row: Project): {
  id: number;
  name: string;
  icon: string;
  color: string;
  statuses?: ApiProject["statuses"];
  labels?: ApiProject["labels"];
} {
  if (row.apiData) {
    return {
      id: row.apiData.id,
      name: row.apiData.name,
      icon: "",
      color: row.apiData.color || "#3b82f6",
      statuses: row.apiData.statuses,
      labels: row.apiData.labels,
    };
  }
  const id = Number(row.id);
  return {
    id: Number.isFinite(id) ? id : 0,
    name: row.name,
    icon: "",
    color: row.iconColor || "#3b82f6",
  };
}

function projectIdFromSidebarEditTask(
  task: CreatePlannerSidebarTaskProp | null | undefined,
): number | null {
  if (task == null || typeof task !== "object") return null;
  const t = task as Record<string, unknown>;
  const pid = t.project_id;
  if (typeof pid === "number" && Number.isFinite(pid)) return pid;
  const proj = t.project as { id?: unknown } | undefined;
  if (proj != null && typeof proj === "object" && typeof proj.id === "number") {
    return proj.id;
  }
  return null;
}

function resolveProjectActionsMenuOpenState(
  projectId: string,
  nextShow: boolean,
  previousOpenId: string | null,
): string | null {
  if (nextShow) {
    return projectId;
  }
  return previousOpenId === projectId ? null : previousOpenId;
}

function createProjectRowActionsToggleHandler(
  projectId: string,
  setOpenProjectActionsId: React.Dispatch<React.SetStateAction<string | null>>,
): (nextShow: boolean) => void {
  return (nextShow: boolean) => {
    setOpenProjectActionsId((prev) => resolveProjectActionsMenuOpenState(projectId, nextShow, prev));
  };
}

/**
 * ExpandableProjectTable
 *
 * Renders the GenericTable with an extra first column for the expand chevron.
 * When a project row is expanded, task rows are injected below it via a custom
 * tbody rendering trick using the `customBody` prop pattern.
 *
 * NOTE: Since GenericTable doesn't natively support tree/nested rows, we render
 * a custom table body and pass it as `customBody` to GenericTable's card wrapper.
 * The toolbar and pagination are still handled by GenericTable.
 * Expanding a row loads tasks via `getProject` + `WORK_PLANNER_PROJECT_DETAIL_RELATIONS`.
 */
const ExpandableProjectTable: React.FC<ExpandableProjectTableProps> = ({
  projects,
  loading,
  extensions,
  onProjectClick,
  onEditProject,
  onDeleteProject,
  sessionPlannerProjectCrud,
  pagination,
  onPaginationChange,
  toolbarConfig,
  statsCards,
  columns,
  actions,
  sessionUserPhoneOrExtension,
}) => {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const canPreviewEditTask = hasPermission(PERMISSIONS.EDIT_TASKS_WORK_PLANNER);
  const sessionCanCreatePlannerTask = useMemo(
    () =>
      hasAnyPermission([
        PERMISSIONS.CREATE_TASKS_WORK_PLANNER,
        PERMISSIONS.EDIT_TASKS_WORK_PLANNER,
      ]),
    [hasAnyPermission],
  );
  // Track which project rows are expanded
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  // Cache of loaded tasks per project { [projectId]: Task[] }
  const [projectTasks, setProjectTasks] = useState<Record<string, Task[]>>({});
  // Track which task rows are expanded (showing subtasks)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  // Loading state per project
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  /** Task payload for edit mode — always loaded via `getTask`, never from the table row cache. */
  const [fetchedEditTask, setFetchedEditTask] = useState<CreatePlannerSidebarTaskProp | null>(null);
  const [loadingSidebarEditTask, setLoadingSidebarEditTask] = useState(false);
  /** When set, sidebar opens in create mode for this table row’s project. */
  const [createTaskForProject, setCreateTaskForProject] = useState<Project | null>(null);
  const [showCreateTaskSidebar, setShowCreateTaskSidebar] = useState(false);
  /** Only one project row actions menu open at a time (controlled Dropdown). */
  const [openProjectActionsId, setOpenProjectActionsId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  const fetchAndStoreProjectTasks = async (projectId: string) => {
    setLoadingTasks((prev) => new Set(prev).add(projectId));
    try {
      const tasks = await fetchTasksForExpandedProject(projectId);
      setProjectTasks((prev) => ({ ...prev, [projectId]: tasks }));
    } catch (err) {
      console.error("[WorkPlannerProjects] Failed to load tasks for project", projectId, err);
      setProjectTasks((prev) => ({ ...prev, [projectId]: [] }));
    } finally {
      setLoadingTasks((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const handleToggleProject = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const projectId = project.id;

    if (expandedProjects.has(projectId)) {
      // Collapse
      const newSet = new Set(expandedProjects);
      newSet.delete(projectId);
      setExpandedProjects(newSet);
    } else {
      // Expand — always refetch so reopening a row shows up-to-date tasks
      const newSet = new Set(expandedProjects);
      newSet.add(projectId);
      setExpandedProjects(newSet);
      await fetchAndStoreProjectTasks(projectId);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    setExpandedTasks(newSet);
  };

  const handlePreviewTask = async (task: Task) => {
    if (loadingSidebarEditTask) return;
    setCreateTaskForProject(null);
    setFetchedEditTask(null);
    setLoadingSidebarEditTask(true);
    try {
      const raw = await getTask(task.id, Array.from(WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS));
      if (raw == null || typeof raw !== "object") {
        return;
      }
      setFetchedEditTask(
        mapGetTaskResponseToSidebarEditTask(raw as Record<string, unknown>) as CreatePlannerSidebarTaskProp,
      );
      setShowCreateTaskSidebar(true);
    } catch (err) {
      console.error("[WorkPlannerProjects] getTask failed for sidebar edit", task.id, err);
    } finally {
      setLoadingSidebarEditTask(false);
    }
  };

  const handleOpenCreateTaskForExpandedProject = (projectRow: Project) => {
    setFetchedEditTask(null);
    setCreateTaskForProject(projectRow);
    setShowCreateTaskSidebar(true);
  };

  function handleProjectRowMouseEnter(projectId: string) {
    setHoveredProjectId(projectId);
  }

  function handleProjectRowMouseLeave(projectId: string) {
    setHoveredProjectId((prev) => (prev === projectId ? null : prev));
  }

  // Build the custom table body
  const renderTableBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={6} className="text-center py-5" style={{ color: "#94a3b8" }}>
              <Spinner animation="border" size="sm" className="me-2" />
              Loading projects...
            </td>
          </tr>
        </tbody>
      );
    }

    if (projects.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={6} className="text-center py-5">
              <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ color: "#64748b" }}>No projects found</div>
            </td>
          </tr>
        </tbody>
      );
    }

    const rows: React.ReactNode[] = [];

    projects.forEach((project) => {
      const isExpanded = expandedProjects.has(project.id);
      const isLoadingTasks = loadingTasks.has(project.id);
      const tasks = projectTasks[project.id] || [];
      // Project row
      rows.push(
        <tr
          key={`project-${project.id}`}
          className="generic-table-row clickable"
          onClick={() => onProjectClick(project)}
          onMouseEnter={() => handleProjectRowMouseEnter(project.id)}
          onMouseLeave={() => handleProjectRowMouseLeave(project.id)}
          style={{ backgroundColor: isExpanded ? "#f0f7ff" : undefined }}
        >
          {/* Expand chevron + Project name */}
          <td style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Chevron toggle */}
              <button
                onClick={(e) => handleToggleProject(project, e)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "2px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: "#6b7280",
                  flexShrink: 0,
                  borderRadius: 4,
                  transition: "background 0.15s",
                }}
                title={isExpanded ? "Collapse tasks" : "Expand tasks"}
              >
                {isExpanded ? (
                  <ChevronDownIcon size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>

              {/* Project icon + name */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: project.iconColor + "20",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <project.icon size={20} style={{ color: project.iconColor }} />
              </div>
              <span style={{ fontWeight: 600 }}>{project.name}</span>

              {hoveredProjectId === project.id && (
                <button
                type="button"
                className="preview-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectClick(project);
                }}
                style={{ position: "absolute", right: 8, fontSize: "12px", color: "#141414", border: "1px solid #141414", borderRadius: "4px", backgroundColor: "#ffffff" }}
              >
                Preview
              </button>
              )}
            </div>
          </td>

          {/* Members */}
          <td>
            <div className="member-avatar bg-primary">{project.members?.length || 0}</div>
          </td>

          {/* Open */}
          <td>{project.open}</td>

          {/* Overdue */}
          <td>
            <span className={project.overdue > 0 ? "overdue-count" : ""}>
              {project.overdue}
            </span>
          </td>

          {/* Last Update */}
          <td>{project.lastUpdate}</td>

          {/* Actions */}
          <td className="generic-table-actions-cell" onClick={(e) => e.stopPropagation()}>
            <div className="generic-table-actions">
              <div>
                <Dropdown
                  show={openProjectActionsId === project.id}
                  onToggle={createProjectRowActionsToggleHandler(project.id, setOpenProjectActionsId)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown.Toggle
                    variant="link"
                    size="sm"
                    className="p-1 text-decoration-none shadow-none"
                    style={{ color: "#6b7280" }}
                    id={`project-row-actions-${project.id}`}
                  >
                    <MoreVertical size={16} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" popperConfig={{ strategy: "fixed" }} renderOnMount>
                    <Dropdown.Item
                      as="button"
                      type="button"
                      onClick={() => {
                        setOpenProjectActionsId(null);
                        window.open(`/planner/projects/${project.id}`, "_blank");
                      }}
                    >
                      <Eye size={14} className="me-2" />
                      Project overview
                    </Dropdown.Item>
                    {canAdministerProjectFromMembers(project, sessionUserPhoneOrExtension) &&
                    sessionPlannerProjectCrud.canUpdate ? (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          as="button"
                          type="button"
                          onClick={() => {
                            setOpenProjectActionsId(null);
                            onEditProject(project);
                          }}
                        >
                          <Settings size={14} className="me-2" />
                          Edit Project
                        </Dropdown.Item>
                      </>
                    ) : null}
                    {canAdministerProjectFromMembers(project, sessionUserPhoneOrExtension) &&
                    sessionPlannerProjectCrud.canDelete ? (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          as="button"
                          type="button"
                          className="text-danger"
                          onClick={() => {
                            setOpenProjectActionsId(null);
                            onDeleteProject(project);
                          }}
                        >
                          <Trash2 size={14} className="me-2" />
                          Delete Project
                        </Dropdown.Item>
                      </>
                    ) : null}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </td>
        </tr>
      );

      // Task rows (shown when project is expanded)
      if (isExpanded) {
        if (isLoadingTasks) {
          rows.push(
            <tr key={`loading-${project.id}`} style={{ backgroundColor: "#fafbfc" }}>
              <td colSpan={6} style={{ paddingLeft: 56, paddingTop: 12, paddingBottom: 12 }}>
                <Spinner animation="border" size="sm" className="me-2" style={{ color: "#94a3b8" }} />
                <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading tasks...</span>
              </td>
            </tr>
          );
        } else if (tasks.length === 0) {
          rows.push(
            <tr key={`empty-${project.id}`} style={{ backgroundColor: "#fafbfc" }}>
              <td colSpan={6} style={{ paddingLeft: 56, paddingTop: 10, paddingBottom: 10, color: "#9ca3af", fontSize: "0.875rem" }}>
                No tasks found for this project.
              </td>
            </tr>
          );
        } else {
          tasks.forEach((task) => {
            rows.push(
              <TaskRow
                key={`task-${task.id}`}
                task={task}
                depth={1}
                onPreview={handlePreviewTask}
                expandedTasks={expandedTasks}
                onToggleTask={handleToggleTask}
                canPreviewEditTask={canPreviewEditTask}
              />
            );
          });
        }

        // "Add task" row at the bottom of expanded project (same member role as edit/delete)
        if (
          canManageProjectFromMembers(project, sessionUserPhoneOrExtension) &&
          sessionCanCreatePlannerTask
        ) {
          rows.push(
            <tr key={`add-task-${project.id}`} style={{ backgroundColor: "#fafbfc" }}>
              <td colSpan={6} style={{ paddingLeft: 56, paddingTop: 6, paddingBottom: 6 }}>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: "0.825rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 0",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateTaskForExpandedProject(project);
                  }}
                >
                  <Plus size={14} />
                  Add task
                </button>
              </td>
            </tr>
          );
        }
      }
    });

    return <tbody>{rows}</tbody>;
  };

  return (
    <>
      <CreateTaskSidebar
        isOpen={showCreateTaskSidebar}
        onClose={() => {
          setShowCreateTaskSidebar(false);
          setFetchedEditTask(null);
          setCreateTaskForProject(null);
        }}
        onCreate={async (data) => {
          const projectIdNum =
            data.projectId ??
            projectIdFromSidebarEditTask(fetchedEditTask) ??
            createTaskForProject?.apiData?.id ??
            null;
          if (projectIdNum != null) {
            const projectIdStr = String(projectIdNum);
            if (expandedProjects.has(projectIdStr)) {
              await fetchAndStoreProjectTasks(projectIdStr);
            }
          }
          setShowCreateTaskSidebar(false);
          setFetchedEditTask(null);
          setCreateTaskForProject(null);
        }}
        extensions={extensions}
        labels={createTaskForProject?.apiData?.labels ?? []}
        project={
          createTaskForProject ? mapTableProjectToPlannerSidebarProject(createTaskForProject) : undefined
        }
        task={fetchedEditTask ?? undefined}
        isEdit={!!fetchedEditTask}
      />

      {/* Use GenericTable only for toolbar + pagination; render our own table body */}
      <GenericTable<Project>
        data={projects}
        columns={columns}
        actions={actions}
        showActions={true}
        showToolbarActions={false}
        actionsLabel="Actions"
        pagination={{
          currentPage: pagination.page,
          rowsPerPage: pagination.limit,
          totalRows: pagination.total,
          pageSizeOptions: [10, 15, 25, 50],
        }}
        onPaginationChange={onPaginationChange}
        sortable={true}
        loading={loading}
        emptyMessage={
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
            <FolderOpen size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
            <p style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              No projects found
            </p>
          </div>
        }
        hover={true}
        uniqueKey="id"
        customizableColumns={true}
        columnStorageKey="planner-projects-columns"
        showToolbar={true}
        toolbar={toolbarConfig}
        statsCards={statsCards}
        /**
         * customBody: We pass our own table markup so we can render expandable rows.
         * The GenericTable will render this inside its Card wrapper, alongside
         * the toolbar and pagination controls.
         */
        customBody={
          <div className="generic-table-responsive">
            <style>{`
              .task-tree-row td {
                padding: 8px 12px;
                border-bottom: 1px solid #f1f5f9;
                vertical-align: middle;
              }
              .task-tree-row:last-child td {
                border-bottom: none;
              }
              .subtask-row td {
                border-bottom: 1px solid #f8fafc;
              }
            `}</style>
            <table className="table generic-table mb-0" style={{ width: "100%" }}>
              <thead className="generic-table-header">
                <tr>
                  <th className="generic-table-th">Project Name</th>
                  <th className="generic-table-th">Members</th>

                  <th className="generic-table-th">Open Tasks</th>
                  <th className="generic-table-th">Overdue Tasks</th>
                  <th className="generic-table-th">Last Update</th>
                  <th className="generic-table-th generic-table-actions-header">Actions</th>
                </tr>
              </thead>
              {renderTableBody()}
            </table>
          </div>
        }
      />
    </>
  );
};

// ============================================================
// PROJECT DETAIL SIDEBAR (extracted to reduce complexity)
// ============================================================

type ProjectDetailOffcanvasProps = {
  show: boolean;
  onHide: () => void;
  selectedProject: Project | null;
  selectedProjectDetails: ApiProject | null;
  loadingProjectDetails: boolean;
  loadingOverdueTasks: boolean;
  overdueTasks: any[];
  detailTab: string;
  setDetailTab: (tab: string) => void;
  loadingActivities: boolean;
  projectActivities: any[];
  getUserNameFromExtension: (extensionNumber: string) => string;
  getAvatarColor: (extensionNumber: string, index: number) => string;
  getInitials: (extensionNumber: string) => string;
  getActionColor: (action: string) => string;
  formatTimeAgo: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
};

const ProjectDetailOffcanvas: React.FC<ProjectDetailOffcanvasProps> = ({
  show,
  onHide,
  selectedProject,
  selectedProjectDetails,
  loadingProjectDetails,
  loadingOverdueTasks,
  overdueTasks,
  detailTab,
  setDetailTab,
  loadingActivities,
  projectActivities,
  getUserNameFromExtension,
  getAvatarColor,
  getInitials,
  getActionColor,
  formatTimeAgo,
  formatDateTime,
}) => {
  if (!show || !selectedProject) {
    return null;
  }

  const resolvedStatus =
    selectedProjectDetails ? getProjectStatusFromApiStatus(selectedProjectDetails.status) : selectedProject.status;

  const sidebarStartDate = formatProjectSidebarDate(
    selectedProjectDetails?.start_date ?? selectedProject.apiData?.start_date ?? undefined,
  );
  const sidebarEndDate = formatProjectSidebarDate(
    selectedProjectDetails?.end_date ?? selectedProject.apiData?.end_date ?? undefined,
  );
  const sidebarProjectColor =
    selectedProjectDetails?.color?.trim() ||
    selectedProject.iconColor ||
    "#3b82f6";
  const lastUpdatedIso = selectedProjectDetails?.updated_at ?? selectedProject.apiData?.updated_at;
  const lastUpdatedDisplay =
    formatProjectSidebarDateTime(lastUpdatedIso) ??
    (selectedProject.lastUpdate !== "N/A" ? selectedProject.lastUpdate : null);
  const projectMembers = selectedProjectDetails?.members || selectedProject.members;
  const progressPercent = Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100);

  const activityActorDisplayName = (extension: string) =>
    extension === "system" ? "System" : getUserNameFromExtension(extension);

  let recentActivityContent: React.ReactNode;
  if (loadingActivities) {
    recentActivityContent = <Spinner animation="border" size="sm" />;
  } else if (projectActivities.length === 0) {
    recentActivityContent = (
      <div className="text-center py-3 text-muted" style={{ fontSize: "0.875rem" }}>
        No recent activity
      </div>
    );
  } else {
    recentActivityContent = (
      <div className="d-flex flex-column gap-3">
        {projectActivities.slice(0, 10).map((activity: any, idx: number) => {
          const ext = activity.extension_number || "system";
          return (
            <div key={activity.id || `${ext}-${activity.created_at || idx}`} className="d-flex gap-2">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: getAvatarColor(ext, idx),
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {getInitials(ext)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.875rem", color: "#334155" }}>
                  <span style={{ fontWeight: 600 }}>{activityActorDisplayName(ext)}</span>{" "}
                  {activity.description || `${activity.action} task`}
                  {activity.task && (
                    <span style={{ fontWeight: 600, color: "#3b82f6" }}>
                      {" "}
                      {activity.task?.title || activity.task?.task_id}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                  {formatTimeAgo(activity.created_at)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  let historyContent: React.ReactNode;
  if (loadingActivities) {
    historyContent = <Spinner animation="border" size="sm" />;
  } else if (projectActivities.length === 0) {
    historyContent = (
      <div className="text-center py-3 text-muted" style={{ fontSize: "0.875rem" }}>
        No history available
      </div>
    );
  } else {
    historyContent = (
      <div className="d-flex flex-column gap-2">
        {projectActivities.map((activity: any, idx: number) => {
          const ext = activity.extension_number || "system";
          const actionColor = getActionColor(activity.action);
          return (
            <div
              key={activity.id || `${ext}-${activity.created_at || idx}`}
              style={{
                padding: "0.75rem",
                backgroundColor: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                borderLeft: `3px solid ${actionColor}`,
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <AlertCircle size={16} style={{ color: actionColor }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                  {activity.description || `${activity.action} task`}
                </span>
              </div>
              <div style={{ fontSize: "0.875rem", color: "#475569", marginBottom: "0.25rem" }}>
                <span style={{ fontWeight: 600 }}>{activityActorDisplayName(ext)}</span>
                {activity.task && (
                  <>
                    {" "}
                    -{" "}
                    <span style={{ fontWeight: 600, color: "#3b82f6" }}>
                      {activity.task?.title || activity.task?.task_id}
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{formatDateTime(activity.created_at)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const descriptionHtml = selectedProjectDetails?.description?.trim();

  return (
    <GenericSidebar
      isOpen={show}
      onClose={onHide}
      width="470px"
      title={selectedProject.name}
      subtitle={resolvedStatus.toUpperCase()}
      avatar={{
        name: selectedProject.name,
        initials: selectedProject.name.slice(0, 1).toUpperCase(),
        gradient: selectedProject.iconColor,
      }}
      actionsDropdown={{
        label: "Actions",
        items: [
          {
            label: "Open Project",
            onClick: () => {
              globalThis.window?.open(`/planner/projects/${selectedProject.id}`, "_blank");
            },
          },
        ],
      }}
      sections={[
        {
          id: "project-overview",
          title: "Overview",
          icon: FolderOpen,
          collapsible: true,
          defaultExpanded: true,
          isLoading: loadingProjectDetails,
          fields: [
            { label: "Open Tasks", value: selectedProject.open },
            {
              label: "Overdue Tasks",
              value: loadingOverdueTasks ? "Loading..." : overdueTasks.length,
            },
            {
              label: "Owner / PM",
              value: selectedProjectDetails?.owner_extension_number
                ? getUserNameFromExtension(selectedProjectDetails.owner_extension_number)
                : selectedProject.owner,
            },
            {
              label: "Status",
              value: resolvedStatus.toUpperCase(),
              type: "badge",
              badgeVariant: getProjectStatusVariant(resolvedStatus),
            },
            {
              label: "Last Updated",
              value: lastUpdatedDisplay ?? "--",
              type: "datetime",
              icon: Calendar,
            },
          ],
        },
        {
          id: "project-progress",
          title: "Progress",
          icon: AlertCircle,
          collapsible: true,
          defaultExpanded: true,
          customContent: (
            <>
              <ProgressBar now={progressPercent} style={{ height: 10, marginBottom: "0.5rem" }} variant="primary" />
              <div style={{ fontSize: "0.875rem", color: "#64748b", textAlign: "right" }}>
                {progressPercent}% Complete
              </div>
            </>
          ),
        },
        {
          id: "project-dates",
          title: "Dates & Color",
          icon: CalendarDays,
          collapsible: true,
          defaultExpanded: true,
          fields: [
            { label: "Start Date", value: sidebarStartDate, type: "date", icon: Calendar },
            { label: "End Date", value: sidebarEndDate, type: "date", icon: CalendarDays },
            {
              label: "Color",
              type: "color",
              value: sidebarProjectColor,
              copyable: true,
            },
          ],
        },
        {
          id: "project-members",
          title: `Team Members (${projectMembers.length})`,
          icon: Users,
          collapsible: true,
          defaultExpanded: true,
          customContent: (
            <div className="d-flex flex-column gap-2">
              {projectMembers.map((member: any) => {
                const ext = member.extension_number || member.name || "";
                const key = String(
                  member?.id ?? member?.extension_number ?? member?.name ?? `${ext}-${member?.role ?? ""}`,
                );
                return (
                  <div key={key} style={{ fontSize: "0.85rem", color: "#334155" }}>
                    {member.user?.name || getUserNameFromExtension(ext)}
                    {member.role ? ` (${member.role})` : ""}
                  </div>
                );
              })}
            </div>
          ),
        },
        {
          id: "project-description",
          title: "Description",
          icon: ExternalLink,
          collapsible: true,
          defaultExpanded: true,
          customContent: descriptionHtml ? (
            <div
              className="task-description-html"
              style={{
                fontSize: "0.875rem",
                color: "#475569",
                lineHeight: 1.6,
                margin: 0,
                overflowX: "auto",
                wordBreak: "break-word",
              }}
              dangerouslySetInnerHTML={{ __html: String(descriptionHtml) }}
            />
          ) : (
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No description</span>
          ),
        },
        // {
        //   id: "project-activity",
        //   title: "Activity & History",
        //   icon: Clock,
        //   collapsible: true,
        //   defaultExpanded: true,
        //   customContent: (
        //     <>
        //       <Nav
        //         variant="tabs"
        //         className="detail-tabs"
        //         activeKey={detailTab}
        //         onSelect={(k) => {
        //           if (k) setDetailTab(k);
        //         }}
        //       >
        //         <Nav.Item>
        //           <Nav.Link eventKey="Activity">Activity</Nav.Link>
        //         </Nav.Item>
        //         <Nav.Item>
        //           <Nav.Link eventKey="History">History</Nav.Link>
        //         </Nav.Item>
        //       </Nav>
        //       <div style={{ marginTop: "1rem" }}>
        //         {detailTab === "Activity" ? recentActivityContent : historyContent}
        //       </div>
        //     </>
        //   ),
        // },
      ]}
    />
  );
};

type ProjectFormSidebarProps = {
  show: boolean;
  editingProject: Project | null;
  projectFormData: ProjectFormState;
  setProjectFormData: React.Dispatch<React.SetStateAction<ProjectFormState>>;
  submitting: boolean;
  submitButtonText: string;
  submittingButtonText: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
};

const ProjectFormSidebar: React.FC<ProjectFormSidebarProps> = ({
  show,
  editingProject,
  projectFormData,
  setProjectFormData,
  submitting,
  submitButtonText,
  submittingButtonText,
  onClose,
  onSubmit,
}) => {
  if (!show) {
    return null;
  }

  const hasName = projectFormData.name.trim() !== "";
  const hasStartDate = projectFormData.start_date.trim() !== "";
  const hasStartDateInPast =
    editingProject == null &&
    hasStartDate &&
    projectFormData.start_date.trim() < todayYmdLocal();
  const hasEndDateBeforeStart =
    projectFormData.end_date.trim() !== "" &&
    projectFormData.end_date.trim() < projectFormData.start_date.trim();
  const disableSubmit =
    submitting || !hasName || !hasStartDate || hasStartDateInPast || hasEndDateBeforeStart;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          background: "transparent",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "600px",
          height: "100vh",
          backgroundColor: "#ffffff",
          boxShadow: "-2px 0 8px rgba(0, 0, 0, 0.1)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #eaf0f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#141414",
              margin: 0,
            }}
          >
            {editingProject ? "Edit Project" : "Create New Project"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "#718096",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={24} />
          </button>
        </div>

        <Form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "40px",
            }}
          >
            <Form.Group style={{ marginBottom: "20px" }}>
              <Form.Label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#141414",
                  marginBottom: "8px",
                }}
              >
                Project Name <span style={{ color: "#f2545b" }}>*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={projectFormData.name}
                maxLength={PROJECT_NAME_MAX_LENGTH}
                onChange={(e) =>
                  setProjectFormData((prev) => ({
                    ...prev,
                    name: e.target.value.slice(0, PROJECT_NAME_MAX_LENGTH),
                  }))
                }
                placeholder="Enter project name"
                required
                style={{
                  padding: "10px 12px",
                  border: "1px solid #8a8a8a",
                  borderRadius: "4px",
                  fontSize: "14px",
                  minHeight: 40,
                }}
              />
              <div className="d-flex justify-content-between align-items-baseline gap-2 mt-1">
                <Form.Text className="text-muted mb-0">
                  Maximum {PROJECT_NAME_MAX_LENGTH} characters.
                </Form.Text>
                <Form.Text className="text-muted mb-0 small text-nowrap" aria-live="polite">
                  {projectFormData.name.length}/{PROJECT_NAME_MAX_LENGTH}
                </Form.Text>
              </div>
            </Form.Group>

            <Form.Group style={{ marginBottom: "20px" }}>
              <Form.Label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#141414",
                  marginBottom: "8px",
                }}
              >
                Description
              </Form.Label>
              <RichTextEditor
                buttonSize="sm"
                value={projectFormData.description || ""}
                onChange={(html) =>
                  setProjectFormData((prev) => ({ ...prev, description: html }))
                }
                placeholder="Enter project description"
                minHeight="100px"
                maxHeight="220px"
                maxLength={5000}
              />
            </Form.Group>

            <Row className="g-2" style={{ marginBottom: "20px" }}>
              <Col md={6}>
                <Form.Group>
                  <Form.Label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#141414",
                      marginBottom: "8px",
                    }}
                  >
                    Start date <span style={{ color: "#f2545b" }}>*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    required
                    min={editingProject == null ? todayYmdLocal() : undefined}
                    value={projectFormData.start_date}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const today = todayYmdLocal();
                      if (editingProject == null && newStart && newStart < today) {
                        toast.error("Start date cannot be in the past");
                        return;
                      }
                      setProjectFormData((prev) => {
                        let nextEnd = prev.end_date;
                        if (newStart && nextEnd && nextEnd < newStart) {
                          nextEnd = newStart;
                        }
                        return { ...prev, start_date: newStart, end_date: nextEnd };
                      });
                    }}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #8a8a8a",
                      borderRadius: "4px",
                      fontSize: "14px",
                      minHeight: 40,
                    }}
                  />
                  {editingProject == null ? (
                    <Form.Text className="text-muted">Start date must be today or a future date.</Form.Text>
                  ) : null}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#141414",
                      marginBottom: "8px",
                    }}
                  >
                    End date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    min={projectFormData.start_date || todayYmdLocal()}
                    value={projectFormData.end_date}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProjectFormData((prev) => {
                        if (v && prev.start_date && v < prev.start_date) {
                          toast.error("End date cannot be before start date");
                          return prev;
                        }
                        return { ...prev, end_date: v };
                      });
                    }}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid #8a8a8a",
                      borderRadius: "4px",
                      fontSize: "14px",
                      minHeight: 40,
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group style={{ marginBottom: "20px" }}>
              <Form.Label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#141414",
                  marginBottom: "8px",
                }}
              >
                Status
              </Form.Label>
              <Form.Select
                value={projectFormData.status}
                onChange={(e) =>
                  setProjectFormData({
                    ...projectFormData,
                    status: e.target.value as ProjectFormStatus,
                  })
                }
                style={{
                  padding: "10px 12px",
                  border: "1px solid #8a8a8a",
                  borderRadius: "4px",
                  fontSize: "14px",
                  minHeight: 40,
                }}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group style={{ marginBottom: "20px" }}>
              <Form.Label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#141414",
                  marginBottom: "8px",
                }}
              >
                Color
              </Form.Label>
              <div className="d-flex align-items-center gap-3">
                <Form.Control
                  type="color"
                  value={projectFormData.color}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, color: e.target.value })
                  }
                  style={{ width: 80, height: 40, padding: 4 }}
                />
                <Form.Control
                  type="text"
                  value={projectFormData.color}
                  onChange={(e) =>
                    setProjectFormData({ ...projectFormData, color: e.target.value })
                  }
                  placeholder="#3b82f6"
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: "1px solid #8a8a8a",
                    borderRadius: "4px",
                    fontSize: "14px",
                    minHeight: 40,
                  }}
                />
              </div>
            </Form.Group>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #eaf0f6",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-start",
            }}
          >
            <button
              type="submit"
              disabled={disableSubmit}
              style={{
                padding: "10px 20px",
                backgroundColor: disableSubmit ? "#cbd5e0" : "#0091ae",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: disableSubmit ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  {submittingButtonText}
                </>
              ) : (
                submitButtonText
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "#141414",
                border: "1px solid #8a8a8a",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>
    </>
  );
};

// ============================================================
// MAIN PAGE COMPONENT
// (mostly unchanged from original — search for "CHANGED" comments)
// ============================================================

type AppliedProjectFilters = {
  search: string;
  status: ProjectStatusFilter;
  /** Selected owner / PM extension numbers; empty means no filter (all owners). */
  ownerExtensionNumbers: string[];
  team: string;
  startDateFrom: string;
  endDateTo: string;
};

/** Optional `page` avoids stale `pagination` when resetting to page 1 in the same tick as `fetchProjects`. */
type ProjectListFetchParams = Partial<AppliedProjectFilters> & { page?: number };

type ProjectPaginationState = {
  page: number;
  limit: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type ProjectStatsState = {
  activeProjects: number;
  totalProjects: number;
  tasksDueThisWeek: number;
  overdueAcrossProjects: number;
};

type LoadProjectsFromApiArgs = {
  filters?: ProjectListFetchParams;
  pagination: Pick<ProjectPaginationState, "page" | "limit">;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setPagination: React.Dispatch<React.SetStateAction<ProjectPaginationState>>;
  setStats: React.Dispatch<React.SetStateAction<ProjectStatsState>>;
};

async function loadProjectsFromApi({
  filters,
  pagination,
  setLoading,
  setProjects,
  setPagination,
  setStats,
}: LoadProjectsFromApiArgs): Promise<void> {
  try {
    setLoading(true);
    const pageForRequest = typeof filters?.page === "number" ? filters.page : pagination.page;
    const statusParam = filters?.status && filters.status !== "all" ? filters.status : undefined;
    const extensionNumbers =
      filters?.ownerExtensionNumbers && filters.ownerExtensionNumbers.length > 0
        ? filters.ownerExtensionNumbers.map((ext) => String(ext).trim()).filter(Boolean)
        : undefined;
    let startFrom = filters?.startDateFrom?.trim() || undefined;
    let endTo = filters?.endDateTo?.trim() || undefined;
    if (startFrom && endTo && endTo < startFrom) {
      endTo = startFrom;
    }

    const response = await listProjects({
      page: pageForRequest,
      limit: pagination.limit,
      search: filters?.search || "",
      status: statusParam,
      extension_numbers: extensionNumbers,
      start_date_from: startFrom,
      end_date_to: endTo,
    });

    if (response?.success === true && Array.isArray(response.data)) {
      setProjects(response.data.map((p: ApiProject) => mapApiProjectToProject(p)));
      if (response.pagination) {
        setPagination((prev) => ({ ...prev, ...response.pagination }));
      }
      const summary = response.summary;
      if (summary) {
        setStats({
          activeProjects: summary.active ?? 0,
          totalProjects: summary.total ?? 0,
          tasksDueThisWeek: summary.task_due_this_week ?? 0,
          overdueAcrossProjects: summary.overdue_tasks ?? 0,
        });
      }
    } else {
      setProjects([]);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    setProjects([]);
  } finally {
    setLoading(false);
  }
}

type LoadProjectSidebarDataArgs = {
  project: Project;
  setSelectedProject: React.Dispatch<React.SetStateAction<Project | null>>;
  setShowProjectDetail: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingProjectDetails: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingActivities: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingOverdueTasks: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedProjectDetails: React.Dispatch<React.SetStateAction<ApiProject | null>>;
  setProjectActivities: React.Dispatch<React.SetStateAction<any[]>>;
  setOverdueTasks: React.Dispatch<React.SetStateAction<any[]>>;
};

async function loadProjectSidebarData({
  project,
  setSelectedProject,
  setShowProjectDetail,
  setLoadingProjectDetails,
  setLoadingActivities,
  setLoadingOverdueTasks,
  setSelectedProjectDetails,
  setProjectActivities,
  setOverdueTasks,
}: LoadProjectSidebarDataArgs): Promise<void> {
  setSelectedProject(project);
  setShowProjectDetail(true);
  setLoadingProjectDetails(true);
  setLoadingOverdueTasks(true);

  try {
    const withRelations = ["members.user", "tasks", "tasks.assignees", "tasks.labels", "tasks.status", "statuses", "owner"];
    const [projectDetails, activities, overdue] = await Promise.all([
      getProject(project.id, withRelations),
      getRecentActivity(Number(project.id)),
      getOverdueTasks(Number(project.id)),
    ]);
    setSelectedProjectDetails(projectDetails || project.apiData || null);
    setProjectActivities(Array.isArray(activities) ? activities : []);
    setOverdueTasks(Array.isArray(overdue) ? overdue : []);
  } catch (error) {
    console.error("Error fetching project details:", error);
    setSelectedProjectDetails(project.apiData || null);
    setProjectActivities([]);
    setOverdueTasks([]);
  } finally {
    setLoadingProjectDetails(false);
    setLoadingActivities(false);
    setLoadingOverdueTasks(false);
  }
}

type SubmitPlannerProjectParams = {
  editingProject: Project | null;
  projectFormData: ProjectFormState;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  appliedFilters: AppliedProjectFilters;
  fetchProjects: (filters?: ProjectListFetchParams) => Promise<void>;
  resetProjectModalState: () => void;
};

type ConfirmDeleteProjectParams = {
  projectToDelete: Project | null;
  setDeleting: React.Dispatch<React.SetStateAction<boolean>>;
  fetchProjects: (filters?: ProjectListFetchParams) => Promise<void>;
  appliedFilters: AppliedProjectFilters;
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  setProjectToDelete: React.Dispatch<React.SetStateAction<Project | null>>;
};

type ApplyProjectTabChangeArgs = {
  tabId: string;
  searchTerm: string;
  filterOwnerExtensions: string[];
  filterTeam: string;
  filterStartDateFrom: string;
  filterEndDateTo: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setFilterStatus: React.Dispatch<React.SetStateAction<ProjectStatusFilter>>;
  setPagination: React.Dispatch<React.SetStateAction<ProjectPaginationState>>;
  setAppliedFilters: React.Dispatch<React.SetStateAction<AppliedProjectFilters>>;
  fetchProjects: (filters?: ProjectListFetchParams) => Promise<void>;
};

async function applyProjectTabChangeAndRefetch({
  tabId,
  searchTerm,
  filterOwnerExtensions,
  filterTeam,
  filterStartDateFrom,
  filterEndDateTo,
  setActiveTab,
  setFilterStatus,
  setPagination,
  setAppliedFilters,
  fetchProjects,
}: ApplyProjectTabChangeArgs): Promise<void> {
  setActiveTab(tabId);
  const statusMap: Record<string, ProjectStatusFilter> = {
    all: "all",
    active: "active",
    completed: "completed",
    archived: "archived",
  };
  const status = statusMap[tabId];
  if (status == null) {
    return;
  }

  setFilterStatus(status);
  setPagination((prev) => ({ ...prev, page: 1 }));
  const next: AppliedProjectFilters = {
    search: searchTerm,
    status,
    ownerExtensionNumbers: filterOwnerExtensions,
    team: filterTeam,
    startDateFrom: filterStartDateFrom,
    endDateTo: filterEndDateTo,
  };
  setAppliedFilters(next);
  await fetchProjects({ ...next, page: 1 });
}

function clampProjectDateRangeOnStartChange(value: string, prevEnd: string): string {
  if (value && prevEnd && prevEnd < value) {
    return value;
  }
  return prevEnd;
}

function normalizeProjectEndDateByStart(value: string, start: string): string {
  if (value && start && value < start) {
    return start;
  }
  return value;
}

function getProjectDateRangePillLabel(fromRaw: string, toRaw: string): string | undefined {
  const from = fromRaw.trim();
  const to = toRaw.trim();
  if (from === "" && to === "") {
    return undefined;
  }
  if (from !== "" && to !== "") {
    return `${from} → ${to}`;
  }
  if (from !== "") {
    return `From ${from}`;
  }
  return `To ${to}`;
}

async function confirmDeleteProjectAndRefresh({
  projectToDelete,
  setDeleting,
  fetchProjects,
  appliedFilters,
  setShowDeleteModal,
  setProjectToDelete,
}: ConfirmDeleteProjectParams): Promise<void> {
  if (projectToDelete == null) {
    return;
  }

  try {
    setDeleting(true);
    const result = await deleteProject(projectToDelete.id);
    if (result) {
      await fetchProjects(appliedFilters);
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  } catch (error) {
    console.error("Error deleting project:", error);
  } finally {
    setDeleting(false);
  }
}

async function submitPlannerProjectForm({
  editingProject,
  projectFormData,
  setSubmitting,
  appliedFilters,
  fetchProjects,
  resetProjectModalState,
}: SubmitPlannerProjectParams): Promise<void> {
  const start = projectFormData.start_date.trim();
  const end = projectFormData.end_date.trim();
  if (start === "") {
    toast.error("Start date is required");
    return;
  }
  if (editingProject == null && start < todayYmdLocal()) {
    toast.error("Start date cannot be in the past");
    return;
  }
  if (end !== "" && end < start) {
    toast.error("End date cannot be before start date");
    return;
  }

  try {
    setSubmitting(true);
    const projectData: Parameters<typeof createProject>[0] = {
      name: projectFormData.name.trim().slice(0, PROJECT_NAME_MAX_LENGTH),
      description: projectFormData.description.trim() || undefined,
      color: projectFormData.color,
      status: projectFormData.status,
      timezone: projectFormData.timezone,
      start_date: start,
    };
    if (end !== "") {
      projectData.end_date = end;
    }

    const result = editingProject
      ? await updateProject(editingProject.id, projectData)
      : await createProject(projectData);

    if (result) {
      await fetchProjects(appliedFilters);
      resetProjectModalState();
    }
  } catch (error) {
    console.error("Error saving project:", error);
  } finally {
    setSubmitting(false);
  }
}

function projectMatchesFilters(project: Project, appliedFilters: AppliedProjectFilters): boolean {
  const matchesSearch =
    project.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
    project.id.toLowerCase().includes(appliedFilters.search.toLowerCase());
  const projectStatusKey = String(project.apiData?.status || project.status || "").toLowerCase();
  const matchesStatus = appliedFilters.status === "all" || projectStatusKey === appliedFilters.status;
  const projectOwnerExt = project.apiData?.owner_extension_number || project.owner;
  const matchesOwner =
    appliedFilters.ownerExtensionNumbers.length === 0 ||
    appliedFilters.ownerExtensionNumbers.some((ext) => String(projectOwnerExt || "") === String(ext));
  const projectMembers = (project.apiData?.members || project.members || []) as any[];
  const matchesTeam =
    appliedFilters.team === "All Teams" ||
    projectMembers.some((m: any) => String(m?.extension_number || m?.name || "") === String(appliedFilters.team));
  return matchesSearch && matchesStatus && matchesOwner && matchesTeam;
}

const WorkPlannerProjects = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  const sessionPlannerProjectCrud = useMemo(
    () => ({
      canCreate: hasAnyPermission([
        PERMISSIONS.CREATE_PROJECTS_WORK_PLANNER,
        PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER,
      ]),
      canUpdate: hasAnyPermission([
        PERMISSIONS.UPDATE_PROJECTS_WORK_PLANNER,
        PERMISSIONS.EDIT_TASKS_WORK_PLANNER,
      ]),
      canDelete: hasAnyPermission([
        PERMISSIONS.DELETE_PROJECTS_WORK_PLANNER,
        PERMISSIONS.EDIT_TASKS_WORK_PLANNER,
      ]),
    }),
    [hasAnyPermission],
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectFormData, setProjectFormData] = useState<ProjectFormState>(() => createEmptyProjectForm());
  const [stats, setStats] = useState<ProjectStatsState>({ activeProjects: 0, totalProjects: 0, tasksDueThisWeek: 0, overdueAcrossProjects: 0 });
  const [pagination, setPagination] = useState<ProjectPaginationState>({ page: 1, limit: 15, total: 0, last_page: 1, from: 0, to: 0 });
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatusFilter>("all");
  const [filterOwnerExtensions, setFilterOwnerExtensions] = useState<string[]>([]);
  const [filterTeam, setFilterTeam] = useState("All Teams");
  const [filterStartDateFrom, setFilterStartDateFrom] = useState("");
  const [filterEndDateTo, setFilterEndDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedProjectFilters>({
    search: "",
    status: "all",
    ownerExtensionNumbers: [],
    team: "All Teams",
    startDateFrom: "",
    endDateTo: "",
  });
  const [customTabs] = useState<TabConfig[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState<ApiProject | null>(null);
  const [loadingProjectDetails, setLoadingProjectDetails] = useState(false);
  const [projectActivities, setProjectActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [loadingOverdueTasks, setLoadingOverdueTasks] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [detailTab, setDetailTab] = useState("Activity");

  const resetProjectModalState = useCallback(() => {
    setShowProjectModal(false);
    setEditingProject(null);
    setProjectFormData(createEmptyProjectForm());
  }, []);

  const fetchProjects = useCallback(
    async (filters?: ProjectListFetchParams) => {
      await loadProjectsFromApi({
        filters,
        pagination,
        setLoading,
        setProjects,
        setPagination,
        setStats,
      });
    },
    [pagination.page, pagination.limit],
  );

  useEffect(() => {
    if (!hierarchyLoading) {
      fetchProjects({
        search: searchTerm,
        status: filterStatus,
        ownerExtensionNumbers: filterOwnerExtensions,
        startDateFrom: filterStartDateFrom,
        endDateTo: filterEndDateTo,
      });
    }
  }, [pagination.page, pagination.limit, hierarchyLoading, fetchProjects]);

  const handleCreateProject = () => {
    if (!sessionPlannerProjectCrud.canCreate) {
      toast.error("You are not authorized to create projects");
      return;
    }
    setEditingProject(null);
    setProjectFormData(createEmptyProjectForm());
    setShowProjectModal(true);
  };

  const handleEditProject = (project: Project) => {
    if (!sessionPlannerProjectCrud.canUpdate) {
      toast.error("You are not authorized to update projects");
      return;
    }
    setEditingProject(project);
    const api = project.apiData;
    setProjectFormData({
      name: project.name.slice(0, PROJECT_NAME_MAX_LENGTH),
      description: api?.description || "",
      start_date: formatApiDateForProjectInput(api?.start_date ?? undefined),
      end_date: formatApiDateForProjectInput(api?.end_date ?? undefined),
      color: project.iconColor,
      status: apiStatusToProjectFormStatus(api?.status),
      timezone:
        typeof api?.timezone === "string" && api.timezone.trim() !== ""
          ? api.timezone
          : getAutoTimezone(),
    });
    setShowProjectModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    if (!sessionPlannerProjectCrud.canDelete) {
      toast.error("You are not authorized to delete projects");
      return;
    }
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!sessionPlannerProjectCrud.canDelete) {
      toast.error("You are not authorized to delete projects");
      return;
    }
    await confirmDeleteProjectAndRefresh({
      projectToDelete,
      setDeleting,
      fetchProjects,
      appliedFilters,
      setShowDeleteModal,
      setProjectToDelete,
    });
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject && !sessionPlannerProjectCrud.canUpdate) {
      toast.error("You are not authorized to update projects");
      return;
    }
    if (!editingProject && !sessionPlannerProjectCrud.canCreate) {
      toast.error("You are not authorized to create projects");
      return;
    }
    await submitPlannerProjectForm({
      editingProject,
      projectFormData,
      setSubmitting,
      appliedFilters,
      fetchProjects,
      resetProjectModalState,
    });
  };

  const handleProjectClick = async (project: Project) => {
    await loadProjectSidebarData({
      project,
      setSelectedProject,
      setShowProjectDetail,
      setLoadingProjectDetails,
      setLoadingActivities,
      setLoadingOverdueTasks,
      setSelectedProjectDetails,
      setProjectActivities,
      setOverdueTasks,
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return formatDateGlobal(dateString);
  };

  const formatDateTime = (dateString: string) => formatDateTimeGlobal(dateString);

  const getUserNameFromExtension = (extensionNumber: string): string => {
    if (!extensionNumber || !hierarchyDataExtensions || hierarchyDataExtensions.length === 0) return extensionNumber || "Unknown";
    const extension = (hierarchyDataExtensions as any[]).find(
      (ext: any) => ext.extension_number === extensionNumber || ext.id === extensionNumber || String(ext.id) === String(extensionNumber)
    );
    return extension?.user?.name || extension?.name || extensionNumber || "Unknown";
  };

  const getInitials = (extensionNumber: string) => {
    if (!extensionNumber || extensionNumber === "system") return "SY";
    const userName = getUserNameFromExtension(extensionNumber);
    if (userName !== extensionNumber && userName !== "Unknown") {
      return userName.split(" ").map((n: string) => n[0]).join("").substring(0, 1).toUpperCase();
    }
    return extensionNumber.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (extensionNumber: string, index: number) => {
    const colors = ["#667eea", "#f56565", "#48bb78", "#ed64a6", "#4299e1", "#9f7aea", "#fc8181", "#f59e0b"];
    if (extensionNumber === "system") return "#6b7280";
    return colors[index % colors.length];
  };

  const getActionColor = (action: string) => {
    const map: Record<string, string> = { status_changed: "#3b82f6", updated: "#f59e0b", created: "#10b981", completed: "#10b981", deleted: "#ef4444" };
    return map[action] || "#6b7280";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveTab("all");
    setFilterStatus("all");
    setFilterOwnerExtensions([]);
    setFilterTeam("All Teams");
    setFilterStartDateFrom("");
    setFilterEndDateTo("");
    const cleared: AppliedProjectFilters = {
      search: "",
      status: "all",
      ownerExtensionNumbers: [],
      team: "All Teams",
      startDateFrom: "",
      endDateTo: "",
    };
    setAppliedFilters(cleared);
    fetchProjects({ ...cleared, page: 1 });
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status: filterStatus,
      ownerExtensionNumbers: filterOwnerExtensions,
      team: filterTeam,
      startDateFrom: filterStartDateFrom,
      endDateTo: filterEndDateTo,
    };
    setAppliedFilters(next);
    fetchProjects({ ...next, page: 1 });
  };

  const applyProjectStatusFromPill = (status: ProjectStatusFilter) => {
    setFilterStatus(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status,
      ownerExtensionNumbers: filterOwnerExtensions,
      team: filterTeam,
      startDateFrom: filterStartDateFrom,
      endDateTo: filterEndDateTo,
    };
    setAppliedFilters(next);
    fetchProjects({ ...next, page: 1 });
  };

  const clearDateFiltersAndRefetch = () => {
    setFilterStartDateFrom("");
    setFilterEndDateTo("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status: filterStatus,
      ownerExtensionNumbers: filterOwnerExtensions,
      team: filterTeam,
      startDateFrom: "",
      endDateTo: "",
    };
    setAppliedFilters(next);
    fetchProjects({ ...next, page: 1 });
  };

  const handleProjectStartDateChange = (value = "") => {
    setFilterStartDateFrom(value);
    setFilterEndDateTo((prevEnd) => {
      return clampProjectDateRangeOnStartChange(value, prevEnd);
    });
  };

  const handleProjectEndDateChange = (value = "") => {
    const start = filterStartDateFrom.trim();
    setFilterEndDateTo(normalizeProjectEndDateByStart(value, start));
  };

  const dateRangePillActiveLabel = (): string | undefined => {
    return getProjectDateRangePillLabel(filterStartDateFrom, filterEndDateTo);
  };

  const handleTabChange = (tabId: string) => {
    void applyProjectTabChangeAndRefetch({
      tabId,
      searchTerm,
      filterOwnerExtensions,
      filterTeam,
      filterStartDateFrom,
      filterEndDateTo,
      setActiveTab,
      setFilterStatus,
      setPagination,
      setAppliedFilters,
      fetchProjects,
    });
  };

  const filteredProjects = projects.filter((project) => projectMatchesFilters(project, appliedFilters));

  const userOptions = (() => {
    const list = (hierarchyDataExtensions as any[]) || [];
    const seen = new Set<string>();
    return list
      .map((ext: any) => ({ value: String(ext?.extension_number || ext?.id || "").trim(), label: String(ext?.user?.name || ext?.name || "").trim() }))
      .filter((o) => o.value && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const clearOwnerFilterAndRefetch = () => {
    setFilterOwnerExtensions([]);
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status: filterStatus,
      ownerExtensionNumbers: [],
      team: filterTeam,
      startDateFrom: filterStartDateFrom,
      endDateTo: filterEndDateTo,
    };
    setAppliedFilters(next);
    fetchProjects({ ...next, page: 1 });
  };

  const applyOwnerExtensionsAndRefetch = (extensions: string[]) => {
    const trimmed = extensions.map((ext) => String(ext).trim()).filter((ext) => ext.length > 0);
    setFilterOwnerExtensions(trimmed);
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status: filterStatus,
      ownerExtensionNumbers: trimmed,
      team: filterTeam,
      startDateFrom: filterStartDateFrom,
      endDateTo: filterEndDateTo,
    };
    setAppliedFilters(next);
    fetchProjects({ ...next, page: 1 });
  };

  const applyOwnerExtensionsRef = useRef(applyOwnerExtensionsAndRefetch);
  applyOwnerExtensionsRef.current = applyOwnerExtensionsAndRefetch;
  const clearOwnerFilterRef = useRef(clearOwnerFilterAndRefetch);
  clearOwnerFilterRef.current = clearOwnerFilterAndRefetch;

 

  const statuses: Array<{ value: ProjectStatusFilter; label: string }> = [
    { value: "all", label: "All Status" },
    { value: "active", label: "active" },
    { value: "archived", label: "archived" },
    { value: "completed", label: "completed" },
  ];

  const filterFields: FilterField[] = [
    { id: "search", label: "Search", type: "text", value: searchTerm, onChange: (v: string) => setSearchTerm(v ?? ""), placeholder: "Search projects..." },
    { id: "status", label: "Status", type: "dropdown", value: filterStatus, onChange: (v) => setFilterStatus(coerceProjectStatusFilter(v)), options: statuses },
    {
      id: "owner",
      label: "Owner / PM",
      type: "multi-select",
      value: filterOwnerExtensions.map((ext) => ({
        value: ext,
        label: getUserNameFromExtension(ext) || ext,
      })),
      onChange: (selected: unknown) => {
        if (!selected || !Array.isArray(selected)) {
          setFilterOwnerExtensions([]);
          return;
        }
        setFilterOwnerExtensions(
          (selected as FilterOption[]).map((o) => String(o.value)).filter((v) => v.length > 0),
        );
      },
      options: userOptions,
      placeholder: "Select users (by extension)",
      isClearable: true,
    },
    {
      id: "start_date_from",
      label: "Start date (from)",
      type: "date",
      value: filterStartDateFrom,
      onChange: (v: string | null) => handleProjectStartDateChange(v ?? ""),
      placeholder: "YYYY-MM-DD",
      max: filterEndDateTo || undefined,
    },
    {
      id: "end_date_to",
      label: "End date (to)",
      type: "date",
      value: filterEndDateTo,
      onChange: (v: string | null) => handleProjectEndDateChange(v ?? ""),
      placeholder: "YYYY-MM-DD",
      min: filterStartDateFrom || undefined,
    },
  ];

  const statsCardsData: StatsCardData[] = [
    { title: "Active Projects", value: stats.activeProjects, icon: FolderOpen, iconColor: "#0ea5e9", iconBgColor: "#e0f2fe" },
    { title: "Total Projects", value: stats.totalProjects, icon: Folder, iconColor: "#3b82f6", iconBgColor: "#dbeafe" },
    { title: "Tasks Due This Week", value: stats.tasksDueThisWeek, icon: CalendarDays, iconColor: "#3b82f6", iconBgColor: "#eff6ff" },
    { title: "Overdue Across Projects", value: stats.overdueAcrossProjects, icon: AlertCircle, iconColor: "#ef4444", iconBgColor: "#fef2f2" },
  ];

  const tabsConfig: TabConfig[] = [
    { id: "all", label: "All Projects", count: stats.totalProjects, removable: false },
    { id: "active", label: "Active", count: stats.activeProjects, removable: false },
    ...customTabs,
  ];

  const filterPills: FilterPill[] = [
    {
      id: "status",
      label: "Status",
      active: isProjectStatusFilterActive(filterStatus),
      activeLabel: isProjectStatusFilterActive(filterStatus) ? filterStatus : undefined,
      showDropdown: true,
      dropdownOptions: [
        { label: "All Status", value: "all", onClick: () => applyProjectStatusFromPill("all") },
        { label: "Active", value: "active", onClick: () => applyProjectStatusFromPill("active") },
        { label: "Archived", value: "archived", onClick: () => applyProjectStatusFromPill("archived") },
        { label: "Completed", value: "completed", onClick: () => applyProjectStatusFromPill("completed") },
      ],
      onClear: () => applyProjectStatusFromPill("all"),
    },
    // {
    //   id: "owner",
    //   label: "Owner / PM",
    //   active: filterOwnerExtensions.length > 0,
    //   activeLabel: ownerFilterPillActiveLabel,
    //   showDropdown: true,
    //   searchable: true,
    //   dropdownOptions: ownerFilterPillOptions,
    //   onClear: filterOwnerExtensions.length > 0 ? () => clearOwnerFilterRef.current() : undefined,
    // },
    {
      id: "date_range",
      label: "Dates",
      active: Boolean(filterStartDateFrom.trim() || filterEndDateTo.trim()),
      activeLabel: dateRangePillActiveLabel(),
      showDropdown: true,
      dropdownContent: (
        <div className="d-flex flex-column gap-2" style={{ minWidth: 240 }}>
          <Form.Group className="mb-0">
            <Form.Label className="small text-muted mb-1">Start date (from)</Form.Label>
            <Form.Control
              type="date"
              value={filterStartDateFrom}
              max={filterEndDateTo || undefined}
              onChange={(e) => handleProjectStartDateChange(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-0">
            <Form.Label className="small text-muted mb-1">End date (to)</Form.Label>
            <Form.Control
              type="date"
              value={filterEndDateTo}
              min={filterStartDateFrom || undefined}
              onChange={(e) => handleProjectEndDateChange(e.target.value)}
            />
          </Form.Group>
          <Button variant="dark" size="sm" className="align-self-stretch" onClick={() => handleApplyFilters()}>
            Apply dates
          </Button>
        </div>
      ),
      onClear: () => clearDateFiltersAndRefetch(),
    },
  ];

  const toolbarConfig: ToolbarConfig = {
    showTabs: true,
    tabs: tabsConfig,
    activeTab: activeTab,
    onTabChange: handleTabChange,
    showSearch: true,
    searchValue: searchTerm,
    searchPlaceholder: "Search projects...",
    onSearchChange: setSearchTerm,
    onSearch: () => handleApplyFilters(),
    showFilterPills: true,
    filterPills: filterPills,
    showFiltersButton: true,
    showMoreFiltersButton: false,
    onFiltersClick: () => setShowFilterSidebar(true),
    rightActions: (
      <button
        style={{
          cursor: "pointer",
          transition: "150ms ease-out",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          borderRadius: "4px",
          border: "1px solid rgb(20, 20, 20)",
          padding: "8px 16px",
          fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
          fontSize: "12px",
          fontWeight: 300,
          lineHeight: "14px",
          backgroundColor: "rgb(20, 20, 20)",
          color: "#ffffff",
          position: "absolute",
          right: "35px",
          top: "21px",
        }}
        onClick={handleCreateProject}
      >
        <Plus size={18} />
        <span>Create Project</span>
      </button>
    ),
  };

  const handleCloseFilterSidebar = () => setShowFilterSidebar(false);
  const handleApplyFiltersAndClose = () => {
    handleApplyFilters();
    setShowFilterSidebar(false);
  };

  const submitButtonText = editingProject ? "Update Project" : "Create Project";
  const submittingButtonText = editingProject ? "Updating..." : "Creating...";

  // Columns definition (used only for toolbar column customization; actual rendering done by ExpandableProjectTable)
  const projectTableColumns: TableColumn<Project>[] = [
    { key: "name", label: "Project Name", sortable: true, accessor: (row) => row.name },
    { key: "members", label: "Members", sortable: true, accessor: (row) => row.members?.length ?? 0 },
    { key: "open", label: "Open", sortable: true, accessor: (row) => row.open },
    { key: "overdue", label: "Overdue", sortable: true, accessor: (row) => row.overdue },
    { key: "lastUpdate", label: "Last Update", sortable: true, accessor: (row) => row.lastUpdate },
  ];

  const projectTableActions: TableAction<Project>[] = [
    {
      label: "Actions",
      icon: <MoreVertical size={16} />,
      dropdown: {
        options: [
          {
            label: "Project overview",
            icon: <Eye size={14} />,
            onClick: (row) => {
              router.push(`/planner/projects/${row.id}`).catch(() => undefined);
            },
          },
          {
            label: "Edit Project",
            icon: <Settings size={14} />,
            onClick: (row) => {
              if (!canAdministerProjectFromMembers(row, sessionUserPhoneOrExtension)) return;
              handleEditProject(row);
            },
            divider: true,
          },
          {
            label: "Delete Project",
            icon: <Trash2 size={14} />,
            onClick: (row) => {
              if (!canAdministerProjectFromMembers(row, sessionUserPhoneOrExtension)) return;
              handleDeleteProject(row);
            },
            className: "text-danger",
            divider: true,
          },
        ],
        align: "end",
      },
    },
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects" />

      <>
        <style>{`
          .header-section { background-color: white; padding: 1.5rem 0; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .nav-tabs { border: none; }
          .nav-tabs .nav-link { color: #64748b; border: none; border-bottom: 3px solid transparent; padding: .75rem 1.5rem; font-weight: 500; background: transparent; }
          .nav-tabs .nav-link.active { color: #3b82f6; background: transparent; border-bottom: 3px solid #3b82f6; }
          .project-name { font-weight: 600; color: #334155; display: flex; align-items: center; gap: .75rem; }
          .project-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0; }
          .member-avatar { width: 32px; height: 32px; border-radius: 50%; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: .75rem; font-weight: 600; margin-right: -8px; border: 2px solid white; position: relative; }
          .overdue-count { color: #ef4444; font-weight: 600; }
          .project-detail-panel { width: 750px !important; max-width: 750px !important; }
          .project-detail-panel .offcanvas-header { padding: 16px 20px !important; border-bottom: 1px solid #eaf0f6 !important; background-color: #ffffff !important; }
          .project-detail-panel .offcanvas-body { padding: 20px !important; padding-right: 10px !important; background-color: #ffffff !important; }
          .project-detail-panel .offcanvas-title { font-size: 22px !important; font-weight: 500 !important; color: #141414 !important; }
          .detail-section { margin-bottom: 16px; padding: 16px; background-color: #ffffff; border-radius: 5px; border: 1px solid #eaf0f6; }
          .detail-label { font-size: 13px; color: #666; margin-bottom: 8px; font-weight: 400; }
          .detail-tabs { border-bottom: 1px solid #eaf0f6; margin: 20px -20px 20px -20px; padding: 0 20px; }
          .detail-tabs .nav-link { color: #718096; border: none; border-bottom: 2px solid transparent; padding: 12px 16px; font-weight: 500; font-size: 14px; background: transparent; margin-bottom: -1px; }
          .detail-tabs .nav-link.active { color: #141414; background: transparent; border-bottom: 2px solid #0091ae; }
          .table-responsive .table th:last-child, .table-responsive .table td:last-child { min-width: initial !important; }
          .table-responsive .table th:first-child, .table-responsive .table td:first-child { min-width: initial !important; max-width: initial !important; }
        `}</style>

        <div className="project-dashboard">
          <Container fluid>
            <GenericFilterSidebar
              isOpen={showFilterSidebar}
              onClose={handleCloseFilterSidebar}
              title="Filters"
              subtitle="Filter and refine projects"
              filters={filterFields}
              onApply={handleApplyFiltersAndClose}
              onReset={clearFilters}
              width="400px"
              showApplyButton
              showResetButton
            />

            <div style={{ display: "flex", alignItems: "stretch", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* CHANGED: Replaced GenericTable with ExpandableProjectTable */}
                <ExpandableProjectTable
                  projects={filteredProjects}
                  loading={loading}
                  extensions={(hierarchyDataExtensions as any[]) || []}
                  sessionPlannerProjectCrud={sessionPlannerProjectCrud}
                  sessionUserPhoneOrExtension={sessionUserPhoneOrExtension}
                  onProjectClick={handleProjectClick}
                  onEditProject={handleEditProject}
                  onDeleteProject={handleDeleteProject}
                  pagination={pagination}
                  onPaginationChange={(page, rowsPerPage) => setPagination((prev) => ({ ...prev, page, limit: rowsPerPage }))}
                  toolbarConfig={toolbarConfig}
                  statsCards={statsCardsData}
                  columns={projectTableColumns}
                  actions={projectTableActions}
                />
              </div>

              <ProjectDetailOffcanvas
                show={showProjectDetail}
                onHide={() => setShowProjectDetail(false)}
                selectedProject={selectedProject}
                selectedProjectDetails={selectedProjectDetails}
                loadingProjectDetails={loadingProjectDetails}
                loadingOverdueTasks={loadingOverdueTasks}
                overdueTasks={overdueTasks}
                detailTab={detailTab}
                setDetailTab={setDetailTab}
                loadingActivities={loadingActivities}
                projectActivities={projectActivities}
                getUserNameFromExtension={getUserNameFromExtension}
                getAvatarColor={getAvatarColor}
                getInitials={getInitials}
                getActionColor={getActionColor}
                formatTimeAgo={formatTimeAgo}
                formatDateTime={formatDateTime}
              />
            </div>
          </Container>
        </div>

        <ProjectFormSidebar
          show={showProjectModal}
          editingProject={editingProject}
          projectFormData={projectFormData}
          setProjectFormData={setProjectFormData}
          submitting={submitting}
          submitButtonText={submitButtonText}
          submittingButtonText={submittingButtonText}
          onClose={resetProjectModalState}
          onSubmit={handleSubmitProject}
        />

        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => { setShowDeleteModal(false); setProjectToDelete(null); }}
          onConfirm={confirmDelete}
          itemName={projectToDelete?.name}
          itemType="project"
          loading={deleting}
        />
      </>
    </React.Fragment>
  );
};

WorkPlannerProjects.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default WorkPlannerProjects;
