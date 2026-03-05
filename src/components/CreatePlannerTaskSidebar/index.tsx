import React, { useState, useEffect, useCallback } from "react";
import { Form, Row, Col } from "react-bootstrap";
import {
  X,
  Calendar,
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
  Info,
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

interface Extension {
  id: string;
  name: string;
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
  task?: any;
  isEdit?: boolean;
  selectedStatusForTask?: number | null;
  taskType?: "regular" | "recurring" | "todo";
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

interface CreateTaskFormData {
  title: string;
  description: string;
  taskType: "todo" | "regular" | "recurring";
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
  const mapPriorityStringToId = (priority: string | null | undefined): number => {
    const priorityMap: Record<string, number> = {
      low: 1,
      normal: 2,
      medium: 2,
      high: 3,
      urgent: 4,
    };
    return priorityMap[priority?.toLowerCase() || "normal"] || 2;
  };

  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const getInitialFormData = (): CreateTaskFormData => {
    if (isEdit && editTask) {
      const projectIdRaw = editTask.project_id ?? editTask.project?.id;
      const statusIdRaw = editTask.status_id ?? editTask.status?.id;
      const assigneeIds =
        editTask.assignees?.map((assignee: any) => {
          const extension = extensions.find(
            (ext: any) =>
              ext.id === assignee.extension_number ||
              ext.extension_number === assignee.extension_number
          );
          return extension ? Number(extension.id) : Number(assignee.extension_number);
        }) ||
        editTask.extension_numbers?.map((extNum: string) => {
          const extension = extensions.find(
            (ext: any) => ext.id === extNum || ext.extension_number === extNum
          );
          return extension ? Number(extension.id) : Number(extNum);
        }) ||
        [];
      const watcherIds =
        editTask.watchers?.map((watcher: any) => {
          const extension = extensions.find(
            (ext: any) =>
              ext.id === watcher.extension_number ||
              ext.extension_number === watcher.extension_number
          );
          return extension ? Number(extension.id) : Number(watcher.extension_number);
        }) ||
        editTask.watcher_numbers?.map((extNum: string) => {
          const extension = extensions.find(
            (ext: any) => ext.id === extNum || ext.extension_number === extNum
          );
          return extension ? Number(extension.id) : Number(extNum);
        }) ||
        [];
      const taskTypeVal =
        editTask.type === "todo" || editTask.type === "recurring"
          ? editTask.type
          : "regular";
      const frequency = (editTask.frequency || "weekly") as string;
      const repeatInterval = Math.max(1, Number(editTask.repeat_interval) || 1);
      const repeatOn = editTask.repeat_on != null ? String(editTask.repeat_on) : "";
      const dueTime =
        typeof editTask.due_time === "string" ? editTask.due_time : "";
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
        labelIds: editTask.label_ids || editTask.labels?.map((l: any) => l.id) || [],
        linkedRecordIds: [],
        frequency,
        repeatInterval,
        repeatOn,
        dueTime,
      };
    }
    return {
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
    };
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
        if (
          response &&
          response.success === true &&
          response.data &&
          Array.isArray(response.data)
        ) {
          const projectsList = response.data.map((project: any) => ({
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
          const statusesList = response.map((status: any) => ({
            id: status.id,
            name: status.name,
            icon: "",
            color: status.color || "#3b82f6",
          }));
          setGenericStatuses(statusesList);
        } else if (response?.data && Array.isArray(response.data)) {
          const statusesList = response.data.map((status: any) => ({
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
              (t: any) => currentTaskId == null || Number(t.id) !== currentTaskId
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

  const projects: Project[] =
    fetchedProjects.length > 0 ? fetchedProjects : propProject ? [propProject] : [];

  const getStatusesForSelectedProject = (): Status[] => {
    if (formData.projectId) {
      const selectedProject = fetchedProjects.find(
        (p) => p.id === formData.projectId
      );
      if (
        selectedProject?.statuses &&
        Array.isArray(selectedProject.statuses)
      ) {
        return selectedProject.statuses.map((status: any) => ({
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
      return selectedProject.labels.map((label: any) => ({
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
          const extension = extensions.find((ext: any) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
      watchers:
        formData.watcherIds?.map((id: number) => {
          const extension = extensions.find((ext: any) => Number(ext.id) === id);
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

  const handleCreate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmitting) return;
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (formData.taskType === "recurring") {
      if (!formData.projectId) {
        toast.error("Recurring tasks require a project");
        return;
      }
      if (!formData.statusId) {
        toast.error("Recurring tasks require a status");
        return;
      }
      if (!formData.startDate) {
        toast.error("Recurring tasks require a start date");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit && editTask?.id) {
        if (formData.taskType === "recurring") {
          const result = await updateRecurringTask(editTask.id, payload);
          if (result) {
            onCreate?.(formData);
            onClose?.();
          }
        } else {
          const result = await updateTask(editTask.id, payload);
          if (result) {
            onCreate?.(formData);
            onClose?.();
          }
        }
      } else {
        if (formData.taskType === "recurring") {
          const recurringPayload = {
            ...payload,
            project_id: formData.projectId!,
            status_id: formData.statusId!,
            start_date: formData.startDate,
            end_date: formData.dueDate || null,
            type: "recurring" as const,
          };
          const result = await createRecurringTask(recurringPayload);
          if (result) {
            onCreate?.(formData);
            onClose?.();
          }
        } else {
          payload.timezone = getAutoTimezone();
          const result = await createTask(payload);
          if (result) {
            onCreate?.(formData);
            onClose?.();
          }
        }
      }
    } catch (error) {
      console.error(
        `Error ${isEdit ? "updating" : "creating"} task:`,
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndOpen = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSubmitting) return;
    if (!formData.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (formData.taskType === "recurring") {
      if (!formData.projectId || !formData.statusId || !formData.startDate) {
        toast.error("Recurring tasks require project, status, and start date");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (isEdit && editTask?.id) {
        if (formData.taskType === "recurring") {
          const result = await updateRecurringTask(editTask.id, payload);
          if (result) {
            onCreateAndOpen?.(formData);
            onClose?.();
          }
        } else {
          const result = await updateTask(editTask.id, payload);
          if (result) {
            onCreateAndOpen?.(formData);
            onClose?.();
          }
        }
      } else {
        if (formData.taskType === "recurring") {
          const recurringPayload = {
            ...payload,
            project_id: formData.projectId!,
            status_id: formData.statusId!,
            start_date: formData.startDate,
            end_date: formData.dueDate || null,
            type: "recurring" as const,
          };
          const result = await createRecurringTask(recurringPayload);
          if (result) {
            onCreateAndOpen?.(formData);
            onClose?.();
          }
        } else {
          payload.timezone = getAutoTimezone();
          const result = await createTask(payload);
          if (result) {
            onCreateAndOpen?.(formData);
            onClose?.();
          }
        }
      }
    } catch (error) {
      console.error(
        `Error ${isEdit ? "updating" : "creating"} task:`,
        error
      );
    } finally {
      setIsSubmitting(false);
    }
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

  if (!isOpen) return null;

  const labelStyle = {
    fontSize: "14px",
    color: "#2d3748",
    fontWeight: 600,
    marginBottom: 8,
  };
  const groupClass = "mb-3";

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      />
      <div
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
            {formData.taskType === "todo"
              ? isEdit
                ? "Edit Todo"
                : "Create Todo"
              : formData.taskType === "recurring"
              ? isEdit
                ? "Edit Recurring"
                : "Create Recurring"
              : isEdit
              ? "Edit Task"
              : "Create Task"}
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
                    taskType: e.target.value as "todo" | "regular" | "recurring",
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
                      style={{ paddingLeft: 40, fontSize: "14px" }}
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
                    {loadingLinkedRecords ? (
                      <div
                        className="p-3 text-center text-muted"
                        style={{ fontSize: "0.9rem" }}
                      >
                        Loading tasks...
                      </div>
                    ) : linkedRecordsFromApi.length === 0 ? (
                      <div
                        className="p-3 text-center text-muted"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {searchQuery
                          ? "No tasks found matching your search"
                          : "No tasks available"}
                      </div>
                    ) : (
                      linkedRecordsFromApi.map((record) => (
                        <div
                          key={record.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              linkedRecordIds: prev.linkedRecordIds.includes(
                                record.id
                              )
                                ? []
                                : [record.id],
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setFormData((prev) => ({
                                ...prev,
                                linkedRecordIds: prev.linkedRecordIds.includes(
                                  record.id
                                )
                                  ? []
                                  : [record.id],
                              }));
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: 12,
                            cursor: "pointer",
                            backgroundColor: formData.linkedRecordIds.includes(
                              record.id
                            )
                              ? "#edf6ff"
                              : "white",
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 4,
                              backgroundColor:
                                record.type === "crm" ? "#4e6fa5" : "#6B7280",
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
                                color: "#2d3748",
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
                          {formData.linkedRecordIds.includes(record.id) && (
                            <Check
                              size={18}
                              style={{
                                color: "#3b82f6",
                                marginLeft: 8,
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      ))
                    )}
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
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      fontSize: "0.875rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: "#fff",
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
                    <div
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleAssignee(user.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && toggleAssignee(user.id)
                      }
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
                      }}
                    >
                      <span style={{ color: "#2d3748", fontWeight: 500 }}>
                        {user.name}
                      </span>
                      <X size={14} style={{ color: "#64748b" }} />
                    </div>
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
                        <div
                          key={user.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleAssignee(user.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && toggleAssignee(user.id)
                          }
                          style={{
                            padding: "7px 12px",
                            cursor: "pointer",
                            backgroundColor: formData.assigneeIds.includes(user.id)
                              ? "#edf6ff"
                              : "white",
                              borderBottom: "1px solid #d5d5d5",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#2d3748",
                              // fontWeight: 500,
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
                        </div>
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
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      fontSize: "0.875rem",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: "#fff",
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
                    <div
                      key={user.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleWatcher(user.id)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && toggleWatcher(user.id)
                      }
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
                      }}
                    >
                      <span style={{ color: "#2d3748", fontWeight: 500 }}>
                        {user.name}
                      </span>
                      <X size={14} style={{ color: "#64748b" }} />
                    </div>
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
                        <div
                          key={user.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleWatcher(user.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && toggleWatcher(user.id)
                          }
                          style={{
                            padding: "7px 12px",
                            cursor: "pointer",
                            backgroundColor: formData.watcherIds.includes(user.id)
                              ? "#f0fdf4"
                              : "white",
                            borderBottom: "1px solid #d5d5d5",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "13px",
                              color: "#2d3748",
                              // fontWeight: 500,
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
                        </div>
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
                      {loadingProjects ? (
                        <option value="">Loading projects...</option>
                      ) : projects.length === 0 ? (
                        <option value="">No projects available</option>
                      ) : (
                        <>
                          <option value="">Select project</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </>
                      )}
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
                      {(formData.projectId && loadingProjects) ||
                      (!formData.projectId && loadingGenericStatuses) ? (
                        <option value="">Loading statuses...</option>
                      ) : statuses.length === 0 ? (
                        isEdit && formData.statusId ? (
                          <option value={formData.statusId}>
                            {editTask?.status?.name ||
                              editTask?.status_name ||
                              `Status #${formData.statusId}`}
                          </option>
                        ) : (
                          <option value="">No statuses available</option>
                        )
                      ) : (
                        <>
                          <option value="">Select status</option>
                          {isEdit &&
                            formData.statusId &&
                            !statuses.some(
                              (s) => String(s.id) === String(formData.statusId)
                            ) && (
                              <option value={formData.statusId}>
                                {editTask?.status?.name ||
                                  editTask?.status_name ||
                                  `Status #${formData.statusId}`}
                              </option>
                            )}
                          {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </>
                      )}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

{formData.taskType !== "todo" && (
              <>
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
                        <div
                          key={label.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleLabel(label.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 12px",
                            backgroundColor: label.color,
                            color: "#2d3748",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            cursor: "pointer",
                            borderRadius: 6,
                          }}
                        >
                          <Tag size={12} />
                          {label.name}
                          <X size={12} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      maxHeight: 140,
                      overflowY: "auto",
                      padding: 12,
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
                          <div
                            key={label.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleLabel(label.id)}
                            style={{
                              backgroundColor: formData.labelIds.includes(
                                label.id
                              )
                                ? label.color
                                : "#ffffff",
                              color: "#2d3748",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              padding: "6px 12px",
                              cursor: "pointer",
                              border: formData.labelIds.includes(label.id)
                                ? "2px solid #3b82f6"
                                : "1px solid #e2e8f0",
                              borderRadius: 6,
                            }}
                          >
                            {label.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Form.Group>
                </Col>

               
              </>
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
          <button
            type="button"
            onClick={() => handleCreate()}
            disabled={isSubmitting}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: "#4e6fa5",
              border: "none",
              borderRadius: 4,
              color: "#fff",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting
              ? "Processing..."
              : isEdit
              ? "Update"
              : "Create"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CreateTaskSidebar;
