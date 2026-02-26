import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { 
  X, 
  Calendar, 
  User, 
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
  Circle,
  AlertCircle,
  Check,
  Ticket,
  FileSpreadsheet,
  Phone
} from 'lucide-react';
import { toast } from 'react-toastify';
import { listProjects, createTask, updateTask, listTasks } from '@utils/tasks';
import { listStatuses } from '@utils/work-planner';
import { getAutoTimezone } from '@utils/Helper';
import RichTextEditor from '../../../pages/help-center/partials/RichTextEditor';

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
  taskType?: 'regular' | 'recurring' | 'todo'; // Task type: regular, recurring, or todo
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
  labelIds: number[];
  linkedRecordIds: number[];
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
  // Map priority string to priority ID
  const mapPriorityStringToId = (priority: string | null | undefined): number => {
    const priorityMap: Record<string, number> = {
      'low': 1,
      'normal': 2,
      'medium': 2,
      'high': 3,
      'urgent': 4
    };
    return priorityMap[priority?.toLowerCase() || 'normal'] || 2;
  };

  // Format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // Format as YYYY-MM-DD for HTML date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Initialize form data - populate from editTask if in edit mode
  const getInitialFormData = (): CreateTaskFormData => {
    if (isEdit && editTask) {
      const projectIdRaw = editTask.project_id ?? editTask.project?.id;
      const statusIdRaw = editTask.status_id ?? editTask.status?.id;

      // Map assignees from extension_numbers to assigneeIds
      const assigneeIds = editTask.assignees?.map((assignee: any) => {
        const extension = extensions.find((ext: any) => 
          ext.id === assignee.extension_number || 
          ext.extension_number === assignee.extension_number
        );
        return extension ? Number(extension.id) : Number(assignee.extension_number);
      }) || editTask.extension_numbers?.map((extNum: string) => {
        const extension = extensions.find((ext: any) => ext.id === extNum || ext.extension_number === extNum);
        return extension ? Number(extension.id) : Number(extNum);
      }) || [];

      const watcherIds = editTask.watchers?.map((watcher: any) => {
        const extension = extensions.find((ext: any) =>
          ext.id === watcher.extension_number || ext.extension_number === watcher.extension_number
        );
        return extension ? Number(extension.id) : Number(watcher.extension_number);
      }) || editTask.watcher_numbers?.map((extNum: string) => {
        const extension = extensions.find((ext: any) => ext.id === extNum || ext.extension_number === extNum);
        return extension ? Number(extension.id) : Number(extNum);
      }) || [];

      return {
        title: editTask.title || '',
        description: editTask.description || '',
        projectId: projectIdRaw ? Number(projectIdRaw) : null,
        statusId: statusIdRaw ? Number(statusIdRaw) : null,
        priorityId: mapPriorityStringToId(editTask.priority),
        assigneeIds: assigneeIds,
        watcherIds: watcherIds,
        dueDate: formatDateForInput(editTask.due_date),
        startDate: formatDateForInput(editTask.start_date),
        labelIds: editTask.label_ids || editTask.labels?.map((l: any) => l.id) || [],
        linkedRecordIds: []
      };
    }
    
    return {
      title: '',
      description: '',
      projectId: propProject?.id || null,
      statusId: selectedStatusForTask || (propStatuses.length > 0 ? propStatuses[0].id : null),
      priorityId: 0, // Default to "Select Priority" (empty value)
      assigneeIds: [],
      watcherIds: [],
      dueDate: '',
      startDate: '',
      labelIds: [],
      linkedRecordIds: []
    };
  };

  const [formData, setFormData] = useState<CreateTaskFormData>(getInitialFormData());
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [watcherSearchQuery, setWatcherSearchQuery] = useState('');
  const [showWatcherDropdown, setShowWatcherDropdown] = useState(false);
  const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [genericStatuses, setGenericStatuses] = useState<Status[]>([]);
  const [loadingGenericStatuses, setLoadingGenericStatuses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedRecordsFromApi, setLinkedRecordsFromApi] = useState<LinkedRecord[]>([]);
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState(false);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      if (!show) return; // Only fetch when modal is open
      
      try {
        setLoadingProjects(true);
        const response = await listProjects({ page: 1, limit: 100 });
        if (response && response.success === true && response.data && Array.isArray(response.data)) {
          const projectsList = response.data.map((project: any) => ({
            id: project.id,
            name: project.name,
            icon: '',
            color: project.color || '#3b82f6',
            statuses: project.statuses || [], // Store statuses from API response
            labels: project.labels || [] // Store labels from API response
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

  // Fetch generic statuses from API
  useEffect(() => {
    const fetchGenericStatuses = async () => {
      if (!show) return; // Only fetch when modal is open
      
      try {
        setLoadingGenericStatuses(true);
        const response = await listStatuses();
        if (response && Array.isArray(response)) {
          const statusesList = response.map((status: any) => ({
            id: status.id,
            name: status.name,
            icon: '',
            color: status.color || '#3b82f6'
          }));
          setGenericStatuses(statusesList);
        } else if (response?.data && Array.isArray(response.data)) {
          const statusesList = response.data.map((status: any) => ({
            id: status.id,
            name: status.name,
            icon: '',
            color: status.color || '#3b82f6'
          }));
          setGenericStatuses(statusesList);
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

  // Fetch link records via listTasks (no relations); call with any search string (including single character)
  const fetchLinkRecordsForSearch = useCallback(async (query: string, currentProjectId?: number | null) => {
    const trimmed = query.trim();
    setLoadingLinkedRecords(true);
    try {
      const projectId = currentProjectId ?? (isEdit ? (editTask?.project_id ?? editTask?.project?.id) : null);
      const response = await listTasks({
        page: 1,
        limit: 30,
        type: 'regular',
        search: trimmed || undefined,
        ...(projectId != null && projectId > 0 ? { project_id: projectId } : {}),
      });
      if (response?.data && Array.isArray(response.data)) {
        const currentTaskId = isEdit && editTask?.rawData?.id != null ? Number(editTask.rawData.id) : null;
        const records: LinkedRecord[] = response.data
          .filter((t: any) => currentTaskId == null || Number(t.id) !== currentTaskId)
          .map((t: any) => ({
            id: Number(t.id),
            type: 'task' as const,
            title: t.title || '',
            reference: t.reference || `#${t.id}`,
          }));
        setLinkedRecordsFromApi(records);
      } else {
        setLinkedRecordsFromApi([]);
      }
    } catch (error) {
      console.error('Error fetching link records:', error);
      setLinkedRecordsFromApi([]);
    } finally {
      setLoadingLinkedRecords(false);
    }
  }, [isEdit, editTask?.rawData?.id, editTask?.project_id, editTask?.project?.id]);

  useEffect(() => {
    if (!show) return;
    void fetchLinkRecordsForSearch(searchQuery, formData.projectId);
  }, [show, fetchLinkRecordsForSearch]);

  // Reset form data when modal opens/closes or editTask changes (after projects are loaded)
  useEffect(() => {
    if (show) {
      setSearchQuery(''); // Clear Link Records search when modal opens
      // Recalculate initial form data when modal opens or editTask changes
      // Wait for projects to be fetched if in edit mode (needed for statuses/labels)
      if (isEdit && editTask && fetchedProjects.length === 0 && loadingProjects) {
        // Projects are still loading, wait for them
        return;
      }
      const initialData = getInitialFormData();
      setFormData(initialData);
    } else {
      // Reset form when modal closes
      setSearchQuery('');
      setFormData({
        title: '',
        description: '',
        projectId: propProject?.id || null,
        statusId: selectedStatusForTask || (propStatuses.length > 0 ? propStatuses[0].id : null),
        priorityId: 0,
        assigneeIds: [],
        watcherIds: [],
        dueDate: '',
        startDate: '',
        labelIds: [],
        linkedRecordIds: []
      });
    }
  }, [show, editTask, isEdit, fetchedProjects, loadingProjects, selectedStatusForTask]);

  // Convert extensions to users format for assignees
  const users: UserType[] = extensions.map((ext) => ({
    id: Number(ext.id),
    name: ext.name,
    avatar: "",
    initials: ext.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }));

  // Use API-fetched projects, or fallback to propProject if provided
  const projects: Project[] = fetchedProjects.length > 0 
    ? fetchedProjects 
    : (propProject ? [propProject] : []);

  // Get statuses: if project is selected, use project statuses; otherwise use generic statuses
  const getStatusesForSelectedProject = (): Status[] => {
    // If project is selected, use project statuses
    if (formData.projectId) {
      const selectedProject = fetchedProjects.find(p => p.id === formData.projectId);
      if (selectedProject && selectedProject.statuses && Array.isArray(selectedProject.statuses)) {
        return selectedProject.statuses.map((status: any) => ({
          id: status.id,
          name: status.name,
          icon: '',
          color: status.color || '#3b82f6'
        }));
      }
      // If project selected but no statuses found, return empty array
      return [];
    }
    
    // If no project selected, use generic statuses from API
    if (genericStatuses.length > 0) {
      return genericStatuses;
    }
    
    // Fallback to propStatuses if provided
    return propStatuses;
  };

  const statuses: Status[] = getStatusesForSelectedProject();

  // Auto-select first status when project changes or generic statuses load
  useEffect(() => {
    // Only auto-select in create mode, not edit mode
    if (isEdit) {
      return;
    }

    // If project is selected, wait for projects to load
    if (formData.projectId && fetchedProjects.length === 0) {
      return;
    }

    // If no project selected, wait for generic statuses to load
    if (!formData.projectId && loadingGenericStatuses) {
      return;
    }

    // Get available statuses
    const availableStatuses = getStatusesForSelectedProject();
    
    // Auto-select first status if none selected and statuses are available
    if (!formData.statusId && availableStatuses.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        statusId: selectedStatusForTask || availableStatuses[0].id 
      }));
    }
  }, [formData.projectId, fetchedProjects, genericStatuses, loadingGenericStatuses, isEdit, selectedStatusForTask]);

  const priorities: Priority[] = [
    { id: 0, name: "Select Priority", icon: "", color: "#6c757d" },
    { id: 1, name: "Low", icon: "🟢", color: "#10b981" },
    { id: 2, name: "Medium", icon: "🟡", color: "#eab308" },
    { id: 3, name: "High", icon: "🟠", color: "#f97316" },
    { id: 4, name: "Urgent", icon: "🔴", color: "#ef4444" }
  ];

  // Get labels from selected project (from fetchedProjects), otherwise use propLabels
  const getLabelsForSelectedProject = (): Label[] => {
    if (!formData.projectId) {
      return propLabels;
    }
    
    const selectedProject = fetchedProjects.find(p => p.id === formData.projectId);
    if (selectedProject && selectedProject.labels && Array.isArray(selectedProject.labels)) {
      return selectedProject.labels.map((label: any) => ({
        id: label.id,
        name: label.name,
        color: label.color || '#3b82f6',
        description: label.description || ''
      }));
    }
    
    return propLabels;
  };

  const labels: Label[] = getLabelsForSelectedProject();

  // Link records are fetched via listTasks (see useEffect) with empty relations

  // Map priority ID to priority string
  const mapPriorityIdToString = (priorityId: number | null): string | undefined => {
    if (!priorityId || priorityId === 0) {
      return ''; // Return empty for "Select Priority" (id: 0)
    }
    const priorityMap: Record<number, string> = {
      1: 'low',
      2: 'normal',
      3: 'high',
      4: 'urgent'
    };
    return priorityMap[priorityId] || undefined;
  };

  const handleCreate = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isSubmitting) {
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map form data to API payload
      const payload: any = {
        title: formData.title,
        description: formData.description || '',
        priority: mapPriorityIdToString(formData.priorityId) || undefined,
        due_date: formData.dueDate || '',
        start_date: formData.startDate || '',
        extension_numbers: formData.assigneeIds?.map((id: number) => {
          // Find the extension by id from extensions prop
          const extension = extensions.find((ext: any) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
        watchers: formData.watcherIds?.map((id: number) => {
          const extension = extensions.find((ext: any) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
        type: taskType // Add task type (regular, recurring, or todo)
      };

      // Add project_id if available (optional)
      if (formData.projectId) {
        payload.project_id = formData.projectId;
        payload.label_ids = formData.labelIds || [];
      }

      // Add status_id if available (works for both project-based and generic statuses)
      if (formData.statusId) {
        payload.status_id = formData.statusId;
      }

      // Add parent_task_id if records are linked (use first linked record as parent)
      if (formData.linkedRecordIds && formData.linkedRecordIds.length > 0) {
        payload.parent_task_id = formData.linkedRecordIds[0];
      }

      // If edit mode, use updateTask API
      if (isEdit && editTask?.id) {
        const result = await updateTask(editTask.id, payload);
        if (result) {
          // Call the callback if provided
          if (onCreate) {
            onCreate(formData);
          }
          onHide();
        }
      } else {
        // Create mode
        const autoTimezone = getAutoTimezone();
        payload.timezone = autoTimezone;
        
        const result = await createTask(payload);
        if (result) {
          // Call the callback if provided
          if (onCreate) {
            onCreate(formData);
          }
          onHide();
        }
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} task:`, error);
      // Error is already handled by API (toast notification)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndOpen = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isSubmitting) {
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map form data to API payload
      const payload: any = {
        title: formData.title,
        description: formData.description || '',
        priority: mapPriorityIdToString(formData.priorityId) || undefined,
        due_date: formData.dueDate || '',
        start_date: formData.startDate || '',
        extension_numbers: formData.assigneeIds?.map((id: number) => {
          const extension = extensions.find((ext: any) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
        watchers: formData.watcherIds?.map((id: number) => {
          const extension = extensions.find((ext: any) => Number(ext.id) === id);
          return extension ? extension.id : String(id);
        }) || [],
        type: taskType // Add task type (regular, recurring, or todo)
      };

      // Add project_id if available (optional)
      if (formData.projectId) {
        payload.project_id = formData.projectId;
        payload.label_ids = formData.labelIds || [];
      }

      // Add status_id if available (works for both project-based and generic statuses)
      if (formData.statusId) {
        payload.status_id = formData.statusId;
      }

      // Add parent_task_id if records are linked (use first linked record as parent)
      if (formData.linkedRecordIds && formData.linkedRecordIds.length > 0) {
        payload.parent_task_id = formData.linkedRecordIds[0];
      }

      // If edit mode, use updateTask API
      if (isEdit && editTask?.id) {
        const result = await updateTask(editTask.id, payload);
        if (result) {
          // Call the callback if provided
          if (onCreateAndOpen) {
            onCreateAndOpen(formData);
          }
          onHide();
        }
      } else {
        // Create mode
        const autoTimezone = getAutoTimezone();
        payload.timezone = autoTimezone;
        
        const result = await createTask(payload);
        if (result) {
          // Call the callback if provided
          if (onCreateAndOpen) {
            onCreateAndOpen(formData);
          }
          onHide();
        }
      }
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} task:`, error);
      // Error is already handled by API (toast notification)
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      labelIds: prev.labelIds.includes(labelId)
        ? prev.labelIds.filter(id => id !== labelId)
        : [...prev.labelIds, labelId]
    }));
  };

  const toggleAssignee = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(userId)
        ? prev.assigneeIds.filter(id => id !== userId)
        : [...prev.assigneeIds, userId]
    }));
  };

  const toggleWatcher = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      watcherIds: prev.watcherIds.includes(userId)
        ? prev.watcherIds.filter(id => id !== userId)
        : [...prev.watcherIds, userId]
    }));
  };

  const selectedProject = projects.find(p => p.id === formData.projectId) || null;
  const selectedStatus = statuses.find(s => s.id === formData.statusId) || null;
  const selectedPriority = priorities.find(p => p.id === formData.priorityId) || null;
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
    >
      <Modal.Header style={{ 
        borderBottom: '1px solid #e8eef5',
        paddingBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Modal.Title style={{ 
          fontSize: '18px', 
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ListTodo size={20} color="#4e6fa5" />
          {taskType === 'todo' 
            ? (isEdit ? 'Edit Todo' : 'Create Todo')
            : taskType === 'recurring'
            ? (isEdit ? 'Edit Recurring' : 'Create Recurring')
            : (isEdit ? 'Edit Task' : 'Create Task')}
        </Modal.Title>
        <Button
          variant="link"
          onClick={onHide}
          style={{ 
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: '#6c757d',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={20} />
        </Button>
      </Modal.Header>

      <Modal.Body className="py-4">
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
                {loadingProjects ? (
                  <option value="">Loading projects...</option>
                ) : projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  <>
                    <option value="">Select project</option>
                    {projects.map(project => (
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
                {(formData.projectId && loadingProjects) || (!formData.projectId && loadingGenericStatuses) ? (
                  <option value="">Loading statuses...</option>
                ) : statuses.length === 0 ? (
                  isEdit && formData.statusId ? (
                    <option value={formData.statusId}>
                      {editTask?.status?.name || editTask?.status_name || `Status #${formData.statusId}`}
                    </option>
                  ) : (
                    <option value="">No statuses available</option>
                  )
                ) : (
                  <>
                    <option value="">Select status</option>
                    {isEdit &&
                      formData.statusId &&
                      !statuses.some(s => String(s.id) === String(formData.statusId)) && (
                        <option value={formData.statusId}>
                          {editTask?.status?.name || editTask?.status_name || `Status #${formData.statusId}`}
                        </option>
                      )}
                    {statuses.map(status => (
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
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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

      <Modal.Footer style={{ 
        borderTop: '1px solid #e8eef5',
        paddingTop: '16px',
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <Button 
          variant="light" 
          onClick={onHide}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid #e2e8f0'
          }}
        >
          Cancel
        </Button>
        
        <Button 
          variant="primary" 
          type="button"
          onClick={handleCreate}
          disabled={isSubmitting}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: '#4e6fa5',
            borderColor: '#4e6fa5'
          }}
        >
          {isSubmitting ? 'Processing...' : (isEdit ? 'Update' : 'Create')}
        </Button>
      </Modal.Footer>

      <style>{`
        .create-task-modal .modal-header .btn-close {
          display: none;
        }
      `}</style>
    </Modal>
  );
};

export default CreateTaskModal;
