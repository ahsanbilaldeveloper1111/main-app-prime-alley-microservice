import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import {
  X,
  Calendar,
  Clock,
  FileText,
  Tag,
  Users,
  Eye,
  Flag,
  ListTodo,
  Plus,
  Search,
  Link as LinkIcon,
  FolderOpen,
  Check,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { listProjects, createTask, updateTask, listTasks } from '@utils/tasks';
import { listStatuses } from '@utils/work-planner';
import { getAutoTimezone } from '@utils/Helper';
import {
  formatPlannerDueTimeAsUtcIso,
  parseApiDueTimeToTimeInput,
} from '@utils/plannerTaskDueTime';
import RichTextEditor from '../../../pages/help-center/partials/RichTextEditor';

const CREATE_TASK_MODAL_THEME = {
  accent: "#4f46e5",
  accentSoft: "rgba(79, 70, 229, 0.1)",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#64748b",
  radius: 14,
} as const;

interface Extension {
  id: string;
  name: string;
}

interface CreateTaskModalProps {
  show: boolean;
  onHide: () => void;
  onCreate?: (data: CreateTaskFormData) => void;
  onCreateAndOpen?: (data: CreateTaskFormData) => void;
  extensions?: Extension[];
  labels?: Label[];
  linkedRecords?: LinkedRecord[];
  project?: Project;
  statuses?: Status[];
  task?: any; // Task data for edit mode
  isEdit?: boolean; // Whether this is edit mode
  selectedStatusForTask?: number | null; // Pre-selected status ID when opening from board column
  /** Task type: regular, recurring, or to-do */
  taskType?: 'regular' | 'recurring' | 'todo';
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
}

interface Priority {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface LinkedRecord {
  id: number;
  type: 'task' | 'crm';
  title: string;
  reference: string;
}

interface ActivityEntry {
  id: number;
  user: UserType;
  action: string;
  timestamp: Date;
  type: 'assignment' | 'comment';
  content?: string;
}

interface CreateTaskFormData {
  title: string;
  description: string;
  projectId: number | null;
  statusId: number | null;
  priorityId: number | null;
  assigneeIds: number[];
  watcherIds: number[];
  dueDate: string;
  startDate: string;
  /** Local HH:mm for API `due_time` (regular and to-do tasks only). */
  dueTime: string;
  labelIds: number[];
  linkedRecordIds: number[];
}

function applyDueTimeToPayloadForRegularOrTodo(
  taskType: 'regular' | 'recurring' | 'todo',
  payload: Record<string, unknown>,
  dueDate: string,
  dueTime: string,
  isEditMode: boolean,
): void {
  if (taskType !== 'regular' && taskType !== 'todo') {
    return;
  }
  const utc = formatPlannerDueTimeAsUtcIso(dueDate, dueTime);
  if (utc) {
    payload.due_time = utc;
  } else if (isEditMode) {
    payload.due_time = null;
  }
}

type CreateTaskModalTaskType = 'regular' | 'recurring' | 'todo';

function mapPriorityStringToId(priority: string | null | undefined): number {
  const priorityMap: Record<string, number> = {
    low: 1,
    normal: 2,
    medium: 2,
    high: 3,
    urgent: 4,
  };
  return priorityMap[priority?.toLowerCase() || 'normal'] || 2;
}

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

function mapEditTaskPeopleIds(
  editTask: any,
  extensions: Extension[],
  peopleKey: "assignees" | "watchers",
  fallbackExtNumsKey: "extension_numbers" | "watcher_numbers",
): number[] {
  const fromPeople =
    editTask[peopleKey]?.map((person: { extension_number?: string }) => {
      const extension = extensions.find(
        (ext: any) =>
          ext.id === person.extension_number ||
          ext.extension_number === person.extension_number,
      );
      return extension
        ? Number(extension.id)
        : Number(person.extension_number);
    }) ?? [];
  if (fromPeople.length > 0) {
    return fromPeople;
  }
  return (
    editTask[fallbackExtNumsKey]?.map((extNum: string) => {
      const extension = extensions.find(
        (ext: any) => ext.id === extNum || ext.extension_number === extNum,
      );
      return extension ? Number(extension.id) : Number(extNum);
    }) ?? []
  );
}

function buildCreateTaskModalInitialFormFromEdit(
  editTask: any,
  extensions: Extension[],
): CreateTaskFormData {
  const projectIdRaw = editTask.project_id ?? editTask.project?.id;
  const statusIdRaw = editTask.status_id ?? editTask.status?.id;
  const dueTimeRaw = editTask.due_time;
  return {
    title: editTask.title || '',
    description: editTask.description || '',
    projectId: projectIdRaw ? Number(projectIdRaw) : null,
    statusId: statusIdRaw ? Number(statusIdRaw) : null,
    priorityId: mapPriorityStringToId(editTask.priority),
    assigneeIds: mapEditTaskPeopleIds(
      editTask,
      extensions,
      "assignees",
      "extension_numbers",
    ),
    watcherIds: mapEditTaskPeopleIds(
      editTask,
      extensions,
      "watchers",
      "watcher_numbers",
    ),
    dueDate: formatDateForInput(editTask.due_date),
    startDate: formatDateForInput(editTask.start_date),
    dueTime:
      typeof dueTimeRaw === 'string'
        ? parseApiDueTimeToTimeInput(dueTimeRaw)
        : '',
    labelIds: editTask.label_ids || editTask.labels?.map((l: any) => l.id) || [],
    linkedRecordIds: [],
  };
}

function validateCreateTaskModalBeforeSubmit(
  formData: CreateTaskFormData,
  taskType: CreateTaskModalTaskType,
): boolean {
  if (!formData.title.trim()) {
    toast.error('Please enter a task title');
    return false;
  }
  if (
    (taskType === 'regular' || taskType === 'todo') &&
    formData.dueTime.trim() !== '' &&
    formData.dueDate.trim() === ''
  ) {
    toast.error('Please set a due date when adding a due time');
    return false;
  }
  return true;
}

function createTaskModalBlankCreateForm(
  propProject: Project | undefined,
  propStatuses: Status[],
  selectedStatusForTask: number | null,
): CreateTaskFormData {
  return {
    title: "",
    description: "",
    projectId: propProject?.id || null,
    statusId:
      selectedStatusForTask ||
      (propStatuses.length > 0 ? propStatuses[0].id : null),
    priorityId: 0,
    assigneeIds: [],
    watcherIds: [],
    dueDate: "",
    startDate: "",
    dueTime: "",
    labelIds: [],
    linkedRecordIds: [],
  };
}

function mapNumericUserIdsToExtensionPayloadIds(
  extensions: Extension[],
  ids: number[] | undefined,
): string[] {
  return (
    ids?.map((id: number) => {
      const extension = extensions.find((ext: any) => Number(ext.id) === id);
      return extension ? extension.id : String(id);
    }) ?? []
  );
}

function buildCreateTaskModalApiPayload(
  formData: CreateTaskFormData,
  extensions: Extension[],
  taskType: CreateTaskModalTaskType,
  priorityToApi: (priorityId: number | null) => string | undefined,
  isEdit: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: formData.title,
    description: formData.description || '',
    priority: priorityToApi(formData.priorityId) || undefined,
    due_date: formData.dueDate || '',
    start_date: formData.startDate || '',
    extension_numbers: mapNumericUserIdsToExtensionPayloadIds(
      extensions,
      formData.assigneeIds,
    ),
    watchers: mapNumericUserIdsToExtensionPayloadIds(
      extensions,
      formData.watcherIds,
    ),
    type: taskType,
  };
  if (formData.projectId) {
    payload.project_id = formData.projectId;
    payload.label_ids = formData.labelIds || [];
  }
  if (formData.statusId) {
    payload.status_id = formData.statusId;
  }
  if (formData.linkedRecordIds && formData.linkedRecordIds.length > 0) {
    payload.parent_task_id = formData.linkedRecordIds[0];
  }
  applyDueTimeToPayloadForRegularOrTodo(
    taskType,
    payload,
    formData.dueDate,
    formData.dueTime,
    isEdit,
  );
  return payload;
}

async function persistCreateTaskModalResult(
  isEdit: boolean,
  editTask: { id?: number } | undefined,
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (isEdit && editTask?.id) {
    return Boolean(await updateTask(editTask.id, payload));
  }
  const withTz = { ...payload, timezone: getAutoTimezone() };
  return Boolean(await createTask(withTz as Parameters<typeof createTask>[0]));
}

type CreateTaskModalSubmitContext = Readonly<{
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  formData: CreateTaskFormData;
  extensions: Extension[];
  taskType: CreateTaskModalTaskType;
  isEdit: boolean;
  editTask: any;
  onSuccess: ((data: CreateTaskFormData) => void) | undefined;
  onHide: () => void;
}>;

type CreateTaskModalIdArrayKey = "labelIds" | "assigneeIds" | "watcherIds";

function toggleCreateTaskModalIdInArrayField(
  setFormData: React.Dispatch<React.SetStateAction<CreateTaskFormData>>,
  field: CreateTaskModalIdArrayKey,
  id: number,
): void {
  setFormData((prev) => {
    const current = prev[field];
    return {
      ...prev,
      [field]: current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    };
  });
}

async function runCreateTaskModalSubmit(
  e: React.MouseEvent | undefined,
  ctx: CreateTaskModalSubmitContext,
): Promise<void> {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (ctx.isSubmitting) {
    return;
  }
  if (!validateCreateTaskModalBeforeSubmit(ctx.formData, ctx.taskType)) {
    return;
  }
  ctx.setIsSubmitting(true);
  try {
    const payload = buildCreateTaskModalApiPayload(
      ctx.formData,
      ctx.extensions,
      ctx.taskType,
      mapPriorityIdToStringCreateModal,
      ctx.isEdit,
    );
    const result = await persistCreateTaskModalResult(ctx.isEdit, ctx.editTask, payload);
    if (result) {
      ctx.onSuccess?.(ctx.formData);
      ctx.onHide();
    }
  } catch (error) {
    console.error(
      `Error ${ctx.isEdit ? "updating" : "creating"} task:`,
      error,
    );
  } finally {
    ctx.setIsSubmitting(false);
  }
}

function useCreateTaskModalReferenceLists(show: boolean) {
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [genericStatuses, setGenericStatuses] = useState<Status[]>([]);
  const [loadingGenericStatuses, setLoadingGenericStatuses] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!show) return;

      try {
        setLoadingProjects(true);
        const response = await listProjects({ page: 1, limit: 100 });
        if (response?.success === true && Array.isArray(response.data)) {
          const projectsList = response.data.map((project: any) => ({
            id: project.id,
            name: project.name,
            icon: '',
            color: project.color || '#3b82f6',
            statuses: project.statuses || [],
            labels: project.labels || [],
          }));
          setFetchedProjects(projectsList);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setFetchedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [show]);

  useEffect(() => {
    const fetchGenericStatuses = async () => {
      if (!show) return;

      try {
        setLoadingGenericStatuses(true);
        const response = await listStatuses();
        const rawList = Array.isArray(response)
          ? response
          : response?.data;
        if (Array.isArray(rawList)) {
          setGenericStatuses(
            rawList.map((status: any) =>
              normalizeListStatusRowToModalStatus(status),
            ),
          );
        } else {
          setGenericStatuses([]);
        }
      } catch (error) {
        console.error('Error fetching generic statuses:', error);
        setGenericStatuses([]);
      } finally {
        setLoadingGenericStatuses(false);
      }
    };

    fetchGenericStatuses();
  }, [show]);

  return {
    fetchedProjects,
    loadingProjects,
    genericStatuses,
    loadingGenericStatuses,
  };
}

function mapExtensionsToCreateTaskModalUsers(extensions: Extension[]): UserType[] {
  return extensions.map((ext) => ({
    id: Number(ext.id),
    name: ext.name,
    avatar: "",
    initials: ext.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase(),
  }));
}

function mapPriorityIdToStringCreateModal(
  priorityId: number | null,
): string | undefined {
  if (!priorityId || priorityId === 0) {
    return "";
  }
  const priorityMap: Record<number, string> = {
    1: "low",
    2: "normal",
    3: "high",
    4: "urgent",
  };
  return priorityMap[priorityId] || undefined;
}

function normalizeListStatusRowToModalStatus(status: {
  id: number;
  name: string;
  color?: string;
}): Status {
  return {
    id: status.id,
    name: status.name,
    icon: "",
    color: status.color || "#3b82f6",
  };
}

function resolveCreateTaskModalStatusesForProject(
  projectId: number | null,
  fetchedProjects: Project[],
  genericStatuses: Status[],
  propStatuses: Status[],
): Status[] {
  if (projectId) {
    const selectedProject = fetchedProjects.find((p) => p.id === projectId);
    if (selectedProject?.statuses && Array.isArray(selectedProject.statuses)) {
      return selectedProject.statuses.map((status: any) =>
        normalizeListStatusRowToModalStatus(status),
      );
    }
    return [];
  }
  if (genericStatuses.length > 0) {
    return genericStatuses;
  }
  return propStatuses;
}

function resolveCreateTaskModalProjects(
  fetchedProjects: Project[],
  propProject: Project | undefined,
): Project[] {
  if (fetchedProjects.length > 0) {
    return fetchedProjects;
  }
  return propProject ? [propProject] : [];
}

function resolveCreateTaskModalLabelsForProject(
  projectId: number | null,
  fetchedProjects: Project[],
  propLabels: Label[],
): Label[] {
  if (!projectId) {
    return propLabels;
  }
  const selectedProject = fetchedProjects.find((p) => p.id === projectId);
  if (selectedProject?.labels && Array.isArray(selectedProject.labels)) {
    return selectedProject.labels.map((label: any) => ({
      id: label.id,
      name: label.name,
      color: label.color || "#3b82f6",
      description: label.description || "",
    }));
  }
  return propLabels;
}

function useCreateTaskModalLinkedRecords(
  isEdit: boolean,
  editTask: any,
): {
  linkedRecordsFromApi: LinkedRecord[];
  loadingLinkedRecords: boolean;
  fetchLinkRecordsForSearch: (
    query: string,
    currentProjectId?: number | null,
  ) => Promise<void>;
} {
  const [linkedRecordsFromApi, setLinkedRecordsFromApi] = useState<LinkedRecord[]>(
    [],
  );
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState(false);

  const fetchLinkRecordsForSearch = useCallback(
    async (query: string, currentProjectId?: number | null) => {
      const trimmed = query.trim();
      setLoadingLinkedRecords(true);
      try {
        const projectId =
          currentProjectId ??
          (isEdit ? editTask?.project_id ?? editTask?.project?.id : null);
        const response = await listTasks({
          page: 1,
          limit: 30,
          type: "regular",
          search: trimmed || undefined,
          ...(projectId != null && projectId > 0 ? { project_id: projectId } : {}),
        });
        if (response?.data && Array.isArray(response.data)) {
          const currentTaskId =
            isEdit && editTask?.rawData?.id != null
              ? Number(editTask.rawData.id)
              : null;
          const records: LinkedRecord[] = response.data
            .filter(
              (t: any) =>
                currentTaskId == null || Number(t.id) !== currentTaskId,
            )
            .map((t: any) => ({
              id: Number(t.id),
              type: "task" as const,
              title: t.title || "",
              reference: t.reference || `#${t.id}`,
            }));
          setLinkedRecordsFromApi(records);
        } else {
          setLinkedRecordsFromApi([]);
        }
      } catch (error) {
        console.error("Error fetching link records:", error);
        setLinkedRecordsFromApi([]);
      } finally {
        setLoadingLinkedRecords(false);
      }
    },
    [isEdit, editTask?.rawData?.id, editTask?.project_id, editTask?.project?.id],
  );

  return {
    linkedRecordsFromApi,
    loadingLinkedRecords,
    fetchLinkRecordsForSearch,
  };
}

type CreateTaskModalFormSyncParams = Readonly<{
  show: boolean;
  isEdit: boolean;
  editTask: any;
  fetchedProjects: Project[];
  loadingProjects: boolean;
  selectedStatusForTask: number | null;
  propProject: Project | undefined;
  propStatuses: Status[];
  getInitialFormData: () => CreateTaskFormData;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setFormData: React.Dispatch<React.SetStateAction<CreateTaskFormData>>;
}>;

function useCreateTaskModalSyncFormOnShow(params: CreateTaskModalFormSyncParams): void {
  useEffect(() => {
    const {
      show,
      isEdit,
      editTask,
      fetchedProjects,
      loadingProjects,
      getInitialFormData,
      selectedStatusForTask,
      propProject,
      propStatuses,
      setSearchQuery,
      setFormData,
    } = params;
    if (show) {
      setSearchQuery("");
      if (isEdit && editTask && fetchedProjects.length === 0 && loadingProjects) {
        return;
      }
      setFormData(getInitialFormData());
    } else {
      setSearchQuery("");
      setFormData(
        createTaskModalBlankCreateForm(
          propProject,
          propStatuses,
          selectedStatusForTask,
        ),
      );
    }
  }, [
    params.show,
    params.editTask,
    params.isEdit,
    params.fetchedProjects,
    params.loadingProjects,
    params.selectedStatusForTask,
  ]);
}

type CreateTaskModalAutoStatusParams = Readonly<{
  isEdit: boolean;
  projectId: number | null;
  statusId: number | null;
  fetchedProjects: Project[];
  genericStatuses: Status[];
  loadingGenericStatuses: boolean;
  selectedStatusForTask: number | null;
  propStatuses: Status[];
  setFormData: React.Dispatch<React.SetStateAction<CreateTaskFormData>>;
}>;

function createTaskModalTitleText(
  taskType: CreateTaskModalTaskType,
  isEdit: boolean,
): string {
  if (taskType === "todo") {
    return isEdit ? "Edit Todo" : "Create Todo";
  }
  if (taskType === "recurring") {
    return isEdit ? "Edit Recurring" : "Create Recurring";
  }
  return isEdit ? "Edit Task" : "Create Task";
}

function createTaskModalCreateAndOpenLabel(
  isSubmitting: boolean,
  isEdit: boolean,
): string {
  if (isSubmitting) {
    return 'Processing...';
  }
  if (isEdit) {
    return 'Update and open';
  }
  return 'Create and open';
}

function createTaskModalPrimaryLabel(
  isSubmitting: boolean,
  isEdit: boolean,
): string {
  if (isSubmitting) {
    return 'Processing...';
  }
  if (isEdit) {
    return 'Update';
  }
  return 'Create';
}

function createTaskModalProjectSelectChildren(
  loadingProjects: boolean,
  projects: Project[],
): React.ReactNode {
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

type CreateTaskModalStatusOptionsArgs = Readonly<{
  projectId: number | null;
  loadingProjects: boolean;
  loadingGenericStatuses: boolean;
  statuses: Status[];
  isEdit: boolean;
  statusId: number | null;
  editTask: any;
}>;

function createTaskModalStatusSelectOptions(
  args: CreateTaskModalStatusOptionsArgs,
): React.ReactNode {
  const {
    projectId,
    loadingProjects,
    loadingGenericStatuses,
    statuses,
    isEdit,
    statusId,
    editTask,
  } = args;
  const isLoadingStatuses =
    (Boolean(projectId) && loadingProjects) ||
    (!projectId && loadingGenericStatuses);
  if (isLoadingStatuses) {
    return <option value="">Loading statuses...</option>;
  }
  if (statuses.length === 0) {
    if (isEdit && statusId != null) {
      return (
        <option value={statusId}>
          {editTask?.status?.name || editTask?.status_name || `Status #${statusId}`}
        </option>
      );
    }
    return <option value="">No statuses available</option>;
  }
  const missingFromList =
    isEdit &&
    statusId != null &&
    !statuses.some((status) => String(status.id) === String(statusId));
  return (
    <>
      <option value="">Select status</option>
      {missingFromList && (
        <option value={statusId}>
          {editTask?.status?.name || editTask?.status_name || `Status #${statusId}`}
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

function useCreateTaskModalAutoPickStatus(
  params: CreateTaskModalAutoStatusParams,
): void {
  useEffect(() => {
    const {
      isEdit,
      projectId,
      statusId,
      fetchedProjects,
      genericStatuses,
      loadingGenericStatuses,
      selectedStatusForTask,
      propStatuses,
      setFormData,
    } = params;
    if (isEdit) {
      return;
    }
    if (projectId && fetchedProjects.length === 0) {
      return;
    }
    if (!projectId && loadingGenericStatuses) {
      return;
    }
    const availableStatuses = resolveCreateTaskModalStatusesForProject(
      projectId,
      fetchedProjects,
      genericStatuses,
      propStatuses,
    );
    if (!statusId && availableStatuses.length > 0) {
      setFormData((prev) => ({
        ...prev,
        statusId: selectedStatusForTask || availableStatuses[0].id,
      }));
    }
  }, [
    params.isEdit,
    params.projectId,
    params.statusId,
    params.fetchedProjects,
    params.genericStatuses,
    params.loadingGenericStatuses,
    params.selectedStatusForTask,
    params.propStatuses,
    params.setFormData,
  ]);
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  show,
  onHide,
  onCreate,
  onCreateAndOpen,
  extensions = [],
  labels: propLabels = [],
  linkedRecords: propLinkedRecords = [],
  project: propProject,
  statuses: propStatuses = [],
  task: editTask,
  isEdit = false,
  selectedStatusForTask = null,
  taskType = 'regular'
}) => {
  // Initialize form data - populate from editTask if in edit mode
  const getInitialFormData = (): CreateTaskFormData => {
    if (isEdit && editTask) {
      return buildCreateTaskModalInitialFormFromEdit(editTask, extensions);
    }
    
    return createTaskModalBlankCreateForm(
      propProject,
      propStatuses,
      selectedStatusForTask,
    );
  };

  const [formData, setFormData] = useState<CreateTaskFormData>(getInitialFormData());
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [watcherSearchQuery, setWatcherSearchQuery] = useState('');
  const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);
  const {
    fetchedProjects,
    loadingProjects,
    genericStatuses,
    loadingGenericStatuses,
  } = useCreateTaskModalReferenceLists(show);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    linkedRecordsFromApi,
    loadingLinkedRecords,
    fetchLinkRecordsForSearch,
  } = useCreateTaskModalLinkedRecords(isEdit, editTask);

  useEffect(() => {
    if (!show) return;
    fetchLinkRecordsForSearch(searchQuery, formData.projectId).catch(() => undefined);
  }, [show, fetchLinkRecordsForSearch]);

  useCreateTaskModalSyncFormOnShow({
    show,
    isEdit,
    editTask,
    fetchedProjects,
    loadingProjects,
    selectedStatusForTask,
    propProject,
    propStatuses,
    getInitialFormData,
    setSearchQuery,
    setFormData,
  });

  const users: UserType[] = mapExtensionsToCreateTaskModalUsers(extensions);

  const projects: Project[] = resolveCreateTaskModalProjects(
    fetchedProjects,
    propProject,
  );

  const statuses: Status[] = resolveCreateTaskModalStatusesForProject(
    formData.projectId,
    fetchedProjects,
    genericStatuses,
    propStatuses,
  );

  useCreateTaskModalAutoPickStatus({
    isEdit,
    projectId: formData.projectId,
    statusId: formData.statusId,
    fetchedProjects,
    genericStatuses,
    loadingGenericStatuses,
    selectedStatusForTask,
    propStatuses,
    setFormData,
  });

  const priorities: Priority[] = [
    { id: 0, name: "Select Priority", icon: "", color: "#6c757d" },
    { id: 1, name: "Low", icon: "🟢", color: "#10b981" },
    { id: 2, name: "Medium", icon: "🟡", color: "#eab308" },
    { id: 3, name: "High", icon: "🟠", color: "#f97316" },
    { id: 4, name: "Urgent", icon: "🔴", color: "#ef4444" }
  ];

  const labels: Label[] = resolveCreateTaskModalLabelsForProject(
    formData.projectId,
    fetchedProjects,
    propLabels,
  );

  const handleCreate = (e?: React.MouseEvent) =>
    runCreateTaskModalSubmit(e, {
      isSubmitting,
      setIsSubmitting,
      formData,
      extensions,
      taskType,
      isEdit,
      editTask,
      onSuccess: onCreate,
      onHide,
    });

  const handleCreateAndOpen = (e?: React.MouseEvent) =>
    runCreateTaskModalSubmit(e, {
      isSubmitting,
      setIsSubmitting,
      formData,
      extensions,
      taskType,
      isEdit,
      editTask,
      onSuccess: onCreateAndOpen,
      onHide,
    });

  const toggleLabel = (labelId: number) =>
    toggleCreateTaskModalIdInArrayField(setFormData, "labelIds", labelId);

  const toggleAssignee = (userId: number) =>
    toggleCreateTaskModalIdInArrayField(setFormData, "assigneeIds", userId);

  const toggleWatcher = (userId: number) =>
    toggleCreateTaskModalIdInArrayField(setFormData, "watcherIds", userId);

  const selectedAssignees = users.filter(u => formData.assigneeIds.includes(u.id));
  const selectedWatchers = users.filter(u => formData.watcherIds.includes(u.id));
  const selectedLabels = labels.filter(l => formData.labelIds.includes(l.id));

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered 
      size="lg"
      className="create-task-modal"
      contentClassName="create-task-modal-content"
    >
      <Modal.Header
        closeButton={false}
        style={{
          borderBottom: `1px solid ${CREATE_TASK_MODAL_THEME.border}`,
          padding: "18px 22px 16px",
          background: `linear-gradient(180deg, ${CREATE_TASK_MODAL_THEME.surfaceMuted} 0%, ${CREATE_TASK_MODAL_THEME.surface} 100%)`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Modal.Title
          style={{
            fontSize: 19,
            fontWeight: 700,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: CREATE_TASK_MODAL_THEME.text,
            letterSpacing: "-0.02em",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 42,
              height: 42,
              borderRadius: 12,
              background: CREATE_TASK_MODAL_THEME.accentSoft,
            }}
          >
            <ListTodo size={22} color={CREATE_TASK_MODAL_THEME.accent} strokeWidth={2.25} />
          </span>
          {createTaskModalTitleText(taskType, isEdit)}
        </Modal.Title>
        <Button
          variant="light"
          onClick={onHide}
          aria-label="Close"
          style={{
            background: CREATE_TASK_MODAL_THEME.surfaceMuted,
            border: `1px solid ${CREATE_TASK_MODAL_THEME.border}`,
            borderRadius: 10,
            width: 40,
            height: 40,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: CREATE_TASK_MODAL_THEME.textMuted,
          }}
        >
          <X size={20} strokeWidth={2} />
        </Button>
      </Modal.Header>

      <Modal.Body className="py-4 px-4 create-task-modal-body">
        {/* Title Field - Required */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Title <span style={{ color: '#ef4444' }}>*</span>
          </Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter task title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="py-2"
            style={{ fontSize: '14px' }}
            required
          />
        </Form.Group>

        {/* Description Field */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <FileText size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Description
          </Form.Label>
          <RichTextEditor
            value={formData.description || ''}
            onChange={(html: string, text: string) => {
              // Store HTML to preserve formatting
              setFormData({ ...formData, description: html });
            }}
            placeholder="Describe the task..."
            minHeight="100px"
            maxHeight="200px"
            maxLength={5000}
          />
        </Form.Group>

        {/* Project and Assignees Row */}
        <Row className="mb-3">
        {taskType !== 'todo' && (
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <FolderOpen size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Project
              </Form.Label>
              <Form.Select
                value={formData.projectId || ''}
                onChange={(e) => {
                  const newProjectId = e.target.value ? Number(e.target.value) : null;
                  // When project changes, clear status (project statuses are different from generic)
                  setFormData(prev => ({ 
                    ...prev, 
                    projectId: newProjectId,
                    statusId: null // Clear status when project changes
                  }));
                  // Refetch link records for the selected project
                  fetchLinkRecordsForSearch(searchQuery, newProjectId);
                }}
                className="py-2"
                style={{ fontSize: '14px' }}
                disabled={loadingProjects || projects.length === 0}
              >
                {createTaskModalProjectSelectChildren(loadingProjects, projects)}
              </Form.Select>
            </Form.Group>
          </Col>
          )}


       

        {/* Status and Priority Row */}
        
          {taskType !== 'todo' && (
          <Col xs={12} md={6} className="mb-3 mb-md-0">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <ListTodo size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Status
              </Form.Label>
              <Form.Select
                value={formData.statusId ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statusId: e.target.value ? Number(e.target.value) : null
                  })
                }
                className="py-2"
                style={{ fontSize: '14px' }}
                disabled={
                  (formData.projectId && loadingProjects) || 
                  (!formData.projectId && loadingGenericStatuses) || 
                  statuses.length === 0
                }
              >
                {createTaskModalStatusSelectOptions({
                  projectId: formData.projectId,
                  loadingProjects,
                  loadingGenericStatuses,
                  statuses,
                  isEdit,
                  statusId: formData.statusId,
                  editTask,
                })}
              </Form.Select>
            </Form.Group>
          </Col>
          )}
          
          {/* {!isEdit && ( */}
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Calendar size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Start Date
              </Form.Label>
              <Form.Control
                type="date"
                placeholder="Select date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="py-2"
                style={{ fontSize: '14px' }}
              />
            </Form.Group>
          </Col>
          {/* )} */}
          {/* {!isEdit && ( */}
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Calendar size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                End Date
              </Form.Label>
              <Form.Control
                type="date"
                placeholder="Select date"
                value={formData.dueDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    dueDate: v,
                    dueTime:
                      (taskType === 'regular' || taskType === 'todo') && v.trim() === ''
                        ? ''
                        : prev.dueTime,
                  }));
                }}
                min={new Date().toISOString().split('T')[0]}
                className="py-2"
                style={{ fontSize: '14px' }}
              />
            </Form.Group>
          </Col>
          {/* )} */}
          <Col xs={12} md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
                <Flag size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
                Priority
              </Form.Label>
              <Form.Select
                value={formData.priorityId || 0}
                onChange={(e) => setFormData({ ...formData, priorityId: Number(e.target.value) })}
                className="py-2"
                style={{ fontSize: '14px' }}
              >
                {priorities.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {(taskType === 'regular' || taskType === 'todo') && (
          <Row className="mb-3">
            <Col xs={12} md={6} className="d-flex">
              <Form.Group className="d-flex flex-column flex-fill mb-0">
                <Form.Label
                  className="fw-semibold mb-2"
                  style={{
                    fontSize: "14px",
                    color: "#2d3748",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 44,
                    whiteSpace: "nowrap",
                  }}
                  title="Optional — leave empty for no specific time"
                >
                  <Clock size={16} style={{ flexShrink: 0 }} aria-hidden />
                  <span>
                    Due time{" "}
                    <span style={{ fontWeight: 500, color: "#64748b", fontSize: "12px" }}>
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
                  className="py-2 mt-auto"
                  style={{ fontSize: "14px" }}
                />
              </Form.Group>
            </Col>
          </Row>
        )}

        {/* Assignees Field */}
        {taskType !== 'todo' && (
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Users size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Assignees
          </Form.Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {selectedAssignees.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#edf6ff',
                  border: '1px solid #bfdbfe',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
                onClick={() => toggleAssignee(user.id)}
              >
                {/* <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: '600'
                  }}
                >
                  {user.initials}
                </div> */}
                <span style={{ color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                <X size={14} style={{ color: '#64748b' }} />
              </div>
            ))}
            
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setShowAssigneeDropdown(!showAssigneeDropdown);
                if (!showAssigneeDropdown) {
                  setAssigneeSearchQuery(''); // Clear search when opening
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.875rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
              }}
            >
              <Plus size={14} />
              Add Assignee
            </Button>
          </div>

          {/* Assignee Dropdown */}
          {showAssigneeDropdown && (
            <div 
              className="border rounded"
              style={{ 
                backgroundColor: '#f8fafc',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {/* Search Input */}
              <div className="p-2 border-bottom" style={{ backgroundColor: 'white' }}>
                <div className="position-relative">
                  <Search 
                    size={16} 
                    className="position-absolute text-muted" 
                    style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Search assignees..."
                    value={assigneeSearchQuery}
                    onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                    className="py-2"
                    style={{ 
                      paddingLeft: '40px',
                      fontSize: '14px' 
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Filtered Users List */}
              {(() => {
                const filteredUsers = users.filter((user) =>
                  user.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
                );
                
                return filteredUsers.length === 0 ? (
                  <div className="p-3 text-center text-muted" style={{ fontSize: '14px' }}>
                    {assigneeSearchQuery ? 'No assignees found' : 'No extensions available'}
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="d-flex align-items-center justify-content-between p-3 border-bottom cursor-pointer"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: formData.assigneeIds.includes(user.id) ? '#edf6ff' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => toggleAssignee(user.id)}
                  onMouseEnter={(e) => {
                    if (!formData.assigneeIds.includes(user.id)) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formData.assigneeIds.includes(user.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                  {formData.assigneeIds.includes(user.id) && (
                    <Check size={18} className="text-primary" style={{ flexShrink: 0 }} />
                  )}
                </div>
                  ))
                );
              })()}
              {/* Done button to close dropdown after multiple selection */}
              <div className="p-2 border-top" style={{ backgroundColor: 'white' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-100"
                  onClick={() => {
                    setShowAssigneeDropdown(false);
                    setAssigneeSearchQuery('');
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </Form.Group>
        )}

        {/* Watchers Field */}
        {taskType !== 'todo' && (
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Eye size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Watchers
          </Form.Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {selectedWatchers.map((user) => (
              <div
                key={user.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
                onClick={() => toggleWatcher(user.id)}
              >
                <span style={{ color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                <X size={14} style={{ color: '#64748b' }} />
              </div>
            ))}

            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setShowWatcherDropdown(!showWatcherDropdown);
                if (!showWatcherDropdown) {
                  setWatcherSearchQuery('');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '0.875rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px'
              }}
            >
              <Plus size={14} />
              Add Watcher
            </Button>
          </div>

          {showWatcherDropdown && (
            <div
              className="border rounded"
              style={{
                backgroundColor: '#f8fafc',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              <div className="p-2 border-bottom" style={{ backgroundColor: 'white' }}>
                <div className="position-relative">
                  <Search
                    size={16}
                    className="position-absolute text-muted"
                    style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Search watchers..."
                    value={watcherSearchQuery}
                    onChange={(e) => setWatcherSearchQuery(e.target.value)}
                    className="py-2"
                    style={{ paddingLeft: '40px', fontSize: '14px' }}
                    autoFocus
                  />
                </div>
              </div>

              {(() => {
                const filteredWatchers = users.filter((user) =>
                  user.name.toLowerCase().includes(watcherSearchQuery.toLowerCase())
                );

                return filteredWatchers.length === 0 ? (
                  <div className="p-3 text-center text-muted" style={{ fontSize: '14px' }}>
                    {watcherSearchQuery ? 'No watchers found' : 'No extensions available'}
                  </div>
                ) : (
                  filteredWatchers.map((user) => (
                    <div
                      key={user.id}
                      className="d-flex align-items-center justify-content-between p-3 border-bottom cursor-pointer"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: formData.watcherIds.includes(user.id) ? '#f0fdf4' : 'white',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => toggleWatcher(user.id)}
                      onMouseEnter={(e) => {
                        if (!formData.watcherIds.includes(user.id)) {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!formData.watcherIds.includes(user.id)) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: '500' }}>{user.name}</span>
                      {formData.watcherIds.includes(user.id) && (
                        <Check size={18} className="text-success" style={{ flexShrink: 0 }} />
                      )}
                    </div>
                  ))
                );
              })()}
              <div className="p-2 border-top" style={{ backgroundColor: 'white' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-100"
                  onClick={() => {
                    setShowWatcherDropdown(false);
                    setWatcherSearchQuery('');
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </Form.Group>
        )}

        {/* Labels Field */}
        {taskType !== 'todo' && (
          <>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <Tag size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Labels
          </Form.Label>
          
          {/* Selected Labels Display */}
          {selectedLabels.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {selectedLabels.map((label) => (
                <div
  key={label.id}
  className="d-inline-flex align-items-center gap-2 px-3 py-2"
  style={{
    backgroundColor: label.color,
    color: '#2d3748',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '0.375rem' // same default Bootstrap badge feel
  }}
  onClick={() => toggleLabel(label.id)}
>
  <Tag size={12} />
  {label.name}
  <X size={12} />
</div>

              ))}
            </div>
          )}
          
          {/* Available Labels */}
          <div 
            className="border rounded p-3"
            style={{ 
              backgroundColor: '#f8fafc',
              maxHeight: '140px',
              overflowY: 'auto'
            }}
          >
            {labels.length === 0 ? (
              <div className="text-center text-muted" style={{ fontSize: '14px' }}>
                No labels available
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="d-inline-block"
                    style={{
                      backgroundColor: formData.labelIds.includes(label.id) ? label.color : '#ffffff',
                      color: '#2d3748',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      border: formData.labelIds.includes(label.id)
                        ? '2px solid #3b82f6'
                        : '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      transition: 'all 0.2s',
                      userSelect: 'none'
                    }}
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Form.Group>

        {/* Link Record Field */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold mb-2" style={{ fontSize: '14px', color: '#2d3748' }}>
            <LinkIcon size={16} className="me-2" style={{ verticalAlign: 'middle' }} />
            Link Records
          </Form.Label>
          <div className="position-relative mb-2">
            <Search 
              size={16} 
              className="position-absolute text-muted" 
              style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            />
            <Form.Control
              type="text"
              placeholder="Search task..."
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                setSearchQuery(value);
                fetchLinkRecordsForSearch(value, formData.projectId);
              }}
              className="py-2"
              style={{ 
                paddingLeft: '40px',
                fontSize: '14px' 
              }}
            />
          </div>

          {/* Linked Records Display - fetched via listTasks with empty relations */}
          <div
            className="border rounded"
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: '#f8fafc'
            }}
          >
            {loadingLinkedRecords ? (
              <div className="p-3 text-center text-muted" style={{ fontSize: '0.9rem' }}>
                Loading tasks...
              </div>
            ) : linkedRecordsFromApi.length === 0 ? (
              <div className="p-3 text-center text-muted" style={{ fontSize: '0.9rem' }}>
                {searchQuery ? 'No tasks found matching your search' : 'No tasks available'}
              </div>
            ) : (
              linkedRecordsFromApi.map((record) => (
                  <div
                    key={record.id}
                    className="d-flex align-items-center p-3 border-bottom cursor-pointer"
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: formData.linkedRecordIds.includes(record.id) ? '#edf6ff' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        // Single selection: if clicking the same record, deselect it; otherwise select only this one
                        linkedRecordIds: prev.linkedRecordIds.includes(record.id)
                          ? []
                          : [record.id]
                      }));
                    }}
                    onMouseEnter={(e) => {
                      if (!formData.linkedRecordIds.includes(record.id)) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!formData.linkedRecordIds.includes(record.id)) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center rounded me-3 text-white"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: record.type === 'crm' ? '#4e6fa5' : '#6B7280',
                        flexShrink: 0
                      }}
                    >
                      {record.type === 'crm' ? (
                        <FolderOpen size={18} />
                      ) : (
                        <ListTodo size={18} />
                      )}
                    </div>
                    <div className="flex-grow-1 overflow-hidden">
                      <div className="fw-semibold text-truncate" style={{ fontSize: '0.9rem', color: '#2d3748' }}>
                        {record.title}
                      </div>
                      <div className="text-muted small text-truncate" style={{ fontSize: '0.8rem' }}>
                        {record.reference}
                      </div>
                    </div>
                    {formData.linkedRecordIds.includes(record.id) && (
                      <Check size={18} className="text-primary ms-2" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                ))
              )}
            </div>
        </Form.Group>
        </>
        )}
      </Modal.Body>

      <Modal.Footer
        style={{
          borderTop: `1px solid ${CREATE_TASK_MODAL_THEME.border}`,
          padding: "16px 22px 20px",
          display: "flex",
          gap: 10,
          justifyContent: "flex-end",
          background: CREATE_TASK_MODAL_THEME.surface,
          boxShadow: "0 -8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Button 
          variant="light" 
          onClick={onHide}
          style={{
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            border: `1px solid ${CREATE_TASK_MODAL_THEME.border}`,
            borderRadius: 10,
            color: CREATE_TASK_MODAL_THEME.text,
            background: CREATE_TASK_MODAL_THEME.surface,
          }}
        >
          Cancel
        </Button>

        {onCreateAndOpen && (
          <Button
            variant="outline-primary"
            type="button"
            onClick={handleCreateAndOpen}
            disabled={isSubmitting}
            style={{
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: CREATE_TASK_MODAL_THEME.accent,
              color: CREATE_TASK_MODAL_THEME.accent,
              background: CREATE_TASK_MODAL_THEME.surface,
            }}
          >
            {createTaskModalCreateAndOpenLabel(isSubmitting, isEdit)}
          </Button>
        )}
        
        <Button 
          variant="primary" 
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting}
          style={{
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            borderRadius: 10,
            backgroundImage: isSubmitting
              ? "none"
              : `linear-gradient(135deg, ${CREATE_TASK_MODAL_THEME.accent} 0%, #4338ca 100%)`,
            backgroundColor: isSubmitting ? "#94a3b8" : undefined,
            boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(79, 70, 229, 0.35)",
          }}
        >
          {createTaskModalPrimaryLabel(isSubmitting, isEdit)}
        </Button>
      </Modal.Footer>

      <style>{`
        .create-task-modal .modal-dialog {
          max-width: 640px;
        }
        .create-task-modal-content {
          border: none;
          border-radius: ${CREATE_TASK_MODAL_THEME.radius}px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.22);
        }
        .create-task-modal-body {
          background: ${CREATE_TASK_MODAL_THEME.surfaceMuted};
          max-height: min(72vh, 720px);
          overflow-y: auto;
        }
        .create-task-modal .form-control,
        .create-task-modal .form-select {
          border-radius: 10px !important;
          border-color: ${CREATE_TASK_MODAL_THEME.border} !important;
          min-height: 42px;
          font-size: 15px;
        }
        .create-task-modal .form-control:focus,
        .create-task-modal .form-select:focus {
          border-color: ${CREATE_TASK_MODAL_THEME.accent} !important;
          box-shadow: 0 0 0 3px ${CREATE_TASK_MODAL_THEME.accentSoft} !important;
        }
        .create-task-modal .modal-header .btn-close {
          display: none;
        }
      `}</style>
    </Modal>
  );
};

export default CreateTaskModal;
