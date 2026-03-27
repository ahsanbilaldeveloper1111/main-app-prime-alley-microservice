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
  useState,
  type ComponentProps,
} from "react";
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
} from "./workPlannerProjectRelations";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { ModuleSlug } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { StatsCardData } from "@components/GenericStatsCards";
import GenericFilterSidebar, { FilterField } from "@components/GenericFilterSidebar";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import GenericTable, {
  TableColumn,
  TableAction,
  ToolbarConfig,
  FilterPill,
  TabConfig,
} from "@components/GenericTable";
import {
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  Nav,
  Modal,
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
}

function mapApiPriorityToTaskPriority(raw: unknown): Task["priority"] {
  const p = String(raw ?? "medium").toLowerCase();
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

function mapApiTaskToPlannerTask(
  api: Record<string, unknown>,
  projectId: string,
  statuses: Array<Record<string, unknown>>,
): Task {
  const id = String(api.id ?? "");
  const statusMap: Record<string, string> = {};
  statuses.forEach((s) => {
    if (s?.id != null && s.name != null) statusMap[String(s.id)] = String(s.name);
  });

  const statusNameFromApi = (): string => {
    const st = api.status as { name?: string } | undefined;
    if (st?.name) return String(st.name);
    const sid = api.status_id == null ? "" : String(api.status_id);
    return statusMap[sid] ?? "";
  };

  const statusName = statusNameFromApi().toLowerCase();
  const isCompleted = Boolean(api.is_completed);
  let dueRaw: string | undefined;
  if (typeof api.due_date === "string") {
    dueRaw = api.due_date;
  } else if (api.due_date != null) {
    dueRaw = String(api.due_date);
  }

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
    title: String(api.title ?? ""),
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
        {/* Checkbox placeholder */}
        <td style={{ width: 40, paddingLeft: 12 }}>
          <input type="checkbox" style={{ cursor: "pointer" }} onClick={(e) => e.stopPropagation()} />
        </td>

        {/* Name column - indented */}
        <td style={{ paddingLeft: indentLeft + 8, position: "relative" }}>
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
                <Eye size={12} />
                Preview/Edit
              </button>
            )}
          </div>
        </td>

        {/* Members */}
        <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
          {task.assignee ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: "#667eea",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                {task.assignee.substring(0, 1).toUpperCase()}
              </div>
              <span style={{ fontSize: "0.8rem" }}>{task.assignee}</span>
            </div>
          ) : (
            <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>—</span>
          )}
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
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "—"}
        </td>
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
      <td style={{ width: 40, paddingLeft: 12 }}>
        <input type="checkbox" style={{ cursor: "pointer" }} onClick={(e) => e.stopPropagation()} />
      </td>

      <td style={{ paddingLeft: indentLeft + 8, position: "relative" }}>
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

      <td style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
        {subtask.assignee ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "#a78bfa",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontWeight: 600,
              }}
            >
              {subtask.assignee.substring(0, 1).toUpperCase()}
            </div>
            <span style={{ fontSize: "0.775rem" }}>{subtask.assignee}</span>
          </div>
        ) : (
          "—"
        )}
      </td>
      <td style={{ fontSize: "0.8rem", color: "#9ca3af" }}>—</td>
      <td style={{ fontSize: "0.8rem" }}>
        {subtask.status === "overdue" ? (
          <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.8rem" }}>Overdue</span>
        ) : "—"}
      </td>
      <td style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
        {subtask.dueDate
          ? new Date(subtask.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—"}
      </td>
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
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "No due date"}
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
  // Pagination
  pagination: { page: number; limit: number; total: number; last_page: number; from: number; to: number };
  onPaginationChange: (page: number, rowsPerPage: number) => void;
  // Toolbar
  toolbarConfig: ToolbarConfig;
  statsCards: StatsCardData[];
  selectedProjects: Set<string>;
  onSelectionChange: (selected: Project[]) => void;
  columns: TableColumn<Project>[];
  actions: TableAction<Project>[];
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
  pagination,
  onPaginationChange,
  toolbarConfig,
  statsCards,
  selectedProjects,
  onSelectionChange,
  columns,
  actions,
}) => {
  const { hasPermission } = usePermissions();
  const canPreviewEditTask = hasPermission("edit-tasks-work-planner");
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

  const buildSelectedProjectsFromIds = (selectedIds: Set<string>): Project[] => {
    const selected: Project[] = [];
    for (const project of projects) {
      if (selectedIds.has(project.id)) selected.push(project);
    }
    return selected;
  };

  const handleProjectSelectionChange = (projectId: string, checked: boolean) => {
    const nextSelectedIds = new Set(selectedProjects);
    if (checked) nextSelectedIds.add(projectId);
    else nextSelectedIds.delete(projectId);
    onSelectionChange(buildSelectedProjectsFromIds(nextSelectedIds));
  };

  const handleToggleAllProjects = (checked: boolean) => {
    onSelectionChange(checked ? projects : []);
  };

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

  // Build the custom table body
  const renderTableBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={7} className="text-center py-5" style={{ color: "#94a3b8" }}>
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
            <td colSpan={7} className="text-center py-5">
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
      const isSelected = selectedProjects.has(project.id);

      // Project row
      rows.push(
        <tr
          key={`project-${project.id}`}
          className="generic-table-row clickable"
          onClick={() => onProjectClick(project)}
          style={{ backgroundColor: isExpanded ? "#f0f7ff" : undefined }}
        >
          {/* Checkbox */}
          <td style={{ width: 40, paddingLeft: 12 }} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleProjectSelectionChange(project.id, e.target.checked)}
              style={{ cursor: "pointer" }}
            />
          </td>

          {/* Expand chevron + Project name */}
          <td>
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
                  <Dropdown.Menu align="end">
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
              <td colSpan={7} style={{ paddingLeft: 56, paddingTop: 12, paddingBottom: 12 }}>
                <Spinner animation="border" size="sm" className="me-2" style={{ color: "#94a3b8" }} />
                <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Loading tasks...</span>
              </td>
            </tr>
          );
        } else if (tasks.length === 0) {
          rows.push(
            <tr key={`empty-${project.id}`} style={{ backgroundColor: "#fafbfc" }}>
              <td colSpan={7} style={{ paddingLeft: 56, paddingTop: 10, paddingBottom: 10, color: "#9ca3af", fontSize: "0.875rem" }}>
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

        // "Add task" row at the bottom of expanded project
        rows.push(
          <tr key={`add-task-${project.id}`} style={{ backgroundColor: "#fafbfc" }}>
            <td colSpan={7} style={{ paddingLeft: 56, paddingTop: 6, paddingBottom: 6 }}>
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
        taskType="regular"
      />

      {/* Use GenericTable only for toolbar + pagination; render our own table body */}
      <GenericTable<Project>
        data={projects}
        columns={columns}
        actions={actions}
        showActions={true}
        actionsLabel="Actions"
        selectable={true}
        selectedRows={projects.filter((p) => selectedProjects.has(p.id))}
        onSelectionChange={onSelectionChange}
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
                  <th className="generic-table-th" style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      onChange={(e) => handleToggleAllProjects(e.target.checked)}
                      checked={projects.length > 0 && selectedProjects.size === projects.length}
                    />
                  </th>
                  <th className="generic-table-th">Project Name</th>
                  <th className="generic-table-th">Members</th>
                  <th className="generic-table-th">Open</th>
                  <th className="generic-table-th">Overdue</th>
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
  const resolvedStatus =
    selectedProjectDetails ? getProjectStatusFromApiStatus(selectedProjectDetails.status) : selectedProject?.status;

  const recentActivityContent = (() => {
    if (loadingActivities) return <Spinner animation="border" size="sm" />;
    if (projectActivities.length === 0) {
      return (
        <div className="text-center py-3 text-muted" style={{ fontSize: "0.875rem" }}>
          No recent activity
        </div>
      );
    }

    return (
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
                  <span style={{ fontWeight: 600 }}>{ext === "system" ? "System" : ext}</span>{" "}
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
  })();

  const historyContent = (() => {
    if (loadingActivities) return <Spinner animation="border" size="sm" />;
    if (projectActivities.length === 0) {
      return (
        <div className="text-center py-3 text-muted" style={{ fontSize: "0.875rem" }}>
          No history available
        </div>
      );
    }

    return (
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
                <span style={{ fontWeight: 600 }}>{ext === "system" ? "System" : ext}</span>
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
  })();

  const bodyContent = (() => {
    if (loadingProjectDetails) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-3 text-muted">Loading project details...</p>
        </div>
      );
    }

    if (!selectedProject) return null;

    return (
      <>
        <Row className="g-2 mb-3">
          <Col xs={6}>
            <div className="detail-section">
              <div className="detail-label">Open Tasks</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#3b82f6" }}>{selectedProject.open}</div>
            </div>
          </Col>
          <Col xs={6}>
            <div className="detail-section">
              <div className="detail-label">Overdue Tasks</div>
              {loadingOverdueTasks ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: overdueTasks.length > 0 ? "#ef4444" : "#10b981",
                  }}
                >
                  {overdueTasks.length}
                </div>
              )}
            </div>
          </Col>
        </Row>

        <div className="detail-section">
          <div className="detail-label">Project Progress</div>
          <ProgressBar
            now={Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100)}
            style={{ height: 10, marginBottom: "0.5rem" }}
            variant="primary"
          />
          <div style={{ fontSize: "0.875rem", color: "#64748b", textAlign: "right" }}>
            {Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100)}% Complete
          </div>
        </div>

        <Row className="g-2 mb-3">
          <Col xs={6}>
            <div
              className="detail-section"
              style={{ height: "100%", display: "flex", flexDirection: "column", padding: "0.75rem" }}
            >
              <div className="detail-label">Owner / PM</div>
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "auto",
                }}
              >
                <span>
                  {selectedProjectDetails?.owner_extension_number
                    ? getUserNameFromExtension(selectedProjectDetails.owner_extension_number)
                    : selectedProject.owner}
                </span>
              </div>
            </div>
          </Col>
          <Col xs={6}>
            <div
              className="detail-section"
              style={{ height: "100%", display: "flex", flexDirection: "column", padding: "0.75rem" }}
            >
              <div className="detail-label">Status</div>
              <div style={{ marginTop: "auto" }}>
                <Badge
                  bg={getProjectStatusVariant(resolvedStatus ?? selectedProject.status)}
                  style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.5rem 0.75rem" }}
                >
                  {(resolvedStatus ?? selectedProject.status).toUpperCase()}
                </Badge>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="g-2 mb-3">
          <Col xs={6}>
            <div className="detail-section">
              <div className="detail-label">
                Team Members ({selectedProjectDetails?.members?.length || selectedProject.members.length})
              </div>
              <div className="d-flex flex-wrap gap-2">
                {(selectedProjectDetails?.members || selectedProject.members).map((member: any) => {
                  const ext = member.extension_number || member.name || "";
                  const key = String(
                    member?.id ?? member?.extension_number ?? member?.name ?? `${ext}-${member?.role ?? ""}`,
                  );
                  return (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        backgroundColor: "white",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: "#334155",
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {member.user?.name || getUserNameFromExtension(ext)} {member.role ? `(${member.role})` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Col>

          <Col xs={6}>
            <div className="detail-section">
              <div className="detail-label">Last Updated</div>
              <div className="d-flex align-items-center" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                <Calendar size={16} className="me-2 text-muted" />
                <span>
                  {selectedProjectDetails?.updated_at
                    ? new Date(selectedProjectDetails.updated_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : selectedProject.lastUpdate}
                </span>
              </div>
            </div>
          </Col>
        </Row>

        {selectedProjectDetails?.description && (
          <div className="detail-section">
            <div className="detail-label">Description</div>
            <div style={{ fontSize: "0.875rem", color: "#475569" }}>{selectedProjectDetails.description}</div>
          </div>
        )}

        <Nav variant="tabs" className="detail-tabs" activeKey={detailTab} onSelect={(k) => k && setDetailTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="Activity">Activity</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="History">History</Nav.Link>
          </Nav.Item>
        </Nav>

        <div style={{ marginTop: "1.5rem" }}>
          {detailTab === "Activity" && (
            <div>
              <div className="detail-label" style={{ marginBottom: "1rem" }}>
                Recent Activity
              </div>
              {recentActivityContent}
            </div>
          )}
          {detailTab === "History" && (
            <div>
              <div className="detail-label" style={{ marginBottom: "1rem" }}>
                Project History
              </div>
              {historyContent}
            </div>
          )}
        </div>
      </>
    );
  })();

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" className="project-detail-panel">
      <Offcanvas.Header style={{ position: "relative" }}>
        <Offcanvas.Title>
          <div className="d-flex align-items-center gap-3">
            {selectedProject && (
              <>
                <div className="project-icon" style={{ backgroundColor: selectedProject.iconColor + "20" }}>
                  <selectedProject.icon size={24} style={{ color: selectedProject.iconColor }} />
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize: "1.125rem", marginBottom: "0.25rem" }}>
                    {selectedProject.name}
                  </div>
                  <Badge bg={getProjectStatusVariant(selectedProject.status)} style={{ fontSize: "0.7rem" }}>
                    {selectedProject.status.toUpperCase()}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </Offcanvas.Title>

        <div className="d-flex align-items-center gap-2">
          {selectedProject && (
            <Button
              variant="link"
              className="p-0"
              onClick={() => {
                globalThis.window?.open(`/planner/projects/${selectedProject.id}`, "_blank");
              }}
              style={{
                color: "#6b7280",
                textDecoration: "none",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 4,
              }}
            >
              <ExternalLink size={18} />
            </Button>
          )}
          <Button
            variant="link"
            className="p-0"
            onClick={onHide}
            style={{
              color: "#6b7280",
              textDecoration: "none",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
            }}
          >
            <X size={18} />
          </Button>
        </div>
      </Offcanvas.Header>

      <Offcanvas.Body>
        {bodyContent}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

// ============================================================
// MAIN PAGE COMPONENT
// (mostly unchanged from original — search for "CHANGED" comments)
// ============================================================

type SelectOption = { value: string; label: string };
type AppliedProjectFilters = {
  search: string;
  status: ProjectStatusFilter;
  owner: string;
  team: string;
  startDateFrom: string;
  endDateTo: string;
};

const WorkPlannerProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.USER_DIRECTORY);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectFormData, setProjectFormData] = useState({ name: "", description: "", color: "#3b82f6" });
  const [stats, setStats] = useState({ activeProjects: 0, totalProjects: 0, tasksDueThisWeek: 0, overdueAcrossProjects: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, last_page: 1, from: 0, to: 0 });
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ProjectStatusFilter>("active");
  const [filterOwner, setFilterOwner] = useState("All Owners");
  const [filterTeam, setFilterTeam] = useState("All Teams");
  const [filterStartDateFrom, setFilterStartDateFrom] = useState("");
  const [filterEndDateTo, setFilterEndDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedProjectFilters>({
    search: "",
    status: "active",
    owner: "All Owners",
    team: "All Teams",
    startDateFrom: "",
    endDateTo: "",
  });
  const [customTabs] = useState<TabConfig[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
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
    setProjectFormData({ name: "", description: "", color: "#3b82f6" });
  }, []);

  useEffect(() => {
    if (!hierarchyLoading) {
      fetchProjects({
        search: searchTerm,
        status: filterStatus,
        owner: filterOwner,
        startDateFrom: filterStartDateFrom,
        endDateTo: filterEndDateTo,
      });
    }
  }, [pagination.page, pagination.limit, hierarchyLoading]);

  const fetchProjects = async (filters?: Partial<AppliedProjectFilters>) => {
    try {
      setLoading(true);
      const statusParam = filters?.status && filters.status !== "all" ? filters.status : undefined;
      const ownerParam = filters?.owner && filters.owner !== "All Owners" ? [filters.owner] : undefined;
      let startFrom = filters?.startDateFrom?.trim() || undefined;
      let endTo = filters?.endDateTo?.trim() || undefined;
      if (startFrom && endTo && endTo < startFrom) {
        endTo = startFrom;
      }
      const response = await listProjects({
        page: pagination.page,
        limit: pagination.limit,
        search: filters?.search || "",
        status: statusParam,
        user_extensions: ownerParam,
        start_date_from: startFrom,
        end_date_to: endTo,
      });
      if (response?.success === true && Array.isArray(response.data)) {
        setProjects(response.data.map((p: ApiProject) => mapApiProjectToProject(p)));
        if (response.pagination) setPagination((prev) => ({ ...prev, ...response.pagination }));
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
  };

  const mapApiProjectToProject = (apiProject: ApiProject): Project => {
    const tasks = apiProject.tasks || [];
    const openTasks = tasks.filter((t: any) => !t.is_completed).length;
    const overdueTasks = tasks.filter((t: any) => {
      if (!t.due_date) return false;
      return !t.is_completed && new Date(t.due_date) < new Date();
    }).length;

    const members = (apiProject.members || []).map((member, idx) => {
      const colors = ["#667eea", "#f56565", "#48bb78", "#ed64a6", "#4299e1", "#9f7aea", "#fc8181"];
      return { name: member.extension_number, initials: member.extension_number.substring(0, 2).toUpperCase(), color: colors[idx % colors.length] };
    });

    const lastUpdate = apiProject.updated_at
      ? new Date(apiProject.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "N/A";

    type IconComponent = typeof Folder;
    const iconMap: Record<string, IconComponent> = {
      website: Palette, mobile: Smartphone, marketing: Megaphone, it: Monitor,
      client: Users, support: Headphones, product: Rocket, crm: Settings,
    };
    const projectNameLower = apiProject.name.toLowerCase();
    let Icon: IconComponent = Folder;
    for (const key in iconMap) {
      if (projectNameLower.includes(key)) { Icon = iconMap[key]; break; }
    }

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
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectFormData({ name: "", description: "", color: "#3b82f6" });
    setShowProjectModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormData({ name: project.name, description: project.apiData?.description || "", color: project.iconColor });
    setShowProjectModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
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
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const projectData = { name: projectFormData.name, description: projectFormData.description, color: projectFormData.color };
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
  };

  const handleProjectClick = async (project: Project) => {
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
  };

  const formatTimeAgo = (dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

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
    setFilterStatus("active");
    setFilterOwner("All Owners");
    setFilterTeam("All Teams");
    setFilterStartDateFrom("");
    setFilterEndDateTo("");
    const cleared: AppliedProjectFilters = {
      search: "",
      status: "active",
      owner: "All Owners",
      team: "All Teams",
      startDateFrom: "",
      endDateTo: "",
    };
    setAppliedFilters(cleared);
    fetchProjects(cleared);
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status: filterStatus,
      owner: filterOwner,
      team: filterTeam,
      startDateFrom: filterStartDateFrom,
      endDateTo: filterEndDateTo,
    };
    setAppliedFilters(next);
    fetchProjects(next);
  };

  const applyProjectStatusFromPill = (status: ProjectStatusFilter) => {
    setFilterStatus(status);
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status,
      owner: filterOwner,
      team: filterTeam,
      startDateFrom: filterStartDateFrom,
      endDateTo: filterEndDateTo,
    };
    setAppliedFilters(next);
    fetchProjects(next);
  };

  const clearDateFiltersAndRefetch = () => {
    setFilterStartDateFrom("");
    setFilterEndDateTo("");
    setPagination((prev) => ({ ...prev, page: 1 }));
    const next: AppliedProjectFilters = {
      search: searchTerm,
      status: filterStatus,
      owner: filterOwner,
      team: filterTeam,
      startDateFrom: "",
      endDateTo: "",
    };
    setAppliedFilters(next);
    fetchProjects(next);
  };

  const handleProjectStartDateChange = (value = "") => {
    setFilterStartDateFrom(value);
    setFilterEndDateTo((prevEnd) => {
      if (value && prevEnd && prevEnd < value) {
        return value;
      }
      return prevEnd;
    });
  };

  const handleProjectEndDateChange = (value = "") => {
    const start = filterStartDateFrom.trim();
    if (value && start && value < start) {
      setFilterEndDateTo(start);
      return;
    }
    setFilterEndDateTo(value);
  };

  const dateRangePillActiveLabel = (): string | undefined => {
    const from = filterStartDateFrom.trim();
    const to = filterEndDateTo.trim();
    if (!from && !to) return undefined;
    if (from && to) return `${from} → ${to}`;
    if (from) return `From ${from}`;
    return `To ${to}`;
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const statusMap: Record<string, ProjectStatusFilter> = {
      all: "all",
      active: "active",
      completed: "completed",
      archived: "archived",
    };
    if (statusMap[tabId]) setFilterStatus(statusMap[tabId]);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) || project.id.toLowerCase().includes(appliedFilters.search.toLowerCase());
    const projectStatusKey = String(project.apiData?.status || project.status || "").toLowerCase();
    const matchesStatus = appliedFilters.status === "all" || projectStatusKey === appliedFilters.status;
    const projectOwnerExt = project.apiData?.owner_extension_number || project.owner;
    const matchesOwner = appliedFilters.owner === "All Owners" || String(projectOwnerExt || "") === String(appliedFilters.owner);
    const projectMembers = (project.apiData?.members || project.members || []) as any[];
    const matchesTeam = appliedFilters.team === "All Teams" || projectMembers.some((m: any) => String(m?.extension_number || m?.name || "") === String(appliedFilters.team));
    return matchesSearch && matchesStatus && matchesOwner && matchesTeam;
  });

  const userOptions = (() => {
    const list = (hierarchyDataExtensions as any[]) || [];
    const seen = new Set<string>();
    return list
      .map((ext: any) => ({ value: String(ext?.extension_number || ext?.id || "").trim(), label: String(ext?.user?.name || ext?.name || "").trim() }))
      .filter((o) => o.value && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  const ownerSelectOptions: SelectOption[] = [{ value: "All Owners", label: "All Owners" }, ...userOptions];

  const statuses: Array<{ value: ProjectStatusFilter; label: string }> = [
    { value: "all", label: "All Status" },
    { value: "active", label: "active" },
    { value: "archived", label: "archived" },
    { value: "completed", label: "completed" },
  ];

  const filterFields: FilterField[] = [
    { id: "search", label: "Search", type: "text", value: searchTerm, onChange: (v: string) => setSearchTerm(v ?? ""), placeholder: "Search projects..." },
    { id: "status", label: "Status", type: "dropdown", value: filterStatus, onChange: (v) => setFilterStatus(coerceProjectStatusFilter(v)), options: statuses },
    { id: "owner", label: "Owner / PM", type: "dropdown", value: filterOwner, onChange: (v) => setFilterOwner(v ?? "All Owners"), options: ownerSelectOptions },
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
    {
      id: "owner",
      label: filterOwner === "All Owners" ? "Owner / PM" : filterOwner,
      active: filterOwner !== "All Owners",
      activeLabel: filterOwner === "All Owners" ? undefined : getUserNameFromExtension(filterOwner),
      onClear: () => setFilterOwner("All Owners"),
    },
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
          { label: "Edit Project", icon: <Settings size={14} />, onClick: (row) => handleEditProject(row) },
          { label: "Delete Project", icon: <Trash2 size={14} />, onClick: (row) => handleDeleteProject(row), className: "text-danger", divider: true },
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

            {/* CHANGED: Replaced GenericTable with ExpandableProjectTable */}
            <ExpandableProjectTable
              projects={filteredProjects}
              loading={loading}
              extensions={(hierarchyDataExtensions as any[]) || []}
              onProjectClick={handleProjectClick}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              pagination={pagination}
              onPaginationChange={(page, rowsPerPage) => setPagination((prev) => ({ ...prev, page, limit: rowsPerPage }))}
              toolbarConfig={toolbarConfig}
              statsCards={statsCardsData}
              selectedProjects={selectedProjects}
              onSelectionChange={(selected) => setSelectedProjects(new Set(selected.map((p) => p.id)))}
              columns={projectTableColumns}
              actions={projectTableActions}
            />
          </Container>
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

        {/* Project Form Modal */}
        <Modal show={showProjectModal} onHide={resetProjectModalState} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingProject ? "Edit Project" : "Create New Project"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmitProject}>
              <Form.Group className="mb-3">
                <Form.Label>Project Name <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" value={projectFormData.name} onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })} placeholder="Enter project name" required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={3} value={projectFormData.description} onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })} placeholder="Enter project description" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Color</Form.Label>
                <div className="d-flex align-items-center gap-3">
                  <Form.Control type="color" value={projectFormData.color} onChange={(e) => setProjectFormData({ ...projectFormData, color: e.target.value })} style={{ width: 80, height: 40 }} />
                  <Form.Control type="text" value={projectFormData.color} onChange={(e) => setProjectFormData({ ...projectFormData, color: e.target.value })} placeholder="#3b82f6" style={{ flex: 1 }} />
                </div>
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={resetProjectModalState} disabled={submitting}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={submitting || !projectFormData.name.trim()}>
                  {submitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      {submittingButtonText}
                    </>
                  ) : (
                    submitButtonText
                  )}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

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
