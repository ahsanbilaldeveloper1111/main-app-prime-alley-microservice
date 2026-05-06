import React, {
  ReactElement,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Button, Modal, Form, Dropdown } from "react-bootstrap";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import moment from "moment";
import { Plus, ChevronDown, MoreVertical, Repeat, Settings, Trash2 } from "lucide-react";
import GenericTable, { TableColumn, TableAction } from "@components/GenericTable";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import {
  listTasks,
  listProjects,
  getProject,
  deleteTask as deleteTaskApi,
  completeTask,
  incompleteTask,
  type ListTasksSummary,
} from "@utils/tasks";
import { listStatuses } from "@utils/work-planner";
import {
  canManageProjectFromMembers,
  getSessionPhoneOrExtension,
} from "@planner/projectMemberRole";
import {
  applyPlannerTaskSessionCrud,
  computePlannerTaskRowPermissions,
  plannerTaskRowDeleteDeniedTitle,
  plannerTaskRowEditDeniedTitle,
} from "@planner/taskRowPermissions";
import { extensionOrIdToTrimmedString } from "@planner/projectTabsContentUtils";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";
import { useTasksListingPager } from "@hooks/useTasksListingPager";
import {
  ALL_STATUS_VALUE,
  applyPlannerTaskFiltersToListParams,
  applyPlannerTaskTabToListParams,
  plannerTaskListTodayTriple,
} from "@utils/taskListing/plannerTasksQueryParams";
import {
  isStoredAsUtcMidnightCalendarDue,
  parseApiDueTimeToTimeInput,
  shouldSuppressDueTimeInListCell,
} from "@utils/plannerTaskDueTime";
import {
  buildTaskListingPageStyleTag,
  formatTaskDueDateCellParts,
  TaskCompleteCircleButton,
  TaskListingAssigneeCell,
  TaskListingSearchRow,
  TASK_LIST_BTN_OUTLINE,
  TASK_LIST_CELL,
  TASK_PRIORITY_DOT_COLORS,
} from "@utils/taskListing/taskListUiPrimitives";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Task {
  id: number;
  title: string;
  task_type: string;
  assigned_to: string | null;
  assigned_to_name?: string;
  priority: "low" | "medium" | "high" | "urgent" | null;
  due_date: string | null;
  notes: string | null;
  repeat_status: string | null;
  /** Derived from completion + due date (toggles, due column styling). */
  status: "pending" | "completed" | "overdue";
  /** Workflow status from API when `status` relation is loaded. */
  workflowStatus: { id: number; name: string } | null;
  rawData?: any;
}

interface ApiTask {
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
  /** Creator / owner extension when API sends it (matches session `user.phone` for edit/delete). */
  extension_number?: string;
  owner_extension_number?: string | null;
  created_by_extension_number?: string | null;
  extension_numbers?: string[];
  is_completed?: boolean;
  type?: string;
}

function apiDueTimeFromPlannerTaskRow(row: Task): string | undefined {
  const raw = row.rawData;
  if (raw == null || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const t = o.due_time ?? o.dueTime;
  if (typeof t === "string" && t.trim() !== "") return t;
  return undefined;
}

function resolvePlannerListTaskDueDate(apiTask: ApiTask): string | null {
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

type HierarchyExtension = {
  id?: string;
  extension_number?: string;
  name?: string;
};

function lookupHierarchyExtensionDisplayName(
  extNumber: string | number | null | undefined,
  hierarchyDataExtensions: unknown[] | null | undefined,
): string {
  const trimmed =
    extNumber == null || extNumber === "" ? "" : String(extNumber).trim();
  if (!trimmed) return "";
  if (!Array.isArray(hierarchyDataExtensions)) return trimmed;
  const ext = hierarchyDataExtensions.find((e) => {
    const item = e as HierarchyExtension;
    const id = item.id == null ? "" : String(item.id).trim();
    const en =
      item.extension_number == null ? "" : String(item.extension_number).trim();
    return id === trimmed || en === trimmed;
  }) as HierarchyExtension | undefined;
  const name = ext?.name?.trim();
  return name && name.length > 0 ? name : trimmed;
}

/** Names for the Assigned to column from `rawData.assignees[].extension_number` + hierarchy directory. */
function assigneeDisplayNamesForTaskRow(
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

export interface TasksListingPageProps {
  /** When true (e.g. embedded on project details list tab), To-do is omitted from filters and create/edit sidebar. */
  omitTodoTaskType?: boolean;
  /** When set (e.g. project list tab), create/edit sidebar uses this project and locks the project field. */
  sidebarProject?: {
    id: number;
    name: string;
    color?: string;
    statuses?: any[];
    labels?: any[];
    members?: unknown[];
    owner_extension_number?: string | null;
  };
  /**
   * When embedded with `sidebarProject`, use these extensions for assignee labels and skip GetHierarchyData.
   * Should match the shape returned by GetHierarchyData `extensions` (id, extension_number, name).
   */
  hierarchyExtensionsFromParent?: unknown[];
  /** Increment from parent to refetch when embedded on project detail (parent skips its own list fetch). */
  embeddedListRefreshSignal?: number;
  /** Receives `summary` from `listTasks` so project list-tab stats cards stay in sync. */
  onEmbeddedListSummary?: (summary: ListTasksSummary | undefined) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

/** Full list; table column still shows To-do for existing rows when `omitTodoTaskType` is on. */
const TASK_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "todo", label: "To-do" },
  { value: "recurring", label: "Recurring" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

/** Planner workflow status from GET /statuses */
type PlannerWorkflowStatusRow = { id: number; name: string };

function normalizePlannerStatusesFromApi(raw: unknown): PlannerWorkflowStatusRow[] {
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

/** Relations for GET /projects/:id — statuses for filter dropdown. */
const PROJECT_DETAILS_STATUS_WITH = ["statuses", "statuses.tasks"] as const;

const INITIAL_FILTER_FORM = {
  task_type: null as any,
  priority: null as any,
  assigned_to: null as string | null,
  due_date_from: "",
  due_date_to: "",
  project: "All Projects",
  assignee: [] as string[],
  status: ALL_STATUS_VALUE,
};

const TASKS_TABLE_COLUMN_STORAGE_KEY = "planner-tasks-listing-visible-columns-v1";

/** Must match `key` on each table column (order = default left-to-right). */
const DEFAULT_TASK_TABLE_COLUMN_KEYS: string[] = [
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

/**
 * Restores the exact visible-column list from storage (order preserved).
 * Does not re-append “missing” defaults — those are columns the user hid.
 */
function parseStoredTaskTableColumns(
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

/** Keep column order aligned with the table definition (not “last toggled on at the end”). */
function orderTaskColumnKeysByDefault(keys: string[]): string[] {
  const order = new Map(DEFAULT_TASK_TABLE_COLUMN_KEYS.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => (order.get(a) ?? 9999) - (order.get(b) ?? 9999));
}

function readVisibleTaskColumnKeysFromStorage(): string[] {
  if (globalThis.window === undefined) return [...DEFAULT_TASK_TABLE_COLUMN_KEYS];
  const stored = parseStoredTaskTableColumns(
    globalThis.localStorage.getItem(TASKS_TABLE_COLUMN_STORAGE_KEY),
    DEFAULT_TASK_TABLE_COLUMN_KEYS,
  );
  const base = stored ?? [...DEFAULT_TASK_TABLE_COLUMN_KEYS];
  return orderTaskColumnKeysByDefault(base);
}

function persistVisibleTaskColumnKeys(keys: string[]) {
  try {
    globalThis.localStorage.setItem(
      TASKS_TABLE_COLUMN_STORAGE_KEY,
      JSON.stringify(keys),
    );
  } catch {
    // ignore quota / private mode
  }
}

const TOTAL_VIEWS = 6;

const POSSIBLE_TABS = [
  { id: "all", label: "All" },
  { id: "due_today", label: "Due today" },
  { id: "overdue", label: "Overdue" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
] as const;

const TASK_VIEW_TAB_IDS = new Set<string>(POSSIBLE_TABS.map((t) => t.id));

const DEFAULT_VISIBLE_TAB_IDS = ["all", "due_today", "overdue", "upcoming"];
const SAVED_VIEW_STORAGE_KEY = "planner_tasks_visible_tabs";

function stripHtmlTags(input: string): string {
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
      tagBuffer.length = 0; // drop tag content
    }
  }

  // If we never closed the tag, keep the buffered text.
  if (inTag && tagBuffer.length) out.push(...tagBuffer);
  return out.join("");
}

function taskStatusColumnLabel(row: Task): string {
  const workflowName = row.workflowStatus?.name?.trim();
  if (workflowName) return workflowName;
  if (row.status === "completed") return "Completed";
  if (row.status === "overdue") return "Overdue";
  return "Pending";
}

/** e.g. `no_repeat` → "No Repeat" for table display. */
function formatRepeatStatusLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw
    .split(/_+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function resolveTaskActionsMenuOpenState(
  taskId: number,
  nextShow: boolean,
  previousOpenId: number | null,
): number | null {
  if (nextShow) {
    return taskId;
  }
  return previousOpenId === taskId ? null : previousOpenId;
}

function createTaskRowActionsToggleHandler(
  taskId: number,
  setOpenTaskActionsId: React.Dispatch<React.SetStateAction<number | null>>,
): (nextShow: boolean) => void {
  return (nextShow: boolean) => {
    setOpenTaskActionsId((prev) =>
      resolveTaskActionsMenuOpenState(taskId, nextShow, prev),
    );
  };
}

/** Tab bar order matches POSSIBLE_TABS. */
function normalizeVisibleTabIdsForStorage(ids: string[]): string[] {
  const set = new Set(ids);
  return POSSIBLE_TABS.map((t) => t.id).filter((id) => set.has(id));
}

function persistVisibleTabIds(ids: string[]) {
  const normalized = normalizeVisibleTabIdsForStorage(ids);
  try {
    globalThis.localStorage.setItem(
      SAVED_VIEW_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  } catch {
    // ignore quota / private mode
  }
}

function getInitialVisibleTabIds(): string[] {
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

// ─── Component ─────────────────────────────────────────────────────────────────

const TasksListingPage = ({
  omitTodoTaskType = false,
  sidebarProject,
  hierarchyExtensionsFromParent,
  embeddedListRefreshSignal,
  onEmbeddedListSummary,
}: TasksListingPageProps) => {
    const router = useRouter();
    const { data: session } = useSession();
    const { hasPermission } = usePermissions();
    const sessionUserPhoneOrExtension = useMemo(
      () => getSessionPhoneOrExtension(session),
      [session],
    );
    const sessionCanUpdatePlannerTask = useMemo(
      () => hasPermission(PERMISSIONS.EDIT_TASKS_WORK_PLANNER),
      [hasPermission],
    );
    const sessionCanDeletePlannerTask = useMemo(
      () => hasPermission(PERMISSIONS.DELETE_TASKS_WORK_PLANNER),
      [hasPermission],
    );
    const sessionCanCreatePlannerTask = useMemo(
      () => hasPermission(PERMISSIONS.CREATE_TASKS_WORK_PLANNER),
      [hasPermission],
    );
    const sessionCanConvertToRecurringPlannerTask = useMemo(
      () => hasPermission(PERMISSIONS.CONVERT_TO_RECURRING_TASK_WORK_PLANNER),
      [hasPermission],
    );
    const isProjectScopedEmbed = Boolean(sidebarProject?.id);
    const { hierarchyDataExtensions: hierarchyFromApi } = useHierarchyData(
      ModuleSlug.WORK_PLANNER,
      !isProjectScopedEmbed,
    );
    const hierarchyDataExtensions = useMemo(() => {
      if (isProjectScopedEmbed) {
        return Array.isArray(hierarchyExtensionsFromParent)
          ? hierarchyExtensionsFromParent
          : [];
      }
      return hierarchyFromApi;
    }, [isProjectScopedEmbed, hierarchyExtensionsFromParent, hierarchyFromApi]);

    const taskTypeFilterOptions = useMemo(
      () =>
        omitTodoTaskType
          ? TASK_TYPE_OPTIONS.filter((o) => o.value !== "todo")
          : TASK_TYPE_OPTIONS,
      [omitTodoTaskType],
    );

    // Map API task to UI Task (uses hierarchy for assignee names)
    const mapApiTaskToTask = useCallback((apiTask: ApiTask): Task => {
      const priorityMap: Record<string, "low" | "medium" | "high" | "urgent"> = {
        low: "low",
        normal: "medium",
        high: "high",
        urgent: "urgent",
      };
      const p = (apiTask.priority || "normal").toLowerCase();
      const priority = priorityMap[p] ?? "medium";

      const assignees = apiTask.assignees || [];
      const firstExtRaw = assignees[0]?.extension_number;
      const firstExt =
        firstExtRaw == null || firstExtRaw === ""
          ? null
          : String(firstExtRaw).trim() || null;
      const assigned_to = firstExt;
      const assigned_to_name = firstExt
        ? lookupHierarchyExtensionDisplayName(firstExt, hierarchyDataExtensions)
        : undefined;

      const dueDate = resolvePlannerListTaskDueDate(apiTask);

      const isCompleted = apiTask.is_completed === true;
      const dueMoment = dueDate ? moment(dueDate) : null;
      const isOverdue = dueMoment?.isBefore(moment(), "day") && !isCompleted;
      let status: Task["status"] = "pending";
      if (isCompleted) status = "completed";
      else if (isOverdue) status = "overdue";

      const taskTypeMap: Record<string, string> = {
        todo: "todo",
        regular: "regular",
        recurring: "recurring",
      };
      const task_type = taskTypeMap[apiTask.type || ""] || "todo";

      const apiStatus = apiTask.status;
      const workflowStatus =
        apiStatus && typeof apiStatus === "object" && apiStatus.name != null
          ? { id: Number(apiStatus.id), name: String(apiStatus.name) }
          : null;

      return {
        id: apiTask.id,
        title: apiTask.title || "",
        task_type,
        assigned_to,
        assigned_to_name,
        priority,
        due_date: dueDate,
        notes: apiTask.description ? stripHtmlTags(apiTask.description) : null,
        repeat_status: apiTask.type === "recurring" ? "repeat" : "no_repeat",
        status,
        workflowStatus,
        rawData: apiTask,
      };
    }, [hierarchyDataExtensions]);

    // Assignee options for CreateTaskSidebar
    const assigneeOptions = useMemo(() => {
      if (!Array.isArray(hierarchyDataExtensions)) return [];
      return hierarchyDataExtensions.map((ext) => {
        const item = ext as HierarchyExtension;
        return {
          value: item.extension_number || item.id || "",
          label: item.name || item.extension_number || item.id || "Unknown",
        };
      });
    }, [hierarchyDataExtensions]);

    // ── Tab state ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("all");
    const [visibleTabIds, setVisibleTabIds] = useState<string[]>(() => [...DEFAULT_VISIBLE_TAB_IDS]);
    const [showAddViewModal, setShowAddViewModal] = useState(false);

    useLayoutEffect(() => {
      setVisibleTabIds(getInitialVisibleTabIds());
    }, []);

    const allTabs = useMemo(
      () => POSSIBLE_TABS.filter((t) => visibleTabIds.includes(t.id)),
      [visibleTabIds]
    );

    // If current active tab was hidden, switch to first visible.
    // When embedded on project detail, `router.query.tab` is the project tab (e.g. "list"), not a task view id — do not sync to URL.
    useEffect(() => {
      if (visibleTabIds.length === 0 || visibleTabIds.includes(activeTab)) return;
      const nextId = visibleTabIds[0];
      setActiveTab(nextId);
      if (isProjectScopedEmbed) return;
      router.push(
        { pathname: router.pathname, query: { ...router.query, tab: nextId } },
        undefined,
        { shallow: true },
      );
    }, [visibleTabIds, activeTab, router, isProjectScopedEmbed]);

    useEffect(() => {
      if (isProjectScopedEmbed) return;
      if (router.isReady && router.query.tab) {
        const t = String(router.query.tab);
        if (TASK_VIEW_TAB_IDS.has(t)) setActiveTab(t);
      }
    }, [router.isReady, router.query.tab, isProjectScopedEmbed]);
  
    const switchTab = useCallback((id: string) => {
      setActiveTab(id);
      setPager(p => ({ ...p, page: 1 }));
      if (isProjectScopedEmbed) return;
      router.push({ pathname: router.pathname, query: { ...router.query, tab: id } }, undefined, { shallow: true });
    }, [router, isProjectScopedEmbed]);

    const toggleVisibleTab = useCallback((tabId: string, isVisible: boolean, isOnlyOne: boolean) => {
      if (isVisible && isOnlyOne) return;
      setVisibleTabIds((prev) => {
        const nextRaw = prev.includes(tabId)
          ? prev.filter((id) => id !== tabId)
          : [...prev, tabId];
        const next = normalizeVisibleTabIdsForStorage(nextRaw);
        persistVisibleTabIds(next);
        return next;
      });
    }, []);
  
    // ── Data ──────────────────────────────────────────────────────────────────────
    const [tasks, setTasks]           = useState<Task[]>([]);
    const [total, setTotal]           = useState(0);
    const [loading, setLoading]       = useState(false);
    const [filters, setFilters]       = useState<Record<string, any>>({});
    const [search, setSearch]         = useState("");
  
  
    const { pager, setPager } = useTasksListingPager();
  
    // ── Filter sidebar ────────────────────────────────────────────────────────────
    const [allProjects, setAllProjects]  = useState<Array<{ id: number; name: string }>>([]);
    const [fForm, setFForm] = useState(INITIAL_FILTER_FORM);
    const [workflowStatuses, setWorkflowStatuses] = useState<PlannerWorkflowStatusRow[]>([]);
    const [openQuickFilter, setOpenQuickFilter] = useState<string | null>(null);
    const quickFilterRef = useRef<HTMLDivElement | null>(null);
  
    // ── Create/edit task sidebar ──────────────────────────────────────────────────
    const [showCreate, setShowCreate]   = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editingTaskEditScope, setEditingTaskEditScope] = useState<
      "none" | "limited" | "full"
    >("full");
    const [openAsRecurringConversion, setOpenAsRecurringConversion] = useState(false);
  
    // ── Delete confirmation ──────────────────────────────────────────────────────
    const [showDelete, setShowDelete] = useState(false);
    const [toDelete, setToDelete] = useState<Task | null>(null);
    const [openTaskActionsId, setOpenTaskActionsId] = useState<number | null>(null);

    const [visibleTaskColumnKeys, setVisibleTaskColumnKeys] = useState<string[]>(
      () => [...DEFAULT_TASK_TABLE_COLUMN_KEYS],
    );

    useLayoutEffect(() => {
      const fromStorage = readVisibleTaskColumnKeysFromStorage();
      if (!fromStorage.includes("actions")) {
        const next = [...fromStorage, "actions"];
        persistVisibleTaskColumnKeys(next);
        setVisibleTaskColumnKeys(next);
        return;
      }
      setVisibleTaskColumnKeys(fromStorage);
    }, []);

    useEffect(() => {
      if (!omitTodoTaskType) return;
      setFilters((prev) => {
        if (prev.task_type !== "todo") return prev;
        const next = { ...prev };
        delete next.task_type;
        return next;
      });
      setFForm((prev) =>
        prev.task_type?.value === "todo" ? { ...prev, task_type: null } : prev,
      );
    }, [omitTodoTaskType]);

    useEffect(() => {
      if (!sidebarProject?.name) return;
      setFForm((prev) =>
        prev.project === sidebarProject.name ? prev : { ...prev, project: sidebarProject.name },
      );
    }, [sidebarProject?.id, sidebarProject?.name]);

    // Fetch projects for filter and sidebar (skip when embedded on a project — single project only)
    useEffect(() => {
      if (sidebarProject?.id) {
        setAllProjects([{ id: sidebarProject.id, name: sidebarProject.name }]);
        return;
      }
      const load = async () => {
        try {
          const res = await listProjects({ page: 1, limit: 100 });
          if (res?.success === true && Array.isArray(res.data)) {
            const list = res.data.map((p: any) => ({ id: p.id, name: p.name }));
            setAllProjects(list);
          }
        } catch {
          // ignore
        }
      };
      void load();
    }, [sidebarProject?.id, sidebarProject?.name]);

    /** Embedded only — stable list so `fetchTasks` does not re-run when `allProjects` is set in an effect. */
    const embeddedProjectsForFilters = useMemo((): Array<{ id: number; name: string }> => {
      if (sidebarProject?.id == null) return [];
      return [{ id: Number(sidebarProject.id), name: sidebarProject.name }];
    }, [sidebarProject?.id, sidebarProject?.name]);

    const projectsForApplyFilters = isProjectScopedEmbed
      ? embeddedProjectsForFilters
      : allProjects;

    /** Project used for task list context: embed uses sidebar; otherwise filter project when not "All Projects". */
    const resolvedProjectIdForStatuses = useMemo((): number | null => {
      if (sidebarProject?.id != null) {
        const n = Number(sidebarProject.id);
        return Number.isFinite(n) ? n : null;
      }
      if (fForm.project === "All Projects") return null;
      const match = allProjects.find((p) => p.name === fForm.project);
      if (match == null) return null;
      const n = Number(match.id);
      return Number.isFinite(n) ? n : null;
    }, [sidebarProject?.id, fForm.project, allProjects]);

    useEffect(() => {
      let cancelled = false;
      const load = async () => {
        try {
          if (resolvedProjectIdForStatuses != null) {
            const data = await getProject(resolvedProjectIdForStatuses, [...PROJECT_DETAILS_STATUS_WITH]);
            if (cancelled) return;
            const statuses = (data as { statuses?: unknown } | null)?.statuses;
            setWorkflowStatuses(normalizePlannerStatusesFromApi(statuses));
            return;
          }
          const raw = await listStatuses();
          if (cancelled) return;
          setWorkflowStatuses(normalizePlannerStatusesFromApi(raw));
        } catch {
          if (!cancelled) setWorkflowStatuses([]);
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, [resolvedProjectIdForStatuses]);

    useEffect(() => {
      if (fForm.status === ALL_STATUS_VALUE) return;
      const stillValid = workflowStatuses.some((s) => s.name === fForm.status);
      if (stillValid) return;
      setFForm((prev) => ({ ...prev, status: ALL_STATUS_VALUE }));
      setFilters((prev) => {
        const next = { ...prev };
        delete next.status;
        return next;
      });
    }, [workflowStatuses, fForm.status]);

    // ── Fetch ─────────────────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async () => {
      setLoading(true);
      try {
        const params: any = {
          page: pager.page,
          limit: pager.perPage,
          search: filters.search || undefined,
          order: { column: pager.sortCol === "due_date" ? "due_date" : "created_at", dir: pager.sortDir },
          withRelations: ["project", "status", "assignees"],
        };

        applyPlannerTaskFiltersToListParams(params, filters, projectsForApplyFilters);
        applyPlannerTaskTabToListParams(
          params,
          activeTab,
          plannerTaskListTodayTriple(),
        );

        if (sidebarProject?.id) {
          params.project_id = sidebarProject.id;
        }

        const res = await listTasks(params);
        if (isProjectScopedEmbed && res?.summary != null) {
          onEmbeddedListSummary?.(res.summary);
        }
        if (res?.data) {
          const mapped = (res.data as ApiTask[]).map((task) => mapApiTaskToTask(task));
          setTasks(mapped);
          setTotal(res.pagination?.total ?? 0);
        } else {
          setTasks([]);
          setTotal(0);
        }
      } catch {
        setTasks([]);
        setTotal(0);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }, [
      pager.page,
      pager.perPage,
      pager.sortCol,
      pager.sortDir,
      filters,
      activeTab,
      mapApiTaskToTask,
      projectsForApplyFilters,
      sidebarProject?.id,
      isProjectScopedEmbed,
      onEmbeddedListSummary,
    ]);

    const prevEmbeddedRefreshSignal = useRef<number | undefined>(undefined);
    useEffect(() => {
      if (!isProjectScopedEmbed || embeddedListRefreshSignal === undefined) return;
      if (prevEmbeddedRefreshSignal.current === undefined) {
        prevEmbeddedRefreshSignal.current = embeddedListRefreshSignal;
        return;
      }
      if (prevEmbeddedRefreshSignal.current === embeddedListRefreshSignal) return;
      prevEmbeddedRefreshSignal.current = embeddedListRefreshSignal;
      fetchTasks().catch(() => undefined);
    }, [embeddedListRefreshSignal, isProjectScopedEmbed, fetchTasks]);
  
    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const resolveProjectForMemberCheck = useCallback(
      (row: Task): unknown => {
        const raw = row.rawData as { project?: Record<string, unknown> | null } | undefined;
        const p = raw?.project ?? null;
        if (isProjectScopedEmbed && sidebarProject) {
          const sp = sidebarProject as {
            members?: unknown;
            owner_extension_number?: unknown;
          };
          const base = p && typeof p === "object" ? p : {};
          return {
            ...base,
            id: base.id ?? sidebarProject.id,
            name: base.name ?? sidebarProject.name,
            members: base.members ?? sp.members,
            owner_extension_number:
              base.owner_extension_number ?? sp.owner_extension_number,
          };
        }
        return p;
      },
      [isProjectScopedEmbed, sidebarProject],
    );

    const getTaskRowPermissions = useCallback(
      (row: Task) =>
        applyPlannerTaskSessionCrud(
          computePlannerTaskRowPermissions(
            row.rawData,
            resolveProjectForMemberCheck(row),
            sessionUserPhoneOrExtension,
          ),
          {
            canUpdateTask: sessionCanUpdatePlannerTask,
            canDeleteTask: sessionCanDeletePlannerTask,
          },
        ),
      [
        resolveProjectForMemberCheck,
        sessionUserPhoneOrExtension,
        sessionCanUpdatePlannerTask,
        sessionCanDeletePlannerTask,
      ],
    );

    const canCreateTaskOnEmbeddedPage = useMemo(() => {
      if (!isProjectScopedEmbed || !sidebarProject) return true;
      return canManageProjectFromMembers(
        sidebarProject,
        sessionUserPhoneOrExtension,
      );
    }, [isProjectScopedEmbed, sidebarProject, sessionUserPhoneOrExtension]);

    const showCreateTaskButton = useMemo(
      () => canCreateTaskOnEmbeddedPage && sessionCanCreatePlannerTask,
      [canCreateTaskOnEmbeddedPage, sessionCanCreatePlannerTask],
    );
  
    const openEdit = useCallback(
      (row: Task) => {
        const perms = getTaskRowPermissions(row);
        if (!perms.canOpenTaskEdit) return;
        setOpenAsRecurringConversion(false);
        setEditingTask(row);
        setEditingTaskEditScope(perms.taskEditScope);
        setShowCreate(true);
      },
      [getTaskRowPermissions],
    );

    const openConvertToRecurring = useCallback(
      (row: Task) => {
        if (!sessionCanConvertToRecurringPlannerTask) return;
        const perms = getTaskRowPermissions(row);
        if (!perms.canOpenTaskEdit) return;
        const kind = row.task_type;
        if (kind !== "todo" && kind !== "regular") return;
        setOpenAsRecurringConversion(true);
        setEditingTask(row);
        setEditingTaskEditScope(perms.taskEditScope);
        setShowCreate(true);
      },
      [getTaskRowPermissions, sessionCanConvertToRecurringPlannerTask],
    );

    const openDeleteConfirm = useCallback(
      (row: Task) => {
        if (!getTaskRowPermissions(row).canDeleteTask) return;
        setToDelete(row);
        setShowDelete(true);
      },
      [getTaskRowPermissions],
    );

    const handleDelete = async () => {
      if (!toDelete) return;
      if (!getTaskRowPermissions(toDelete).canDeleteTask) {
        toast.error("You cannot delete this task");
        return;
      }
      try {
        await deleteTaskApi(toDelete.id);
        setShowDelete(false);
        setToDelete(null);
        fetchTasks();
      } catch {
        toast.error("Failed to delete task");
      }
    };

    const handleToggleComplete = useCallback(
      async (row: Task) => {
        if (!getTaskRowPermissions(row).canOpenTaskEdit) {
          toast.error("You are not authorized to update this task");
          return;
        }
        try {
          if (row.status === "completed") {
            await incompleteTask(row.id);
          } else {
            await completeTask(row.id);
          }
          fetchTasks();
        } catch {
          toast.error("Failed to update task");
        }
      },
      [fetchTasks, getTaskRowPermissions],
    );
  
    // ── Columns ───────────────────────────────────────────────────────────────────
    const columns: TableColumn<Task>[] = useMemo(() => [
      {
        key: "complete", label: "Done", sortable: false, type: "custom",
        render: (row) => {
          const canToggleComplete = getTaskRowPermissions(row).canOpenTaskEdit;
          let completeBtnTitle = "Mark complete";
          if (row.status === "completed") {
            completeBtnTitle = "Mark incomplete";
          }
          if (!canToggleComplete) {
            completeBtnTitle = plannerTaskRowEditDeniedTitle(false) ?? "";
          }
          return (
            <TaskCompleteCircleButton
              isCompleted={row.status === "completed"}
              title={completeBtnTitle}
              disabled={!canToggleComplete}
              onClick={async (e) => {
                e.stopPropagation();
                if (!canToggleComplete) return;
                await handleToggleComplete(row);
              }}
            />
          );
        },
      },
      {
        key: "title", label: "Title", sortable: true, type: "custom",
        render: (row) => (
          <div className="task-title-cell" style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", minWidth: 0 }}>
            <a
              href={`/planner/tasks/${row.id}`}
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/planner/tasks/${row.id}`); }}
              title={row.title}
              style={{
                color: "#2563eb", fontWeight: 400, fontSize: 13, cursor: "pointer",
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                flex: 1, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {row.title}
            </a>

            {getTaskRowPermissions(row).canOpenTaskEdit && (
              <button
                className="task-edit-btn"
                type="button"
                onClick={e => { e.stopPropagation(); openEdit(row); }}
                style={{
                  ...TASK_LIST_BTN_OUTLINE,
                  paddingTop: 3, paddingBottom: 3, paddingLeft: 9, paddingRight: 9, fontSize: 11,
                  flexShrink: 0,
                }}
              >
                Edit
              </button>
            )}
          </div>
        ),
      },
      {
        key: "task_type", label: "Task Type", sortable: true, type: "custom",
        render: (row) => (
          <span style={TASK_LIST_CELL}>
            {TASK_TYPE_OPTIONS.find(t => t.value === row.task_type)?.label || row.task_type}
          </span>
        ),
      },
      {
        key: "assigned_to", label: "Assigned to", sortable: true, type: "custom",
        render: (row) => {
          const names = assigneeDisplayNamesForTaskRow(row, hierarchyDataExtensions);
          const display = names.length > 0 ? names.join(", ") : "";
          return <TaskListingAssigneeCell label={display} />;
        },
      },
      {
        key: "priority", label: "Priority", sortable: true, type: "custom",
        render: (row) => {
          if (!row.priority) return <span style={{ ...TASK_LIST_CELL, color: "#9ca3af" }}>—</span>;
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, display: "inline-block",
                backgroundColor: TASK_PRIORITY_DOT_COLORS[row.priority] }} />
              <span style={TASK_LIST_CELL}>{row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}</span>
            </div>
          );
        },
      },
      {
        key: "due_date", label: "Due date", sortable: true, type: "custom",
        render: (row) => {
          const parts = formatTaskDueDateCellParts(
            row.due_date,
            row.status,
            apiDueTimeFromPlannerTaskRow(row),
          );
          return (
            <span
              style={{
                ...TASK_LIST_CELL,
                color: parts.color,
                fontWeight: parts.fontWeight,
              }}
            >
              {parts.label}
            </span>
          );
        },
      },
      {
        key: "notes", label: "Notes", sortable: true, type: "custom",
        render: (row) => (
          <span style={{ ...TASK_LIST_CELL, maxWidth: 200, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}
            title={row.notes || ""}>{row.notes || "—"}</span>
        ),
      },
      {
        key: "workflow_status", label: "Status", sortable: false, type: "custom",
        render: (row) => (
          <span style={TASK_LIST_CELL}>{taskStatusColumnLabel(row)}</span>
        ),
      },
      {
        key: "repeat_status", label: "Repeat Status", sortable: false, type: "custom",
        render: (row) => {
          const label = formatRepeatStatusLabel(row.repeat_status);
          return <span style={TASK_LIST_CELL}>{label || "—"}</span>;
        },
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        type: "custom",
        render: (row) => {
          const perms = getTaskRowPermissions(row);
          const canEditRow = perms.canOpenTaskEdit;
          const canDeleteRow = perms.canDeleteTask;
          const canConvertRow =
            sessionCanConvertToRecurringPlannerTask && canEditRow;
          const isTodoOrRegular =
            row.task_type === "todo" || row.task_type === "regular";
          return (
            <Dropdown
              show={openTaskActionsId === row.id}
              onToggle={createTaskRowActionsToggleHandler(row.id, setOpenTaskActionsId)}
              onClick={(e) => e.stopPropagation()}
            >
              <Dropdown.Toggle
                variant="link"
                size="sm"
                className="p-1 text-decoration-none shadow-none"
                style={{ color: "#6b7280" }}
                id={`task-row-actions-${row.id}`}
                aria-label="Task actions"
              >
                <MoreVertical size={16} />
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item
                  as="button"
                  type="button"
                  aria-disabled={!canEditRow}
                  className={canEditRow ? undefined : "text-muted"}
                  style={{
                    cursor: canEditRow ? "pointer" : "not-allowed",
                    opacity: canEditRow ? 1 : 0.65,
                  }}
                  title={plannerTaskRowEditDeniedTitle(canEditRow)}
                  onClick={() => {
                    if (!canEditRow) return;
                    setOpenTaskActionsId(null);
                    openEdit(row);
                  }}
                >
                  <Settings size={14} className="me-2" />
                  Edit Task
                </Dropdown.Item>
                {isTodoOrRegular && (
                  <Dropdown.Item
                    as="button"
                    type="button"
                    aria-disabled={!canConvertRow}
                    className={canConvertRow ? undefined : "text-muted"}
                    style={{
                      cursor: canConvertRow ? "pointer" : "not-allowed",
                      opacity: canConvertRow ? 1 : 0.65,
                    }}
                    title={
                      canConvertRow
                        ? ""
                        : !sessionCanConvertToRecurringPlannerTask
                          ? "You are not authorized to convert tasks to recurring"
                          : plannerTaskRowEditDeniedTitle(canEditRow)
                    }
                    onClick={() => {
                      if (!canConvertRow) return;
                      setOpenTaskActionsId(null);
                      openConvertToRecurring(row);
                    }}
                  >
                    <Repeat size={14} className="me-2" />
                    Convert to recurring
                  </Dropdown.Item>
                )}
                <Dropdown.Divider />
                <Dropdown.Item
                  as="button"
                  type="button"
                  aria-disabled={!canDeleteRow}
                  className={canDeleteRow ? "text-danger" : "text-muted"}
                  style={{
                    cursor: canDeleteRow ? "pointer" : "not-allowed",
                    opacity: canDeleteRow ? 1 : 0.65,
                  }}
                  title={plannerTaskRowDeleteDeniedTitle(perms)}
                  onClick={() => {
                    if (!canDeleteRow) return;
                    setOpenTaskActionsId(null);
                    openDeleteConfirm(row);
                  }}
                >
                  <Trash2 size={14} className="me-2" />
                  Delete Task
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          );
        },
      },
    ], [
      fetchTasks,
      router,
      handleToggleComplete,
      openEdit,
      openConvertToRecurring,
      openDeleteConfirm,
      getTaskRowPermissions,
      openTaskActionsId,
      hierarchyDataExtensions,
      sessionCanConvertToRecurringPlannerTask,
    ]);

    const tableColumnsForGrid = useMemo(() => {
      const byKey = new Map(columns.map((c) => [c.key, c]));
      return visibleTaskColumnKeys
        .map((k) => byKey.get(k))
        .filter((c): c is TableColumn<Task> => c != null);
    }, [columns, visibleTaskColumnKeys]);

    const toggleTaskColumnVisibility = useCallback((columnKey: string) => {
      setVisibleTaskColumnKeys((prev) => {
        const toggled = prev.includes(columnKey)
          ? prev.filter((k) => k !== columnKey)
          : [...prev, columnKey];
        if (toggled.length === 0) {
          toast.error("Keep at least one column visible");
          return prev;
        }
        const next = orderTaskColumnKeysByDefault(toggled);
        persistVisibleTaskColumnKeys(next);
        return next;
      });
    }, []);

    const selectAllTaskColumns = useCallback(() => {
      const next = [...DEFAULT_TASK_TABLE_COLUMN_KEYS];
      setVisibleTaskColumnKeys(next);
      persistVisibleTaskColumnKeys(next);
    }, []);

    const resetTaskColumnsToDefault = useCallback(() => {
      const next = [...DEFAULT_TASK_TABLE_COLUMN_KEYS];
      setVisibleTaskColumnKeys(next);
      persistVisibleTaskColumnKeys(next);
    }, []);
  
    const actions: TableAction<Task>[] = useMemo(() => [], []);
  
    // Filter options for Project, Assignee, Status
    const projectOptions = useMemo(() => [
      { value: "All Projects", label: "All Projects" },
      ...allProjects.map(p => ({ value: p.name, label: p.name })),
    ], [allProjects]);

    const statusFilterOptions = useMemo(
      () => [
        { value: ALL_STATUS_VALUE, label: ALL_STATUS_VALUE },
        ...workflowStatuses.map((s) => ({ value: s.name, label: s.name })),
      ],
      [workflowStatuses],
    );

    const statusFilterPillLabel = useMemo(() => {
      if (fForm.status === ALL_STATUS_VALUE) return ALL_STATUS_VALUE;
      return statusFilterOptions.find((o) => o.value === fForm.status)?.label ?? fForm.status;
    }, [fForm.status, statusFilterOptions]);

    const priorityFilterPillLabel = useMemo(() => {
      if (!fForm.priority?.value) return "Priority";
      return PRIORITY_OPTIONS.find((o) => o.value === fForm.priority?.value)?.label || "Priority";
    }, [fForm.priority]);

    const dueDateFilterPillLabel = useMemo(() => {
      if (fForm.due_date_from && fForm.due_date_to) {
        return `${fForm.due_date_from} to ${fForm.due_date_to}`;
      }
      if (fForm.due_date_from) return `From ${fForm.due_date_from}`;
      if (fForm.due_date_to) return `Until ${fForm.due_date_to}`;
      return "Due date";
    }, [fForm.due_date_from, fForm.due_date_to]);

    const applyCurrentFilters = useCallback(() => {
      const f: Record<string, any> = {};
      if (fForm.project && fForm.project !== "All Projects") f.project = fForm.project;
      if (fForm.assignee?.length) f.assignee = fForm.assignee;
      if (fForm.status && fForm.status !== ALL_STATUS_VALUE) f.status = fForm.status;
      if (fForm.task_type) f.task_type = fForm.task_type.value;
      if (fForm.priority) f.priority = fForm.priority.value;
      if (fForm.due_date_from) f.due_date_from = fForm.due_date_from;
      if (fForm.due_date_to) f.due_date_to = fForm.due_date_to;
      if (search) f.search = search;
      setFilters(f);
      setPager({ ...pager, page: 1 });
      setOpenQuickFilter(null);
    }, [fForm, pager, search, setPager]);

    const resetCurrentFilters = useCallback(() => {
      setFForm({
        ...INITIAL_FILTER_FORM,
        assignee: [],
      });
      setFilters({});
      setSearch("");
      setPager({ ...pager, page: 1 });
      setOpenQuickFilter(null);
    }, [pager, setPager]);

    useEffect(() => {
      const onDocClick = (event: MouseEvent) => {
        if (!quickFilterRef.current) return;
        const target = event.target as Node;
        if (!quickFilterRef.current.contains(target)) {
          setOpenQuickFilter(null);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const filterPills = [
      {
        id: "project",
        label: fForm.project,
        icon: <ChevronDown size={12} />,
        showDropdown: true,
        onClick: () => setOpenQuickFilter((prev) => (prev === "project" ? null : "project")),
      }
    ,
      {
        id: "assigned_to",
        label: `Assigned to (${fForm.assignee.length})`,
        icon: <ChevronDown size={12} />,
        showDropdown: true,
        onClick: () => setOpenQuickFilter((prev) => (prev === "assigned_to" ? null : "assigned_to")),
      },
      {
        id: "task_type",
        label: fForm.task_type
          ? TASK_TYPE_OPTIONS.find((o) => o.value === fForm.task_type?.value)?.label || "Task type"
          : "Task type",
        icon: <ChevronDown size={12} />,
        showDropdown: true,
        onClick: () => setOpenQuickFilter((prev) => (prev === "task_type" ? null : "task_type")),
      },
      {
        id: "status",
        label: statusFilterPillLabel,
        icon: <ChevronDown size={12} />,
        showDropdown: true,
        onClick: () => setOpenQuickFilter((prev) => (prev === "status" ? null : "status")),
      },
      {
        id: "priority",
        label: priorityFilterPillLabel,
        icon: <ChevronDown size={12} />,
        showDropdown: true,
        onClick: () => setOpenQuickFilter((prev) => (prev === "priority" ? null : "priority")),
      },
      
      {
        id: "due_date",
        label: dueDateFilterPillLabel,
        icon: <ChevronDown size={12} />,
        showDropdown: true,
        onClick: () => setOpenQuickFilter((prev) => (prev === "due_date" ? null : "due_date")),
      },
      {
        id: "queue",
        label: "Queue",
        icon: <ChevronDown size={12} />,
        showDropdown: true,
        onClick: () => setOpenQuickFilter((prev) => (prev === "queue" ? null : "queue")),
      },
      
    ];
  
    // ── Render ─────────────────────────────────────────────────────────────────────
    return (
      <React.Fragment>
  
        {/* ── Global style overrides ── */}
        <style
          dangerouslySetInnerHTML={{
            __html: buildTaskListingPageStyleTag({
              showTitleHoverEditButton: true,
            }),
          }}
        />
  
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle="Tasks" />
  
        <div className="tasks-page" style={{
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 100px)",
          overflow: "hidden",
        }}>
  
          {/* ══════════════════════════════════════════════════════
              ROW 1 — Page title + top-right buttons
          ══════════════════════════════════════════════════════ */}
          <div style={{
            padding: "14px 20px",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div>
              <h4 style={{
                fontWeight: 700, fontSize: 20, margin: 0, color: "#141414",
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
              }}>Tasks</h4>
              <p style={{
                fontSize: 12, color: "#6b7280", margin: "3px 0 0",
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif", fontWeight: 400,
              }}>{total} records</p>
            </div>
  
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {showCreateTaskButton && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setOpenAsRecurringConversion(false);
                    setShowCreate(true);
                  }}
                  style={{
                    ...TASK_LIST_BTN_OUTLINE,
                    backgroundColor: "#000",
                    background: "#000",
                    borderColor: "#000",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#333";
                    e.currentTarget.style.background = "#333";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#000";
                    e.currentTarget.style.background = "#000";
                  }}
                >Create task</button>
              )}
            </div>
          </div>
  
          {/* ══════════════════════════════════════════════════════
              ROW 2 — Tabs
              Design: [All ✕] [Due today flex-1] [Overdue flex-1] [Upcoming flex-1]
                      ────────── spacer ──────────  [+ Add view (4/50)]  [All Views]
          ══════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex",
            alignItems: "stretch",
            backgroundColor: "#fff",
            
         
            height: 44,
            flexShrink: 0,
          }}>
            {(() => {
              const currentViewCount = allTabs.length;
              const hasAllViews = visibleTabIds.length === POSSIBLE_TABS.length;
              return (
                <>
            {/* Tabs with equal width */}
            {allTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: "0 20px",
                  border: "none",
                  borderRight: "1px solid #8A8A8A",
                  borderTop: "1px solid #8A8A8A",
                  backgroundColor: activeTab === tab.id ? "#f7f2f7" : "#fff",
                  borderBottom: activeTab === tab.id ? "none" : "1px solid #8A8A8A",
                  color: "#141414",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 500 : 400,
                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                  cursor: "pointer",
                  height: "100%",
                  gap: tab.id === "all" ? 10 : 0,
                }}
              >
                {tab.label}
                {tab.id === "all"}
              </button>
            ))}

            {/* + Add view — opens popup to toggle which tabs are visible */}
            <button
              onClick={() => setShowAddViewModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "0 16px",
               border: "none",
              //   borderLeft: "1px solid #e5e7eb",
                borderTop: "none",
                backgroundColor: "#fff",
                color: "#374151",
                fontSize: 13,
                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                fontWeight: 400,
                cursor: "pointer",
                flexShrink: 0,
                height: "100%",
                whiteSpace: "nowrap",
                borderRight: "none",
                borderBottom: "1px solid #ccc",
              }}
            >
              <Plus size={14} />
              Add view ({currentViewCount}/{TOTAL_VIEWS})
            </button>

            {/* All Views — enable all tabs, then hide this button */}
            {!hasAllViews && (
              <button
                onClick={() => {
                  const all = POSSIBLE_TABS.map((t) => t.id);
                  setVisibleTabIds(all);
                  persistVisibleTabIds(all);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 16px",
                  border: "none",
                  borderBottom: "1px solid #ccc",
                  borderLeft: "none",
                  borderTop: "none",
                  borderRight: "none",
                  backgroundColor: "#fff",
                  color: "#2563eb",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                  cursor: "pointer",
                  flexShrink: 0,
                  height: "100%",
                  whiteSpace: "nowrap",
                }}
              >All Views</button>
            )}
                </>
              );
            })()}
          </div>

          {/* Add view / Manage tabs modal */}
          <Modal show={showAddViewModal} onHide={() => setShowAddViewModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Manage views</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted small mb-3">
                Toggle which views appear in the tab bar. At least one must be visible.
              </p>
              {POSSIBLE_TABS.map((tab) => {
                const isVisible = visibleTabIds.includes(tab.id);
                const isOnlyOne = visibleTabIds.length === 1;
                return (
                  <Form.Check
                    key={tab.id}
                    type="switch"
                    id={`view-${tab.id}`}
                    label={tab.label}
                    checked={isVisible}
                    disabled={isVisible && isOnlyOne}
                    onChange={() => {
                      toggleVisibleTab(tab.id, isVisible, isOnlyOne);
                    }}
                    className="mb-2"
                  />
                );
              })}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddViewModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          {/* ══════════════════════════════════════════════════════
              ROW 3 — Filter controls row
              LEFT:  Assigned to (1) ✕ | Task type ▼ | Due date ▼ | Queue ▼ | Clear all
              RIGHT: Save view | Start N tasks
          ══════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
            gap: 8,
            flexShrink: 0,
          }}>
  
            {/* LEFT — filter pills (GenericTable style) */}
            <div className="gt-filter-pills" ref={quickFilterRef}>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {filterPills.map((pill) => (
                  <div key={pill.id} style={{ position: "relative" }}>
                    <button
                      className="gt-filter-pill"
                      onClick={pill.onClick}
                    >
                      {pill.icon && <span className="me-1">{pill.icon}</span>}
                      <span>{pill.label}</span>
                    </button>
                    {pill.id === "project" && openQuickFilter === "project" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 220,
                        maxHeight: 260,
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        {projectOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFForm({ ...fForm, project: option.value });
                              setOpenQuickFilter(null);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: "none",
                              background: option.value === fForm.project ? "#f3f4f6" : "transparent",
                              borderRadius: 6,
                              padding: "8px 10px",
                              fontSize: 12,
                              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {pill.id === "assigned_to" && openQuickFilter === "assigned_to" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 220,
                        maxHeight: 260,
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        <button
                          onClick={() => {
                            setFForm((prev) => ({ ...prev, assignee: [] }));
                            setOpenQuickFilter(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: fForm.assignee.length === 0 ? "#f3f4f6" : "transparent",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 12,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                          }}
                        >
                          All assignees
                        </button>
                        {assigneeOptions.map((option) => {
                          const selected = fForm.assignee.includes(option.value);
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                let nextAssignees: string[];
                                if (selected) {
                                  const index = fForm.assignee.indexOf(option.value);
                                  nextAssignees =
                                    index === -1
                                      ? fForm.assignee
                                      : [...fForm.assignee.slice(0, index), ...fForm.assignee.slice(index + 1)];
                                } else {
                                  nextAssignees = [...fForm.assignee, option.value];
                                }
                                setFForm({ ...fForm, assignee: nextAssignees });
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                border: "none",
                                background: selected ? "#f3f4f6" : "transparent",
                                borderRadius: 6,
                                padding: "8px 10px",
                                fontSize: 12,
                                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {pill.id === "task_type" && openQuickFilter === "task_type" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 220,
                        maxHeight: 260,
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        <button
                          onClick={() => {
                            setFForm((prev) => ({ ...prev, task_type: null }));
                            setOpenQuickFilter(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: fForm.task_type ? "transparent" : "#f3f4f6",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 12,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                          }}
                        >
                          All task types
                        </button>
                        {taskTypeFilterOptions.map((option) => {
                          const selected = fForm.task_type?.value === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                const selectedType = { value: option.value, label: option.label };
                                setFForm({ ...fForm, task_type: selectedType });
                                setOpenQuickFilter(null);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                border: "none",
                                background: selected ? "#f3f4f6" : "transparent",
                                borderRadius: 6,
                                padding: "8px 10px",
                                fontSize: 12,
                                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {pill.id === "status" && openQuickFilter === "status" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 220,
                        maxHeight: 260,
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        {statusFilterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setFForm({ ...fForm, status: option.value });
                              setOpenQuickFilter(null);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              border: "none",
                              background: option.value === fForm.status ? "#f3f4f6" : "transparent",
                              borderRadius: 6,
                              padding: "8px 10px",
                              fontSize: 12,
                              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {pill.id === "priority" && openQuickFilter === "priority" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 220,
                        maxHeight: 260,
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        <button
                          onClick={() => {
                            setFForm((prev) => ({ ...prev, priority: null }));
                            setOpenQuickFilter(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: fForm.priority ? "transparent" : "#f3f4f6",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 12,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                          }}
                        >
                          All priorities
                        </button>
                        {PRIORITY_OPTIONS.map((option) => {
                          const selected = fForm.priority?.value === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setFForm({
                                  ...fForm,
                                  priority: { value: option.value, label: option.label },
                                });
                                setOpenQuickFilter(null);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                border: "none",
                                background: selected ? "#f3f4f6" : "transparent",
                                borderRadius: 6,
                                padding: "8px 10px",
                                fontSize: 12,
                                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {pill.id === "due_date" && openQuickFilter === "due_date" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 220,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        <button
                          onClick={() => {
                            const today = moment().format("YYYY-MM-DD");
                            setFForm((prev) => ({ ...prev, due_date_from: today, due_date_to: today }));
                            setOpenQuickFilter(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 12,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                          }}
                        >
                          Due today
                        </button>
                        <button
                          onClick={() => {
                            const from = moment().format("YYYY-MM-DD");
                            const to = moment().add(7, "days").format("YYYY-MM-DD");
                            setFForm((prev) => ({ ...prev, due_date_from: from, due_date_to: to }));
                            setOpenQuickFilter(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 12,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                          }}
                        >
                          Next 7 days
                        </button>
                        <button
                          onClick={() => {
                            setFForm((prev) => ({ ...prev, due_date_from: "", due_date_to: "" }));
                            setOpenQuickFilter(null);
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 12,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                          }}
                        >
                          Clear due date
                        </button>
                        <div style={{ borderTop: "1px solid #e5e7eb", margin: "6px 0" }} />
                        <div style={{ padding: "6px 10px" }}>
                          <label
                            htmlFor="quick-due-date-from"
                            style={{
                              display: "block",
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 4,
                            }}
                          >
                            Due date from
                          </label>
                          <input
                            id="quick-due-date-from"
                            type="date"
                            value={fForm.due_date_from || ""}
                            onChange={(e) =>
                              setFForm((prev) => ({ ...prev, due_date_from: e.target.value || "" }))
                            }
                            style={{
                              width: "100%",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              padding: "6px 8px",
                              fontSize: 12,
                              marginBottom: 8,
                            }}
                          />
                          <label
                            htmlFor="quick-due-date-to"
                            style={{
                              display: "block",
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 4,
                            }}
                          >
                            Due date to
                          </label>
                          <input
                            id="quick-due-date-to"
                            type="date"
                            value={fForm.due_date_to || ""}
                            onChange={(e) =>
                              setFForm((prev) => ({ ...prev, due_date_to: e.target.value || "" }))
                            }
                            style={{
                              width: "100%",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              padding: "6px 8px",
                              fontSize: 12,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {pill.id === "queue" && openQuickFilter === "queue" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 220,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 10,
                        fontSize: 12,
                        color: "#6b7280",
                        fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                      }}>
                        Queue quick filters are not configured yet.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
  
            {/* RIGHT */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <button
                type="button"
                onClick={applyCurrentFilters}
                style={{
                  ...TASK_LIST_BTN_OUTLINE,
                  backgroundColor: "#000",
                  background: "#000",
                  borderColor: "#000",
                  color: "#fff",
                  fontWeight: 600,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#333";
                  e.currentTarget.style.background = "#333";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.background = "#000";
                }}
              >
                Apply filters
              </button>
              <button
                type="button"
                onClick={resetCurrentFilters}
                style={{
                  ...TASK_LIST_BTN_OUTLINE,
                  backgroundColor: "#000",
                  background: "#000",
                  borderColor: "#000",
                  color: "#fff",
                  fontWeight: 600,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#333";
                  e.currentTarget.style.background = "#333";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#000";
                  e.currentTarget.style.background = "#000";
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
  
          {/* ══════════════════════════════════════════════════════
              ROW 4 — Search + Edit columns
          ══════════════════════════════════════════════════════ */}
          <TaskListingSearchRow
            search={search}
            onSearchChange={setSearch}
            onSubmitSearch={() => {
              setFilters((p) => ({ ...p, search }));
              setPager((p) => ({ ...p, page: 1 }));
            }}
            wrapperStyle={{
              borderBottom: "1px solid #e5e7eb",
            }}
            editColumnsSlot={(
            <Dropdown align="end" autoClose="outside">
              <Dropdown.Toggle
                variant="outline-secondary"
                id="tasks-edit-columns-dropdown"
                style={{
                  ...TASK_LIST_BTN_OUTLINE,
                  fontSize: 12,
                  backgroundColor: "#fff",
                  borderColor: "#8a8a8a",
                  color: "#141414",
                }}
              >
                Edit columns
              </Dropdown.Toggle>
              <Dropdown.Menu style={{ minWidth: 240 }}>
                {columns.map((col) => (
                  <Dropdown.Item
                    key={col.key}
                    as="div"
                    className="px-3 py-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Form.Check
                      type="checkbox"
                      id={`planner-task-col-${col.key}`}
                      label={col.label || col.key}
                      checked={visibleTaskColumnKeys.includes(col.key)}
                      onChange={() => toggleTaskColumnVisibility(col.key)}
                    />
                  </Dropdown.Item>
                ))}
                <Dropdown.Divider />
                <Dropdown.Item as="button" type="button" onClick={selectAllTaskColumns}>
                  Select all
                </Dropdown.Item>
                <Dropdown.Item as="button" type="button" onClick={resetTaskColumnsToDefault}>
                  Reset to default
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            )}
          />
  
          {/* ══════════════════════════════════════════════════════
              ROW 5 — Table (fills remaining height)
          ══════════════════════════════════════════════════════ */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <GenericTable
              data={tasks}
              columns={tableColumnsForGrid}
              actions={actions}
              showActions={false}
              pagination={{
                currentPage: pager.page,
                rowsPerPage: pager.perPage,
                totalRows: total,
                pageSizeOptions: [10, 25, 50, 100],
              }}
              onPaginationChange={(page, perPage) =>
                setPager(p => ({ ...p, page, perPage }))
              }
              sortable
              defaultSortBy={pager.sortCol}
              defaultSortOrder={pager.sortDir}
              onSort={(col, dir) => setPager(p => ({ ...p, sortCol: col, sortDir: dir }))}
              onFirstColumnClick={row => router.push(`/planner/tasks/task-detail?id=${row.id}`)}
              loading={loading}
              emptyMessage="No tasks found"
              loadingMessage="Loading tasks..."
              hover
              uniqueKey="id"
              fixedHeight
              maxHeight="calc(100vh - 439px)"
              showToolbar={false}
            />
          </div>
  
        </div>
  
        {/* ── Create / Edit task (CreateTaskSidebar – same logic as createtask-modal) ── */}
        <CreateTaskSidebar
          isOpen={showCreate}
          onClose={() => {
            setShowCreate(false);
            setEditingTask(null);
            setEditingTaskEditScope("full");
            setOpenAsRecurringConversion(false);
          }}
          onCreate={async () => {
            setShowCreate(false);
            setEditingTask(null);
            setEditingTaskEditScope("full");
            setOpenAsRecurringConversion(false);
            await fetchTasks();
          }}
          extensions={hierarchyDataExtensions as any}
          labels={sidebarProject?.labels ?? []}
          project={
            sidebarProject
              ? {
                  id: sidebarProject.id,
                  name: sidebarProject.name,
                  icon: "",
                  color: sidebarProject.color || "#3b82f6",
                  statuses: sidebarProject.statuses,
                  labels: sidebarProject.labels,
                }
              : undefined
          }
          task={editingTask?.rawData ?? editingTask}
          isEdit={!!editingTask}
          taskTypeChoices={
            omitTodoTaskType ? (["regular", "recurring"] as const) : undefined
          }
          lockProjectSelection={Boolean(sidebarProject)}
          taskEditScope={editingTask ? editingTaskEditScope : "full"}
          openAsRecurringConversion={openAsRecurringConversion}
        />
  
        {/* ── Delete confirmation ── */}
        <DeleteConfirmationModal
          show={showDelete}
          onHide={() => { setShowDelete(false); setToDelete(null); }}
          onConfirm={handleDelete}
          itemName={toDelete?.title}
          itemType="task"
        />
      </React.Fragment>
    );
  };
  
  // ─── Layout wrapper ────────────────────────────────────────────────────────────
  
  TasksListingPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
  
  export default TasksListingPage;
  