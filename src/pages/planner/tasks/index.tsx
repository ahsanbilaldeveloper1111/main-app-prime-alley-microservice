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
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import moment from "moment";
import { ChevronDown, Plus, X } from "lucide-react";
import { Button, Form, Modal } from "react-bootstrap";
import GenericTable, { TableColumn, TableAction } from "@components/GenericTable";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import {
  listTasks,
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
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";
import { useTasksListingPager } from "@hooks/useTasksListingPager";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlannerProjectFilterDirectory } from "../../../query/fetchPlannerProjectFilterDirectory";
import { plannerKeys } from "@query/keys";
import {
  ALL_STATUS_VALUE,
  applyPlannerTaskFiltersToListParams,
  applyPlannerTaskTabToListParams,
  plannerTaskListTodayTriple,
} from "@utils/taskListing/plannerTasksQueryParams";
import {
  PlannerTaskAssigneeCell,
  PlannerTaskCompleteColumnRender,
  PlannerTaskDueDateCell,
  PlannerTaskNotesCell,
  PlannerTaskPriorityCell,
  PlannerTaskRepeatStatusCell,
  PlannerTaskRowActionsMenu,
  PlannerTaskTitleCell,
  PlannerTaskTypeCell,
  PlannerTaskWorkflowStatusCell,
} from "@components/planner/plannerTasksListing/PlannerTaskListCells";
import { PlannerAddToMyDayEstimateModal } from "@components/planner/plannerTasksListing/PlannerAddToMyDayEstimateModal";
import { usePlannerAddToMyDay } from "@components/planner/plannerTasksListing/usePlannerAddToMyDay";
import { listingTaskToAddToMyDayTarget } from "@components/planner/plannerTasksListing/plannerTasksListingMyDay";
import { PlannerTasksEditColumnsDropdown } from "@components/planner/plannerTasksListing/PlannerTasksEditColumnsDropdown";
import {
  type ApiTask,
  type HierarchyExtension,
  type PlannerWorkflowStatusRow,
  type Task,
  DEFAULT_TASK_TABLE_COLUMN_KEYS,
  DEFAULT_VISIBLE_TAB_IDS,
  getInitialVisibleTabIds,
  INITIAL_FILTER_FORM,
  lookupHierarchyExtensionDisplayName,
  normalizePlannerStatusesFromApi,
  normalizeVisibleTabIdsForStorage,
  orderTaskColumnKeysByDefault,
  persistVisibleTabIds,
  persistVisibleTaskColumnKeys,
  POSSIBLE_TABS,
  PRIORITY_OPTIONS,
  PROJECT_DETAILS_STATUS_WITH,
  readVisibleTaskColumnKeysFromStorage,
  resolvePlannerListTaskDueDate,
  stripHtmlTags,
  TASK_TYPE_OPTIONS,
  TASK_VIEW_TAB_IDS,
  TOTAL_VIEWS,
} from "@components/planner/plannerTasksListing/plannerTasksListingDomain";
import {
  TASK_LIST_BTN_OUTLINE,
  buildTaskListingPageStyleTag,
  TaskListingSearchRow,
} from "@utils/taskListing/taskListUiPrimitives";

function plannerTaskConvertDeniedTitle(
  canConvertRow: boolean,
  hasConvertPermission: boolean,
  canEditRow: boolean,
): string {
  if (canConvertRow) return "";
  if (hasConvertPermission === false) {
    return "You are not authorized to convert tasks to recurring";
  }
  return plannerTaskRowEditDeniedTitle(canEditRow) ?? "";
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
  lockedTabId?: string;
  pageTitle?: string;
  breadcrumbSubTitle?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const TasksListingPage = ({
  omitTodoTaskType = false,
  sidebarProject,
  hierarchyExtensionsFromParent,
  embeddedListRefreshSignal,
  onEmbeddedListSummary,
  lockedTabId,
  pageTitle = "Tasks",
  breadcrumbSubTitle = "Tasks",
}: TasksListingPageProps) => {
    const router = useRouter();
    const { data: session } = useSession();
    const { hasPermission } = usePermissions();
    const sessionUserPhoneOrExtension = useMemo(
      () => getSessionPhoneOrExtension(session),
      [session],
    );
    const sessionCanUpdatePlannerTask = useMemo(
      () => hasPermission(HEADER_CONSTANTS.PERMISSIONS.EDIT_TASKS_WORK_PLANNER),
      [hasPermission],
    );
    const sessionCanDeletePlannerTask = useMemo(
      () => hasPermission(HEADER_CONSTANTS.PERMISSIONS.DELETE_TASKS_WORK_PLANNER),
      [hasPermission],
    );
    const sessionCanCreatePlannerTask = useMemo(
      () => hasPermission(HEADER_CONSTANTS.PERMISSIONS.CREATE_TASKS_WORK_PLANNER),
      [hasPermission],
    );
    const sessionCanConvertToRecurringPlannerTask = useMemo(
      () =>
        hasPermission(
          HEADER_CONSTANTS.PERMISSIONS.CONVERT_TO_RECURRING_TASK_WORK_PLANNER,
        ),
      [hasPermission],
    );
    const sessionCanUseMyDay = useMemo(
      () => hasPermission(HEADER_CONSTANTS.PERMISSIONS.VIEW_MY_DAY_TASKS_WORK_PLANNER),
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
        (omitTodoTaskType
          ? TASK_TYPE_OPTIONS.filter((o) => o.value !== "todo")
          : [...TASK_TYPE_OPTIONS]
        ).map((o) => ({ value: o.value, label: o.label })),
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
    const [activeTab, setActiveTab] = useState(lockedTabId ?? "all");
    const [visibleTabIds, setVisibleTabIds] = useState<string[]>(() => [...DEFAULT_VISIBLE_TAB_IDS]);
    const [showAddViewModal, setShowAddViewModal] = useState(false);
    const isTabLocked = Boolean(lockedTabId);

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
      if (isTabLocked) return;
      if (router.isReady && router.query.tab) {
        const t = String(router.query.tab);
        if (TASK_VIEW_TAB_IDS.has(t)) setActiveTab(t);
      }
    }, [router.isReady, router.query.tab, isProjectScopedEmbed, isTabLocked]);

    useEffect(() => {
      if (!isTabLocked) return;
      setActiveTab(lockedTabId ?? "all");
    }, [isTabLocked, lockedTabId]);
  
    const switchTab = useCallback((id: string) => {
      if (isTabLocked) return;
      setActiveTab(id);
      setPager(p => ({ ...p, page: 1 }));
      if (isProjectScopedEmbed) return;
      router.push({ pathname: router.pathname, query: { ...router.query, tab: id } }, undefined, { shallow: true });
    }, [router, isProjectScopedEmbed, isTabLocked]);

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
    const queryClient = useQueryClient();
    const [filters, setFilters]       = useState<Record<string, any>>({});
    const [search, setSearch]         = useState("");


    const { pager, setPager } = useTasksListingPager();

    // ── Filter sidebar ────────────────────────────────────────────────────────────
    const { data: projectDirectoryRows = [] } = useQuery({
      queryKey: plannerKeys.projects.filterDirectory(),
      queryFn: fetchPlannerProjectFilterDirectory,
      enabled: !isProjectScopedEmbed,
    });

    const allProjects = useMemo((): Array<{ id: number; name: string }> => {
      if (isProjectScopedEmbed && sidebarProject?.id != null) {
        return [{ id: Number(sidebarProject.id), name: sidebarProject.name }];
      }
      return projectDirectoryRows.map((p) => ({
        id: Number(p.id),
        name: String(p.name ?? ""),
      }));
    }, [
      isProjectScopedEmbed,
      sidebarProject?.id,
      sidebarProject?.name,
      projectDirectoryRows,
    ]);

    const [fForm, setFForm] = useState(INITIAL_FILTER_FORM);
    const [openQuickFilter, setOpenQuickFilter] = useState<string | null>(null);
    const [projectSearch, setProjectSearch] = useState("");
    const [assigneeSearch, setAssigneeSearch] = useState("");
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

    /** Embedded only — stable list for filter application when project-scoped. */
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

    const { data: workflowStatuses = [] } = useQuery({
      queryKey: plannerKeys.statuses.workflow(resolvedProjectIdForStatuses),
      queryFn: async (): Promise<PlannerWorkflowStatusRow[]> => {
        try {
          if (resolvedProjectIdForStatuses != null) {
            const data = await getProject(
              String(resolvedProjectIdForStatuses),
              [...PROJECT_DETAILS_STATUS_WITH],
            );
            const statuses = (data as { statuses?: unknown } | null)?.statuses;
            return normalizePlannerStatusesFromApi(statuses);
          }
          const raw = await listStatuses();
          return normalizePlannerStatusesFromApi(raw);
        } catch {
          return [];
        }
      },
    });

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

    const assigneeExtensionsKey = useMemo(
      () =>
        hierarchyDataExtensions
          .map((ext) => {
            const e = ext as HierarchyExtension;
            return `${String(e.id ?? "")}:${String(e.extension_number ?? "")}`;
          })
          .join("|"),
      [hierarchyDataExtensions],
    );

    const projectsForFiltersKey = useMemo(
      () =>
        JSON.stringify(
          projectsForApplyFilters.map((p) => ({ id: p.id, name: p.name })),
        ),
      [projectsForApplyFilters],
    );

    const tasksListQueryKey = useMemo(
      () =>
        plannerKeys.tasks.list({
          scope: isProjectScopedEmbed ? "embed" : "page",
          embedProjectId:
            sidebarProject?.id === undefined || sidebarProject?.id === null
              ? null
              : Number(sidebarProject.id),
          embedRefresh: isProjectScopedEmbed
            ? embeddedListRefreshSignal
            : undefined,
          page: pager.page,
          perPage: pager.perPage,
          sortCol: pager.sortCol,
          sortDir: pager.sortDir,
          filtersKey: JSON.stringify(filters),
          activeTab,
          projectsForFiltersKey,
          assigneeExtensionsKey,
        }),
      [
        isProjectScopedEmbed,
        sidebarProject?.id,
        embeddedListRefreshSignal,
        pager.page,
        pager.perPage,
        pager.sortCol,
        pager.sortDir,
        filters,
        activeTab,
        projectsForFiltersKey,
        assigneeExtensionsKey,
      ],
    );

    const {
      data: tasksQueryData,
      isPending: tasksQueryPending,
      isFetching: tasksQueryFetching,
    } = useQuery({
      queryKey: tasksListQueryKey,
      queryFn: async () => {
        try {
          const params: any = {
            page: pager.page,
            limit: pager.perPage,
            search: filters.search || undefined,
            order: {
              column: pager.sortCol === "due_date" ? "due_date" : "created_at",
              dir: pager.sortDir,
            },
            withRelations: ["project", "status", "assignees"],
          };

          applyPlannerTaskFiltersToListParams(
            params,
            filters,
            projectsForApplyFilters,
          );
          applyPlannerTaskTabToListParams(
            params,
            activeTab,
            plannerTaskListTodayTriple(),
          );

          if (sidebarProject?.id) {
            params.project_id = sidebarProject.id;
          }

          const res = await listTasks(params);
          const summary =
            isProjectScopedEmbed && res?.summary != null ? res.summary : undefined;
          let mapped: Task[] = [];
          let totalRows = 0;
          if (res?.data) {
            mapped = (res.data as ApiTask[]).map((t) => mapApiTaskToTask(t));
            totalRows = res.pagination?.total ?? 0;
          }
          return { tasks: mapped, total: totalRows, summary };
        } catch {
          toast.error("Failed to load tasks");
          return { tasks: [] as Task[], total: 0, summary: undefined };
        }
      },
    });

    useEffect(() => {
      if (!isProjectScopedEmbed || tasksQueryData?.summary == null) return;
      onEmbeddedListSummary?.(tasksQueryData.summary);
    }, [
      isProjectScopedEmbed,
      tasksQueryData?.summary,
      onEmbeddedListSummary,
    ]);

    const tasks = tasksQueryData?.tasks ?? [];
    const total = tasksQueryData?.total ?? 0;
    const loading = tasksQueryPending || tasksQueryFetching;

    const invalidateTaskLists = useCallback(() => {
      queryClient.invalidateQueries({ queryKey: plannerKeys.tasks.all() });
    }, [queryClient]);

    const {
      pendingTask: addToMyDayPendingTask,
      estimateInput: addToMyDayEstimateInput,
      setEstimateInput: setAddToMyDayEstimateInput,
      closeEstimateModal: closeAddToMyDayEstimateModal,
      requestAddTaskToMyDay,
      skipEstimateAndAdd: skipAddToMyDayEstimate,
      confirmEstimateAndAdd: confirmAddToMyDayEstimate,
      canAddTaskToMyDay,
      isTaskInMyDay,
      addToMyDayTableAction,
    } = usePlannerAddToMyDay({
      canUseMyDay: sessionCanUseMyDay,
      extensionNumber: sessionUserPhoneOrExtension,
      onAdded: invalidateTaskLists,
    });

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
        invalidateTaskLists();
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
          invalidateTaskLists();
        } catch {
          toast.error("Failed to update task");
        }
      },
      [invalidateTaskLists, getTaskRowPermissions],
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
            <PlannerTaskCompleteColumnRender
              row={row}
              canToggleComplete={canToggleComplete}
              completeBtnTitle={completeBtnTitle}
              onToggleComplete={async (e) => {
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
          <PlannerTaskTitleCell
            row={row}
            canEdit={getTaskRowPermissions(row).canOpenTaskEdit}
            onNavigate={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/planner/tasks/${row.id}`);
            }}
            onEditClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          />
        ),
      },
      {
        key: "task_type", label: "Task Type", sortable: true, type: "custom",
        render: (row) => <PlannerTaskTypeCell row={row} />,
      },
      {
        key: "assigned_to", label: "Assigned to", sortable: true, type: "custom",
        render: (row) => (
          <PlannerTaskAssigneeCell row={row} hierarchyDataExtensions={hierarchyDataExtensions} />
        ),
      },
      {
        key: "priority", label: "Priority", sortable: true, type: "custom",
        render: (row) => <PlannerTaskPriorityCell row={row} />,
      },
      {
        key: "due_date", label: "Due date", sortable: true, type: "custom",
        render: (row) => <PlannerTaskDueDateCell row={row} />,
      },
      {
        key: "notes", label: "Notes", sortable: true, type: "custom",
        render: (row) => <PlannerTaskNotesCell row={row} />,
      },
      {
        key: "workflow_status", label: "Status", sortable: false, type: "custom",
        render: (row) => <PlannerTaskWorkflowStatusCell row={row} />,
      },
      {
        key: "repeat_status", label: "Repeat Status", sortable: false, type: "custom",
        render: (row) => <PlannerTaskRepeatStatusCell row={row} />,
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
          return (
            <PlannerTaskRowActionsMenu
              row={row}
              isOpen={openTaskActionsId === row.id}
              showAddToMyDay={sessionCanUseMyDay}
              canAddToMyDay={canAddTaskToMyDay(row)}
              alreadyInMyDay={isTaskInMyDay(listingTaskToAddToMyDayTarget(row))}
              canEditRow={canEditRow}
              canDeleteRow={canDeleteRow}
              editTitle={plannerTaskRowEditDeniedTitle(canEditRow)}
              deleteTitle={plannerTaskRowDeleteDeniedTitle(perms)}
              setOpenTaskActionsId={setOpenTaskActionsId}
              onAddToMyDay={() => requestAddTaskToMyDay(listingTaskToAddToMyDayTarget(row))}
              onEdit={() => openEdit(row)}
              onDelete={() => openDeleteConfirm(row)}
            />
          );
        },
      },
    ], [
      router,
      handleToggleComplete,
      openEdit,
      openConvertToRecurring,
      openDeleteConfirm,
      getTaskRowPermissions,
      openTaskActionsId,
      hierarchyDataExtensions,
      sessionCanConvertToRecurringPlannerTask,
      sessionCanUseMyDay,
      canAddTaskToMyDay,
      isTaskInMyDay,
      requestAddTaskToMyDay,
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
  
    const actions: TableAction<Task>[] = useMemo(() => {
      const list: TableAction<Task>[] = [];
      if (sessionCanUseMyDay) {
        list.push(addToMyDayTableAction);
      }
      return list;
    }, [addToMyDayTableAction, sessionCanUseMyDay]);
  
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

    const filterPills = useMemo(
      () => [
      {
        id: "project",
        label: fForm.project,
        isActive: fForm.project !== "All Projects",
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "project" ? null : "project")),
        onClear: () => { setFForm((prev) => ({ ...prev, project: "All Projects" })); setProjectSearch(""); },
      },
      {
        id: "assigned_to",
        label: `Assigned to (${fForm.assignee.length})`,
        isActive: fForm.assignee.length > 0,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "assigned_to" ? null : "assigned_to")),
        onClear: () => { setFForm((prev) => ({ ...prev, assignee: [] })); setAssigneeSearch(""); },
      },
      {
        id: "task_type",
        label: fForm.task_type
          ? TASK_TYPE_OPTIONS.find((o) => o.value === fForm.task_type?.value)?.label || "Task type"
          : "Task type",
        isActive: fForm.task_type != null,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "task_type" ? null : "task_type")),
        onClear: () => setFForm((prev) => ({ ...prev, task_type: null })),
      },
      {
        id: "status",
        label: statusFilterPillLabel,
        isActive: fForm.status !== ALL_STATUS_VALUE,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "status" ? null : "status")),
        onClear: () => setFForm((prev) => ({ ...prev, status: ALL_STATUS_VALUE })),
      },
      {
        id: "priority",
        label: priorityFilterPillLabel,
        isActive: fForm.priority != null,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "priority" ? null : "priority")),
        onClear: () => setFForm((prev) => ({ ...prev, priority: null })),
      },
      {
        id: "due_date",
        label: dueDateFilterPillLabel,
        isActive: !!(fForm.due_date_from || fForm.due_date_to),
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "due_date" ? null : "due_date")),
        onClear: () => setFForm((prev) => ({ ...prev, due_date_from: "", due_date_to: "" })),
      },
      {
        id: "queue",
        label: "Queue",
        isActive: false,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "queue" ? null : "queue")),
      },
      ],
      [
        fForm,
        statusFilterPillLabel,
        priorityFilterPillLabel,
        dueDateFilterPillLabel,
      ],
    );

    const hasActiveFilters = filterPills.some((p) => p.isActive);
  
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
  
        <BreadcrumbItem mainTitle="Planner" mainLink="/planner/dashboard" subTitle={breadcrumbSubTitle} />
  
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
              }}>{pageTitle}</h4>
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
                    backgroundColor: "#0066CC",
                    background: "#0066CC",
                    borderColor: "#0066CC",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "#333";
                    e.currentTarget.style.background = "#333";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "#0066CC";
                    e.currentTarget.style.background = "#0066CC";
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
          {!isTabLocked && (
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
            {allTabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 20px",
                  border: "none",
                  borderLeft: index === 0 ? "1px solid #8A8A8A" : "none",
                  borderRight: "1px solid #8A8A8A",
                  borderTop: "1px solid #8A8A8A",
                  backgroundColor: activeTab === tab.id ? "#f5f8fa" : "#fff",
                  borderBottom: activeTab === tab.id ? "2px solid #0066CC" : "1px solid #8A8A8A",
                  color: activeTab === tab.id ? "#0066CC" : "#141414",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
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
          )}

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
                {filterPills.map((pill, idx) => (
                  <div key={pill.id} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                    {idx > 0 && filterPills[idx - 1].isActive && !pill.isActive && (
                      <span style={{ color: "#cbd5e0", fontSize: 18, marginRight: 8, userSelect: "none" }}>|</span>
                    )}
                    <button
                      className={`gt-filter-pill${pill.isActive ? " gt-filter-pill-active" : ""}`}
                      onClick={pill.onClick}
                    >
                      {pill.icon && <span className="me-1">{pill.icon}</span>}
                      <span>{pill.label}</span>
                      {pill.isActive && pill.onClear && (
                        <button
                          type="button"
                          className="gt-filter-pill-clear"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            pill.onClear?.();
                          }}
                          title="Clear filter"
                        >
                          <X size={12} aria-hidden />
                        </button>
                      )}
                    </button>
                    {pill.id === "project" && openQuickFilter === "project" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 240,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        <div style={{ padding: "4px 4px 6px" }}>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search projects..."
                            value={projectSearch}
                            onChange={e => setProjectSearch(e.target.value)}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e0",
                              borderRadius: 4,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                              outline: "none",
                            }}
                          />
                        </div>
                        <div style={{ maxHeight: 220, overflowY: "auto" }}>
                          {projectOptions
                            .filter(o => o.label.toLowerCase().includes(projectSearch.toLowerCase()))
                            .map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setFForm({ ...fForm, project: option.value });
                                  setOpenQuickFilter(null);
                                  setProjectSearch("");
                                }}
                                style={{
                                  width: "100%",
                                  textAlign: "left",
                                  border: "none",
                                  background: option.value === fForm.project ? "#eef4ff" : "transparent",
                                  borderRadius: 6,
                                  padding: "8px 10px",
                                  fontSize: 12,
                                  fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  color: option.value === fForm.project ? "#0066CC" : "#141414",
                                  fontWeight: option.value === fForm.project ? 500 : 400,
                                  cursor: "pointer",
                                  transition: "background 0.15s ease",
                                }}
                                onMouseEnter={e => {
                                  if (option.value !== fForm.project)
                                    e.currentTarget.style.background = "#f5f8fa";
                                }}
                                onMouseLeave={e => {
                                  if (option.value !== fForm.project)
                                    e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <span>{option.label}</span>
                                {option.value === fForm.project && option.value !== "All Projects" && (
                                  <span style={{ color: "#0066CC", fontSize: 14, flexShrink: 0 }}>✓</span>
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                    {pill.id === "assigned_to" && openQuickFilter === "assigned_to" && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 30,
                        minWidth: 240,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                      }}>
                        <div style={{ padding: "4px 4px 6px" }}>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Search members..."
                            value={assigneeSearch}
                            onChange={e => setAssigneeSearch(e.target.value)}
                            style={{
                              width: "100%",
                              border: "1px solid #cbd5e0",
                              borderRadius: 4,
                              padding: "6px 10px",
                              fontSize: 13,
                              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                              outline: "none",
                            }}
                          />
                        </div>
                        <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        <button
                          onClick={() => {
                            setFForm((prev) => ({ ...prev, assignee: [] }));
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: fForm.assignee.length === 0 ? "#eef4ff" : "transparent",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 13,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            color: fForm.assignee.length === 0 ? "#0066CC" : "#141414",
                            fontWeight: fForm.assignee.length === 0 ? 500 : 400,
                            cursor: "pointer",
                          }}
                          onMouseEnter={e => { if (fForm.assignee.length > 0) e.currentTarget.style.background = "#f5f8fa"; }}
                          onMouseLeave={e => { if (fForm.assignee.length > 0) e.currentTarget.style.background = "transparent"; }}
                        >
                          All assignees
                        </button>
                        {assigneeOptions
                          .filter(o => o.label.toLowerCase().includes(assigneeSearch.toLowerCase()))
                          .map((option) => {
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
                                background: selected ? "#eef4ff" : "transparent",
                                borderRadius: 6,
                                padding: "8px 10px",
                                fontSize: 13,
                                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                                color: selected ? "#0066CC" : "#141414",
                                fontWeight: selected ? 500 : 400,
                                cursor: "pointer",
                              }}
                              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#f5f8fa"; }}
                              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>{option.label}</span>
                              {selected && (
                                <span style={{ color: "#0066CC", fontSize: 14, flexShrink: 0 }}>✓</span>
                              )}
                            </button>
                          );
                        })}
                        </div>
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
                            background: fForm.task_type ? "transparent" : "#eef4ff",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 13,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                            color: !fForm.task_type ? "#0066CC" : "#141414",
                            fontWeight: !fForm.task_type ? 500 : 400,
                            cursor: "pointer",
                          }}
                          onMouseEnter={e => { if (fForm.task_type) e.currentTarget.style.background = "#f5f8fa"; }}
                          onMouseLeave={e => { if (fForm.task_type) e.currentTarget.style.background = "transparent"; }}
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
                                background: selected ? "#eef4ff" : "transparent",
                                borderRadius: 6,
                                padding: "8px 10px",
                                fontSize: 13,
                                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                                color: selected ? "#0066CC" : "#141414",
                                fontWeight: selected ? 500 : 400,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#f5f8fa"; }}
                              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>{option.label}</span>
                              {selected && <span style={{ color: "#0066CC", fontSize: 14 }}>✓</span>}
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
                              background: option.value === fForm.status ? "#eef4ff" : "transparent",
                              borderRadius: 6,
                              padding: "8px 10px",
                              fontSize: 13,
                              fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                              color: option.value === fForm.status ? "#0066CC" : "#141414",
                              fontWeight: option.value === fForm.status ? 500 : 400,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                            onMouseEnter={e => { if (option.value !== fForm.status) e.currentTarget.style.background = "#f5f8fa"; }}
                            onMouseLeave={e => { if (option.value !== fForm.status) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span>{option.label}</span>
                            {option.value === fForm.status && <span style={{ color: "#0066CC", fontSize: 14 }}>✓</span>}
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
                            background: fForm.priority ? "transparent" : "#eef4ff",
                            borderRadius: 6,
                            padding: "8px 10px",
                            fontSize: 13,
                            fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                            color: !fForm.priority ? "#0066CC" : "#141414",
                            fontWeight: !fForm.priority ? 500 : 400,
                            cursor: "pointer",
                          }}
                          onMouseEnter={e => { if (fForm.priority) e.currentTarget.style.background = "#f5f8fa"; }}
                          onMouseLeave={e => { if (fForm.priority) e.currentTarget.style.background = "transparent"; }}
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
                                background: selected ? "#eef4ff" : "transparent",
                                borderRadius: 6,
                                padding: "8px 10px",
                                fontSize: 13,
                                fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                                color: selected ? "#0066CC" : "#141414",
                                fontWeight: selected ? 500 : 400,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#f5f8fa"; }}
                              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                            >
                              <span>{option.label}</span>
                              {selected && <span style={{ color: "#0066CC", fontSize: 14 }}>✓</span>}
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
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetCurrentFilters}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e53e3e",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "Lexend Deca, Helvetica, Arial, sans-serif",
                      cursor: "pointer",
                      padding: "4px 8px",
                      textDecoration: "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
  
            {/* RIGHT */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
              <button
                type="button"
                onClick={applyCurrentFilters}
                style={{
                  ...TASK_LIST_BTN_OUTLINE,
                  backgroundColor: "#0066CC",
                  background: "#0066CC",
                  borderColor: "#0066CC",
                  color: "#fff",
                  fontWeight: 600,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = "#0052A3";
                  e.currentTarget.style.background = "#0052A3";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = "#0066CC";
                  e.currentTarget.style.background = "#0066CC";
                }}
              >
                Apply filters
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
            wrapperClassName="ptl-search-row-border"
            editColumnsSlot={
              <PlannerTasksEditColumnsDropdown
                columns={columns}
                visibleTaskColumnKeys={visibleTaskColumnKeys}
                toggleTaskColumnVisibility={toggleTaskColumnVisibility}
                selectAllTaskColumns={selectAllTaskColumns}
                resetTaskColumnsToDefault={resetTaskColumnsToDefault}
              />
            }
          />
  
          {/* ══════════════════════════════════════════════════════
              ROW 5 — Table (fills remaining height)
          ══════════════════════════════════════════════════════ */}
          <div className="ptl-table-wrap">
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
            invalidateTaskLists();
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
          showAddToMyDay={sessionCanUseMyDay}
          canAddToMyDay={
            editingTask != null && canAddTaskToMyDay(listingTaskToAddToMyDayTarget(editingTask))
          }
          alreadyInMyDay={
            editingTask != null && isTaskInMyDay(listingTaskToAddToMyDayTarget(editingTask))
          }
          onAddToMyDay={() => {
            if (editingTask) {
              requestAddTaskToMyDay(listingTaskToAddToMyDayTarget(editingTask));
            }
          }}
        />
  
        {/* ── Delete confirmation ── */}
        <PlannerAddToMyDayEstimateModal
          show={addToMyDayPendingTask != null}
          taskTitle={addToMyDayPendingTask?.title ?? ""}
          estimateInput={addToMyDayEstimateInput}
          onEstimateInputChange={setAddToMyDayEstimateInput}
          onClose={closeAddToMyDayEstimateModal}
          onSkip={skipAddToMyDayEstimate}
          onConfirm={confirmAddToMyDayEstimate}
        />

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
  