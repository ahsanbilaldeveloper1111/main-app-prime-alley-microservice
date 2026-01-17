import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { listTasks, listProjects, getTask, updateTask, deleteTask } from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug } from "@utils/Helper";
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
  InputGroup
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
  Trash2
} from 'lucide-react';
import SelectBox from '@components/SelectBox';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';

interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Overdue' | string;
  priority: 'Low' | 'Medium' | 'High' | string;
  project: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  assignees?: Array<{ name: string; initials: string }>;
  description?: string;
  comments?: number;
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
    limit: 20,
    total: 0,
    last_page: 1
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
  const [filterAssignee, setFilterAssignee] = useState('All Assignees');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPriority, setFilterPriority] = useState('All Priority');
  const [filterDueDate, setFilterDueDate] = useState('All Dates');

  // Fetch extensions for CreateTaskModal - MUST load first before other APIs
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  
  // Get assignees list from hierarchyDataExtensions
  const assigneesList = hierarchyDataExtensions && Array.isArray(hierarchyDataExtensions)
    ? (hierarchyDataExtensions as any[]).map((ext: any) => ({
        id: ext.id || ext.extension_number || '',
        name: ext.name || ext.id || ext.extension_number || 'Unknown'
      }))
    : [];
  
  // Create assignees array for dropdown (includes "All Assignees" option)
  const assignees = ['All Assignees', ...assigneesList.map(ext => ext.name)];

  // Map API task to UI Task
  const mapApiTaskToTask = (apiTask: ApiTask): Task => {
    const getStatusName = (status: any) => {
      if (!status) return 'To Do';
      return status.name || 'To Do';
    };

    const getPriorityName = (priority: string) => {
      const priorityMap: Record<string, string> = {
        'low': 'Low',
        'normal': 'Medium',
        'high': 'High'
      };
      return priorityMap[priority] || 'Medium';
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
        : extensionNumber.substring(0, 2).toUpperCase() || 'UN';
      
      const assigneesList = assignees.map((a: any) => {
        const extNum = a.extension_number || '';
        const name = findExtensionName(extNum);
        return {
          name: name,
          initials: name !== extNum
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : (extNum || 'UN').substring(0, 2).toUpperCase()
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
      
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
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

      // Add filters
      if (filterProject !== 'All Projects' && filterProject) {
        // Find project ID from tasks or pass as string (will need project list API)
        // For now, we'll filter client-side if project name is provided
      }
      
      if (filterStatus !== 'All Status' && filterStatus) {
        // Map status name to status_id if needed
        // For now, filter client-side
      }

      if (filterPriority !== 'All Priority' && filterPriority) {
        const priorityMap: Record<string, string> = {
          'Low': 'low',
          'Medium': 'normal',
          'High': 'high'
        };
        params.priority = priorityMap[filterPriority] || filterPriority.toLowerCase();
      }

      const response = await listTasks(params);
      
      if (response && response.data) {
        const mappedTasks = response.data.map(mapApiTaskToTask);
        setTasks(mappedTasks);
        
        if (response.pagination) {
          setPagination(prev => {
            // Only update if values actually changed to prevent infinite loop
            const newPagination = {
              page: response.pagination.page || 1,
              limit: response.pagination.limit || 20,
              total: response.pagination.total || 0,
              last_page: response.pagination.last_page || 1
            };
            // Only update if something actually changed
            if (prev.page !== newPagination.page || 
                prev.limit !== newPagination.limit || 
                prev.total !== newPagination.total || 
                prev.last_page !== newPagination.last_page) {
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
  }, [pagination.page, pagination.limit, searchTerm, filterProject, filterStatus, filterPriority]);

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

  // Wait for hierarchy data to load first, then fetch tasks
  useEffect(() => {
    if (hierarchyLoading) return; // Wait for hierarchy data to load
    fetchTasks();
  }, [fetchTasks, hierarchyLoading]);

  // Update pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, filterProject, filterStatus, filterPriority, filterAssignee, filterDueDate]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState('My Work');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

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
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    
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
      const result = await deleteTask(selectedTask.rawData.id);
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

  const clearFilters = () => {
    setFilterProject('All Projects');
    setFilterAssignee('All Assignees');
    setFilterStatus('All Status');
    setFilterPriority('All Priority');
    setFilterDueDate('All Dates');
    setSearchTerm('');
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'All Projects' || task.project === filterProject;
    const matchesAssignee = filterAssignee === 'All Assignees' || task.assignee === filterAssignee;
    const matchesStatus = filterStatus === 'All Status' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All Priority' || task.priority === filterPriority;
    
    return matchesProject && matchesAssignee && matchesStatus && matchesPriority;
  });

  const statuses = ['All Status', 'To Do', 'In Progress', 'In Review', 'Overdue'];
  const priorities = ['All Priority', 'Low', 'Medium', 'High'];
  
  // Convert to SelectBox format (value should be the actual value, not the label)
  const projectOptions = projects.map(project => ({ value: project, label: project }));
  const assigneeOptions = assignees.map(assignee => ({ value: assignee, label: assignee }));
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
                  value={filterAssignee === 'All Assignees' ? null : filterAssignee}
                  onChange={(value) => {
                    const val = Array.isArray(value) ? value[0] : value;
                    setFilterAssignee(val ? String(val) : 'All Assignees');
                  }}
                  options={assigneeOptions}
                  placeholder="Assignee"
                  isSearchable
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
                <SelectBox
                  value={filterDueDate === 'All Dates' ? null : filterDueDate}
                  onChange={(value) => {
                    const val = Array.isArray(value) ? value[0] : value;
                    setFilterDueDate(val ? String(val) : 'All Dates');
                  }}
                  options={dueDateOptions}
                  placeholder="Due Date"
                  isSearchable={false}
                />
              </div>

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
                Clear Filters
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="tabs-section">
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'My Work'}
                  onClick={() => setActiveTab('My Work')}
                >
                  My Work
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'All Tasks'}
                  onClick={() => setActiveTab('All Tasks')}
                >
                  All Tasks
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'Activity'}
                  onClick={() => setActiveTab('Activity')}
                >
                  Activity
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <div className="table-container">
            {pagination.last_page > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                <div>
                  Showing {pagination.page === 1 ? 1 : ((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tasks
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={pagination.page >= pagination.last_page}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            <div className="table-responsive">
              <Table className="tasks-table" hover>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Task ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Due</th>
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
                      <td onClick={(e) => e.stopPropagation()}>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                        />
                      </td>
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
                        <div className="d-flex align-items-center">
                          <span className="assignee-avatar">{task.assigneeInitials}</span>
                          <span>{task.assignee}</span>
                        </div>
                      </td>
                      <td onClick={() => handleTaskClick(task)}>{task.dueDate}</td>
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
          </div>
        </Container>
      </div>

      <Offcanvas 
        show={showTaskDetail} 
        onHide={() => setShowTaskDetail(false)} 
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
                  {selectedTask.assignees?.map((assignee, idx) => (
                    <div key={idx} className="assignee-badge" title={assignee.name}>
                      {assignee.initials}
                    </div>
                  ))}
                  <div className="add-assignee">
                    <Plus size={16} />
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Due Date</div>
                <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  <Calendar size={16} className="me-2 text-muted" />
                  <span>{selectedTask.dueDate}</span>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Project</div>
                <Badge bg="light" text="dark" className="px-3 py-2" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                  {selectedTask.project}
                </Badge>
              </div>

              <div className="detail-section">
                <div className="detail-label">Description</div>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {selectedTask.description || 'No description provided'}
                </p>
              </div>

              <Nav variant="tabs" className="detail-tabs">
                <Nav.Item>
                  <Nav.Link active>Activity</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link>
                    Comments {selectedTask.comments && `(${selectedTask.comments})`}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link>History</Nav.Link>
                </Nav.Item>
              </Nav>

              <div className="activity-section">
                <div className="activity-date" style={{ fontWeight: '600', marginBottom: '1rem' }}>Recent Activity</div>
                
                <div className="activity-item" style={{ marginBottom: '1rem' }}>
                  <div className="assignee-avatar" style={{ width: '32px', height: '32px', fontSize: '0.7rem', flexShrink: 0 }}>
                    JD
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      <strong>John D.</strong> was assigned to this task
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apr 22, 2024 at 10:30 AM</div>
                  </div>
                </div>

                <div className="activity-item" style={{ marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertCircle size={16} color="#64748b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      Status changed to <strong>"In Progress"</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apr 22, 2024 at 10:15 AM</div>
                  </div>
                </div>

                <div className="activity-item">
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus size={16} color="#64748b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      Task created
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apr 20, 2024 at 9:00 AM</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Offcanvas.Body>
        </Offcanvas>

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
      />
    </>
     

    </React.Fragment>
  );
};

TasksList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TasksList;
