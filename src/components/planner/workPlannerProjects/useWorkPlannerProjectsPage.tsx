import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { ModuleSlug, formatDateGlobal, formatDateTimeGlobal, getAutoTimezone } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  canAdministerProjectFromMembers,
  getSessionPhoneOrExtension,
} from "@planner/projectMemberRole";
import type { FilterOption, FilterField } from "@components/GenericFilterSidebar";
import {
  type TableAction,
  type TableColumn,
  type ToolbarConfig,
  type FilterPill,
  type TabConfig,
} from "@components/GenericTable";
import { type StatsCardData } from "@components/GenericStatsCards";
import {
  FolderOpen,
  Folder,
  CalendarDays,
  AlertCircle,
  MoreVertical,
  Eye,
  Settings,
  Trash2,
  Plus,
} from "lucide-react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  type ApiProject,
  type Project,
  type ProjectFormState,
  type ProjectStatusFilter,
  PROJECT_NAME_MAX_LENGTH,
  apiStatusToProjectFormStatus,
  coerceProjectStatusFilter,
  createEmptyProjectForm,
  formatApiDateForProjectInput,
  isProjectStatusFilterActive,
} from "@planner/workPlannerProjectsDomain";
import {
  applyProjectTabChangeAndRefetch,
  clampProjectDateRangeOnStartChange,
  confirmDeleteProjectAndRefresh,
  getProjectDateRangePillLabel,
  loadProjectSidebarData,
  loadProjectsFromApi,
  normalizeProjectEndDateByStart,
  projectMatchesFilters,
  submitPlannerProjectForm,
  type AppliedProjectFilters,
  type ProjectListFetchParams,
  type ProjectPaginationState,
  type ProjectStatsState,
} from "./workPlannerProjectsPageApi";
import type { WorkPlannerProjectsPageViewModel } from "./workPlannerProjectsPageViewModel";

const { PERMISSIONS } = HEADER_CONSTANTS;

export function useWorkPlannerProjectsPage(): WorkPlannerProjectsPageViewModel {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  const sessionPlannerProjectCrud = useMemo(
    () => ({
      canCreate: hasPermission(PERMISSIONS.CREATE_PROJECTS_WORK_PLANNER),
      canUpdate: hasPermission(PERMISSIONS.UPDATE_PROJECTS_WORK_PLANNER),
      canDelete: hasPermission(PERMISSIONS.DELETE_PROJECTS_WORK_PLANNER),
    }),
    [hasPermission],
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
  const [stats, setStats] = useState<ProjectStatsState>({
    activeProjects: 0,
    totalProjects: 0,
    tasksDueThisWeek: 0,
    overdueAcrossProjects: 0,
  });
  const [pagination, setPagination] = useState<ProjectPaginationState>({
    page: 1,
    limit: 15,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  });
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
  const [projectActivities, setProjectActivities] = useState<unknown[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [overdueTasks, setOverdueTasks] = useState<unknown[]>([]);
  const [loadingOverdueTasks, setLoadingOverdueTasks] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [detailTab, setDetailTab] = useState("Activity");

  const listRequestGenRef = useRef(0);
  const mountedRef = useRef(true);
  const sidebarDetailRequestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const resetProjectModalState = useCallback(() => {
    setShowProjectModal(false);
    setEditingProject(null);
    setProjectFormData(createEmptyProjectForm());
  }, []);

  const fetchProjects = useCallback(
    async (filters?: ProjectListFetchParams) => {
      const id = ++listRequestGenRef.current;
      await loadProjectsFromApi({
        filters,
        pagination,
        setLoading,
        setProjects,
        setPagination,
        setStats,
        shouldApplyResults: () =>
          mountedRef.current && listRequestGenRef.current === id,
        isActiveRequest: () => listRequestGenRef.current === id,
      });
    },
    [pagination.page, pagination.limit],
  );

  const scheduleFetchProjects = useCallback((filters?: ProjectListFetchParams) => {
    fetchProjects(filters).catch((err) => {
      console.error("[useWorkPlannerProjectsPage] fetchProjects failed", err);
    });
  }, [fetchProjects]);

  useEffect(() => {
    if (!hierarchyLoading) {
      scheduleFetchProjects({
        search: searchTerm,
        status: filterStatus,
        ownerExtensionNumbers: filterOwnerExtensions,
        startDateFrom: filterStartDateFrom,
        endDateTo: filterEndDateTo,
      });
    }
  }, [pagination.page, pagination.limit, hierarchyLoading, scheduleFetchProjects]);

  const handleCreateProject = useCallback(() => {
    if (!sessionPlannerProjectCrud.canCreate) {
      toast.error("You are not authorized to create projects");
      return;
    }
    setEditingProject(null);
    setProjectFormData(createEmptyProjectForm());
    setShowProjectModal(true);
  }, [sessionPlannerProjectCrud.canCreate]);

  const handleEditProject = useCallback(
    (project: Project) => {
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
    },
    [sessionPlannerProjectCrud.canUpdate],
  );

  const handleDeleteProject = useCallback(
    (project: Project) => {
      if (!sessionPlannerProjectCrud.canDelete) {
        toast.error("You are not authorized to delete projects");
        return;
      }
      setProjectToDelete(project);
      setShowDeleteModal(true);
    },
    [sessionPlannerProjectCrud.canDelete],
  );

  const confirmDelete = useCallback(async () => {
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
  }, [sessionPlannerProjectCrud.canDelete, projectToDelete, fetchProjects, appliedFilters]);

  const handleSubmitProject = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [
      editingProject,
      sessionPlannerProjectCrud,
      projectFormData,
      appliedFilters,
      fetchProjects,
      resetProjectModalState,
    ],
  );

  const handleProjectClick = useCallback(
    async (project: Project) => {
      const id = ++sidebarDetailRequestRef.current;
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
        requestId: id,
        activeRequestRef: sidebarDetailRequestRef,
      });
    },
    [],
  );

  const formatTimeAgo = useCallback((dateString: string) => {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return formatDateGlobal(dateString);
  }, []);

  const formatDateTime = useCallback((dateString: string) => formatDateTimeGlobal(dateString), []);

  const getUserNameFromExtension = useCallback(
    (extensionNumber: string): string => {
      if (!extensionNumber || !hierarchyDataExtensions || hierarchyDataExtensions.length === 0) {
        return extensionNumber || "Unknown";
      }
      const extension = (hierarchyDataExtensions as any[]).find(
        (ext: any) =>
          ext.extension_number === extensionNumber ||
          ext.id === extensionNumber ||
          String(ext.id) === String(extensionNumber),
      );
      return extension?.user?.name || extension?.name || extensionNumber || "Unknown";
    },
    [hierarchyDataExtensions],
  );

  const getInitials = useCallback(
    (extensionNumber: string) => {
      if (!extensionNumber || extensionNumber === "system") return "SY";
      const userName = getUserNameFromExtension(extensionNumber);
      if (userName !== extensionNumber && userName !== "Unknown") {
        return userName
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 1)
          .toUpperCase();
      }
      return extensionNumber.substring(0, 2).toUpperCase();
    },
    [getUserNameFromExtension],
  );

  const getAvatarColor = useCallback((extensionNumber: string, index: number) => {
    const colors = ["#667eea", "#f56565", "#48bb78", "#ed64a6", "#4299e1", "#9f7aea", "#fc8181", "#f59e0b"];
    if (extensionNumber === "system") return "#6b7280";
    return colors[index % colors.length];
  }, []);

  const getActionColor = useCallback((action: string) => {
    const map: Record<string, string> = {
      status_changed: "#3b82f6",
      updated: "#f59e0b",
      created: "#10b981",
      completed: "#10b981",
      deleted: "#ef4444",
    };
    return map[action] || "#6b7280";
  }, []);

  const clearFilters = useCallback(() => {
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
    scheduleFetchProjects({ ...cleared, page: 1 });
  }, [scheduleFetchProjects]);

  const handleApplyFilters = useCallback(() => {
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
    scheduleFetchProjects({ ...next, page: 1 });
  }, [
    searchTerm,
    filterStatus,
    filterOwnerExtensions,
    filterTeam,
    filterStartDateFrom,
    filterEndDateTo,
    scheduleFetchProjects,
  ]);

  const applyProjectStatusFromPill = useCallback(
    (status: ProjectStatusFilter) => {
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
      scheduleFetchProjects({ ...next, page: 1 });
    },
    [
      searchTerm,
      filterOwnerExtensions,
      filterTeam,
      filterStartDateFrom,
      filterEndDateTo,
      scheduleFetchProjects,
    ],
  );

  const clearDateFiltersAndRefetch = useCallback(() => {
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
    scheduleFetchProjects({ ...next, page: 1 });
  }, [searchTerm, filterStatus, filterOwnerExtensions, filterTeam, scheduleFetchProjects]);

  const handleProjectStartDateChange = useCallback((value = "") => {
    setFilterStartDateFrom(value);
    setFilterEndDateTo((prevEnd) => clampProjectDateRangeOnStartChange(value, prevEnd));
  }, []);

  const handleProjectEndDateChange = useCallback(
    (value = "") => {
      const start = filterStartDateFrom.trim();
      setFilterEndDateTo(normalizeProjectEndDateByStart(value, start));
    },
    [filterStartDateFrom],
  );

  const dateRangePillActiveLabelCb = useCallback(() => {
    return getProjectDateRangePillLabel(filterStartDateFrom, filterEndDateTo);
  }, [filterStartDateFrom, filterEndDateTo]);

  const handleTabChange = useCallback(
    (tabId: string) => {
      applyProjectTabChangeAndRefetch({
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
      }).catch(() => undefined);
    },
    [
      searchTerm,
      filterOwnerExtensions,
      filterTeam,
      filterStartDateFrom,
      filterEndDateTo,
      fetchProjects,
    ],
  );

  const filteredProjects = useMemo(
    () => projects.filter((project) => projectMatchesFilters(project, appliedFilters)),
    [projects, appliedFilters],
  );

  const userOptions = useMemo(() => {
    const list = (hierarchyDataExtensions as any[]) || [];
    const seen = new Set<string>();
    return list
      .map((ext: any) => ({
        value: String(ext?.extension_number || ext?.id || "").trim(),
        label: String(ext?.user?.name || ext?.name || "").trim(),
      }))
      .filter((o) => o.value && !seen.has(o.value) && seen.add(o.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [hierarchyDataExtensions]);

  const clearOwnerFilterAndRefetch = useCallback(() => {
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
    scheduleFetchProjects({ ...next, page: 1 });
  }, [searchTerm, filterStatus, filterTeam, filterStartDateFrom, filterEndDateTo, scheduleFetchProjects]);

  const applyOwnerExtensionsAndRefetch = useCallback(
    (extensions: string[]) => {
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
      scheduleFetchProjects({ ...next, page: 1 });
    },
    [searchTerm, filterStatus, filterTeam, filterStartDateFrom, filterEndDateTo, scheduleFetchProjects],
  );

  const applyOwnerExtensionsRef = useRef(applyOwnerExtensionsAndRefetch);
  applyOwnerExtensionsRef.current = applyOwnerExtensionsAndRefetch;
  const clearOwnerFilterRef = useRef(clearOwnerFilterAndRefetch);
  clearOwnerFilterRef.current = clearOwnerFilterAndRefetch;

  const statuses = useMemo(
    () =>
      [
        { value: "all" as const, label: "All Status" },
        { value: "active" as const, label: "active" },
        { value: "archived" as const, label: "archived" },
        { value: "completed" as const, label: "completed" },
      ] as const,
    [],
  );

  const filterFields: FilterField[] = useMemo(
    () => [
      {
        id: "search",
        label: "Search",
        type: "text",
        value: searchTerm,
        onChange: (v: string) => setSearchTerm(v ?? ""),
        placeholder: "Search projects...",
      },
      {
        id: "status",
        label: "Status",
        type: "dropdown",
        value: filterStatus,
        onChange: (v) => setFilterStatus(coerceProjectStatusFilter(v)),
        options: [...statuses],
      },
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
    ],
    [
      searchTerm,
      filterStatus,
      filterOwnerExtensions,
      filterStartDateFrom,
      filterEndDateTo,
      userOptions,
      getUserNameFromExtension,
      handleProjectStartDateChange,
      handleProjectEndDateChange,
      statuses,
    ],
  );

  const statsCardsData: StatsCardData[] = useMemo(
    () => [
      { title: "Active Projects", value: stats.activeProjects, icon: FolderOpen, iconColor: "#0ea5e9", iconBgColor: "#e0f2fe" },
      { title: "Total Projects", value: stats.totalProjects, icon: Folder, iconColor: "#3b82f6", iconBgColor: "#dbeafe" },
      { title: "Tasks Due This Week", value: stats.tasksDueThisWeek, icon: CalendarDays, iconColor: "#3b82f6", iconBgColor: "#eff6ff" },
      { title: "Overdue Across Projects", value: stats.overdueAcrossProjects, icon: AlertCircle, iconColor: "#ef4444", iconBgColor: "#fef2f2" },
    ],
    [stats],
  );

  const tabsConfig: TabConfig[] = useMemo(
    () => [
      { id: "all", label: "All Projects", count: stats.totalProjects, removable: false },
      { id: "active", label: "Active", count: stats.activeProjects, removable: false },
      ...customTabs,
    ],
    [stats.totalProjects, stats.activeProjects, customTabs],
  );

  const filterPills: FilterPill[] = useMemo(
    () => [
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
        id: "date_range",
        label: "Dates",
        active: Boolean(filterStartDateFrom.trim() || filterEndDateTo.trim()),
        activeLabel: dateRangePillActiveLabelCb(),
        showDropdown: true,
        dropdownContent: (
          <div className="d-flex flex-column gap-2 wp-filter-date-dropdown">
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
    ],
    [
      filterStatus,
      filterStartDateFrom,
      filterEndDateTo,
      applyProjectStatusFromPill,
      dateRangePillActiveLabelCb,
      handleProjectStartDateChange,
      handleProjectEndDateChange,
      handleApplyFilters,
      clearDateFiltersAndRefetch,
    ],
  );

  const toolbarConfig: ToolbarConfig = useMemo(
    () => ({
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
      rightActions: sessionPlannerProjectCrud.canCreate ? (
        <button type="button" className="wp-create-project-toolbar-btn" onClick={handleCreateProject}>
          <Plus size={18} />
          <span>Create Project</span>
        </button>
      ) : null,
    }),
    [
      tabsConfig,
      activeTab,
      handleTabChange,
      searchTerm,
      handleApplyFilters,
      filterPills,
      sessionPlannerProjectCrud.canCreate,
      handleCreateProject,
    ],
  );

  const handleCloseFilterSidebar = useCallback(() => setShowFilterSidebar(false), []);
  const handleApplyFiltersAndClose = useCallback(() => {
    handleApplyFilters();
    setShowFilterSidebar(false);
  }, [handleApplyFilters]);

  const submitButtonText = editingProject ? "Update Project" : "Create Project";
  const submittingButtonText = editingProject ? "Updating..." : "Creating...";

  const projectTableColumns: TableColumn<Project>[] = useMemo(
    () => [
      { key: "name", label: "Project Name", sortable: true, accessor: (row) => row.name },
      { key: "members", label: "Members", sortable: true, accessor: (row) => row.members?.length ?? 0 },
      { key: "open", label: "Open", sortable: true, accessor: (row) => row.open },
      { key: "overdue", label: "Overdue", sortable: true, accessor: (row) => row.overdue },
      { key: "lastUpdate", label: "Last Update", sortable: true, accessor: (row) => row.lastUpdate },
    ],
    [],
  );

  const projectTableActions: TableAction<Project>[] = useMemo(
    () => [
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
    ],
    [router, sessionUserPhoneOrExtension, handleEditProject, handleDeleteProject],
  );

  const refreshProjectsList = useCallback(async () => {
    await fetchProjects(appliedFilters);
  }, [fetchProjects, appliedFilters]);

  return {
    hierarchyDataExtensions,
    sessionPlannerProjectCrud,
    sessionUserPhoneOrExtension,
    filteredProjects,
    loading,
    showFilterSidebar,
    handleCloseFilterSidebar,
    handleApplyFiltersAndClose,
    pagination,
    setPagination,
    toolbarConfig,
    statsCardsData,
    projectTableColumns,
    projectTableActions,
    filterFields,
    clearFilters,
    handleProjectClick,
    handleEditProject,
    handleDeleteProject,
    showProjectDetail,
    setShowProjectDetail,
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
    showProjectModal,
    resetProjectModalState,
    editingProject,
    projectFormData,
    setProjectFormData,
    submitting,
    submitButtonText,
    submittingButtonText,
    handleSubmitProject,
    showDeleteModal,
    setShowDeleteModal,
    setProjectToDelete,
    projectToDelete,
    deleting,
    confirmDelete,
    applyOwnerExtensionsRef,
    clearOwnerFilterRef,
    refreshProjectsList,
  };
}
