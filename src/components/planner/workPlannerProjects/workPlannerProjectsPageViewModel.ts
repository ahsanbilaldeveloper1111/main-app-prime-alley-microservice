import type { Dispatch, FormEvent, MutableRefObject, SetStateAction } from "react";
import type { FilterField } from "@components/GenericFilterSidebar";
import type {
  TableAction,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import type { StatsCardData } from "@components/GenericStatsCards";
import type { ApiProject, Project, ProjectFormState } from "@planner/workPlannerProjectsDomain";
import type { ProjectPaginationState } from "./workPlannerProjectsPageApi";

/** Values and handlers passed from `useWorkPlannerProjectsPage` to the page shell. */
export type WorkPlannerProjectsPageViewModel = {
  hierarchyDataExtensions: unknown;
  sessionPlannerProjectCrud: { canCreate: boolean; canUpdate: boolean; canDelete: boolean };
  sessionUserPhoneOrExtension: string;
  filteredProjects: Project[];
  loading: boolean;
  showFilterSidebar: boolean;
  handleCloseFilterSidebar: () => void;
  handleApplyFiltersAndClose: () => void;
  pagination: ProjectPaginationState;
  setPagination: Dispatch<SetStateAction<ProjectPaginationState>>;
  toolbarConfig: ToolbarConfig;
  statsCardsData: StatsCardData[];
  projectTableColumns: TableColumn<Project>[];
  projectTableActions: TableAction<Project>[];
  filterFields: FilterField[];
  clearFilters: () => void;
  handleProjectClick: (project: Project) => Promise<void>;
  handleEditProject: (project: Project) => void;
  handleDeleteProject: (project: Project) => void;
  showProjectDetail: boolean;
  setShowProjectDetail: Dispatch<SetStateAction<boolean>>;
  selectedProject: Project | null;
  selectedProjectDetails: ApiProject | null;
  loadingProjectDetails: boolean;
  loadingOverdueTasks: boolean;
  overdueTasks: unknown[];
  detailTab: string;
  setDetailTab: Dispatch<SetStateAction<string>>;
  loadingActivities: boolean;
  projectActivities: unknown[];
  getUserNameFromExtension: (extensionNumber: string) => string;
  getAvatarColor: (extensionNumber: string, index: number) => string;
  getInitials: (extensionNumber: string) => string;
  getActionColor: (action: string) => string;
  formatTimeAgo: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
  showProjectModal: boolean;
  resetProjectModalState: () => void;
  editingProject: Project | null;
  projectFormData: ProjectFormState;
  setProjectFormData: Dispatch<SetStateAction<ProjectFormState>>;
  submitting: boolean;
  submitButtonText: string;
  submittingButtonText: string;
  handleSubmitProject: (e: FormEvent) => Promise<void>;
  showDeleteModal: boolean;
  setShowDeleteModal: Dispatch<SetStateAction<boolean>>;
  setProjectToDelete: Dispatch<SetStateAction<Project | null>>;
  projectToDelete: Project | null;
  deleting: boolean;
  confirmDelete: () => Promise<void>;
  applyOwnerExtensionsRef: MutableRefObject<(extensions: string[]) => void>;
  clearOwnerFilterRef: MutableRefObject<() => void>;
};
