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
import { listTasks, listProjects, getTask, updateTask, deleteTask, getTaskActivities, getTaskComments, createTaskComment, updateTaskComment, deleteTaskComment } from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { GlobalDateTimeFormat, ModuleSlug } from "@utils/Helper";
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
  
  // Use refs to store latest filter values to avoid recreating fetchTasks on filter changes
  const filtersRef = useRef({ searchTerm, filterProject, filterAssignee, filterStatus, filterPriority, filterDueDate });
  const tasksRef = useRef<Task[]>([]);
  
  // Update refs when filters change
  useEffect(() => {
    filtersRef.current = { searchTerm, filterProject, filterAssignee, filterStatus, filterPriority, filterDueDate };
  }, [searchTerm, filterProject, filterAssignee, filterStatus, filterPriority, filterDueDate]);
  
  // Update tasks ref when tasks change
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Fetch extensions for CreateTaskModal - MUST load first before other APIs
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  
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
        params.extension_numbers = currentFilters.filterAssignee;
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
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'activity' | 'comments'>('activity');
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
      filterDueDate: 'All Dates'
    };

    setSearchTerm(cleared.searchTerm);
    setFilterProject(cleared.filterProject);
    setFilterAssignee(cleared.filterAssignee);
    setFilterStatus(cleared.filterStatus);
    setFilterPriority(cleared.filterPriority);
    setFilterDueDate(cleared.filterDueDate);

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

            <div className="table-responsive">
              <Table className="tasks-table" hover>
                <thead>
                  <tr>
                    {/* <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th> */}
                    <th>Task ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Due</th>
                   
                    <th>Created By</th>
                    <th>DateTime</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2">Loading tasks...</div>
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5 text-muted">
                        No tasks found
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(task => (
                    <tr key={task.id}>
                      {/*<td onClick={(e) => e.stopPropagation()}>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                        />
                      </td>
                      */}
                      <td className="task-id" onClick={() => handleTaskClick(task)}>{task.id}</td>
                      <td onClick={() => handleTaskClick(task)}>{task.title}</td>
                      <td onClick={() => handleTaskClick(task)}>
                        <Badge bg={getStatusVariant(task.status)} className="px-3 py-2">
                          {task.status}
                        </Badge>
                      </td>
                      <td onClick={() => handleTaskClick(task)}>
                        <Badge bg={getPriorityVariant(task.priority)} className="px-3 py-2">
                          {task.priority}
                        </Badge>
                      </td>
                      <td onClick={() => handleTaskClick(task)}>{task.project}</td>
                      <td onClick={() => handleTaskClick(task)}>
                        <div className="d-flex align-items-center gap-2">
                        
                        {!task.rawData?.assignees || task.rawData.assignees.length === 0 ? (
                          <span className="text-muted">Not assigned</span>
                        ) : (
                         task.rawData.assignees.map((assignee: any, idx: number) => {
                            const extNumber = assignee.extension_number || '';
                            
                            // Find name from hierarchyDataExtensions
                            if (!hierarchyDataExtensions) {
                              return (
                                <div key={idx} className="assignee-badge" title={extNumber}>
                                  {extNumber.toUpperCase() || 'UN'}
                                </div>
                              );
                            }
                            
                            const extension = (hierarchyDataExtensions as any[]).find(
                              (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
                            );
                            
                            const name = extension?.name || extNumber;
                            const initials = name !== extNumber
                              ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                              : (extNumber || 'UN').toUpperCase();
                            
                            return (
                              <div key={idx} className="assignee-badge" title={name}>
                                {initials}
                              </div>
                            );
                          })
                        )}
                        </div>
                      </td>

                      <td onClick={() => handleTaskClick(task)}>{task.dueDate}</td>
                      
                      <td onClick={() => handleTaskClick(task)}>
                        {(() => {
                          const extNumber = task.rawData?.created_by_extension_number || '';
                          if (!extNumber) return '';
                          
                          if (!hierarchyDataExtensions) {
                            return extNumber;
                          }
                          
                          const extension = (hierarchyDataExtensions as any[]).find(
                            (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
                          );
                          
                          return extension?.name || extNumber;
                        })()}
                        </td>
                        <td onClick={() => handleTaskClick(task)}>{task.rawData?.created_at ? moment(task.rawData?.created_at).format(GlobalDateTimeFormat) : ''}</td>
                      <td>
                        <Button variant="link" className="text-secondary p-0" onClick={() => handleTaskClick(task)}>
                          <MoreVertical size={20} />
                        </Button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {!loading && pagination.last_page > 1 && filteredTasks.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid #e8eef5'
              }}>
                <div style={{ fontSize: '13px', color: '#718096' }}>
                  Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0} tasks
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      if (pagination.page > 1 && !loading) {
                        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                      }
                    }}
                    disabled={pagination.page === 1 || loading}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: (pagination.page === 1 || loading) ? '#f8fafc' : 'white',
                      color: (pagination.page === 1 || loading) ? '#cbd5e0' : '#4a5568',
                      cursor: (pagination.page === 1 || loading) ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page > 1 && !loading) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pagination.page > 1 && !loading) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    Previous
                  </button>
                  
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                      let pageNum;
                      if (pagination.last_page <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.last_page - 2) {
                        pageNum = pagination.last_page - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            if (!loading && pagination.page !== pageNum) {
                              setPagination(prev => ({ ...prev, page: pageNum }));
                            }
                          }}
                          disabled={loading}
                          style={{
                            minWidth: '32px',
                            height: '32px',
                            padding: '0 8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            backgroundColor: pagination.page === pageNum ? '#5b8fd8' : (loading ? '#f8fafc' : 'white'),
                            color: pagination.page === pageNum ? 'white' : (loading ? '#cbd5e0' : '#4a5568'),
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                            fontWeight: pagination.page === pageNum ? '600' : '500',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (pagination.page !== pageNum && !loading) {
                              e.currentTarget.style.backgroundColor = '#f8fafc';
                              e.currentTarget.style.borderColor = '#cbd5e0';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pagination.page !== pageNum && !loading) {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => {
                      if (pagination.page < pagination.last_page && !loading) {
                        setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                      }
                    }}
                    disabled={pagination.page >= pagination.last_page || loading}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: (pagination.page >= pagination.last_page || loading) ? '#f8fafc' : 'white',
                      color: (pagination.page >= pagination.last_page || loading) ? '#cbd5e0' : '#4a5568',
                      cursor: (pagination.page >= pagination.last_page || loading) ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page < pagination.last_page && !loading) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pagination.page < pagination.last_page && !loading) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          
        </Container>
      </div>

      <Offcanvas 
        show={showTaskDetail} 
        onHide={() => {
          setShowTaskDetail(false);
          setTaskActivities([]); // Reset activities when closing
        }} 
        placement="end"
        className="task-detail-panel"
      >
        <Offcanvas.Header closeButton className="task-detail-header">
          <Offcanvas.Title>
            <div className="d-flex align-items-center justify-content-between w-100">
              <span className="fw-bold">{selectedTask?.id} {selectedTask?.title}</span>
              <div className="d-flex align-items-center gap-2">
                <Button 
                  variant="link" 
                  className="text-primary p-0" 
                  onClick={handleEditTask}
                  title="Edit Task"
                >
                  <Edit size={20} />
                </Button>
                <Button 
                  variant="link" 
                  className="text-danger p-0" 
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete Task"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="task-detail-body">
          {selectedTask && (
            <>
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Status</div>
                    <Badge bg={getStatusVariant(selectedTask.status)} className="px-3 py-2 w-100">
                      {selectedTask.status}
                    </Badge>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Priority</div>
                    <Badge bg={getPriorityVariant(selectedTask.priority)} className="px-3 py-2 w-100">
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <div className="detail-section">
                <div className="detail-label">Assignees</div>
                <div className="assignee-group">
                  {selectedTask.rawData?.assignees?.map((assignee: any, idx: number) => {
                    const extNumber = assignee.extension_number || '';
                    
                    // Find name from hierarchyDataExtensions
                    if (!hierarchyDataExtensions) {
                      return (
                        <div key={idx} className="assignee-badge" title={extNumber}>
                          {extNumber.toUpperCase() || 'UN'}
                        </div>
                      );
                    }
                    
                    const extension = (hierarchyDataExtensions as any[]).find(
                      (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
                    );
                    
                    const name = extension?.name || extNumber;
                    const initials = name !== extNumber
                      ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                      : (extNumber || 'UN').toUpperCase();
                    
                    return (
                      <div key={idx} className="assignee-badge" title={name}>
                        {initials}
                      </div>
                    );
                  })}
                  <div className="add-assignee" onClick={handleEditTask} >
                    <Plus size={16} />
                  </div>
                </div>
              </div>

{selectedTask.dueDate && (
              <div className="detail-section">
                <div className="detail-label">Due Date</div>
                <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  <Calendar size={16} className="me-2 text-muted" />
                  <span>{selectedTask.dueDate}</span>
                </div>
              </div>
              )}

              <div className="detail-section">
                <div className="detail-label">Project</div>
                {selectedTask.project}
              </div>

              <div className="detail-section">
                <div className="detail-label">Description</div>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {selectedTask.description || 'No description provided'}
                </p>
              </div>

              <Nav variant="tabs" className="detail-tabs">
                <Nav.Item>
                  <Nav.Link 
                    active={activeDetailTab === 'activity'}
                    onClick={() => setActiveDetailTab('activity')}
                  >
                    Recent Activity
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeDetailTab === 'comments'}
                    onClick={async () => {
                      setActiveDetailTab('comments');
                      // Fetch comments when switching to comments tab
                      if (selectedTask?.rawData?.id && taskComments.length === 0) {
                        try {
                          setLoadingComments(true);
                          const commentsResponse = await getTaskComments(selectedTask.rawData.id);
                          // Response is a direct array
                          if (commentsResponse && Array.isArray(commentsResponse)) {
                            setTaskComments(commentsResponse);
                          } else {
                            setTaskComments([]);
                          }
                        } catch (error) {
                          console.error('Error fetching comments:', error);
                          setTaskComments([]);
                        } finally {
                          setLoadingComments(false);
                        }
                      }
                    }}
                  >
                    Comments {taskComments.length > 0 && `(${taskComments.length})`}
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {activeDetailTab === 'activity' && (
              <div className="activity-section">
                
                {loadingActivities ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : taskActivities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                    No activities found
                  </div>
                ) : (
                  taskActivities.map((activity: any, idx: number) => {
                    // Find extension name from hierarchy data
                    const extNumber = activity.extension_number || '';
                    let extensionName = extNumber;
                    let extensionInitials = extNumber.toUpperCase() || 'UN';
                    
                    if (hierarchyDataExtensions && extNumber && extNumber !== 'system') {
                      const extension = (hierarchyDataExtensions as any[]).find(
                        (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
                      );
                      if (extension?.name) {
                        extensionName = extension.name;
                        extensionInitials = extensionName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                      }
                    }
                    
                    // Format date
                    const formatActivityDate = (dateString: string) => {
                      try {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                      } catch {
                        return dateString;
                      }
                    };
                    
                    const activityDate = formatActivityDate(activity.created_at || '');
                    const actionText = activity.description || activity.action || 'Activity';
                    
                    return (
                      <div key={activity.id || idx} className="activity-item" style={{ marginBottom: '1rem' }}>
                        <div className="assignee-avatar" style={{ width: '32px', height: '32px', fontSize: '0.7rem', flexShrink: 0 }}>
                          {extensionInitials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                            {extNumber === 'system' ? (
                              <>{actionText}</>
                            ) : (
                              <>
                                <strong>{extensionName}</strong> {actionText}
                              </>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{activityDate}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {taskActivities.length > 0 && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={async () => {
                        if (selectedTask?.rawData?.id) {
                          try {
                            setLoadingAllActivities(true);
                            setShowAllActivitiesModal(true);
                            const activitiesResponse = await getTaskActivities(selectedTask.rawData.id, 1, 100);
                            if (activitiesResponse && activitiesResponse) {
                              setAllActivities(activitiesResponse);
                            }
                          } catch (error) {
                            console.error('Error fetching all activities:', error);
                            setAllActivities([]);
                          } finally {
                            setLoadingAllActivities(false);
                          }
                        }
                      }}
                      style={{
                        color: '#4e6fa5',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      View All
                    </Button>
                  </div>
                )}
              </div>
              )}

              {activeDetailTab === 'comments' && (
              <div className="activity-section">
                {loadingComments ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <>
                    {/* Comments List */}
                    <div style={{ marginBottom: '1rem' }}>
                      {taskComments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                          No comments yet
                        </div>
                      ) : (
                        taskComments.map((comment: any, idx: number) => {
                          // Find extension name from hierarchy data
                          const extNumber = comment.extension_number || comment.user?.extension_number || '';
                          let extensionName = extNumber;
                          let extensionInitials = extNumber.toUpperCase() || 'UN';
                          
                          if (hierarchyDataExtensions && extNumber) {
                            const extension = (hierarchyDataExtensions as any[]).find(
                              (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
                            );
                            if (extension?.name) {
                              extensionName = extension.name;
                              extensionInitials = extensionName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                            }
                          }
                          
                          // Format date
                          const formatCommentDate = (dateString: string) => {
                            try {
                              const date = new Date(dateString);
                              return date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              });
                            } catch {
                              return dateString;
                            }
                          };
                          
                          const commentDate = formatCommentDate(comment.created_at || '');
                          const isEditing = editingCommentId === comment.id;
                          
                          return (
                            <div key={comment.id || idx} style={{ 
                              marginBottom: '1rem',
                              padding: '0.75rem',
                              backgroundColor: '#f8fafc',
                              borderRadius: '6px'
                            }}>
                              {isEditing ? (
                                <div>
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    style={{ marginBottom: '0.5rem' }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <Button
                                      variant="light"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditingCommentText('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={async () => {
                                        if (selectedTask?.rawData?.id && editingCommentText.trim()) {
                                          try {
                                            setSubmittingComment(true);
                                            await updateTaskComment(selectedTask.rawData.id, comment.id, editingCommentText.trim());
                                            // Refresh comments
                                            const commentsResponse = await getTaskComments(selectedTask.rawData.id);
                                            if (commentsResponse && Array.isArray(commentsResponse)) {
                                              setTaskComments(commentsResponse);
                                            } else if (commentsResponse?.data && Array.isArray(commentsResponse.data)) {
                                              setTaskComments(commentsResponse.data);
                                            }
                                            setEditingCommentId(null);
                                            setEditingCommentText('');
                                          } catch (error) {
                                            console.error('Error updating comment:', error);
                                          } finally {
                                            setSubmittingComment(false);
                                          }
                                        }
                                      }}
                                      disabled={submittingComment || !editingCommentText.trim()}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div className="assignee-avatar" style={{ 
                                      width: '32px', 
                                      height: '32px', 
                                      fontSize: '0.7rem', 
                                      flexShrink: 0 
                                    }}>
                                      {extensionInitials}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                                        <strong>{extensionName}</strong>
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{commentDate}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0"
                                        onClick={() => {
                                          setEditingCommentId(comment.id);
                                          setEditingCommentText(comment.comment || '');
                                        }}
                                        style={{ padding: '0.25rem', minWidth: 'auto' }}
                                      >
                                        <Edit size={14} />
                                      </Button>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="p-0"
                                        onClick={async () => {
                                          if (selectedTask?.rawData?.id ) {
                                            try {
                                              await deleteTaskComment(selectedTask.rawData.id, comment.id);
                                              // Refresh comments
                                              const commentsResponse = await getTaskComments(selectedTask.rawData.id);
                                              if (commentsResponse && Array.isArray(commentsResponse)) {
                                                setTaskComments(commentsResponse);
                                              } else {
                                                setTaskComments([]);
                                              }
                                            } catch (error) {
                                              console.error('Error deleting comment:', error);
                                            }
                                          }
                                        }}
                                        style={{ padding: '0.25rem', minWidth: 'auto', color: '#dc3545' }}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6',  }}>
                                    {comment.comment}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    {/* Add Comment Form */}
                    <div style={{ 
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '1rem',
                      marginTop: '1rem'
                    }}>
                      <Form.Group>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          style={{ marginBottom: '0.5rem' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              if (selectedTask?.rawData?.id && newComment.trim()) {
                                try {
                                  setSubmittingComment(true);
                                  await createTaskComment(selectedTask.rawData.id, newComment.trim());
                                  setNewComment('');
                                  // Refresh comments immediately after creating
                                  try {
                                    const commentsResponse = await getTaskComments(selectedTask.rawData.id);
                                    if (commentsResponse && Array.isArray(commentsResponse)) {
                                      setTaskComments(commentsResponse);
                                    } else {
                                      setTaskComments([]);
                                    }
                                  } catch (refreshError) {
                                    console.error('Error refreshing comments:', refreshError);
                                  }
                                } catch (error) {
                                  console.error('Error creating comment:', error);
                                } finally {
                                  setSubmittingComment(false);
                                }
                              }
                            }}
                            disabled={submittingComment || !newComment.trim()}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <Send size={14} />
                            Post Comment
                          </Button>
                        </div>
                      </Form.Group>
                    </div>
                  </>
                )}
              </div>
              )}
            </>
          )}
        </Offcanvas.Body>
        </Offcanvas>

        {/* All Activities Modal */}
        <Modal
          show={showAllActivitiesModal}
          onHide={() => {
            setShowAllActivitiesModal(false);
            setAllActivities([]);
          }}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>All Activities</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {loadingAllActivities ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Spinner animation="border" />
              </div>
            ) : allActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No activities found
              </div>
            ) : (
              allActivities.map((activity: any, idx: number) => {
                // Find extension name from hierarchy data
                const extNumber = activity.extension_number || '';
                let extensionName = extNumber;
                let extensionInitials = extNumber.toUpperCase() || 'UN';
                
                if (hierarchyDataExtensions && extNumber && extNumber !== 'system') {
                  const extension = (hierarchyDataExtensions as any[]).find(
                    (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
                  );
                  if (extension?.name) {
                    extensionName = extension.name;
                    extensionInitials = extensionName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  }
                }
                
                // Format date
                const formatActivityDate = (dateString: string) => {
                  try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                  } catch {
                    return dateString;
                  }
                };
                
                const activityDate = formatActivityDate(activity.created_at || '');
                const actionText = activity.description || activity.action || 'Activity';
                
                return (
                  <div key={activity.id || idx} style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    padding: '1rem 0',
                    borderBottom: idx < allActivities.length - 1 ? '1px solid #e2e8f0' : 'none'
                  }}>
                    <div className="assignee-avatar" style={{ 
                      width: '40px', 
                      height: '40px', 
                      fontSize: '0.8rem', 
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {extensionInitials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                        {extNumber === 'system' ? (
                          <>{actionText}</>
                        ) : (
                          <>
                            <strong>{extensionName}</strong> {actionText}
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{activityDate}</div>
                    </div>
                  </div>
                );
              })
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowAllActivitiesModal(false);
              setAllActivities([]);
            }}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

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
