import type { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  getProject,
  getRecentActivity,
  getOverdueTasks,
} from "@utils/tasks";
import {
  mapApiProjectToProject,
  todayYmdLocal,
  type ApiProject,
  type Project,
  type ProjectFormState,
  type ProjectStatusFilter,
  PROJECT_NAME_MAX_LENGTH,
} from "@planner/workPlannerProjectsDomain";

// ——— Types ———

export type AppliedProjectFilters = {
  search: string;
  status: ProjectStatusFilter;
  ownerExtensionNumbers: string[];
  team: string;
  startDateFrom: string;
  endDateTo: string;
};

export type ProjectListFetchParams = Partial<AppliedProjectFilters> & { page?: number };

export type ProjectPaginationState = {
  page: number;
  limit: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

export type ProjectStatsState = {
  activeProjects: number;
  totalProjects: number;
  tasksDueThisWeek: number;
  overdueAcrossProjects: number;
};

export type LoadProjectsFromApiArgs = {
  filters?: ProjectListFetchParams;
  pagination: Pick<ProjectPaginationState, "page" | "limit">;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setPagination: Dispatch<SetStateAction<ProjectPaginationState>>;
  setStats: Dispatch<SetStateAction<ProjectStatsState>>;
  /** When false, skip applying results (unmounted or superseded request). */
  shouldApplyResults: () => boolean;
};

type SuccessfulProjectsListPayload = {
  success: true;
  data: ApiProject[];
  pagination?: Partial<ProjectPaginationState>;
  summary?: {
    active?: number;
    total?: number;
    task_due_this_week?: number;
    overdue_tasks?: number;
  };
};

function buildListProjectsParams(
  filters: ProjectListFetchParams | undefined,
  pagination: Pick<ProjectPaginationState, "page" | "limit">,
): Parameters<typeof listProjects>[0] {
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
  return {
    page: pageForRequest,
    limit: pagination.limit,
    search: filters?.search || "",
    status: statusParam,
    extension_numbers: extensionNumbers,
    start_date_from: startFrom,
    end_date_to: endTo,
  };
}

function isSuccessfulProjectsListPayload(
  response: unknown,
): response is SuccessfulProjectsListPayload {
  if (response == null || typeof response !== "object") {
    return false;
  }
  const r = response as { success?: unknown; data?: unknown };
  return r.success === true && Array.isArray(r.data);
}

function applySuccessfulProjectsListPayload(
  response: SuccessfulProjectsListPayload,
  setProjects: Dispatch<SetStateAction<Project[]>>,
  setPagination: Dispatch<SetStateAction<ProjectPaginationState>>,
  setStats: Dispatch<SetStateAction<ProjectStatsState>>,
): void {
  setProjects(response.data.map((p) => mapApiProjectToProject(p)));
  if (response.pagination) {
    setPagination((prev) => ({ ...prev, ...response.pagination }));
  }
  const summary = response.summary;
  if (!summary) {
    return;
  }
  setStats({
    activeProjects: summary.active ?? 0,
    totalProjects: summary.total ?? 0,
    tasksDueThisWeek: summary.task_due_this_week ?? 0,
    overdueAcrossProjects: summary.overdue_tasks ?? 0,
  });
}

export async function loadProjectsFromApi({
  filters,
  pagination,
  setLoading,
  setProjects,
  setPagination,
  setStats,
  shouldApplyResults,
}: LoadProjectsFromApiArgs): Promise<void> {
  try {
    setLoading(true);
    const response = await listProjects(buildListProjectsParams(filters, pagination));

    if (!shouldApplyResults()) {
      return;
    }

    if (isSuccessfulProjectsListPayload(response)) {
      applySuccessfulProjectsListPayload(response, setProjects, setPagination, setStats);
    } else {
      setProjects([]);
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    if (shouldApplyResults()) {
      setProjects([]);
    }
  } finally {
    if (shouldApplyResults()) {
      setLoading(false);
    }
  }
}

export type LoadProjectSidebarDataArgs = {
  project: Project;
  setSelectedProject: Dispatch<SetStateAction<Project | null>>;
  setShowProjectDetail: Dispatch<SetStateAction<boolean>>;
  setLoadingProjectDetails: Dispatch<SetStateAction<boolean>>;
  setLoadingActivities: Dispatch<SetStateAction<boolean>>;
  setLoadingOverdueTasks: Dispatch<SetStateAction<boolean>>;
  setSelectedProjectDetails: Dispatch<SetStateAction<ApiProject | null>>;
  setProjectActivities: Dispatch<SetStateAction<unknown[]>>;
  setOverdueTasks: Dispatch<SetStateAction<unknown[]>>;
  requestId: number;
  activeRequestRef: { current: number };
};

export async function loadProjectSidebarData({
  project,
  setSelectedProject,
  setShowProjectDetail,
  setLoadingProjectDetails,
  setLoadingActivities,
  setLoadingOverdueTasks,
  setSelectedProjectDetails,
  setProjectActivities,
  setOverdueTasks,
  requestId,
  activeRequestRef,
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
    if (activeRequestRef.current !== requestId) {
      return;
    }
    setSelectedProjectDetails(projectDetails || project.apiData || null);
    setProjectActivities(Array.isArray(activities) ? activities : []);
    setOverdueTasks(Array.isArray(overdue) ? overdue : []);
  } catch (error) {
    console.error("Error fetching project details:", error);
    if (activeRequestRef.current !== requestId) {
      return;
    }
    setSelectedProjectDetails(project.apiData || null);
    setProjectActivities([]);
    setOverdueTasks([]);
  } finally {
    if (activeRequestRef.current === requestId) {
      setLoadingProjectDetails(false);
      setLoadingActivities(false);
      setLoadingOverdueTasks(false);
    }
  }
}

export type SubmitPlannerProjectParams = {
  editingProject: Project | null;
  projectFormData: ProjectFormState;
  setSubmitting: Dispatch<SetStateAction<boolean>>;
  appliedFilters: AppliedProjectFilters;
  fetchProjects: (filters?: ProjectListFetchParams) => Promise<void>;
  resetProjectModalState: () => void;
};

export type ConfirmDeleteProjectParams = {
  projectToDelete: Project | null;
  setDeleting: Dispatch<SetStateAction<boolean>>;
  fetchProjects: (filters?: ProjectListFetchParams) => Promise<void>;
  appliedFilters: AppliedProjectFilters;
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>;
  setProjectToDelete: Dispatch<SetStateAction<Project | null>>;
};

export type ApplyProjectTabChangeArgs = {
  tabId: string;
  searchTerm: string;
  filterOwnerExtensions: string[];
  filterTeam: string;
  filterStartDateFrom: string;
  filterEndDateTo: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setFilterStatus: Dispatch<SetStateAction<ProjectStatusFilter>>;
  setPagination: Dispatch<SetStateAction<ProjectPaginationState>>;
  setAppliedFilters: Dispatch<SetStateAction<AppliedProjectFilters>>;
  fetchProjects: (filters?: ProjectListFetchParams) => Promise<void>;
};

export async function applyProjectTabChangeAndRefetch({
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

export function clampProjectDateRangeOnStartChange(value: string, prevEnd: string): string {
  if (value && prevEnd && prevEnd < value) {
    return value;
  }
  return prevEnd;
}

export function normalizeProjectEndDateByStart(value: string, start: string): string {
  if (value && start && value < start) {
    return start;
  }
  return value;
}

export function getProjectDateRangePillLabel(fromRaw: string, toRaw: string): string | undefined {
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

export async function confirmDeleteProjectAndRefresh({
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

export async function submitPlannerProjectForm({
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

export function projectMatchesFilters(project: Project, appliedFilters: AppliedProjectFilters): boolean {
  const matchesSearch =
    project.name.toLowerCase().includes(appliedFilters.search.toLowerCase()) ||
    project.id.toLowerCase().includes(appliedFilters.search.toLowerCase());
  const projectStatusKey = String(project.apiData?.status || project.status || "").toLowerCase();
  const matchesStatus = appliedFilters.status === "all" || projectStatusKey === appliedFilters.status;
  const projectOwnerExt = project.apiData?.owner_extension_number || project.owner;
  const matchesOwner =
    appliedFilters.ownerExtensionNumbers.length === 0 ||
    appliedFilters.ownerExtensionNumbers.some((ext) => String(projectOwnerExt || "") === String(ext));
  const projectMembers = (project.apiData?.members || project.members || []) as unknown[];
  const matchesTeam =
    appliedFilters.team === "All Teams" ||
    projectMembers.some(
      (m: unknown) =>
        String((m as { extension_number?: string; name?: string })?.extension_number || (m as { name?: string })?.name || "") ===
        String(appliedFilters.team),
    );
  return matchesSearch && matchesStatus && matchesOwner && matchesTeam;
}
