import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { listTasks, listProjects, getTask, updateTask, deleteTask, getTaskActivities } from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { GlobalDateFormat, GlobalDateTimeFormat, ModuleSlug } from "@utils/Helper";
import { Spinner } from "react-bootstrap";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Table, 
  Badge, 
  Dropdown,
  Nav,
  Offcanvas,
  InputGroup,
  Modal
} from 'react-bootstrap';
import { 
  CheckSquare, 
  Plus, 
  FolderPlus, 
  ChevronDown, 
  Search, 
  X,
  MoreVertical,
  User,
  Calendar,
  AlertCircle,
  CalendarDays,
  Users,
  Star,
  Grid3x3,
  Bell,
  Edit,
  Trash2,
  MessageSquare,
  Send
} from 'lucide-react';
import SelectBox from '@components/SelectBox';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import TaskDetailOffcanvas from '@pages/work-planner/partials/TaskDetailOffcanvas';
import TasksTable from '@pages/work-planner/partials/TasksTable';
import moment from 'moment';

interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Overdue' | string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  project: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  assignees?: Array<{ name: string; initials: string }>;
  description?: string;
  comments?: number;
  completed_by_extension_number?: string;
  rawData?: any; // Store raw API data for detail view
}

interface ApiTask {
  id: number;
  task_id: string;
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
  due_time?: string;
  project?: {
    id: number;
    name: string;
  } | null;
  status?: {
    id: number;
    name: string;
    color?: string;
  } | null;
  assignees?: Array<{
    extension_number: string;
  }>;
  labels?: Array<any>;
  comments?: Array<any>;
  is_completed?: boolean;
}

const TasksList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0
  });
  const [summary, setSummary] = useState({
    openTasks: 0,
    overdue: 0,
    dueThisWeek: 0,
    unassigned: 0,
    highPriority: 0
  });
  const [projects, setProjects] = useState<string[]>(['All Projects']);
  const [allProjects, setAllProjects] = useState<Array<{ id: number; name: string }>>([]);

  // Filter state variables - declared early so they can be used in fetchTasks callback
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All Projects');
  const [filterAssignee, setFilterAssignee] = useState<string[]>([]); // Array of extension numbers
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPriority, setFilterPriority] = useState('All Priority');
  const [filterDueDate, setFilterDueDate] = useState('All Dates');
  const [filterCreatedAtFrom, setFilterCreatedAtFrom] = useState('');
  const [filterCreatedAtTo, setFilterCreatedAtTo] = useState('');
  
  // Use refs to store latest filter values to avoid recreating fetchTasks on filter changes
  const filtersRef = useRef({ searchTerm, filterProject, filterAssignee, filterStatus, filterPriority, filterDueDate, filterCreatedAtFrom, filterCreatedAtTo });
  const tasksRef = useRef<Task[]>([]);

  // Update refs when filters change
  useEffect(() => {
    filtersRef.current = { searchTerm, filterProject, filterAssignee, filterStatus, filterPriority, filterDueDate, filterCreatedAtFrom, filterCreatedAtTo };
  }, [searchTerm, filterProject, filterAssignee, filterStatus, filterPriority, filterDueDate, filterCreatedAtFrom, filterCreatedAtTo]);
  
  // Update tasks ref when tasks change
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Fetch extensions for CreateTaskModal - MUST load first before other APIs
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.USER_DIRECTORY);
  
  // Get assignees list from hierarchyDataExtensions
  const assigneesList = hierarchyDataExtensions && Array.isArray(hierarchyDataExtensions)
    ? (hierarchyDataExtensions as any[]).map((ext: any) => ({
        id: ext.id || ext.extension_number || '',
        extension_number: ext.extension_number || ext.id || '',
        name: ext.name || ext.id || ext.extension_number || 'Unknown'
      }))
    : [];

  // Map API task to UI Task
  const mapApiTaskToTask = (apiTask: ApiTask): Task => {
    const getStatusName = (status: any) => {
      if (!status) return 'N/A';
      return status.name || 'N/A';
    };

    const getPriorityName = (priority: string) => {
      const priorityMap: Record<string, string> = {
        'low': 'Low',
        'normal': 'Medium',
        'high': 'High',
        'urgent': 'Urgent'
      };
      return priorityMap[priority] || 'Low';
    };

    const formatDate = (dateStr: string | null | undefined) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return '';
      }
    };

    const getAssigneeInfo = (assignees: any[]) => {
      if (!assignees || assignees.length === 0) {
        return { assignee: 'Unassigned', assigneeInitials: 'UN', assignees: [] };
      }
      
      const firstAssignee = assignees[0];
      const extensionNumber = firstAssignee.extension_number || '';
      
      // Find name from hierarchyDataExtensions
      const findExtensionName = (extNumber: string): string => {
        if (!extNumber || !hierarchyDataExtensions) return extNumber;
        const extension = (hierarchyDataExtensions as any[]).find(
          (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
        );
        return extension?.name || extNumber;
      };
      
      const assigneeName = findExtensionName(extensionNumber);
      const initials = assigneeName !== extensionNumber 
        ? assigneeName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : extensionNumber.toUpperCase() || 'UN';
      
      const assigneesList = assignees.map((a: any) => {
        const extNum = a.extension_number || '';
        const name = findExtensionName(extNum);
        return {
          name: name,
          initials: name !== extNum
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : (extNum || 'UN').toUpperCase()
        };
      });

      return {
        assignee: assigneeName || 'Unassigned',
        assigneeInitials: initials,
        assignees: assigneesList
      };
    };

    const assigneeInfo = getAssigneeInfo(apiTask.assignees || []);

    return {
      id: apiTask.task_id || `#${apiTask.id}`,
      title: apiTask.title || '',
      status: getStatusName(apiTask.status),
      priority: getPriorityName(apiTask.priority || 'normal'),
      project: apiTask.project?.name || 'No Project',
      assignee: assigneeInfo.assignee,
      assigneeInitials: assigneeInfo.assigneeInitials,
      dueDate: formatDate(apiTask.due_date),
      assignees: assigneeInfo.assignees,
      description: apiTask.description?.replace(/<[^>]*>/g, '') || '',
      comments: apiTask.comments?.length || 0,
      rawData: apiTask
    };
  };

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Read current filter values from ref
      const currentFilters = filtersRef.current;
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        search: currentFilters.searchTerm,
        order: {
          column: 'created_at',
          dir: 'desc'
        },
        withRelations: [
          'project',
          'status',
          'assignees',
          'labels',
          'comments',
          'parent',
          'parent.status',
          'parent.project',
          'parent.assignees',
          'parent.children',
          'children',
          'children.status',
          'children.assignees'
        ]
      };

      // Add filters (reads from ref to get latest values)
      if (currentFilters.filterProject !== 'All Projects' && currentFilters.filterProject) {
        // Find project ID from allProjects list
        const selectedProject = allProjects.find(p => p.name === currentFilters.filterProject);
        if (selectedProject) {
          params.project_id = selectedProject.id;
        }
      }
      
      if (currentFilters.filterStatus !== 'All Status' && currentFilters.filterStatus) {
        // Map status name to status_id
        // First, try to find status_id from existing tasks (use ref to get latest tasks)
        const statusMap: Record<string, number> = {};
        tasksRef.current.forEach(task => {
          if (task.rawData?.status && task.status === currentFilters.filterStatus) {
            const statusId = task.rawData.status.id || task.rawData.status_id;
            if (statusId) {
              statusMap[currentFilters.filterStatus] = statusId;
            }
          }
        });
        
        // If we found a status_id, use it; otherwise, we'll need to fetch statuses or filter client-side
        if (statusMap[currentFilters.filterStatus]) {
          params.status_id = statusMap[currentFilters.filterStatus];
        }
        // Note: If status_id not found, we'll filter client-side (handled in filteredTasks)
      }

      if (currentFilters.filterPriority !== 'All Priority' && currentFilters.filterPriority) {
        const priorityMap: Record<string, string> = {
          'Low': 'low',
          'Medium': 'normal',
          'High': 'high',
          'Urgent': 'urgent'
        };
        params.priority = priorityMap[currentFilters.filterPriority] || currentFilters.filterPriority.toLowerCase();
      }

      // Add extension_numbers filter (array of extension numbers)
      if (currentFilters.filterAssignee && currentFilters.filterAssignee.length > 0) {
        params.extension_numbers = currentFilters.filterAssignee;
      }

      if (currentFilters.filterCreatedAtFrom) {
        params.created_at_from = currentFilters.filterCreatedAtFrom;
      }
      if (currentFilters.filterCreatedAtTo) {
        params.created_at_to = currentFilters.filterCreatedAtTo;
      }

      const response = await listTasks(params);
      
      if (response && response.data) {
        const mappedTasks = response.data.map(mapApiTaskToTask);
        setTasks(mappedTasks);
        console.log('response.pagination', response.pagination);
        if (response.pagination) {
          setPagination(prev => {
            const newPagination = {
              page: response.pagination.page || 1,
              limit: response.pagination.limit || 15,
              total: response.pagination.total || 0,
              last_page: response.pagination.last_page || 1,
              from: response.pagination.from || 0,
              to: response.pagination.to || 0
            };
            // Always update to sync with server response, but only if values are different
            // This ensures pagination state matches server state
            if (prev.page !== newPagination.page || 
                prev.limit !== newPagination.limit || 
                prev.total !== newPagination.total || 
                prev.last_page !== newPagination.last_page ||
                prev.from !== newPagination.from ||
                prev.to !== newPagination.to) {
              return newPagination;
            }
            return prev;
          });
        }
        
        if (response.summary) {
          setSummary({
            openTasks: response.summary.open || response.summary.total || 0,
            overdue: response.summary.overdue || 0,
            dueThisWeek: response.summary.dueThisWeek || 0,
            unassigned: response.summary.unassigned || 0,
            highPriority: response.summary.highPriority || 0
          });
        }

        // Assignees are now from hierarchyDataExtensions, no need to extract from tasks
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, allProjects]); // Only depend on pagination and data needed for status mapping (not filters)

  // Fetch projects list
  // Wait for hierarchy data to load first, then fetch projects
  useEffect(() => {
    if (hierarchyLoading) return; // Wait for hierarchy data to load
    
    const fetchProjectsList = async () => {
      try {
        const response = await listProjects({ page: 1, limit: 100 });
        if (response && response.success === true && response.data && Array.isArray(response.data)) {
          const projectsList = response.data.map((project: any) => ({
            id: project.id,
            name: project.name
          }));
          setAllProjects(projectsList);
          // Update projects filter dropdown
          setProjects(['All Projects', ...projectsList.map((project: { id: number; name: string }) => project.name)]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjectsList();
  }, [hierarchyLoading]);

  // Wait for hierarchy data to load first, then fetch tasks (initial load only)
  useEffect(() => {
    if (hierarchyLoading) return; // Wait for hierarchy data to load
    fetchTasks();
  }, [hierarchyLoading]); // Only trigger on initial load, not on filter changes

  // Handler to apply filters (called when filter button is clicked)
  const handleApplyFilters = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    // Call fetchTasks directly with current filter values
    // The pagination useEffect will also trigger, but fetchTasks has loading state to prevent issues
    fetchTasks();
  }, [fetchTasks]);

  // Fetch tasks when pagination changes (page navigation)
  useEffect(() => {
    if (hierarchyLoading) return; // Wait for hierarchy data to load
    // Skip initial load (handled by hierarchyLoading useEffect)
    // This handles pagination changes from Previous/Next buttons
    // Only trigger on actual pagination changes, not on filter changes
    // fetchTasks is recreated when pagination.page or pagination.limit changes, so it will have latest values
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, hierarchyLoading, fetchTasks]); // Include fetchTasks in deps to ensure it has latest pagination values

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState('My Work');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [taskActionLoadingId, setTaskActionLoadingId] = useState<string | null>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'activity' | 'comments' | 'documents'>('activity');
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'To Do': return 'info';
      case 'In Progress': return 'warning';
      case 'In Review': return 'secondary';
      case 'Overdue': return 'danger';
      default: return 'primary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'danger';
      case 'Urgent': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'info';
    }
  };

  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    setTaskActivities([]); // Reset activities when selecting a new task
    setTaskComments([]); // Reset comments when selecting a new task
    setActiveDetailTab('activity'); // Reset to activity tab
    
    // Fetch full task data using getTask API with relations
    if (task.rawData?.id) {
      try {
        setLoadingTaskDetail(true);
        const withRelations = [
          'parent',
          'parent.status',
          'parent.project',
          'parent.assignees',
          'parent.children',
          'children',
          'children.status',
          'children.assignees'
        ];
        const taskData = await getTask(task.rawData.id, withRelations);
        if (taskData) {
          // Update selectedTask with full data
          setSelectedTask({
            ...task,
            rawData: taskData
          });
        }
        
        // Fetch task activities
        try {
          setLoadingActivities(true);
          const activitiesResponse = await getTaskActivities(task.rawData.id, 1, 5);
          if (activitiesResponse) {
            setTaskActivities(activitiesResponse);
          }
        } catch (error) {
          console.error('Error fetching task activities:', error);
          setTaskActivities([]);
        } finally {
          setLoadingActivities(false);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoadingTaskDetail(false);
      }
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask?.rawData?.id) return;
    
    try {
      setDeletingTask(true);
      const result = await deleteTask(selectedTask?.rawData?.id as string);
      if (result) {
        setShowDeleteModal(false);
        setShowTaskDetail(false);
        setSelectedTask(null);
        // Refresh tasks list
        fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeletingTask(false);
    }
  };

  const handleStartTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const taskId = String(task.rawData?.id ?? task.id);
    if (!taskId) return;
    try {
      setTaskActionLoadingId(taskId);
      await updateTask(taskId, { start_date: new Date().toISOString() ,timezone: Intl.DateTimeFormat().resolvedOptions().timeZone});
      await fetchTasks();
    } catch (error) {
      console.error('Error starting task:', error);
    } finally {
      setTaskActionLoadingId(null);
    }
  };

  const handleEndTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const taskId = String(task.rawData?.id ?? task.id);
    if (!taskId) return;
    try {
      setTaskActionLoadingId(taskId);
      const now = new Date();  
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await updateTask(taskId, { end_date: now.toISOString(), due_date:now.toISOString(), due_time:now.toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      await fetchTasks();
    } catch (error) {
      console.error('Error ending task:', error);
    } finally {
      setTaskActionLoadingId(null);
    }
  };

  const handleEditTask = () => {
    if (!selectedTask?.rawData) return;
    
    // Set the task to edit and open the modal
    setEditingTask(selectedTask.rawData);
    setShowTaskDetail(false);
    setShowCreateTask(true);
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const clearFilters = useCallback(() => {
    const cleared = {
      searchTerm: '',
      filterProject: 'All Projects',
      filterAssignee: [] as string[],
      filterStatus: 'All Status',
      filterPriority: 'All Priority',
      filterDueDate: 'All Dates',
      filterCreatedAtFrom: '',
      filterCreatedAtTo: ''
    };

    setSearchTerm(cleared.searchTerm);
    setFilterProject(cleared.filterProject);
    setFilterAssignee(cleared.filterAssignee);
    setFilterStatus(cleared.filterStatus);
    setFilterPriority(cleared.filterPriority);
    setFilterDueDate(cleared.filterDueDate);
    setFilterCreatedAtFrom(cleared.filterCreatedAtFrom);
    setFilterCreatedAtTo(cleared.filterCreatedAtTo);

    // Keep pagination unchanged; just refresh with cleared filters
    filtersRef.current = cleared;
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'All Projects' || task.project === filterProject;
    // Assignee filtering is now done server-side via extension_numbers, so skip client-side filtering
    const matchesAssignee = filterAssignee.length === 0 || filterAssignee.some(extNum => 
      task.rawData?.assignees?.some((assignee: any) => assignee.extension_number === extNum)
    );
    const matchesStatus = filterStatus === 'All Status' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All Priority' || task.priority === filterPriority;
    
    return matchesProject && matchesAssignee && matchesStatus && matchesPriority;
  });

  const statuses = ['All Status', 'To Do', 'In Progress', 'In Review', 'Overdue', 'Completed'];
  const priorities = ['All Priority', 'Low', 'Medium', 'High', 'Urgent'];
  
  // Convert to SelectBox format (value should be the actual value, not the label)
  const projectOptions = projects.map(project => ({ value: project, label: project }));
  // Assignee options: value is extension_number (or id), label is name
  const assigneeOptions = assigneesList.map(assignee => ({ 
    value: assignee.extension_number || assignee.id, 
    label: assignee.name 
  }));
  const statusOptions = statuses.map(status => ({ value: status, label: status }));
  const priorityOptions = priorities.map(priority => ({ value: priority, label: priority }));
  const dueDateOptions = [
    { value: 'All Dates', label: 'Due: All Dates' },
    { value: 'Today', label: 'Today' },
    { value: 'This Week', label: 'This Week' },
    { value: 'This Month', label: 'This Month' },
    { value: 'Overdue', label: 'Overdue' }
  ];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      <>
      <style>{`
       
        
        .header-section {
          background-color: white;
          padding: 1.5rem 0;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .stat-card {
          border: none;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          height: 100%;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-card.open-tasks {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        }
        
        .stat-card.overdue {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }
        
        .stat-card.due-week {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }
        
        .stat-card.unassigned {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        }
        
        .stat-card.high-priority {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .stat-icon.open-tasks {
          background-color: #10b981;
          color: #ffffff;
        }

        .stat-icon.overdue {
          background-color: #ef4444;
          color: #ffffff;
        }
        
        .stat-icon.due-week {
          background-color: #3b82f6;
          color: #ffffff;
        }
        
        .stat-icon.unassigned {
          background-color: #f97316;
          color: #ffffff;
        }
        
        .stat-icon.high-priority {
          background-color: #a855f7;
          color: #ffffff;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }
        
        .stat-label {
          font-size: 0.875rem;
          opacity: 0.8;
          margin: 0;
        }
        
        .tabs-section {
          background-color: white;
          padding: 1rem 1.5rem 0 1.5rem;
          border-radius: 12px 12px 0 0;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .nav-tabs {
          border: none;
        }
        
        .nav-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          background: transparent;
        }
        
        .nav-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 3px solid #3b82f6;
        }
        
        .table-container {
          background-color: white;
          border-radius: 0 0 12px 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .tasks-table {
          margin: 0;
        }
        
        .tasks-table thead th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 1rem;
          white-space: nowrap;
        }
        
        .tasks-table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .tasks-table tbody tr {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .tasks-table tbody tr:hover {
          background-color: #f8fafc;
        }
        
        .task-id {
          font-weight: 600;
          color: #334155;
        }
        
        .assignee-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 0.5rem;

        }
        
        .task-detail-panel {
          width: 500px;
        }
        
        .task-detail-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 2px solid #e2e8f0;
          background-color: #f8fafc;
        }
        
        .task-detail-body {
          padding: 1.5rem;
          background-color: #ffffff;
        }
        
        .detail-section {
          margin-bottom: 1.25rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .assignee-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .assignee-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .add-assignee {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .add-assignee:hover {
          background-color: #cbd5e1;
        }
        
        .activity-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        
        .activity-date {
          color: #94a3b8;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .detail-tabs {
          border-bottom: 2px solid #e2e8f0;
          margin: 1.5rem -1.5rem 1.5rem -1.5rem;
          padding: 0 1.5rem;
        }
        
        .detail-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.75rem 1rem;
          font-weight: 500;
          font-size: 0.875rem;
          background: transparent;
          margin-bottom: -2px;
        }
        
        .detail-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 2px solid #3b82f6;
        }
        
        .activity-section {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .task-detail-panel {
            width: 100%;
          }
          
          .stat-card {
            margin-bottom: 1rem;
          }
          
          .table-responsive {
            font-size: 0.875rem;
          }
        }
           .table-responsive .table th:last-child, .table-responsive .table td:last-child {
          min-width: initial !important;
        }
        .table-responsive .table th:first-child, .table-responsive .table td:first-child {
          min-width: initial !important;
          max-width: initial !important;
        }
      `}</style>

     

      <div className="task-dashboard">
        <div className="header-section">
          <Container fluid>
            <Row className="align-items-center mb-4">
              <Col>
                <div className="d-flex align-items-center">
                  <CheckSquare size={32} className="text-primary me-2" />
                  <h2 className="mb-0 fw-bold">Tasks</h2>
                </div>
              </Col>
              <Col xs="auto">
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => setShowCreateTask(true)}
                  >
                    <Plus size={18} />
                    <span>Create Task</span>
                  </Button>
                  
                  {/* <Button variant="outline-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderPlus size={18} />
                    <span>Create Project</span>
                  </Button> */}
                </div>
              </Col>
            </Row>

            <Row className="g-3">
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card open-tasks w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Open Tasks</h6>
                      <h2 className="stat-number" style={{ color: '#059669' }}>{summary.openTasks}</h2>
                    </div>
                    <div className="stat-icon open-tasks">
                      <CheckSquare />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card overdue w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Overdue</h6>
                      <h2 className="stat-number" style={{ color: '#dc2626' }}>{summary.overdue}</h2>
                    </div>
                    <div className="stat-icon overdue">
                      <AlertCircle />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card due-week w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Due This Week</h6>
                      <h2 className="stat-number" style={{ color: '#2563eb' }}>{summary.dueThisWeek}</h2>
                    </div>
                    <div className="stat-icon due-week">
                      <CalendarDays />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card unassigned w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Unassigned</h6>
                      <h2 className="stat-number" style={{ color: '#ea580c' }}>{summary.unassigned}</h2>
                    </div>
                    <div className="stat-icon unassigned">
                      <Users />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card high-priority w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">High Priority</h6>
                      <h2 className="stat-number" style={{ color: '#9333ea' }}>{summary.highPriority}</h2>
                    </div>
                    <div className="stat-icon high-priority">
                      <Star />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>

        <Container fluid>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap' as const,
              gap: '1rem'
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 150px' }}>
                <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingLeft: '2.5rem',
                    border: '1px solid #E5E9F2',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#4680FF'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#E5E9F2'}
                />
              </div>

              <div style={{ flex: '1 1 130px' }}>
                <SelectBox
                  value={filterProject === 'All Projects' ? null : filterProject}
                  onChange={(value) => {
                    const val = Array.isArray(value) ? value[0] : value;
                    setFilterProject(val ? String(val) : 'All Projects');
                  }}
                  options={projectOptions}
                  placeholder="Project"
                  isSearchable
                />
              </div>

              <div style={{ flex: '1 1 130px' }}>
                <SelectBox
                  value={filterAssignee.length > 0 ? filterAssignee : null}
                  onChange={(value) => {
                    if (Array.isArray(value)) {
                      setFilterAssignee(value.map(v => String(v)));
                    } else if (value) {
                      setFilterAssignee([String(value)]);
                    } else {
                      setFilterAssignee([]);
                    }
                  }}
                  options={assigneeOptions}
                  placeholder="Assignee"
                  isSearchable
                  isMulti
                />
              </div>

              <div style={{ flex: '1 1 120px' }}>
                <SelectBox
                  value={filterStatus === 'All Status' ? null : filterStatus}
                  onChange={(value) => {
                    const val = Array.isArray(value) ? value[0] : value;
                    setFilterStatus(val ? String(val) : 'All Status');
                  }}
                  options={statusOptions}
                  placeholder="Status"
                  isSearchable
                />
              </div>

              <div style={{ flex: '1 1 120px' }}>
                <SelectBox
                  value={filterPriority === 'All Priority' ? null : filterPriority}
                  onChange={(value) => {
                    const val = Array.isArray(value) ? value[0] : value;
                    setFilterPriority(val ? String(val) : 'All Priority');
                  }}
                  options={priorityOptions}
                  placeholder="Priority"
                  isSearchable
                />
              </div>

              <div style={{ flex: '1 1 140px' }}>
                <Form.Control
                  type="date"
                  value={filterCreatedAtFrom}
                  onChange={(e) => setFilterCreatedAtFrom(e.target.value)}
                  placeholder="Start date"
                  style={{ fontSize: '0.875rem', minHeight: '38px' }}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <Form.Control
                  type="date"
                  value={filterCreatedAtTo}
                  onChange={(e) => setFilterCreatedAtTo(e.target.value)}
                  placeholder="End date"
                  style={{ fontSize: '0.875rem', minHeight: '38px' }}
                />
              </div>

              <button
                onClick={handleApplyFilters}
                style={{
                  flex: '0 1 auto',
                  padding: '0.625rem 1rem',
                  backgroundColor: '#4680FF',
                  color: 'white',
                  border: '1px solid #4680FF',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Search size={16} />
                Filter
              </button>

              <button
                onClick={clearFilters}
                style={{
                  flex: '0 1 auto',
                  padding: '0.625rem 1rem',
                  backgroundColor: 'white',
                  color: '#4680FF',
                  border: '1px solid #4680FF',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap' as const
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Clear
                <X size={16} />
              </button>
            </div>
          </div>

            <TasksTable
              tasks={filteredTasks}
              loading={loading}
              pagination={pagination}
              setPagination={setPagination}
              onTaskClick={(task) => handleTaskClick(task as Task)}
              hierarchyDataExtensions={hierarchyDataExtensions}
              getStatusVariant={getStatusVariant}
              getPriorityVariant={getPriorityVariant}
              itemLabel="tasks"
            />
          
        </Container>
      </div>

      <TaskDetailOffcanvas
        show={showTaskDetail}
        onHide={() => {
          setShowTaskDetail(false);
          setTaskActivities([]);
        }}
        selectedTask={selectedTask}
        taskActivities={taskActivities}
        loadingActivities={loadingActivities}
        activeDetailTab={activeDetailTab}
        setActiveDetailTab={setActiveDetailTab}
        taskComments={taskComments}
        setTaskComments={setTaskComments}
        loadingComments={loadingComments}
        setLoadingComments={setLoadingComments}
        newComment={newComment}
        setNewComment={setNewComment}
        submittingComment={submittingComment}
        setSubmittingComment={setSubmittingComment}
        editingCommentId={editingCommentId}
        setEditingCommentId={setEditingCommentId}
        editingCommentText={editingCommentText}
        setEditingCommentText={setEditingCommentText}
        onEditTask={handleEditTask}
        onOpenDeleteModal={() => setShowDeleteModal(true)}
        hierarchyDataExtensions={hierarchyDataExtensions}
        getStatusVariant={getStatusVariant}
        getPriorityVariant={getPriorityVariant}
      />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteTask}
          itemName={selectedTask ? `${selectedTask.id} ${selectedTask.title}` : undefined}
          itemType="task"
          loading={deletingTask}
        />

      <CreateTaskModal
        show={showCreateTask}
        onHide={() => {
          setShowCreateTask(false);
          setEditingTask(null);
        }}
        onCreate={async (data) => {
          console.log(editingTask ? 'Task updated:' : 'Task created:', data);
          setShowCreateTask(false);
          setEditingTask(null);
          // Refresh tasks after creation/update
          await fetchTasks();
        }}
        onCreateAndOpen={async (data) => {
          console.log(editingTask ? 'Task updated and opening:' : 'Task created and opening:', data);
          setShowCreateTask(false);
          setEditingTask(null);
          // Refresh tasks after creation/update
          await fetchTasks();
        }}
        extensions={hierarchyDataExtensions as any}
        labels={[]}
        task={editingTask}
        isEdit={!!editingTask}
        linkedRecords={tasks
          .filter(task => {
            // Only include tasks that have a valid id and exclude the current task if editing
            const taskId = task.rawData?.id;
            const currentTaskId = editingTask?.id || selectedTask?.rawData?.id;
            return taskId && taskId !== currentTaskId;
          })
         // .slice(0, 50) // Limit to 50 tasks for performance
          .map(task => ({
            id: Number(task.rawData?.id) || 0,
            type: 'task' as const,
            title: task.title || 'Untitled Task',
            reference: `Task #${task.rawData?.id || task.id}`
          }))}
      />
    </>
     

    </React.Fragment>
  );
};

TasksList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TasksList;
