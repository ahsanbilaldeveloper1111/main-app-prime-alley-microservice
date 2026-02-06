import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useSession } from "next-auth/react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { listTasks, getTask, updateTask, deleteTask, listProjects } from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug, formatDateForTable } from "@utils/Helper";
import { Spinner, Button, Form, Dropdown } from 'react-bootstrap';
import GenericTable, { TableColumn, TableAction } from '@components/GenericTable';
import GenericSidebar from '@components/GenericSidebar';
import GenericFilterSidebar, { FilterField } from '@components/GenericFilterSidebar';
import CreateRecurringTaskModal from '@components/work-planner/createrecurringtask-modal';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import {
  Plus,
  Search,
  Settings,
  ChevronDown,
  MoreVertical,
  Grid3x3,
  Bell,
  User,
  Calendar,
  Check,
  Square,
  Lock,
  Mail,
  Server,
  MessageSquare,
  Users as UsersIcon,
  BarChart3,
  Target,
  Clock,
  X,
  Repeat,
  FolderOpen,
  SlidersHorizontal
} from 'lucide-react';


interface RecurringTask {
    id: string;
    name: string;
    recurrence: string;
    nextRun: string;
    reminder: string;
    labels: Array<{ text: string; color: string; type?: string }>;
    completed: boolean;
    status: 'active' | 'paused';
    category: 'today' | 'upcoming';
    rawData?: any; // Store raw API data
  }

interface ApiRecurringTask {
  id: number;
  task_id: string;
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
  next_run_at?: string;
  reminder_minutes?: number;
  frequency?: string;
  frequency_config?: any;
  is_active?: boolean;
  is_completed?: boolean;
  status?: {
    id: number;
    name: string;
    color?: string;
  } | null;
  labels?: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  project?: {
    id: number;
    name: string;
  } | null;
}

interface ProjectOption {
  id: number;
  name: string;
  labels?: Array<{
    id: number;
    name: string;
    color?: string;
  }>;
}

const RecurringReminders = () => {
  const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'active' | 'dueToday' | 'enabled'>('active');
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [todoSearchQuery, setTodoSearchQuery] = useState('');
    const [frequencyFilter, setFrequencyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [labelsFilter, setLabelsFilter] = useState('all');
    const [showFilterSidebar, setShowFilterSidebar] = useState(false);
    const [projectsList, setProjectsList] = useState<ProjectOption[]>([]);
    const [loadingProjectsList, setLoadingProjectsList] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<{
      page: number;
      limit: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    }>({
      page: 1,
      limit: 15,
      total: 0,
      last_page: 1,
      from: 0,
      to: 0
    });
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTask, setDeletingTask] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    
    // Fetch extensions for assignees
    const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.USER_DIRECTORY);
  
    // Hardcoded data for reference (not used - replaced by API)
    const _hardcodedTasks: RecurringTask[] = [
      {
        id: 'review-tickets',
        name: 'Review open tickets',
        recurrence: 'Weekly (Monday)',
        nextRun: 'Apr 17, 9:00 AM',
        reminder: '30 min before',
        labels: [{ text: 'Support', color: '#2563eb', type: 'support' }],
        completed: false,
        status: 'active',
        category: 'today'
      },
      {
        id: 'team-sync',
        name: 'Weekly team sync',
        recurrence: 'Weekly (Monday)',
        nextRun: 'Apr 17, 10:00 AM',
        reminder: '10 min before',
        labels: [{ text: 'Meeting', color: '#a855f7', type: 'meeting' }],
        completed: false,
        status: 'active',
        category: 'today'
      },
      {
        id: 'sales-report',
        name: 'Send weekly sales report',
        recurrence: 'Weekly (Friday)',
        nextRun: 'Apr 19, 4:00 PM',
        reminder: '1 hour before',
        labels: [
          { text: 'Report', color: '#dc2626', type: 'report' },
          { text: 'Email', color: '#f97316', type: 'email' }
        ],
        completed: false,
        status: 'active',
        category: 'upcoming'
      },
      {
        id: 'standup-meeting',
        name: 'Prepare Monday standup meeting',
        recurrence: 'Weekly (Sunday)',
        nextRun: 'Apr 21, 9:00 AM',
        reminder: '1 hour before',
        labels: [{ text: 'Project', color: '#06b6d4', type: 'project' }],
        completed: false,
        status: 'active',
        category: 'upcoming'
      },
      {
        id: 'backup-server',
        name: 'Backup server',
        recurrence: 'Daily (Weekdays)',
        nextRun: 'Apr 17, 11:00 PM',
        reminder: '5 min before',
        labels: [{ text: 'Server', color: '#16a34a', type: 'server' }],
        completed: false,
        status: 'active',
        category: 'today'
      },
      {
        id: 'client-follow-up',
        name: 'Client follow-up calls',
        recurrence: 'Daily (Weekdays)',
        nextRun: 'Apr 17, 2:00 PM',
        reminder: '15 min before',
        labels: [{ text: 'Sales', color: '#ec4899', type: 'sales' }],
        completed: false,
        status: 'active',
        category: 'today'
      }
    ];
  
    const getLabelIcon = (type?: string) => {
      switch (type) {
        case 'support': return <MessageSquare size={12} />;
        case 'meeting': return <UsersIcon size={12} />;
        case 'report': return <BarChart3 size={12} />;
        case 'email': return <Mail size={12} />;
        case 'project': return <Target size={12} />;
        case 'server': return <Server size={12} />;
        case 'sales': return <BarChart3 size={12} />;
        default: return null;
      }
    };

    const tableColumns: TableColumn<RecurringTask>[] = React.useMemo(() => [
      { key: 'name', label: 'Task Name', sortable: true, accessor: (row) => row.name },
      { key: 'recurrence', label: 'Recurrence', sortable: true, accessor: (row) => row.recurrence, render: (row) => <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Repeat size={14} />{row.recurrence}</div> },
      { key: 'nextRun', label: 'Next Run', sortable: true, accessor: (row) => row.nextRun, render: (row) => <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} color="#64748b" />{row.nextRun}</div> },
      { key: 'reminder', label: 'Reminder', sortable: true, accessor: (row) => row.reminder, render: (row) => <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bell size={14} />{row.reminder}</div> },
      {
        key: 'labels',
        label: 'Labels',
        sortable: false,
        render: (row) => (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
            {(row.labels || []).map((label: { text: string; color: string; type?: string }, idx: number) => (
              <span
                key={idx}
                style={{
                  backgroundColor: label.color,
                  color: 'white',
                  padding: '5px 11px',
                  fontWeight: '800',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '8px',
                  boxShadow: `0 3px 8px ${label.color}60`,
                  border: 'none',
                }}
              >
                {getLabelIcon(label.type)}
                {label.text}
              </span>
            ))}
          </div>
        ),
      },
    ], []);
    
    useEffect(() => {
      const fetchProjectsList = async () => {
        try {
          setLoadingProjectsList(true);
          const response = await listProjects({ page: 1, limit: 200 });
          if (response && response.success === true && Array.isArray(response.data)) {
            const mapped = response.data.map((p: any) => ({
              id: Number(p.id),
              name: String(p.name || ''),
              labels: Array.isArray(p.labels) ? p.labels : [],
            }));
            setProjectsList(mapped);
          } else {
            setProjectsList([]);
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
          setProjectsList([]);
        } finally {
          setLoadingProjectsList(false);
        }
      };

      fetchProjectsList();
    }, []);

    const labelOptions = React.useMemo(() => {
      const toType = (name: string) => String(name || '').trim().toLowerCase().replace(/\s+/g, '-');

      const sourceLabels =
        projectFilter !== 'all'
          ? projectsList.find(p => String(p.id) === String(projectFilter))?.labels || []
          : projectsList.flatMap(p => p.labels || []);

      const seen = new Set<string>();
      return sourceLabels
        .map(l => ({ id: l.id, name: l.name, type: toType(l.name) }))
        .filter(l => l.type)
        .filter(l => {
          if (seen.has(l.type)) return false;
          seen.add(l.type);
          return true;
        });
    }, [projectFilter, projectsList]);

    const filterFields: FilterField[] = React.useMemo(() => [
      {
        id: 'search',
        label: 'Search',
        type: 'text',
        value: todoSearchQuery,
        onChange: (v: string) => setTodoSearchQuery(v ?? ''),
        placeholder: 'Search recurring tasks...',
      },
      {
        id: 'frequency',
        label: 'Frequency',
        type: 'dropdown',
        value: frequencyFilter,
        onChange: (v) => setFrequencyFilter(v ?? 'all'),
        options: [
          { value: 'all', label: 'All Frequencies' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ],
      },
      {
        id: 'status',
        label: 'Status',
        type: 'dropdown',
        value: statusFilter,
        onChange: (v) => setStatusFilter(v ?? 'all'),
        options: [
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'Paused' },
        ],
      },
      {
        id: 'project',
        label: 'Project',
        type: 'dropdown',
        value: projectFilter,
        onChange: (v) => {
          setProjectFilter(v ?? 'all');
          setLabelsFilter('all');
        },
        options: [
          { value: 'all', label: 'All Projects' },
          ...projectsList.map((p) => ({ value: String(p.id), label: p.name })),
        ],
      },
      {
        id: 'labels',
        label: 'Labels',
        type: 'dropdown',
        value: labelsFilter,
        onChange: (v) => setLabelsFilter(v ?? 'all'),
        options: [
          { value: 'all', label: 'All Labels' },
          ...labelOptions.map((l) => ({ value: l.type, label: l.name })),
        ],
      },
    ], [todoSearchQuery, frequencyFilter, statusFilter, projectFilter, labelsFilter, projectsList, labelOptions]);

    // Map API task to RecurringTask format
    const mapApiTaskToRecurringTask = (apiTask: ApiRecurringTask): RecurringTask => {
      // Format recurrence pattern
      const formatRecurrence = () => {
        if (!apiTask.frequency) return 'Not set';
        const freq = apiTask.frequency.toLowerCase();
        const config = apiTask.frequency_config || {};
        
        if (freq === 'daily') {
          return config.weekdays_only ? 'Daily (Weekdays)' : 'Daily';
        } else if (freq === 'weekly') {
          const day = config.day_of_week || 'Monday';
          return `Weekly (${day})`;
        } else if (freq === 'monthly') {
          const day = config.day_of_month || 1;
          return `Monthly (Day ${day})`;
        }
        return apiTask.frequency.charAt(0).toUpperCase() + apiTask.frequency.slice(1);
      };

      // Format next run date
      const formatNextRun = () => {
        if (!apiTask.next_run_at) return 'Not scheduled';
        try {
          const date = new Date(apiTask.next_run_at);
          return formatDateForTable(apiTask.next_run_at);
        } catch {
          return 'Invalid date';
        }
      };

      // Format reminder
      const formatReminder = () => {
        if (!apiTask.reminder_minutes) return 'No reminder';
        const minutes = apiTask.reminder_minutes;
        if (minutes < 60) return `${minutes} min before`;
        const hours = Math.floor(minutes / 60);
        return hours === 1 ? '1 hour before' : `${hours} hours before`;
      };

      // Determine category based on next_run_at
      const getCategory = (): 'today' | 'upcoming' => {
        if (!apiTask.next_run_at) return 'upcoming';
        try {
          const nextRun = new Date(apiTask.next_run_at);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          nextRun.setHours(0, 0, 0, 0);
          return nextRun.getTime() === today.getTime() ? 'today' : 'upcoming';
        } catch {
          return 'upcoming';
        }
      };

      return {
        id: apiTask.task_id || `#${apiTask.id}`,
        name: apiTask.title || '',
        recurrence: formatRecurrence(),
        nextRun: formatNextRun(),
        reminder: formatReminder(),
        labels: (apiTask.labels || []).map(label => ({
          text: label.name,
          color: label.color || '#3b82f6',
          type: label.name.toLowerCase().replace(/\s+/g, '-')
        })),
        completed: apiTask.is_completed || false,
        status: apiTask.is_active ? 'active' : 'paused',
        category: getCategory(),
        rawData: apiTask
      };
    };

    // Fetch recurring tasks from API
    const fetchTasks = useCallback(async () => {
      try {
        setLoading(true);
        
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
          type: 'recurring', // Key difference: type is 'recurring'
          search: todoSearchQuery,
          order: {
            column: 'created_at',
            dir: 'desc'
          },
          withRelations: [
            'project',
            'status',
            'assignees',
            'labels'
          ]
        };

        // Add filters
        if (frequencyFilter !== 'all') {
          params.frequency = frequencyFilter;
        }

        if (statusFilter !== 'all') {
          params.is_active = statusFilter === 'active';
        }

        if (projectFilter !== 'all') {
          params.project_id = Number(projectFilter);
        }

        const response = await listTasks(params);
        
        if (response && response.data) {
          const mappedTasks = response.data.map(mapApiTaskToRecurringTask);
          setRecurringTasks(mappedTasks);
          
          if (response.pagination) {
            setPagination(prev => ({
              page: response.pagination.page || 1,
              limit: response.pagination.limit || 20,
              total: response.pagination.total || 0,
              last_page: response.pagination.last_page || 1,
              from: response.pagination.from || 0,
              to: response.pagination.to || 0
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching recurring tasks:', error);
      } finally {
        setLoading(false);
      }
    }, [pagination.page, pagination.limit, todoSearchQuery, frequencyFilter, statusFilter, projectFilter]);

    // Fetch tasks when dependencies change
    useEffect(() => {
      if (!hierarchyLoading) {
        fetchTasks();
      }
    }, [fetchTasks, hierarchyLoading]);

    // Handle task click
    const handleTaskClick = async (task: RecurringTask) => {
      setSelectedTask(task.id);
      setShowTaskDetail(true);
      
      // Fetch full task data if needed
      if (task.rawData?.id) {
        try {
          setLoadingTaskDetail(true);
          const withRelations = ['project', 'status', 'assignees', 'labels'];
          const taskData = await getTask(task.rawData.id, withRelations);
          if (taskData) {
            // Update the task in the list with full data
            setRecurringTasks(prev => prev.map(t => 
              t.id === task.id ? { ...t, rawData: taskData } : t
            ));
          }
        } catch (error) {
          console.error('Error fetching task details:', error);
        } finally {
          setLoadingTaskDetail(false);
        }
      }
    };

    // Handle delete task
    const handleDeleteTask = async () => {
      const task = recurringTasks.find(t => t.id === selectedTask);
      if (!task?.rawData?.id) return;
      
      try {
        setDeletingTask(true);
        const result = await deleteTask(task.rawData.id);
        if (result) {
          setShowDeleteModal(false);
          setShowTaskDetail(false);
          setSelectedTask(null);
          fetchTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setDeletingTask(false);
      }
    };

    // Handle edit task
    const handleEditTask = (task: RecurringTask) => {
      if (!task.rawData) return;
      setEditingTask(task.rawData);
      setShowTaskDetail(false);
      setShowCreateTaskModal(true);
    };

    // Handle pause/resume task
    const handleTogglePause = async (task: RecurringTask) => {
      if (!task.rawData?.id) return;
      
      try {
        const payload: any = {
          is_active: task.status === 'active' ? false : true
        };
        const result = await updateTask(task.rawData.id, payload);
        if (result) {
          fetchTasks();
          setOpenDropdown(null);
        }
      } catch (error) {
        console.error('Error toggling task status:', error);
      }
    };

    // Handle create task
    const handleCreateTask = async (formData: any) => {
      try {
        // Refresh tasks after creation
        fetchTasks();
        setShowCreateTaskModal(false);
        setEditingTask(null);
      } catch (error) {
        console.error('Error creating task:', error);
      }
    };

    const selectedTaskDetails = recurringTasks.find(task => task.id === selectedTask);
    const selectedTaskRaw: any = selectedTaskDetails?.rawData || null;
    const upcomingRuns: any[] = selectedTaskRaw?.upcoming_runs || [];
    const recentEvents: any[] = selectedTaskRaw?.recent_events || [];

    const tableActions: TableAction<RecurringTask>[] = React.useMemo(() => [
      {
        label: 'Actions',
        icon: <MoreVertical size={16} />,
        dropdown: {
          options: [
            { label: 'Edit Task', icon: <Settings size={14} />, onClick: (row) => handleEditTask(row) },
            { label: 'Pause Task', icon: <Lock size={14} />, show: (row) => row.status === 'active', onClick: (row) => handleTogglePause(row) },
            { label: 'Resume Task', icon: <Check size={14} />, show: (row) => row.status === 'paused', onClick: (row) => handleTogglePause(row) },
            { label: 'Delete Task', icon: <X size={14} />, onClick: (row) => { setSelectedTask(row.id); setShowDeleteModal(true); }, className: 'text-danger', divider: true },
          ],
        },
      },
    ], []);

    const safeFormatDate = (value: any): string => {
      if (!value) return '';
      try {
        return formatDateForTable(String(value));
      } catch {
        return String(value);
      }
    };

    const descriptionText =
      typeof selectedTaskRaw?.description === 'string'
        ? selectedTaskRaw.description
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        : '';

    const dueTimeText = (() => {
      const due = selectedTaskRaw?.due_time;
      if (typeof due !== 'string') return '';
      if (due.includes('T')) {
        const timePart = due.split('T')[1] || '';
        return timePart.slice(0, 5);
      }
      return due.slice(0, 5);
    })();

    const assigneesText: string[] = (() => {
      if (Array.isArray(selectedTaskRaw?.assignees) && selectedTaskRaw.assignees.length > 0) {
        return selectedTaskRaw.assignees
          .map((a: any) => a?.name || a?.extension_number || a?.extension || a?.id)
          .filter(Boolean)
          .map((v: any) => String(v));
      }
      if (Array.isArray(selectedTaskRaw?.extension_numbers) && selectedTaskRaw.extension_numbers.length > 0) {
        return selectedTaskRaw.extension_numbers.map((v: any) => String(v));
      }
      return [];
    })();
  
    const filteredTasks = recurringTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(todoSearchQuery.toLowerCase());
      const matchesFrequency = frequencyFilter === 'all' || task.recurrence.toLowerCase().includes(frequencyFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesProject =
        projectFilter === 'all' ||
        String(task.rawData?.project?.id || task.rawData?.project_id || '') === String(projectFilter);
      const matchesLabel = labelsFilter === 'all' || task.labels.some(label => label.type === labelsFilter);
      const matchesTab = activeTab === 'active' || 
                         (activeTab === 'dueToday' && task.category === 'today') ||
                         (activeTab === 'enabled');
      return matchesSearch && matchesFrequency && matchesStatus && matchesProject && matchesLabel && matchesTab;
    });

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Recurring Reminders" />

      {/* Page Header: title left, actions (Add + Filter) right - like leads.tsx */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="mb-3 mb-md-0">
          <h1 className="h4 mb-0 fw-bold">Recurring Reminders</h1>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingTask(null);
              setShowCreateTaskModal(true);
            }}
            style={{
              backgroundColor: '#5b8fd8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            <Plus size={16} /> Add Recurring
          </button>
          <Button
            variant={frequencyFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all' || labelsFilter !== 'all' || (todoSearchQuery && todoSearchQuery.trim() !== '') ? 'primary' : 'outline-secondary'}
            onClick={() => setShowFilterSidebar(true)}
            className="d-flex align-items-center gap-2"
          >
            <SlidersHorizontal size={16} />
            Filters
            {(frequencyFilter !== 'all' || statusFilter !== 'all' || projectFilter !== 'all' || labelsFilter !== 'all' || (todoSearchQuery && todoSearchQuery.trim() !== '')) && (
              <span className="badge bg-light text-dark ms-1">Active</span>
            )}
          </Button>
        </div>
      </div>

           <style>{`
   .table-responsive .table th:last-child, .table-responsive .table td:last-child {
          min-width: initial !important;
        }
        .table-responsive .table th:first-child, .table-responsive .table td:first-child {
          min-width: initial !important;
          max-width: initial !important;
        }
        // h6, .h6, h5, .h5, h4, .h4, h3, .h3, h2, .h2, h1, .h1 {
        //  color: #fff !important;
        // }
        .task-dashboard {
          background-color: #f5f6fa;
          min-height: 100vh;
          padding: 2rem 0;
        }
        
        .task-dashboard .container-fluid {
          max-width: 1400px;
          margin: 0 auto;
        }
        
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
        
        .filters-section {
          background-color: white;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .search-input {
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          padding: 0.625rem 1rem 0.625rem 2.5rem;
        }
        
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        
        .filter-dropdown .dropdown-toggle {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: white;
          color: #334155;
          padding: 0.625rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        
        .clear-filters-btn {
          color: #3b82f6;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.625rem 1rem;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .clear-filters-btn:hover {
          background: #dbeafe;
          border-color: #93c5fd;
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
          border-top: 2px solid #e2e8f0;
        }
        
        .tasks-table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
          font-size:14px;
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
      `}</style>

     

      <div style={{ 
       
      }}>
        {/* Action Bar: tabs only (Add Recurring + Filters are in page header top right) */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              backgroundColor: activeTab === 'active' ? '#5b8fd8' : 'white',
              color: activeTab === 'active' ? 'white' : '#4a5568',
              border: activeTab === 'active' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{
              display: 'inline-block',
              backgroundColor: activeTab === 'active' ? 'rgba(255,255,255,0.9)' : '#5b8fd8',
              color: activeTab === 'active' ? '#5b8fd8' : 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              lineHeight: '22px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {recurringTasks.length}
            </span>
            Active
          </button>

          {/* <button
            onClick={() => setActiveTab('dueToday')}
            style={{
              backgroundColor: activeTab === 'dueToday' ? '#5b8fd8' : 'white',
              color: activeTab === 'dueToday' ? 'white' : '#4a5568',
              border: activeTab === 'dueToday' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{
              display: 'inline-block',
              backgroundColor: activeTab === 'dueToday' ? 'rgba(255,255,255,0.9)' : '#fbbf24',
              color: activeTab === 'dueToday' ? '#fbbf24' : 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              lineHeight: '22px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {recurringTasks.filter(t => t.category === 'today').length}
            </span>
            Due Today
          </button> */}

          <button
            onClick={() => setActiveTab('enabled')}
            style={{
              backgroundColor: activeTab === 'enabled' ? '#5b8fd8' : 'white',
              color: activeTab === 'enabled' ? 'white' : '#4a5568',
              border: activeTab === 'enabled' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <span style={{
              display: 'inline-block',
              backgroundColor: activeTab === 'enabled' ? 'rgba(255,255,255,0.9)' : '#805ad5',
              color: activeTab === 'enabled' ? '#805ad5' : 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              lineHeight: '22px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              {recurringTasks.filter(t => t.status === 'active').length}
            </span>
            All Enabled
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '320px' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e8eef5'
            }}>
              <GenericTable<RecurringTask>
                    data={filteredTasks}
                    columns={tableColumns}
                    actions={tableActions}
                    showActions={true}
                    actionsLabel="Actions"
                    pagination={{
                      currentPage: pagination.page,
                      rowsPerPage: pagination.limit,
                      totalRows: pagination.total,
                      pageSizeOptions: [10, 15, 25, 50],
                    }}
                    onPaginationChange={(page, rowsPerPage) => {
                      setPagination(prev => ({ ...prev, page, limit: rowsPerPage }));
                    }}
                    sortable={true}
                    loading={loading}
                    emptyMessage="No recurring tasks found"
                    loadingMessage="Loading..."
                    hover={true}
                    uniqueKey="id"
                    onRowClick={(row) => handleTaskClick(row)}
                    customizableColumns={true}
                    columnStorageKey="planner-recurring-reminders-columns"
                  />
              
              </div>
          </div>

          <GenericSidebar
            isOpen={!!(showTaskDetail && selectedTaskDetails)}
            onClose={() => { setShowTaskDetail(false); setSelectedTask(null); }}
            title={selectedTaskDetails?.name ?? 'Task Details'}
            subtitle={selectedTaskDetails?.status === 'active' ? 'Active' : 'Paused'}
            metadata={selectedTaskDetails?.recurrence}
            avatar={{
              initials: (selectedTaskDetails?.name ?? 'T').slice(0, 2).toUpperCase(),
              name: selectedTaskDetails?.name ?? 'Task',
              gradient: selectedTaskDetails?.status === 'active' ? '#10b981' : '#64748b',
            }}
            width="400px"
            sections={[
              {
                id: 'task-info',
                title: 'Task Information',
                icon: Repeat,
                fields: [
                  { label: 'Recurrence', value: selectedTaskDetails?.recurrence ?? '—' },
                  { label: 'Next Run', value: selectedTaskDetails?.nextRun ?? '—' },
                  { label: 'Reminder', value: selectedTaskDetails?.reminder ?? '—' },
                  { label: 'Status', value: selectedTaskDetails?.status === 'active' ? 'Active' : 'Paused', type: 'badge', badgeVariant: selectedTaskDetails?.status === 'active' ? 'success' : 'secondary' },
                ],
              },
              ...(descriptionText ? [{
                id: 'description',
                title: 'Description',
                icon: FolderOpen,
                fields: [{ label: '', value: descriptionText }],
              }] : []),
              ...(selectedTaskRaw ? [{
                id: 'details',
                title: 'Details',
                icon: Settings,
                fields: [
                  { label: 'Project', value: selectedTaskRaw?.project?.name },
                  { label: 'Status', value: selectedTaskRaw?.status?.name },
                  { label: 'Priority', value: selectedTaskRaw?.priority },
                  { label: 'Frequency', value: selectedTaskRaw?.frequency },
                  { label: 'Start Date', value: selectedTaskRaw?.start_date ? safeFormatDate(selectedTaskRaw.start_date) : undefined },
                  { label: 'End Date', value: selectedTaskRaw?.end_date ? safeFormatDate(selectedTaskRaw.end_date) : undefined },
                  { label: 'Due Time', value: dueTimeText || undefined },
                  { label: 'Task ID', value: selectedTaskRaw?.task_id || selectedTaskRaw?.id },
                ].filter((f: { value: any }) => f.value != null && f.value !== ''),
              }] : []),
              ...(assigneesText.length > 0 || selectedTaskRaw?.assignees ? [{
                id: 'assignees',
                title: 'Assignees',
                icon: UsersIcon,
                fields: [{ label: '', value: assigneesText.length > 0 ? assigneesText.join(', ') : 'Unassigned' }],
              }] : []),
              ...(Array.isArray(selectedTaskDetails?.labels) && selectedTaskDetails.labels.length > 0 ? [{
                id: 'labels',
                title: 'Labels',
                icon: Target,
                customContent: (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedTaskDetails!.labels.map((label: { text: string; color: string; type?: string }, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: label.color,
                          color: 'white',
                          padding: '6px 10px',
                          fontWeight: '800',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {getLabelIcon(label.type)}
                        {label.text}
                      </span>
                    ))}
                  </div>
                ),
              }] : []),
              ...(Array.isArray(upcomingRuns) && upcomingRuns.length > 0 ? [{
                id: 'upcoming-runs',
                title: 'Upcoming Runs',
                icon: Calendar,
                customContent: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {upcomingRuns.slice(0, 4).map((run: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <Calendar size={16} color="#3b82f6" />
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{run?.date || run?.run_at || run?.next_run_at || ''}</span>
                      </div>
                    ))}
                  </div>
                ),
              }] : []),
              ...(Array.isArray(recentEvents) && recentEvents.length > 0 ? [{
                id: 'recent-activity',
                title: 'Recent Activity',
                icon: Check,
                customContent: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {recentEvents.map((event: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <Check size={16} color="#64748b" />
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{event?.date || event?.created_at || event?.message || ''}</span>
                      </div>
                    ))}
                  </div>
                ),
              }] : []),
            ]}
            actions={[
              { label: 'Edit Task', icon: Settings, variant: 'primary', onClick: () => selectedTaskDetails && handleEditTask(selectedTaskDetails) },
              { label: selectedTaskDetails?.status === 'active' ? 'Pause Task' : 'Resume Task', icon: selectedTaskDetails?.status === 'active' ? Lock : Check, variant: 'secondary', show: !!selectedTaskDetails, onClick: () => selectedTaskDetails && handleTogglePause(selectedTaskDetails) },
              { label: 'Delete Task', icon: X, variant: 'danger', onClick: () => { setShowDeleteModal(true); } },
            ]}
          />

        </div>
      </div>

      <GenericFilterSidebar
        isOpen={showFilterSidebar}
        onClose={() => setShowFilterSidebar(false)}
        title="Filters"
        subtitle="Filter and refine recurring tasks"
        filters={filterFields}
        onApply={() => setShowFilterSidebar(false)}
        onReset={() => {
          setTodoSearchQuery('');
          setFrequencyFilter('all');
          setStatusFilter('all');
          setProjectFilter('all');
          setLabelsFilter('all');
        }}
        width="400px"
        showApplyButton
        showResetButton
      />

      {/* Create/Edit Task Modal */}
      <CreateRecurringTaskModal
        show={showCreateTaskModal}
        onHide={() => {
          setShowCreateTaskModal(false);
          setEditingTask(null);
        }}
        onCreate={handleCreateTask}
        onCreateAndOpen={handleCreateTask}
        extensions={hierarchyDataExtensions as any}
        task={editingTask}
        isEdit={!!editingTask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTask}
        itemName={selectedTaskDetails ? `${selectedTaskDetails.id} ${selectedTaskDetails.name}` : undefined}
        itemType="recurring task"
        loading={deletingTask}
      />

    </React.Fragment>
  );
};

RecurringReminders.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default RecurringReminders;
