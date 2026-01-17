import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useCallback
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { listTasks, getTask, updateTask, deleteTask } from "@utils/tasks";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { ModuleSlug, formatDateForTable } from "@utils/Helper";
import { Spinner, Button, Form, Dropdown, Table } from 'react-bootstrap';
import CreateTaskModal from '@components/work-planner/createtask-modal';
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
  Repeat
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

const RecurringReminders = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'dueToday' | 'enabled'>('active');
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [todoSearchQuery, setTodoSearchQuery] = useState('');
    const [frequencyFilter, setFrequencyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [labelsFilter, setLabelsFilter] = useState('all');
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
      page: 1,
      limit: 20,
      total: 0,
      last_page: 1
    });
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTask, setDeletingTask] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    
    // Fetch extensions for assignees
    const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  
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
  
    const upcomingRuns = [
      { date: 'Wed, Apr 17, 11:00 PM', checked: false },
      { date: 'Thu, Apr 18, 11:00 PM', checked: false },
      { date: 'Fri, Apr 19, 11:00 PM', checked: false },
      { date: 'Mon, Apr 22, 11:00 PM', checked: false },
      { date: 'Tue, Apr 23, 11:00 PM', checked: false }
    ];
  
    const recentEvents = [
      { date: 'Apr 17,, 11:00 PM', icon: <Mail size={16} />, checked: false },
      { date: 'Apr 18,, 11:00 PM', icon: <Check size={16} />, checked: true },
      { date: 'Apr 19,, 11:00 PM', icon: <Square size={16} />, checked: false }
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

        const response = await listTasks(params);
        
        if (response && response.data) {
          const mappedTasks = response.data.map(mapApiTaskToRecurringTask);
          setRecurringTasks(mappedTasks);
          
          if (response.pagination) {
            setPagination(prev => ({
              page: response.pagination.page || 1,
              limit: response.pagination.limit || 20,
              total: response.pagination.total || 0,
              last_page: response.pagination.last_page || 1
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching recurring tasks:', error);
      } finally {
        setLoading(false);
      }
    }, [pagination.page, pagination.limit, todoSearchQuery, frequencyFilter, statusFilter]);

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
  
    const filteredTasks = recurringTasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(todoSearchQuery.toLowerCase());
      const matchesFrequency = frequencyFilter === 'all' || task.recurrence.toLowerCase().includes(frequencyFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesLabel = labelsFilter === 'all' || task.labels.some(label => label.type === labelsFilter);
      const matchesTab = activeTab === 'active' || 
                         (activeTab === 'dueToday' && task.category === 'today') ||
                         (activeTab === 'enabled');
      return matchesSearch && matchesFrequency && matchesStatus && matchesLabel && matchesTab;
    });

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Recurring Reminders" />
      
      <style>{`
   .table-responsive .table th:last-child, .table-responsive .table td:last-child {
          min-width: initial !important;
        }
        .table-responsive .table th:first-child, .table-responsive .table td:first-child {
          min-width: initial !important;
          max-width: initial !important;
        }
        h6, .h6, h5, .h5, h4, .h4, h3, .h3, h2, .h2, h1, .h1 {
         color: #fff !important;
        }
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
        {/* Action Bar */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
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
              padding: '9px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 2px 4px rgba(91,143,216,0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4a7dc0';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(91,143,216,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#5b8fd8';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(91,143,216,0.3)';
            }}
          >
            <Plus size={16} /> Add Recurring
          </button>

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

          <button
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
          </button>

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
              {/* Filters */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '16px',
                paddingBottom: '14px',
                borderBottom: '1px solid #f0f4f8',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} style={{ color: '#6c757d' }} />
                    <Form.Select
                      value={frequencyFilter}
                      onChange={(e) => setFrequencyFilter(e.target.value)}
                      size="sm"
                      style={{
                        padding: '7px 28px 7px 10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        color: '#4a5568'
                      }}
                    >
                      <option value="all">All Frequencies</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Form.Select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={16} style={{ color: '#6c757d' }} />
                    <Form.Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      size="sm"
                      style={{
                        padding: '7px 28px 7px 10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        color: '#4a5568'
                      }}
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </Form.Select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={16} style={{ color: '#6c757d' }} />
                    <Form.Select
                      value={labelsFilter}
                      onChange={(e) => setLabelsFilter(e.target.value)}
                      size="sm"
                      style={{
                        padding: '7px 28px 7px 10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        color: '#4a5568'
                      }}
                    >
                      <option value="all">All Labels</option>
                      <option value="support">Support</option>
                      <option value="meeting">Meeting</option>
                      <option value="report">Report</option>
                      <option value="sales">Sales</option>
                    </Form.Select>
                  </div>
                  
                  {(frequencyFilter !== 'all' || statusFilter !== 'all' || labelsFilter !== 'all') && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        setFrequencyFilter('all');
                        setStatusFilter('all');
                        setLabelsFilter('all');
                      }}
                      style={{ padding: '7px', fontSize: '13px', textDecoration: 'none' }}
                    >
                      <X size={16} /> Clear
                    </Button>
                  )}
                </div>

              {/* Quick Search */}
              <div style={{ marginBottom: '18px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Search size={16} color="#a0aec0" />
                </div>
                <input
                  type="text"
                  placeholder="Search recurring tasks..."
                  value={todoSearchQuery}
                  onChange={(e) => setTodoSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#5b8fd8';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                />
              </div>

                  {/* Table */}
                  <div className="table-container">
                    <div className="table-responsive">
                      <Table hover className="tasks-table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}></th>
                            <th>Task Name</th>
                            <th>Recurrence</th>
                            <th>Next Run</th>
                            <th>Reminder</th>
                            <th style={{ width: '50px' }}>Labels</th>
                            <th style={{ width: '50px' }}></th>
                          </tr>
                        </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="text-center" style={{ padding: '3rem' }}>
                              <Spinner animation="border" />
                            </td>
                          </tr>
                        ) : filteredTasks.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center" style={{ padding: '3rem', color: '#718096', fontSize: '14px' }}>
                              No recurring tasks found
                            </td>
                          </tr>
                        ) : (
                          filteredTasks.map((task, taskIdx) => (
                            <tr
                              key={task.id}
                              onClick={() => {
                                setSelectedTask(task.id);
                                setShowTaskDetail(true);
                              }}
                              style={{
                                backgroundColor: selectedTask === task.id ? '#eff6ff' : undefined
                              }}
                            >
                              <td onClick={(e) => e.stopPropagation()}>
                                <Form.Check 
                                  type="checkbox" 
                                  style={{ accentColor: '#3b82f6' }}
                                />
                              </td>
                              <td className="task-name">
                                {task.name}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Repeat size={14} />
                                  {task.recurrence}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Clock size={14} color="#64748b" />
                                  {task.nextRun}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Bell size={14} />
                                  {task.reminder}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {task.labels.map((label, idx) => (
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
                                        transition: 'all 0.2s',
                                        cursor: 'default'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = `0 5px 12px ${label.color}80`;
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = `0 3px 8px ${label.color}60`;
                                      }}
                                    >
                                      {getLabelIcon(label.type)}
                                      {label.text}
                                    </span>
                                  ))}
                                </div>
                              </td>
                                <td onClick={(e) => e.stopPropagation()}>
                                <Dropdown
                                  show={openDropdown === task.id}
                                  onToggle={(isOpen) => setOpenDropdown(isOpen ? task.id : null)}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Dropdown.Toggle
                                    as="button"
                                    bsPrefix="custom-dropdown-toggle"
                                    className="p-0 border-0 bg-transparent"
                                    style={{ color: '#718096', opacity: 0.6, cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                                  >
                                    <MoreVertical size={16} />
                                  </Dropdown.Toggle>

                                  <Dropdown.Menu align="end" style={{ fontSize: '13px', minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0' }}>
                                    <Dropdown.Item 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditTask(task);
                                      }}
                                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                      <Settings size={14} />
                                      <span>Edit Task</span>
                                    </Dropdown.Item>
                                    <Dropdown.Item 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePause(task);
                                      }}
                                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                      {task.status === 'active' ? (
                                        <>
                                          <Lock size={14} />
                                          <span>Pause Task</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check size={14} />
                                          <span>Resume Task</span>
                                        </>
                                      )}
                                    </Dropdown.Item>
                                    <Dropdown.Divider style={{ margin: '4px 0' }} />
                                    <Dropdown.Item 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTask(task.id);
                                        setShowDeleteModal(true);
                                      }}
                                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#dc3545' }}
                                    >
                                      <X size={14} />
                                      <span>Delete Task</span>
                                    </Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                    </div>
                  </div>
              </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ 
            width: '340px',
            backgroundColor: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: '20px',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto'
          }}>
            <div style={{ 
              backgroundColor: '#f8fafc',
              padding: '18px 20px',
              marginBottom: '0',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ 
                    fontSize: '16px', 
                    fontWeight: '700',
                    margin: '0 0 10px 0',
                    color: '#1e293b',
                    lineHeight: '1.3'
                  }}>
                    {selectedTaskDetails?.name || 'Backup server'}
                  </h2>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '5px 12px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px'
                  }}>
                    ✓ ACTIVE
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#64748b',
                    borderRadius: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#cbd5e1';
                    e.currentTarget.style.color = '#475569';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '18px 20px' }}>

            <div style={{ 
              padding: '14px 16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              marginBottom: '14px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ 
                fontSize: '11px', 
                color: '#075985', 
                marginBottom: '6px', 
                fontWeight: '700', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Repeat size={13} color="#0369a1" />
                Recurrence Pattern
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#0c4a6e', 
                fontWeight: '600', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px'
              }}>
                {selectedTaskDetails?.recurrence || 'Daily (Weekdays)'}
              </div>
            </div>

            <div style={{ 
              marginBottom: '16px',
              padding: '14px 16px',
              backgroundColor: '#fef9c3',
              borderRadius: '8px',
              border: '1px solid #fde047'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                <span style={{ color: '#713f12', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={15} color="#a16207" /> Next Run
                </span>
                <span style={{ fontWeight: '700', color: '#713f12' }}>
                  {selectedTaskDetails?.nextRun || 'Apr 17, 11:00 PM'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#713f12', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={15} color="#a16207" /> Reminder
                </span>
                <span style={{ fontWeight: '700', color: '#713f12' }}>
                  {selectedTaskDetails?.reminder || '5 min before'}
                </span>
              </div>
            </div>

            {/* Upcoming Runs */}
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                marginBottom: '12px', 
                color: '#1e293b', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px'
              }}>
                Upcoming Runs
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {upcomingRuns.slice(0, 4).map((run, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '10px 12px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.borderColor = '#bae6fd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      <Calendar size={16} />
                    </div>
                    <span style={{ 
                      color: '#1e293b', 
                      fontSize: '13px',
                      fontWeight: '500',
                      flex: 1
                    }}>{run.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                marginBottom: '12px', 
                color: '#1e293b', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px'
              }}>
                Recent Activity
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recentEvents.map((event, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '10px 12px', 
                    backgroundColor: event.checked ? '#d1fae5' : '#f8fafc', 
                    borderRadius: '6px',
                    border: event.checked ? '1px solid #6ee7b7' : '1px solid #e2e8f0',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = event.checked ? '#a7f3d0' : '#f0f9ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = event.checked ? '#d1fae5' : '#f8fafc';
                  }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: event.checked ? '#10b981' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {event.icon}
                    </div>
                    <span style={{ 
                      color: '#1e293b', 
                      fontSize: '13px',
                      fontWeight: '500',
                      flex: 1
                    }}>{event.date}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      <CreateTaskModal
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
        taskType="recurring"
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
