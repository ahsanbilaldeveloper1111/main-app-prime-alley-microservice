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
import { ChevronDown } from "lucide-react";
import GenericTable, { TableColumn, TableAction } from "@components/GenericTable";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import {
  listTasks,
  getProject,
  deleteTask as deleteTaskApi,
  completeTask,
  incompleteTask,
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
import { plannerKeys } from "../../../query/keys";
import {
  ALL_STATUS_VALUE,
  applyPlannerTaskFiltersToListParams,
  applyPlannerTaskTabToListParams,
  plannerTaskListTodayTriple,
} from "@utils/taskListing/plannerTasksQueryParams";
import {
  buildTaskListingPageStyleTag,
  TaskListingSearchRow,
} from "@utils/taskListing/taskListUiPrimitives";
import {
  type Task,
  type ApiTask,
  type TasksListingPageProps,
  type PlannerWorkflowStatusRow,
  type HierarchyExtension,
  resolvePlannerListTaskDueDate,
  lookupHierarchyExtensionDisplayName,
  TASK_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  INITIAL_FILTER_FORM,
  DEFAULT_TASK_TABLE_COLUMN_KEYS,
  readVisibleTaskColumnKeysFromStorage,
  persistVisibleTaskColumnKeys,
  POSSIBLE_TABS,
  TASK_VIEW_TAB_IDS,
  DEFAULT_VISIBLE_TAB_IDS,
  normalizePlannerStatusesFromApi,
  PROJECT_DETAILS_STATUS_WITH,
  stripHtmlTags,
  normalizeVisibleTabIdsForStorage,
  persistVisibleTabIds,
  getInitialVisibleTabIds,
  orderTaskColumnKeysByDefault,
} from "@components/planner/plannerTasksListing/plannerTasksListingDomain";
import { PlannerTasksTabsBar } from "@components/planner/plannerTasksListing/PlannerTasksTabsBar";
import { PlannerTasksPageHeader } from "@components/planner/plannerTasksListing/PlannerTasksPageHeader";
import { PlannerTasksQuickFiltersRow } from "@components/planner/plannerTasksListing/PlannerTasksQuickFiltersRow";
import { PlannerTasksEditColumnsDropdown } from "@components/planner/plannerTasksListing/PlannerTasksEditColumnsDropdown";
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
import "@components/planner/plannerTasksListing/plannerTasksListing.scss";

export type { TasksListingPageProps } from "@components/planner/plannerTasksListing/plannerTasksListingDomain";

const { PERMISSIONS } = HEADER_CONSTANTS;

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
    const quickFilterRef = useRef<HTMLDivElement | null>(null);

    // ── Create/edit task sidebar ──────────────────────────────────────────────────
    const [showCreate, setShowCreate]   = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editingTaskEditScope, setEditingTaskEditScope] = useState<
      "none" | "limited" | "full"
    >("full");
  
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
            sidebarProject?.id != null ? Number(sidebarProject.id) : null,
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
        setEditingTask(row);
        setEditingTaskEditScope(perms.taskEditScope);
        setShowCreate(true);
      },
      [getTaskRowPermissions],
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
              canEditRow={canEditRow}
              canDeleteRow={canDeleteRow}
              editTitle={plannerTaskRowEditDeniedTitle(canEditRow)}
              deleteTitle={plannerTaskRowDeleteDeniedTitle(perms)}
              setOpenTaskActionsId={setOpenTaskActionsId}
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
      openDeleteConfirm,
      getTaskRowPermissions,
      openTaskActionsId,
      hierarchyDataExtensions,
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

    const filterPills = useMemo(
      () => [
      {
        id: "project",
        label: fForm.project,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "project" ? null : "project")),
      },
      {
        id: "assigned_to",
        label: `Assigned to (${fForm.assignee.length})`,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "assigned_to" ? null : "assigned_to")),
      },
      {
        id: "task_type",
        label: fForm.task_type
          ? TASK_TYPE_OPTIONS.find((o) => o.value === fForm.task_type?.value)?.label || "Task type"
          : "Task type",
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "task_type" ? null : "task_type")),
      },
      {
        id: "status",
        label: statusFilterPillLabel,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "status" ? null : "status")),
      },
      {
        id: "priority",
        label: priorityFilterPillLabel,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "priority" ? null : "priority")),
      },
      {
        id: "due_date",
        label: dueDateFilterPillLabel,
        icon: <ChevronDown size={12} />,
        onClick: () => setOpenQuickFilter((prev) => (prev === "due_date" ? null : "due_date")),
      },
      {
        id: "queue",
        label: "Queue",
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
        
        <div className="tasks-page ptl-page">
          <PlannerTasksPageHeader
            total={total}
            showCreateTaskButton={showCreateTaskButton}
            onCreateTaskClick={() => {
              setEditingTask(null);
              setShowCreate(true);
            }}
          />

          <PlannerTasksTabsBar
            allTabs={allTabs}
            activeTab={activeTab}
            switchTab={switchTab}
            visibleTabIds={visibleTabIds}
            setVisibleTabIds={setVisibleTabIds}
            showAddViewModal={showAddViewModal}
            setShowAddViewModal={setShowAddViewModal}
            toggleVisibleTab={toggleVisibleTab}
          />

          <PlannerTasksQuickFiltersRow
            quickFilterRef={quickFilterRef}
            filterPills={filterPills}
            openQuickFilter={openQuickFilter}
            fForm={fForm}
            setFForm={setFForm}
            setOpenQuickFilter={setOpenQuickFilter}
            projectOptions={projectOptions}
            assigneeOptions={assigneeOptions}
            taskTypeFilterOptions={taskTypeFilterOptions}
            statusFilterOptions={statusFilterOptions}
            applyCurrentFilters={applyCurrentFilters}
            resetCurrentFilters={resetCurrentFilters}
          />
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
  