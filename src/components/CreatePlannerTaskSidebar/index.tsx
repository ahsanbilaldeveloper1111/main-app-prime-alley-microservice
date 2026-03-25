import React, { useState, useEffect, useCallback } from "react";
import { Form, Row, Col } from "react-bootstrap";
import {
  X,
  Calendar,
  FileText,
  Tag,
  Users,
  Eye,
  ListTodo,
  Plus,
  FolderOpen,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  listProjects,
  createTask,
  updateTask,
  listTasks,
  createRecurringTask,
  updateRecurringTask,
} from "@utils/tasks";
import { listStatuses } from "@utils/work-planner";
import { getAutoTimezone } from "@utils/Helper";
import RichTextEditor from "../../pages/help-center/partials/RichTextEditor";

// ─── Types (from createtask-modal) ─────────────────────────────────────────────

type PlannerTaskType = "todo" | "regular" | "recurring";

interface Extension {
  id: string;
  name: string;
  extension_number?: string;
}

interface CreateTaskSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCreate?: (data: CreateTaskFormData) => void;
  onCreateAndOpen?: (data: CreateTaskFormData) => void;
  extensions?: Extension[];
  labels?: Label[];
  project?: Project;
  statuses?: Status[];
  task?: PlannerEditTask;
  isEdit?: boolean;
  selectedStatusForTask?: number | null;
  taskType?: PlannerTaskType;
}

/** Minimal task shape used when editing in the sidebar (API / normalized task). */
interface PlannerEditTask {
  id?: string | number;
  rawData?: { id?: string | number };
  project_id?: number;
  project?: { id?: number };
  status_id?: number;
  status?: { id?: number; name?: string };
  status_name?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  assignees?: Array<{ extension_number?: string }>;
  watchers?: Array<{ extension_number?: string }>;
  extension_numbers?: string[];
  watcher_numbers?: string[];
  due_date?: string;
  start_date?: string;
  label_ids?: number[];
  labels?: Array<{ id: number }>;
  frequency?: string;
  repeat_interval?: number;
  repeat_on?: string | number | null;
  due_time?: unknown;
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
  type: "task" | "crm";
  title: string;
  reference: string;
}

interface TaskListRow {
  id: string | number;
  title?: string;
  reference?: string;
}

interface CreateTaskFormData {
  title: string;
  description: string;
  taskType: PlannerTaskType;
  projectId: number | null;
  statusId: number | null;
  priorityId: number | null;
  assigneeIds: number[];
  watcherIds: number[];
  dueDate: string;
  startDate: string;
  labelIds: number[];
  linkedRecordIds: number[];
  // Recurring-only
  frequency: string;
  repeatInterval: number;
  repeatOn: string;
  dueTime: string;
}

function mapPriorityStringToId(priority: string | null | undefined): number {
  const priorityMap: Record<string, number> = {
    low: 1,
    normal: 2,
    medium: 2,
    high: 3,
    urgent: 4,
  };
  return priorityMap[priority?.toLowerCase() || "normal"] || 2;
}

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

function resolveExtensionUserId(extensions: Extension[], extRef: string | undefined): number {
  if (extRef == null || extRef === "") return Number.NaN;
  const extension = extensions.find(
    (ext) => String(ext.id) === String(extRef) || ext.extension_number === extRef,
  );
  return extension ? Number(extension.id) : Number(extRef);
}

function mapAssigneeIdsFromEditTask(editTask: PlannerEditTask, extensions: Extension[]): number[] {
  if (editTask.assignees?.length) {
    return editTask.assignees.map((a) => resolveExtensionUserId(extensions, a.extension_number));
  }
  if (editTask.extension_numbers?.length) {
    return editTask.extension_numbers.map((extNum) => resolveExtensionUserId(extensions, extNum));
  }
  return [];
}

function mapWatcherIdsFromEditTask(editTask: PlannerEditTask, extensions: Extension[]): number[] {
  if (editTask.watchers?.length) {
    return editTask.watchers.map((w) => resolveExtensionUserId(extensions, w.extension_number));
  }
  if (editTask.watcher_numbers?.length) {
    return editTask.watcher_numbers.map((extNum) => resolveExtensionUserId(extensions, extNum));
  }
  return [];
}

function normalizeEditTaskType(editTask: PlannerEditTask): PlannerTaskType {
  if (editTask.type === "todo" || editTask.type === "recurring") {
    return editTask.type;
  }
  return "regular";
}

function buildInitialFormFromEdit(
  editTask: PlannerEditTask,
  extensions: Extension[],
): CreateTaskFormData {
  const projectIdRaw = editTask.project_id ?? editTask.project?.id;
  const statusIdRaw = editTask.status_id ?? editTask.status?.id;
  const assigneeIds = mapAssigneeIdsFromEditTask(editTask, extensions);
  const watcherIds = mapWatcherIdsFromEditTask(editTask, extensions);
  const taskTypeVal = normalizeEditTaskType(editTask);
  const frequency = editTask.frequency || "weekly";
  const repeatInterval = Math.max(1, Number(editTask.repeat_interval) || 1);
  const repeatOn = editTask.repeat_on == null ? "" : String(editTask.repeat_on);
  const dueTime = typeof editTask.due_time === "string" ? editTask.due_time : "";
  return {
    title: editTask.title || "",
    description: editTask.description || "",
    taskType: taskTypeVal,
    projectId: projectIdRaw ? Number(projectIdRaw) : null,
    statusId: statusIdRaw ? Number(statusIdRaw) : null,
    priorityId: mapPriorityStringToId(editTask.priority),
    assigneeIds,
    watcherIds,
    dueDate: formatDateForInput(editTask.due_date),
    startDate: formatDateForInput(editTask.start_date),
    labelIds: editTask.label_ids ?? editTask.labels?.map((l) => l.id) ?? [],
    linkedRecordIds: [],
    frequency,
    repeatInterval,
    repeatOn,
    dueTime,
  };
}

function buildInitialFormForCreate(
  taskType: PlannerTaskType,
  propProject: Project | undefined,
  propStatuses: Status[],
  selectedStatusForTask: number | null,
): CreateTaskFormData {
  return {
    title: "",
    description: "",
    taskType,
    projectId: propProject?.id ?? null,
    statusId: selectedStatusForTask || (propStatuses.length > 0 ? propStatuses[0].id : null),
    priorityId: 0,
    assigneeIds: [],
    watcherIds: [],
    dueDate: "",
    startDate: "",
    labelIds: [],
    linkedRecordIds: [],
    frequency: "weekly",
    repeatInterval: 1,
    repeatOn: "",
    dueTime: "",
  };
}

function resolveSidebarProjects(fetchedProjects: Project[], propProject: Project | undefined): Project[] {
  if (fetchedProjects.length > 0) {
    return fetchedProjects;
  }
  if (propProject) {
    return [propProject];
  }
  return [];
}

function getSidebarTitle(taskType: PlannerTaskType, isEdit: boolean): string {
  if (taskType === "todo") {
    return isEdit ? "Edit Todo" : "Create Todo";
  }
  if (taskType === "recurring") {
    return isEdit ? "Edit Recurring" : "Create Recurring";
  }
  return isEdit ? "Edit Task" : "Create Task";
}

function linkedRecordsEmptyMessage(hasSearchQuery: boolean): string {
  if (hasSearchQuery) {
    return "No tasks found matching your search";
  }
  return "No tasks available";
}

function primarySubmitButtonLabel(isSubmitting: boolean, isEdit: boolean): string {
  if (isSubmitting) return "Processing...";
  if (isEdit) return "Update";
  return "Create";
}

interface StatusSelectOptionsProps {
  formDataProjectId: number | null;
  loadingProjects: boolean;
  loadingGenericStatuses: boolean;
  statuses: Status[];
  isEdit: boolean;
  statusId: number | null;
  editTask: PlannerEditTask | undefined;
}

function StatusSelectOptions({
  formDataProjectId,
  loadingProjects,
  loadingGenericStatuses,
  statuses,
  isEdit,
  statusId,
  editTask,
}: Readonly<StatusSelectOptionsProps>): React.ReactNode {
  const isLoadingStatuses =
    Boolean(formDataProjectId && loadingProjects) ||
    Boolean(!formDataProjectId && loadingGenericStatuses);
  if (isLoadingStatuses) {
    return <option value="">Loading statuses...</option>;
  }
  if (statuses.length === 0) {
    if (isEdit && statusId != null) {
      const label =
        editTask?.status?.name ||
        editTask?.status_name ||
        `Status #${statusId}`;
      return <option value={statusId}>{label}</option>;
    }
    return <option value="">No statuses available</option>;
  }
  const missingFromList =
    isEdit &&
    statusId != null &&
    !statuses.some((s) => String(s.id) === String(statusId));
  return (
    <>
      <option value="">Select status</option>
      {missingFromList && (
        <option value={statusId}>
          {editTask?.status?.name ||
            editTask?.status_name ||
            `Status #${statusId}`}
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

function renderProjectSelectChildren(loadingProjects: boolean, projects: Project[]): React.ReactNode {
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

interface LinkedRecordListRowProps {
  record: LinkedRecord;
  selected: boolean;
  onToggle: (recordId: number) => void;
}

function LinkedRecordListRow({
  record,
  selected,
  onToggle,
}: Readonly<LinkedRecordListRowProps>) {
  return (
    <button
      type="button"
      onClick={() => onToggle(record.id)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: 12,
        cursor: "pointer",
        backgroundColor: selected ? "#edf6ff" : "white",
        border: "none",
        borderBottom: "1px solid #f1f5f9",
        width: "100%",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          backgroundColor: record.type === "crm" ? "#4e6fa5" : "#6B7280",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
          flexShrink: 0,
        }}
      >
        {record.type === "crm" ? (
          <FolderOpen size={18} color="#fff" />
        ) : (
          <ListTodo size={18} color="#fff" />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.9rem",
            color: "#141414",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record.title}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "#718096",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {record.reference}
        </div>
      </div>
      {selected && (
        <Check
          size={18}
          style={{
            color: "#3b82f6",
            marginLeft: 8,
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

const CreateTaskSidebar: React.FC<CreateTaskSidebarProps> = ({
  isOpen = false,
  onClose,
  onCreate,
  onCreateAndOpen,
  extensions = [],
  labels: propLabels = [],
  project: propProject,
  statuses: propStatuses = [],
  task: editTask,
  isEdit = false,
  selectedStatusForTask = null,
  taskType = "regular",
}) => {
  const getInitialFormData = (): CreateTaskFormData => {
    if (isEdit && editTask) {
      return buildInitialFormFromEdit(editTask, extensions);
    }
    return buildInitialFormForCreate(
      taskType,
      propProject,
      propStatuses,
      selectedStatusForTask,
    );
  };

  const [formData, setFormData] = useState<CreateTaskFormData>(getInitialFormData());
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [watcherSearchQuery, setWatcherSearchQuery] = useState("");
  const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [genericStatuses, setGenericStatuses] = useState<Status[]>([]);
  const [loadingGenericStatuses, setLoadingGenericStatuses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedRecordsFromApi, setLinkedRecordsFromApi] = useState<LinkedRecord[]>([]);
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await listProjects({ page: 1, limit: 100 });
        if (response?.success === true && Array.isArray(response.data)) {
          const projectsList = response.data.map(
            (project: {
              id: number;
              name: string;
              color?: string;
              statuses?: Project["statuses"];
              labels?: Project["labels"];
            }) => ({
            id: project.id,
            name: project.name,
            icon: "",
            color: project.color || "#3b82f6",
            statuses: project.statuses || [],
            labels: project.labels || [],
          }));
          setFetchedProjects(projectsList);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setFetchedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchGenericStatuses = async () => {
      try {
        setLoadingGenericStatuses(true);
        const response = await listStatuses();
        if (response && Array.isArray(response)) {
          const statusesList = response.map((status: Status) => ({
            id: status.id,
            name: status.name,
            icon: "",
            color: status.color || "#3b82f6",
          }));
          setGenericStatuses(statusesList);
        } else if (response?.data && Array.isArray(response.data)) {
          const statusesList = response.data.map((status: Status) => ({
            id: status.id,
            name: status.name,
            icon: "",
            color: status.color || "#3b82f6",
          }));
          setGenericStatuses(statusesList);
        } else {
          setGenericStatuses([]);
        }
      } catch (error) {
        console.error("Error fetching generic statuses:", error);
        setGenericStatuses([]);
      } finally {
        setLoadingGenericStatuses(false);
      }
    };
    fetchGenericStatuses();
  }, [isOpen]);

  const fetchLinkRecordsForSearch = useCallback(
    async (query: string, currentProjectId?: number | null) => {
      setLoadingLinkedRecords(true);
      try {
        const projectId =
          currentProjectId ??
          (isEdit ? editTask?.project_id ?? editTask?.project?.id : null);
        const response = await listTasks({
          page: 1,
          limit: 30,
          type: "regular",
          search: query.trim() || undefined,
          ...(projectId != null && projectId > 0 ? { project_id: projectId } : {}),
        });
        if (response?.data && Array.isArray(response.data)) {
          const currentTaskId =
            isEdit && editTask?.rawData?.id != null ? Number(editTask.rawData.id) : null;
          const records: LinkedRecord[] = response.data
            .filter(
              (t: TaskListRow) =>
                currentTaskId == null || Number(t.id) !== currentTaskId,
            )
            .map((t: TaskListRow) => ({
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
    [isEdit, editTask?.rawData?.id, editTask?.project_id, editTask?.project?.id]
  );

  useEffect(() => {
    if (!isOpen) return;
    void fetchLinkRecordsForSearch(searchQuery, formData.projectId);
  }, [isOpen, fetchLinkRecordsForSearch]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      if (
        isEdit &&
        editTask &&
        fetchedProjects.length === 0 &&
        loadingProjects
      ) {
        return;
      }
      setFormData(getInitialFormData());
    } else {
      setSearchQuery("");
      setFormData({
        title: "",
        description: "",
        taskType,
        projectId: propProject?.id || null,
        statusId:
          selectedStatusForTask ||
          (propStatuses.length > 0 ? propStatuses[0].id : null),
        priorityId: 0,
        assigneeIds: [],
        watcherIds: [],
        dueDate: "",
        startDate: "",
        labelIds: [],
        linkedRecordIds: [],
        frequency: "weekly",
        repeatInterval: 1,
        repeatOn: "",
        dueTime: "",
      });
    }
  }, [
    isOpen,
    editTask,
    isEdit,
    fetchedProjects.length,
    loadingProjects,
    selectedStatusForTask,
  ]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const users: UserType[] = extensions.map((ext) => ({
    id: Number(ext.id),
    name: ext.name,
    avatar: "",
    initials: ext.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase(),
  }));

  const projects: Project[] = resolveSidebarProjects(fetchedProjects, propProject);

  const getStatusesForSelectedProject = (): Status[] => {
    if (formData.projectId) {
      const selectedProject = fetchedProjects.find(
        (p) => p.id === formData.projectId
      );
      if (
        selectedProject?.statuses &&
        Array.isArray(selectedProject.statuses)
      ) {
        return selectedProject.statuses.map((status) => ({
          id: status.id,
          name: status.name,
          icon: "",
          color: status.color || "#3b82f6",
        }));
      }
      return [];
    }
    if (genericStatuses.length > 0) return genericStatuses;
    return propStatuses;
  };

  const statuses: Status[] = getStatusesForSelectedProject();

  useEffect(() => {
    if (isEdit) return;
    if (formData.projectId && fetchedProjects.length === 0) return;
    if (!formData.projectId && loadingGenericStatuses) return;
    const availableStatuses = getStatusesForSelectedProject();
    if (!formData.statusId && availableStatuses.length > 0) {
      setFormData((prev) => ({
        ...prev,
        statusId: selectedStatusForTask || availableStatuses[0].id,
      }));
    }
  }, [
    formData.projectId,
    fetchedProjects,
    genericStatuses,
    loadingGenericStatuses,
    isEdit,
    selectedStatusForTask,
  ]);

  const priorities: Priority[] = [
    { id: 0, name: "Select Priority", icon: "", color: "#6c757d" },
    { id: 1, name: "Low", icon: "🟢", color: "#10b981" },
    { id: 2, name: "Medium", icon: "🟡", color: "#eab308" },
    { id: 3, name: "High", icon: "🟠", color: "#f97316" },
    { id: 4, name: "Urgent", icon: "🔴", color: "#ef4444" },
  ];

  const getLabelsForSelectedProject = (): Label[] => {
    if (!formData.projectId) return propLabels;
    const selectedProject = fetchedProjects.find(
      (p) => p.id === formData.projectId
    );
    if (selectedProject?.labels && Array.isArray(selectedProject.labels)) {
      return selectedProject.labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color || "#3b82f6",
        description: label.description || "",
      }));
    }
    return propLabels;
  };

  const labels: Label[] = getLabelsForSelectedProject();

  const mapPriorityIdToString = (priorityId: number | null): string | undefined => {
    if (!priorityId || priorityId === 0) return "";
    const priorityMap: Record<number, string> = {
      1: "low",
      2: "normal",
      3: "high",
      4: "urgent",
    };
    return priorityMap[priorityId] || undefined;
  };

  const buildPayload = () => {
    const payload: any = {
      title: formData.title,
      description: formData.description || "",
      priority: mapPriorityIdToString(formData.priorityId) || undefined,
      due_date: formData.dueDate || "",
      start_date: formData.startDate || "",
      extension_numbers:
        formData.assigneeIds?.map((id: number) => {
          const extension = extensions.find((ext) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
      watchers:
        formData.watcherIds?.map((id: number) => {
          const extension = extensions.find((ext) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
      type: formData.taskType,
    };
    if (formData.projectId) {
      payload.project_id = formData.projectId;
      payload.label_ids = formData.labelIds || [];
    }
    if (formData.statusId) payload.status_id = formData.statusId;
    if (
      formData.linkedRecordIds &&
      formData.linkedRecordIds.length > 0
    ) {
      payload.parent_task_id = formData.linkedRecordIds[0];
    }
    if (formData.taskType === "recurring") {
      payload.frequency = formData.frequency;
      payload.repeat_interval = formData.repeatInterval;
      if (formData.repeatOn) payload.repeat_on = formData.repeatOn;
      if (formData.dueTime) payload.due_time = formData.dueTime;
      payload.end_date = formData.dueDate || null;
    }
    return payload;
  };

  const validateBeforeSubmit = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return false;
    }
    if (formData.taskType === "recurring") {
      if (!formData.projectId) {
        toast.error("Recurring tasks require a project");
        return false;
      }
      if (!formData.statusId) {
        toast.error("Recurring tasks require a status");
        return false;
      }
      if (!formData.startDate) {
        toast.error("Recurring tasks require a start date");
        return false;
      }
    }
    return true;
  };

  const persistTaskFromPayload = async (payload: ReturnType<typeof buildPayload>): Promise<boolean> => {
    if (isEdit && editTask?.id != null) {
      if (formData.taskType === "recurring") {
        return Boolean(
          await updateRecurringTask(
            editTask.id,
            payload as Parameters<typeof updateRecurringTask>[1],
          ),
        );
      }
      return Boolean(
        await updateTask(editTask.id, payload as Parameters<typeof updateTask>[1]),
      );
    }
    if (formData.taskType === "recurring") {
      const recurringPayload = {
        ...payload,
        project_id: formData.projectId as number,
        status_id: formData.statusId as number,
        start_date: formData.startDate,
        end_date: formData.dueDate || null,
        type: "recurring" as const,
      };
      return Boolean(
        await createRecurringTask(
          recurringPayload as Parameters<typeof createRecurringTask>[0],
        ),
      );
    }
    const withTz = { ...payload, timezone: getAutoTimezone() };
    return Boolean(await createTask(withTz as Parameters<typeof createTask>[0]));
  };

  const submitPlannerTask = async (
    e: React.MouseEvent | undefined,
    onSuccess: ((data: CreateTaskFormData) => void) | undefined,
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmitting) return;
    if (!validateBeforeSubmit()) return;

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      const ok = await persistTaskFromPayload(payload);
      if (ok) {
        onSuccess?.(formData);
        onClose?.();
      }
    } catch (error) {
      console.error(`Error ${isEdit ? "updating" : "creating"} task:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (e?: React.MouseEvent) => {
    await submitPlannerTask(e, onCreate);
  };

  const toggleLabel = (labelId: number) => {
    setFormData((prev) => ({
      ...prev,
      labelIds: prev.labelIds.includes(labelId)
        ? prev.labelIds.filter((id) => id !== labelId)
        : [...prev.labelIds, labelId],
    }));
  };

  const toggleAssignee = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter((id) => id !== userId)
        : [...prev.assigneeIds, userId],
    }));
  };

  const toggleWatcher = (userId: number) => {
    setFormData((prev) => ({
      ...prev,
      watcherIds: prev.watcherIds.includes(userId)
        ? prev.watcherIds.filter((id) => id !== userId)
        : [...prev.watcherIds, userId],
    }));
  };

  const selectedAssignees = users.filter((u) =>
    formData.assigneeIds.includes(u.id)
  );
  const selectedWatchers = users.filter((u) =>
    formData.watcherIds.includes(u.id)
  );
  const selectedLabels = labels.filter((l) =>
    formData.labelIds.includes(l.id)
  );

  const renderLinkedRecordsList = (): React.ReactNode => {
    if (loadingLinkedRecords) {
      return (
        <div
          className="p-3 text-center text-muted"
          style={{ fontSize: "0.9rem" }}
        >
          Loading tasks...
        </div>
      );
    }
    if (linkedRecordsFromApi.length === 0) {
      return (
        <div
          className="p-3 text-center text-muted"
          style={{ fontSize: "0.9rem" }}
        >
          {linkedRecordsEmptyMessage(Boolean(searchQuery))}
        </div>
      );
    }
    const toggleLinkedRecord = (recordId: number) => {
      setFormData((prev) => ({
        ...prev,
        linkedRecordIds: prev.linkedRecordIds.includes(recordId) ? [] : [recordId],
      }));
    };
    return linkedRecordsFromApi.map((record) => (
      <LinkedRecordListRow
        key={record.id}
        record={record}
        selected={formData.linkedRecordIds.includes(record.id)}
        onToggle={toggleLinkedRecord}
      />
    ));
  };

  if (!isOpen) return null;

  const labelStyle = {
    fontSize: "14px",
    color: "#141414",
    fontWeight: 600,
    marginBottom: 8,
  };
  const groupClass = "mb-3";

  return (
    <>
      <style>{`
        .create-task-sidebar-panel .form-control,
        .create-task-sidebar-panel .form-select {
          border-color: #8a8a8a !important;
          border-radius: 4px !important;
          height: 40px !important;
          font-size: 16px !important;
          font-weight: 300 !important;
        }

        .create-task-sidebar-panel .form-control::placeholder,
        .create-task-sidebar-panel textarea::placeholder,
        .create-task-sidebar-panel input::placeholder {
          font-size: 16px !important;
          font-weight: 300 !important;
        }
      `}</style>

      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.2)",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      />
      <div
        className="create-task-sidebar-panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 520,
          maxWidth: "100vw",
          height: "100vh",
          backgroundColor: "#fff",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.12)",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e8eef5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ListTodo size={20} color="#4e6fa5" />
            {getSidebarTitle(formData.taskType, isEdit)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "#6c757d",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          <Form onSubmit={(e) => { e.preventDefault(); handleCreate(); }}>

            <Row>

              <Col xs={12}>
              <Form.Group className={groupClass}>
              <Form.Label style={labelStyle}>
                <FileText size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                Title <span style={{ color: "#ef4444" }}>*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="py-2"
                style={{ fontSize: "14px" }}
                required
              />
            </Form.Group>
              </Col>

              <Col xs={12} md={6}>
              <Form.Group className={groupClass}>
              <Form.Label style={labelStyle}>
                Task Type <span style={{ color: "#ef4444" }}>*</span>
              </Form.Label>
              <Form.Select
                value={formData.taskType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taskType: e.target.value as PlannerTaskType,
                  })
                }
                className="py-2"
                style={{ fontSize: "14px" }}
              >
                <option value="todo">Todo</option>
                <option value="regular">Regular</option>
                <option value="recurring">Recurring</option>
              </Form.Select>
            </Form.Group>
              </Col>
              <Col xs={12} md={6}>
              <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    Priority <span style={{ color: "#ef4444" }}>*</span>
                  </Form.Label>
                  <Form.Select
                    value={formData.priorityId || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priorityId: Number(e.target.value),
                      })
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  >
                    {priorities.map((priority) => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12}>
              <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    Associate with records 
                  </Form.Label>
                  <div style={{ marginBottom: 8 }}>
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
                      style={{  fontSize: "14px" }}
                    />
                  </div>
                  <div
                    style={{
                      maxHeight: 200,
                      overflowY: "auto",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 4,
                    }}
                  >
                    {renderLinkedRecordsList()}
                  </div>
                </Form.Group>
              </Col>

              <Col xs={12}>
              {formData.taskType !== "todo" && (
              <Form.Group className={groupClass}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Form.Label style={{ ...labelStyle, marginBottom: 0 }}>
                    <Users size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Assigned To
                  </Form.Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssigneeDropdown(!showAssigneeDropdown);
                      if (!showAssigneeDropdown) setAssigneeSearchQuery("");
                    }}
                    style={{
                      backgroundColor: "rgb(255, 255, 255)",
                      borderColor: "rgb(138, 138, 138)",
                      color: "rgb(20, 20, 20)",
                      textDecoration: "none",
                      borderRadius: 4,
                      borderWidth: 1,
                      borderStyle: "solid",
                      verticalAlign: "middle",
                      paddingBlock: "8px",
                      paddingInline: "16px",
                      maxWidth: "100%",
                      fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
                      fontSize: "12px",
                      fontWeight: 300,
                      letterSpacing: "0px",
                      lineHeight: "14px",
                      textUnderlineOffset: "24%",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                    Add Assignee
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {selectedAssignees.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleAssignee(user.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 6,
                        backgroundColor: "#edf6ff",
                        border: "1px solid #bfdbfe",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        font: "inherit",
                      }}
                    >
                      <span style={{ color: "#141414", fontWeight: 500 }}>
                        {user.name}
                      </span>
                      <X size={14} style={{ color: "#64748b" }} />
                    </button>
                  ))}
                </div>
                {showAssigneeDropdown && (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 4,
                      backgroundColor: "#f8fafc",
                      maxHeight: 250,
                      overflowY: "auto",
                    }}
                  >
                    <div
                      className="p-2 border-bottom"
                      style={{ backgroundColor: "white" }}
                    >
                      <Form.Control
                        type="text"
                        placeholder="Search assignees..."
                        value={assigneeSearchQuery}
                        onChange={(e) =>
                          setAssigneeSearchQuery(e.target.value)
                        }
                        className="py-2"
                        style={{ paddingLeft: 40, fontSize: "14px" }}
                      />
                    </div>
                    {users
                      .filter((user) =>
                        user.name
                          .toLowerCase()
                          .includes(assigneeSearchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleAssignee(user.id)}
                          style={{
                            padding: "7px 12px",
                            cursor: "pointer",
                            backgroundColor: formData.assigneeIds.includes(user.id)
                              ? "#edf6ff"
                              : "white",
                            border: "none",
                            borderBottom: "1px solid #d5d5d5",
                            width: "100%",
                            textAlign: "left",
                            font: "inherit",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#141414",
                            }}
                          >
                            {user.name}
                          </span>
                          {formData.assigneeIds.includes(user.id) && (
                            <Check
                              size={18}
                              className="text-primary ms-2"
                              style={{ flexShrink: 0, display: "inline", verticalAlign: "middle" }}
                            />
                          )}
                        </button>
                      ))}
                    
                  </div>
                )}
              </Form.Group>
            )}
              </Col>

              <Col xs={12}>
              {formData.taskType !== "todo" && (
              <Form.Group className={groupClass}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Form.Label style={{ ...labelStyle, marginBottom: 0 }}>
                    <Eye size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Watchers
                  </Form.Label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWatcherDropdown(!showWatcherDropdown);
                      if (!showWatcherDropdown) setWatcherSearchQuery("");
                    }}
                    style={{
                      backgroundColor: "rgb(255, 255, 255)",
                      borderColor: "rgb(138, 138, 138)",
                      color: "rgb(20, 20, 20)",
                      textDecoration: "none",
                      borderRadius: 4,
                      borderWidth: 1,
                      borderStyle: "solid",
                      verticalAlign: "middle",
                      paddingBlock: "8px",
                      paddingInline: "16px",
                      maxWidth: "100%",
                      fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
                      fontSize: "12px",
                      fontWeight: 300,
                      letterSpacing: "0px",
                      lineHeight: "14px",
                      textUnderlineOffset: "24%",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                    Add Watcher
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  {selectedWatchers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleWatcher(user.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 6,
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        fontSize: "0.875rem",
                        cursor: "pointer",
                        font: "inherit",
                      }}
                    >
                      <span style={{ color: "#141414", fontWeight: 500 }}>
                        {user.name}
                      </span>
                      <X size={14} style={{ color: "#64748b" }} />
                    </button>
                  ))}
                </div>
                {showWatcherDropdown && (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 4,
                      backgroundColor: "#f8fafc",
                      maxHeight: 250,
                      overflowY: "auto",
                    }}
                  >
                    <div
                      className="p-2 border-bottom"
                      style={{ backgroundColor: "white" }}
                    >
                      <Form.Control
                        type="text"
                        placeholder="Search watchers..."
                        value={watcherSearchQuery}
                        onChange={(e) =>
                          setWatcherSearchQuery(e.target.value)
                        }
                        className="py-2"
                        style={{ paddingLeft: 40, fontSize: "14px" }}
                      />
                    </div>
                    {users
                      .filter((user) =>
                        user.name
                          .toLowerCase()
                          .includes(watcherSearchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleWatcher(user.id)}
                          style={{
                            padding: "7px 12px",
                            cursor: "pointer",
                            backgroundColor: formData.watcherIds.includes(user.id)
                              ? "#f0fdf4"
                              : "white",
                            border: "none",
                            borderBottom: "1px solid #d5d5d5",
                            width: "100%",
                            textAlign: "left",
                            font: "inherit",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#141414",
                            }}
                          >
                            {user.name}
                          </span>
                          {formData.watcherIds.includes(user.id) && (
                            <Check
                              size={18}
                              style={{
                                flexShrink: 0,
                                display: "inline",
                                verticalAlign: "middle",
                                color: "#22c55e",
                              }}
                            />
                          )}
                        </button>
                      ))}
                    
                  </div>
                )}
              </Form.Group>
            )}

              </Col>

              <Col xs={12} md={6}>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Start Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    End Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Group>
              </Col>

            </Row>


            {formData.taskType === "recurring" && (
              <>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Frequency
                  </Form.Label>
                  <Form.Select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Form.Select>
                </Form.Group>
                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className={groupClass}>
                      <Form.Label style={labelStyle}>
                        Repeat every
                      </Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        max={99}
                        value={formData.repeatInterval}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            repeatInterval: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                          })
                        }
                        className="py-2"
                        style={{ fontSize: "14px" }}
                      />
                      <Form.Text className="text-muted">
                        {formData.frequency === "daily" && "day(s)"}
                        {formData.frequency === "weekly" && "week(s)"}
                        {formData.frequency === "monthly" && "month(s)"}
                        {formData.frequency === "yearly" && "year(s)"}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  {(formData.frequency === "weekly" || formData.frequency === "monthly") && (
                    <Col xs={12} md={6}>
                      <Form.Group className={groupClass}>
                        <Form.Label style={labelStyle}>
                          {formData.frequency === "weekly" ? "Repeat on (days)" : "Day of month"}
                        </Form.Label>
                        {formData.frequency === "weekly" ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => {
                              const dayNum = String(idx);
                              const isChecked = formData.repeatOn.split(",").map((s) => s.trim()).includes(dayNum);
                              return (
                                <Form.Check
                                  key={day}
                                  type="checkbox"
                                  id={`repeat-${day}`}
                                  label={day}
                                  checked={isChecked}
                                  onChange={() => {
                                    const current = formData.repeatOn.split(",").map((s) => s.trim()).filter(Boolean);
                                    const next = isChecked
                                      ? current.filter((d) => d !== dayNum)
                                      : [...current, dayNum].sort((a, b) => Number(a) - Number(b));
                                    setFormData({ ...formData, repeatOn: next.join(",") });
                                  }}
                                  style={{ fontSize: "13px" }}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <Form.Control
                            type="number"
                            min={1}
                            max={31}
                            placeholder="e.g. 15"
                            value={formData.repeatOn || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              const num = v === "" ? "" : String(Math.max(1, Math.min(31, Number(v) || 1)));
                              setFormData({ ...formData, repeatOn: num });
                            }}
                            className="py-2"
                            style={{ fontSize: "14px" }}
                          />
                        )}
                      </Form.Group>
                    </Col>
                  )}
                </Row>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Calendar size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Time (optional)
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dueTime: e.target.value })
                    }
                    className="py-2"
                    style={{ fontSize: "14px" }}
                  />
                </Form.Group>
              </>
            )}




            

            

            

            <Form.Group className={groupClass}>
              <Form.Label style={labelStyle}>
                <FileText size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                Description
              </Form.Label>
              <RichTextEditor
                buttonSize="sm"
                value={formData.description || ""}
                onChange={(html: string) => {
                  setFormData({ ...formData, description: html });
                }}
                placeholder="Describe the task..."
                minHeight="100px"
                maxHeight="200px"
                maxLength={5000}
              />
            </Form.Group>

            <Row className="mb-3">
              {formData.taskType !== "todo" && (
                <Col xs={12} className="mb-3">
                  <Form.Group className={groupClass}>
                    <Form.Label style={labelStyle}>
                      <FolderOpen size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                      Project
                    </Form.Label>
                    <Form.Select
                      value={formData.projectId || ""}
                      onChange={(e) => {
                        const newProjectId = e.target.value
                          ? Number(e.target.value)
                          : null;
                        setFormData((prev) => ({
                          ...prev,
                          projectId: newProjectId,
                          statusId: null,
                        }));
                        fetchLinkRecordsForSearch(searchQuery, newProjectId);
                      }}
                      className="py-2"
                      style={{ fontSize: "14px" }}
                      disabled={loadingProjects || projects.length === 0}
                    >
                      {renderProjectSelectChildren(loadingProjects, projects)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              {formData.taskType !== "todo" && (
                <Col xs={6} className="mb-3">
                  <Form.Group className={groupClass}>
                    <Form.Label style={labelStyle}>
                      <ListTodo size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                      Status
                    </Form.Label>
                    <Form.Select
                      value={formData.statusId ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          statusId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="py-2"
                      style={{ fontSize: "14px" }}
                      disabled={
                        (formData.projectId && loadingProjects) ||
                        (!formData.projectId && loadingGenericStatuses) ||
                        statuses.length === 0
                      }
                    >
                      <StatusSelectOptions
                        formDataProjectId={formData.projectId}
                        loadingProjects={loadingProjects}
                        loadingGenericStatuses={loadingGenericStatuses}
                        statuses={statuses}
                        isEdit={isEdit}
                        statusId={formData.statusId}
                        editTask={editTask}
                      />
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

{formData.taskType !== "todo" && (
                <Col xs={12} md={6}>
                <Form.Group className={groupClass}>
                  <Form.Label style={labelStyle}>
                    <Tag size={16} className="me-2" style={{ verticalAlign: "middle" }} />
                    Labels
                  </Form.Label>
                  {selectedLabels.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      {selectedLabels.map((label) => (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleLabel(label.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 12px",
                            backgroundColor: label.color,
                            color: "#141414",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            borderRadius: 6,
                            border: "none",
                            font: "inherit",
                          }}
                        >
                          <Tag size={12} />
                          {label.name}
                          <X size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      maxHeight: 140,
                      overflowY: "auto",
                      padding: 9,
                      borderRadius: 4,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {labels.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#718096",
                          fontSize: "14px",
                        }}
                      >
                        No labels available
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {labels.map((label) => (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => toggleLabel(label.id)}
                            style={{
                              backgroundColor: formData.labelIds.includes(
                                label.id
                              )
                                ? label.color
                                : "#ffffff",
                              color: "#141414",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              padding: "6px 12px",
                              cursor: "pointer",
                              border: formData.labelIds.includes(label.id)
                                ? "2px solid #3b82f6"
                                : "1px solid #e2e8f0",
                              borderRadius: 6,
                              font: "inherit",
                            }}
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Form.Group>
                </Col>
            )}

             
              
            </Row>

            

            
            
          </Form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e8eef5",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              borderRadius: 4,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          {onCreateAndOpen && !isEdit && (
            <button
              type="button"
              onClick={(e) => void submitPlannerTask(e, onCreateAndOpen)}
              disabled={isSubmitting}
              style={{
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: "#4f46e5",
                border: "none",
                borderRadius: 4,
                color: "#fff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Processing..." : "Create & open"}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleCreate()}
            disabled={isSubmitting}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: "#000000",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {primarySubmitButtonLabel(isSubmitting, isEdit)}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateTaskSidebar;
