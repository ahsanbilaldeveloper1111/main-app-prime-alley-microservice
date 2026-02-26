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
import { Spinner } from "react-bootstrap";
import CreateTaskModal from '@components/work-planner/createtask-modal';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import { 
  Calendar, 
  Phone, 
  FileText, 
  CreditCard, 
  Users, 
  Briefcase, 
  Mail,
  ChevronDown,
  Plus,
  X,
  Copy,
  Trash2,
  Pencil,
  Clock,
  Pin,
  AlertCircle,
  Sparkles,
  Check,
  Pause,
  ListTodo
} from 'lucide-react';

// Types
interface Task {
  id: string;
  time?: string;
  title: string;
  label: string;
  labelColor: string;
  icon: React.ReactNode;
  completed: boolean;
  priority: string;
  category: 'scheduled' | 'anytime' | 'overdue';
  rawData?: any; // Store raw API data
}

interface ApiTodoTask {
  id: number;
  task_id: string;
  title: string;
  description?: string;
  priority: string;
  due_date?: string;
  due_time?: string;
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
  assignees?: Array<{
    extension_number: string;
  }>;
  project?: {
    id: number;
    name: string;
  } | null;
}

interface LinkedRecord {
  id: string;
  type: 'call' | 'contact' | 'ticket';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const DialTodo = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'today' | 'anytime' | 'completed' | 'overdue' | 'upcoming'>('all');
    const [filterDate, setFilterDate] = useState('all');
    const [filterLabel, setFilterLabel] = useState('labels');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
      page: 1,
      limit: 15,
      total: 0,
      last_page: 1,
      from: 0,
      to: 0
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTask, setDeletingTask] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
    const [summary, setSummary] = useState({
      total: 0,
      open: 0,
      overdue: 0,
      dueThisWeek: 0,
      todayDue: 0,
      unassigned: 0,
      highPriority: 0,
      scheduled: 0,
      completed: 0,
      pending: 0,
      anytime: 0
    });
    
    // Fetch extensions for assignees
    const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.USER_DIRECTORY);
  
    // Helper function to find extension name
    const findExtensionName = (extensionNumber: string): string => {
      if (!extensionNumber || !hierarchyDataExtensions) return extensionNumber || 'Unassigned';
      const extension = (hierarchyDataExtensions as any[]).find(
        (ext: any) => ext.id === extensionNumber || ext.extension_number === extensionNumber
      );
      return extension?.name || extensionNumber || 'Unassigned';
    };

    // Helper function to get label icon based on label name
    const getLabelIcon = (labelName: string): React.ReactNode => {
      const lowerName = labelName.toLowerCase();
      if (lowerName.includes('sales') || lowerName.includes('call')) return <Phone size={16} />;
      if (lowerName.includes('support') || lowerName.includes('ticket')) return <FileText size={16} />;
      if (lowerName.includes('finance') || lowerName.includes('invoice')) return <CreditCard size={16} />;
      if (lowerName.includes('meeting')) return <Users size={16} />;
      if (lowerName.includes('work') || lowerName.includes('project')) return <Briefcase size={16} />;
      if (lowerName.includes('email') || lowerName.includes('mail')) return <Mail size={16} />;
      return <FileText size={16} />;
    };

    const getPriorityBadgeStyle = (priority?: string) => {
      const p = String(priority || 'low').toLowerCase();
      switch (p) {
        case 'urgent':
          return { backgroundColor: '#fee2e2', color: '#991b1b' }; // red
        case 'high':
          return { backgroundColor: '#ffedd5', color: '#9a3412' }; // orange
        case 'medium':
        case 'normal':
          return { backgroundColor: '#dbeafe', color: '#1e40af' }; // blue
        case 'low':
        default:
          return { backgroundColor: '#dcfce7', color: '#166534' }; // green
      }
    };

    // Map API task to Todo Task format (no client-side date categorization)
    const mapApiTaskToTodoTask = (apiTask: ApiTodoTask): Task => {
      // Format time from due_time or due_date
      const formatTime = () => {
        if (apiTask.due_time) {
          return apiTask.due_time;
        }
        if (apiTask.due_date) {
          try {
            const date = new Date(apiTask.due_date);
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          } catch {
            return undefined;
          }
        }
        return undefined;
      };

      // Determine category without date math:
      // - no due_date => anytime
      // - has due_date (and optionally due_time) => scheduled
      // Overdue is handled by the API/tab query, not client-side comparisons.
      const getCategory = (): 'scheduled' | 'anytime' | 'overdue' => {
        if (apiTask.is_completed) return 'scheduled';
        if (!apiTask.due_date) return 'anytime';
        return 'scheduled';
      };

      // Get first label or default
      const firstLabel = apiTask.labels && apiTask.labels.length > 0 
        ? apiTask.labels[0] 
        : { name: 'General', color: '#6c757d' };

      return {
        id: apiTask.task_id || `#${apiTask.id}`,
        time: formatTime(),
        title: apiTask.title || '',
        label: firstLabel.name,
        labelColor: firstLabel.color || '#6c757d',
        icon: getLabelIcon(firstLabel.name),
        completed: apiTask.is_completed || false,
        priority: apiTask.priority || 'medium',
        category: getCategory(),
        rawData: apiTask
      };
    };

    // Fetch todo tasks from API
    const fetchTasks = useCallback(async () => {
      try {
        // Clear old data immediately to prevent showing stale data
        setTasks([]);
        setLoading(true);
        
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
          type: 'todo', // Key difference: type is 'todo'
          search: searchTerm,
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

        // Add filters based on activeTab (server-driven)
        if (activeTab === 'completed') {
          params.is_completed = true;
        } else if (activeTab === 'overdue') {
          params.is_completed = false;
          // Server should return overdue tasks for this query
        } else if (activeTab === 'today') {
          params.is_completed = false;
        } else if (activeTab === 'upcoming') {
          params.is_completed = false;
          // Server should return scheduled tasks for this query
        }

        // Date range filtering (server-driven) via due_date_from / due_date_to
        const toYmd = (d: Date) => {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };
        const today = new Date();
        const startOfToday = new Date(today);
        startOfToday.setHours(0, 0, 0, 0);

        const setRange = (from: Date, to: Date) => {
          params.due_date_from = toYmd(from);
          params.due_date_to = toYmd(to);
        };

        if (filterDate === 'today') {
          setRange(startOfToday, startOfToday);
        } else if (filterDate === 'tomorrow') {
          const tomorrow = new Date(startOfToday);
          tomorrow.setDate(tomorrow.getDate() + 1);
          setRange(tomorrow, tomorrow);
        } else if (filterDate === 'this-week') {
          const dayOfWeek = startOfToday.getDay();
          const startOfWeek = new Date(startOfToday);
          // Monday as start of week
          startOfWeek.setDate(startOfToday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          setRange(startOfWeek, endOfWeek);
        } else if (filterDate === 'next-week') {
          const dayOfWeek = startOfToday.getDay();
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfToday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
          const startOfNextWeek = new Date(startOfWeek);
          startOfNextWeek.setDate(startOfWeek.getDate() + 7);
          const endOfNextWeek = new Date(startOfNextWeek);
          endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
          setRange(startOfNextWeek, endOfNextWeek);
        }

        // Overdue tab should only show items due before today (exclude "today" and no due_date items)
        // If user chose an explicit date filter, keep it. Otherwise, limit to yesterday.
        if (activeTab === 'overdue' && filterDate === 'all' && !params.due_date_to) {
          const yesterday = new Date(startOfToday);
          yesterday.setDate(yesterday.getDate() - 1);
          params.due_date_to = toYmd(yesterday);
        }

        // Scheduled tab should exclude today's due items by default
        // If user chose an explicit date filter, keep it. Otherwise, start from tomorrow.
        if (activeTab === 'upcoming' && filterDate === 'all' && !params.due_date_from) {
          const tomorrow = new Date(startOfToday);
          tomorrow.setDate(tomorrow.getDate() + 1);
          params.due_date_from = toYmd(tomorrow);
        }

        const response = await listTasks(params);
        
        if (response && response.data) {
          let mappedTasks = response.data.map(mapApiTaskToTodoTask);
          
          setTasks(mappedTasks);
          
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

          // Update summary from API response (server-driven counters)
          if (response.summary) {
            setSummary({
              total: response.summary.total || 0,
              open: response.summary.open || 0,
              overdue: response.summary.overdue || 0,
              dueThisWeek: response.summary.dueThisWeek || 0,
              todayDue: response.summary.todayDue || 0,
              unassigned: response.summary.unassigned || 0,
              highPriority: response.summary.highPriority || 0,
              scheduled: response.summary.scheduled || 0,
              completed: response.summary.completed || 0,
              pending: response.summary.pending || 0,
              anytime: response.summary.anytime || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching todo tasks:', error);
      } finally {
        setLoading(false);
      }
    }, [pagination.page, pagination.limit, searchTerm, activeTab, filterDate, hierarchyDataExtensions]);

    // Fetch tasks when dependencies change
    useEffect(() => {
      if (!hierarchyLoading) {
        fetchTasks();
      }
    }, [fetchTasks, hierarchyLoading]);

    // Handle task toggle (complete/uncomplete)
    const handleTaskToggle = async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task?.rawData?.id) return;
      
      try {
        const payload: any = {
          is_completed: !task.completed
        };
        const result = await updateTask(task.rawData.id, payload);
        if (result) {
          fetchTasks();
        }
      } catch (error) {
        console.error('Error toggling task:', error);
      }
    };

    // Handle task click - fetch full details
    const handleTaskClick = async (task: Task) => {
      setSelectedTask(task);
      
      if (task.rawData?.id) {
        try {
          setLoadingTaskDetail(true);
          const withRelations = ['project', 'status', 'assignees', 'labels'];
          const taskData = await getTask(task.rawData.id, withRelations);
          if (taskData) {
            const updatedTask = mapApiTaskToTodoTask(taskData);
            setSelectedTask(updatedTask);
            // Update task in list
            setTasks(prev => prev.map(t => 
              t.id === task.id ? updatedTask : t
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
      if (!selectedTask?.rawData?.id) return;
      
      try {
        setDeletingTask(true);
        const result = await deleteTask(selectedTask.rawData.id);
        if (result) {
          setShowDeleteModal(false);
          setSelectedTask(null);
          fetchTasks();
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setDeletingTask(false);
      }
    };

    // Handle create/update task
    const handleCreateTask = async (formData: any) => {
      try {
        // Close modal first
        setShowCreateTaskModal(false);
        setEditingTask(null);
        setIsDuplicating(false);
        setIsConverting(false);
        
        // Reset pagination to page 1 to show the newly created task
        setPagination(prev => ({ ...prev, page: 1 }));
        
        // Small delay to ensure the API has processed the new task
        // The useEffect will automatically trigger fetchTasks when pagination.page changes
        setTimeout(() => {
          fetchTasks();
        }, 500);
      } catch (error) {
        console.error('Error creating/updating task:', error);
      }
    };

    // Handle edit task
    const handleEditTask = () => {
      if (!selectedTask?.rawData) return;
      setEditingTask(selectedTask.rawData);
      setSelectedTask(null);
      setShowCreateTaskModal(true);
    };


    // Use summary from API for counters
    const counts = {
      all: summary.total,
      today: summary.todayDue,
      completed: summary.completed,
      overdue: summary.overdue,
      upcoming: summary.scheduled
    };
  
    const filteredTasks = tasks.filter(task => {
      // First apply tab filter
      if (activeTab === 'all') {
        // Show all tasks - no filtering by status
      } else if (activeTab === 'anytime') {
        // Only tasks with no due_date
        if (task.completed) return false;
        if (task.rawData?.due_date) return false;
      } else if (activeTab === 'completed') {
        if (!task.completed) return false;
      } else if (activeTab === 'overdue') {
        if (task.completed) return false;
      } else if (activeTab === 'today') {
        if (task.completed) return false;
      } else if (activeTab === 'upcoming') {
        if (task.completed) return false;
      }
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.rawData?.description?.toLowerCase().includes(searchLower) ||
          task.rawData?.project?.name?.toLowerCase().includes(searchLower) ||
          task.rawData?.labels?.some((label: any) => label.name?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      
      return true;
    });
  
    // For the All tab UI grouping, mark overdue items based on due_date < today.
    // (We keep the Overdue tab itself server-filtered via due_date_to=yesterday.)
    const isOverdueByDueDate = (task: Task) => {
      const due = task.rawData?.due_date;
      if (!due) return false;
      try {
        const dueDate = new Date(due);
        if (Number.isNaN(dueDate.getTime())) return false;
        dueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate.getTime() < today.getTime();
      } catch {
        return false;
      }
    };

    const isTodayByDueDate = (task: Task) => {
      const due = task.rawData?.due_date;
      if (!due) return false;
      try {
        const dueDate = new Date(due);
        if (Number.isNaN(dueDate.getTime())) return false;
        dueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      } catch {
        return false;
      }
    };

    const overdueTasks =
      activeTab === 'overdue'
        ? filteredTasks.filter(t => !t.completed)
        : activeTab === 'all'
          ? filteredTasks.filter(t => !t.completed && isOverdueByDueDate(t))
          : filteredTasks.filter(t => t.category === 'overdue' && !t.completed);

    const todayTasksForAll = activeTab === 'all'
      ? filteredTasks.filter(t => !t.completed && isTodayByDueDate(t))
      : [];

    const scheduledTasks = filteredTasks.filter(t =>
      t.category === 'scheduled' &&
      !t.completed &&
      !isOverdueByDueDate(t) &&
      !(activeTab === 'all' && isTodayByDueDate(t))
    );
    const anytimeTasks = filteredTasks.filter(t => t.category === 'anytime' && !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);
  

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />


      {/* Main Container */}
      <div style={{ 
        
      }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Left Panel */}
          <div style={{ flex: '1', minWidth: '320px' }}>
            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '5px', 
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
                <Plus size={16} /> Add To-Do
              </button>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSelectedTask(null);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  // Reset filters when going back to All
                  setFilterDate('all');
                  setSearchTerm('');
                }}
                style={{
                  backgroundColor: activeTab === 'all' ? '#5b8fd8' : 'white',
                  color: activeTab === 'all' ? 'white' : '#4a5568',
                  border: activeTab === 'all' ? 'none' : '1px solid #e2e8f0',
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
                  backgroundColor: activeTab === 'all' ? 'rgba(255,255,255,0.9)' : '#4a5568',
                  color: activeTab === 'all' ? '#4a5568' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {summary.total}
                </span>
                All
              </button>
              <button
                onClick={() => {
                  setActiveTab('today');
                  setSelectedTask(null);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setFilterDate('today');
                }}
                style={{
                  backgroundColor: activeTab === 'today' ? '#5b8fd8' : 'white',
                  color: activeTab === 'today' ? 'white' : '#4a5568',
                  border: activeTab === 'today' ? 'none' : '1px solid #e2e8f0',
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
                  backgroundColor: activeTab === 'today' ? 'rgba(255,255,255,0.9)' : '#5b8fd8',
                  color: activeTab === 'today' ? '#5b8fd8' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {summary.todayDue}
                </span>
                Today
              </button>
              <button
                onClick={() => {
                  setActiveTab('anytime');
                  setSelectedTask(null);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setFilterDate('all'); // anytime ignores due_date_from/to filters
                }}
                style={{
                  backgroundColor: activeTab === 'anytime' ? '#5b8fd8' : 'white',
                  color: activeTab === 'anytime' ? 'white' : '#4a5568',
                  border: activeTab === 'anytime' ? 'none' : '1px solid #e2e8f0',
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
                  backgroundColor: activeTab === 'anytime' ? 'rgba(255,255,255,0.9)' : '#805ad5',
                  color: activeTab === 'anytime' ? '#805ad5' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {summary.anytime}
                </span>
                Anytime
              </button>
              <button
                onClick={() => {
                  setActiveTab('completed');
                  setSelectedTask(null);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                style={{
                  backgroundColor: activeTab === 'completed' ? '#5b8fd8' : 'white',
                  color: activeTab === 'completed' ? 'white' : '#4a5568',
                  border: activeTab === 'completed' ? 'none' : '1px solid #e2e8f0',
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
                  backgroundColor: activeTab === 'completed' ? 'rgba(255,255,255,0.9)' : '#28a745',
                  color: activeTab === 'completed' ? '#28a745' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {summary.completed}
                </span>
                Completed
              </button>
              <button
                onClick={() => {
                  setActiveTab('overdue');
                  setSelectedTask(null);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setFilterDate('all'); // ensure Overdue isn't constrained by Today filter
                }}
                style={{
                  backgroundColor: activeTab === 'overdue' ? '#5b8fd8' : 'white',
                  color: activeTab === 'overdue' ? 'white' : '#4a5568',
                  border: activeTab === 'overdue' ? 'none' : '1px solid #e2e8f0',
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
                  backgroundColor: activeTab === 'overdue' ? 'rgba(255,255,255,0.9)' : '#dc3545',
                  color: activeTab === 'overdue' ? '#dc3545' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {summary.overdue}
                </span>
                Overdue
              </button>
              <button
                onClick={() => {
                  setActiveTab('upcoming');
                  setSelectedTask(null);
                  setPagination(prev => ({ ...prev, page: 1 }));
                  setFilterDate('all'); // ensure Scheduled isn't constrained to Today filter
                }}
                style={{
                  backgroundColor: activeTab === 'upcoming' ? '#5b8fd8' : 'white',
                  color: activeTab === 'upcoming' ? 'white' : '#4a5568',
                  border: activeTab === 'upcoming' ? 'none' : '1px solid #e2e8f0',
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
                  backgroundColor: activeTab === 'upcoming' ? 'rgba(255,255,255,0.9)' : '#6c757d',
                  color: activeTab === 'upcoming' ? '#6c757d' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {summary.scheduled}
                </span>
                Scheduled
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Task Container */}
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
                flexWrap: 'wrap',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: '1px solid #f0f4f8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} color="#6c757d" />
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{
                      padding: '7px 28px 7px 10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      color: '#4a5568'
                    }}
                  >
                    
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This Week</option>
                    <option value="next-week">Next Week</option>
                  </select>
                </div>

                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={16} color="#6c757d" />
                  <select
                    value={filterLabel}
                    onChange={(e) => setFilterLabel(e.target.value)}
                    style={{
                      padding: '7px 28px 7px 10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      color: '#4a5568'
                    }}
                  >
                    <option value="all">All Labels</option>
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="work">Work</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div> */}

                <button 
                  onClick={() => {
                    setFilterDate('all');
                    setSearchTerm('');
                  }}
                  style={{
                    padding: '7px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <X size={16} color="#6c757d" />
                </button>
              </div>

              {/* Quick Add */}
              <div style={{ marginBottom: '18px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Sparkles size={16} color="#a0aec0" />
                </div>
                <input
                  type="text"
                  placeholder="Search todo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

              {/* Loading State */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner animation="border" />
                </div>
              )}

              {/* Completed Tasks - Show when activeTab is 'completed' or 'all' */}
              {(activeTab === 'completed' || activeTab === 'all') && (
                <>
                  {completedTasks.length > 0 ? (
                    <div>
                      <h4 style={{ 
                        fontSize: '12px', 
                        fontWeight: '700',
                        color: '#28a745',
                        marginBottom: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Check size={14} color="#28a745" /> Completed
                      </h4>
                      {completedTasks.map(task => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={handleTaskToggle}
                          onClick={handleTaskClick}
                          isSelected={selectedTask?.id === task.id}
                        />
                      ))}
                    </div>
                  ) : (
                    activeTab === 'completed' && !loading && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '3rem 1rem',
                        color: '#718096',
                        fontSize: '14px'
                      }}>
                        No completed todo found
                      </div>
                    )
                  )}
                </>
              )}

              {/* Today Tasks (All tab grouping) */}
              {activeTab === 'all' && !loading && todayTasksForAll.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#5b8fd8',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Calendar size={14} color="#5b8fd8" /> Today
                  </h4>
                  {todayTasksForAll.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}

              {/* Today Tasks (single section label) */}
              {activeTab === 'today' && !loading && (scheduledTasks.length > 0 || anytimeTasks.length > 0) && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#5b8fd8',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Calendar size={14} color="#5b8fd8" /> Today
                  </h4>
                  {[...scheduledTasks, ...anytimeTasks].map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}

              {/* Scheduled Tasks */}
              {(activeTab === 'all' || activeTab === 'upcoming') && scheduledTasks.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#3182ce',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Clock size={14} color="#3182ce" /> Scheduled
                  </h4>
                  {scheduledTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}

              {/* Anytime Tasks */}
              {(activeTab === 'all' || activeTab === 'anytime') && anytimeTasks.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#805ad5',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Pin size={14} color="#805ad5" /> Anytime
                  </h4>
                  {anytimeTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}

              {/* Overdue Tasks */}
              {(activeTab === 'all' || activeTab === 'overdue') && overdueTasks.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#e53e3e',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={14} color="#e53e3e" /> Overdue
                  </h4>
                  {overdueTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}

              {/* Empty state for non-completed tabs (excluding 'all' which has its own check) */}
              {activeTab !== 'completed' && activeTab !== 'all' && scheduledTasks.length === 0 && anytimeTasks.length === 0 && overdueTasks.length === 0 && !loading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  color: '#718096',
                  fontSize: '14px'
                }}>
                  No todo found
                </div>
              )}
              
              {/* Empty state for 'all' tab when no tasks at all (including completed) */}
              {activeTab === 'all' && completedTasks.length === 0 && scheduledTasks.length === 0 && anytimeTasks.length === 0 && overdueTasks.length === 0 && !loading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '3rem 1rem',
                  color: '#718096',
                  fontSize: '14px'
                }}>
                  No todo found
                </div>
              )}

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
            </div>
          </div>

          {/* Right Panel - Task Details or Stats */}
          <div style={{ 
            width: '360px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e8eef5',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: '20px'
          }}>
            {!selectedTask ? (
              /* Default Stats View */
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '700',
                    margin: '0 0 6px 0',
                    color: '#2d3748',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FileText size={20} color="#4e6fa5" />
                    Todo Overview
                  </h2>
                  <p style={{ 
                    color: '#718096', 
                    fontSize: '13px',
                    margin: 0
                  }}>
                    Track your daily progress
                  </p>
                </div>

                {/* Stats Cards */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #e8eef5'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Total Todo
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748', marginTop: '4px' }}>
                          {summary.total}
                        </div>
                      </div>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#4e6fa5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <FileText size={24} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      padding: '14px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5'
                    }}>
                      <div style={{ fontSize: '10px', color: '#166534', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Completed
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d' }}>
                        {summary.completed}
                      </div>
                    </div>

                    <div style={{
                      padding: '14px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Overdue
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                        {summary.overdue}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '14px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Pending
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                      {summary.pending}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {/* <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d3748' }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#4e6fa5' }}>
                      {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e8eef5',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#28a745',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div> */}

                {/* Category Breakdown */}
                <div>
                  <h3 style={{ 
                    fontSize: '13px', 
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: '#2d3748',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    By Category
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#3182ce" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Scheduled</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#3182ce' }}>
                        {summary.scheduled}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pause size={16} color="#805ad5" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Pending
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#805ad5' }}>
                        {summary.pending}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} color="#e53e3e" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Overdue</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#e53e3e' }}>
                        {summary.overdue}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Task Details View */
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      margin: '0 0 10px 0',
                      color: '#2d3748',
                      lineHeight: '1.3'
                    }}>
                      {selectedTask.title}
                    </h2>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      backgroundColor: selectedTask.completed ? '#e2e8f0' : '#d4edda',
                      color: selectedTask.completed ? '#4a5568' : '#155724',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {selectedTask.completed ? 'COMPLETED' : 'OPEN'}
                    </span>

                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      ...getPriorityBadgeStyle(selectedTask.priority),
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '600',
                      marginLeft: '10px'
                    }}>
                      {selectedTask.priority ? selectedTask.priority.toUpperCase() : 'LOW'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#718096',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={18} />
                    </button>
                    
                  </div>
                </div>

              {loadingTaskDetail ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner animation="border" size="sm" />
                </div>
              ) : (
                <>
                  <p style={{ 
                    color: '#718096', 
                    fontSize: '13px',
                    marginBottom: '18px',
                    lineHeight: '1.5'
                  }}>
                    {selectedTask?.rawData?.description?.replace(/<[^>]*>/g, '') || 'No description'}
                  </p>

                  <div style={{ 
                    marginBottom: '18px',
                    padding: '14px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px'
                  }}>
                    
                    {selectedTask?.rawData?.due_date && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '13px'
                      }}>
                        <span style={{ color: '#718096', fontWeight: '500' }}>Due Date:</span>
                        <span style={{ fontWeight: '600', color: '#2d3748' }}>{formatDateForTable(selectedTask.rawData.due_date)}</span>
                      </div>
                    )}

{selectedTask?.rawData?.completed_at && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '13px'
                      }}>
                        <span style={{ color: '#718096', fontWeight: '500' }}>Completed On:</span>
                        <span style={{ fontWeight: '600', color: '#2d3748' }}>{formatDateForTable(selectedTask.rawData.completed_at)}</span>
                      </div>
                    )}

{selectedTask?.rawData?.created_at && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '13px'
                      }}>
                        <span style={{ color: '#718096', fontWeight: '500' }}>Created On:</span>
                        <span style={{ fontWeight: '600', color: '#2d3748' }}>{formatDateForTable(selectedTask.rawData.created_at)}</span>
                      </div>
                    )}

                    {/* <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px'
                    }}>
                      <span style={{ color: '#718096', fontWeight: '500' }}>Label:</span>
                      <span style={{
                        padding: '3px 10px',
                        backgroundColor: selectedTask?.labelColor || '#6c757d',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {selectedTask?.label?.toUpperCase() || 'GENERAL'}
                      </span>
                    </div> */}
                  </div>
                </>
              )}

              

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <button 
                  onClick={handleEditTask}
                  disabled={selectedTask?.rawData?.is_completed === true}
                  style={{
                    padding: '10px',
                    backgroundColor: '#4e6fa5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                   
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5a87'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4e6fa5'}
                >
                  <Pencil size={14} />
                  Edit Todo
                </button>

                <button 
                  onClick={() => {
                    if (selectedTask?.rawData) {
                      // Remove id to create new task instead of updating
                      const taskDataWithoutId = { ...selectedTask.rawData };
                      delete taskDataWithoutId.id;
                      delete taskDataWithoutId.task_id;
                      setEditingTask(taskDataWithoutId);
                      setIsConverting(true);
                      setShowCreateTaskModal(true);
                    }
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: '#4e6fa5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5a87'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4e6fa5'}
                >
                  <ListTodo size={14} />
                  Convert to Task
                </button>
                
              </div>

              

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '8px'
              }}>
                 <button 
                  onClick={() => {
                    if (selectedTask) {
                      setShowDeleteModal(true);
                    }
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    color: '#e53e3e',
                    border: '1px solid #feb2b2',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff5f5';
                    e.currentTarget.style.borderColor = '#fc8181';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#feb2b2';
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <button 
                  onClick={() => {
                    if (selectedTask?.rawData) {
                      // Remove id and task_id to ensure it's treated as a new task, not an update
                      const { id, task_id, ...taskDataWithoutId } = selectedTask.rawData;
                      setEditingTask({ 
                        ...taskDataWithoutId, 
                        title: `${selectedTask.rawData.title} (Copy)`
                      });
                      setIsDuplicating(true); // Mark as duplicating, not editing
                      setShowCreateTaskModal(true);
                    }
                  }}
                  style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    color: '#4a5568',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <Copy size={14} />
                  Duplicate
                </button>

               
              </div>
            </>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Task Modal */}
      <CreateTaskModal
        show={showCreateTaskModal && !isConverting}
        onHide={() => {
          setShowCreateTaskModal(false);
          setEditingTask(null);
          setIsDuplicating(false);
        }}
        onCreate={handleCreateTask}
        onCreateAndOpen={handleCreateTask}
        extensions={hierarchyDataExtensions as any}
        task={editingTask}
        isEdit={!!editingTask} // Set to true so form gets pre-filled, but id is removed so it creates instead of updates
        taskType="todo"
        
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTask}
        itemName={selectedTask ? `${selectedTask.id} ${selectedTask.title}` : undefined}
        itemType="todo task"
        loading={deletingTask}
      />

      {/* Convert to Task Modal */}
      <CreateTaskModal
        show={showCreateTaskModal && isConverting}
        onHide={() => {
          setShowCreateTaskModal(false);
          setEditingTask(null);
          setIsConverting(false);
        }}
        onCreate={handleCreateTask}
        onCreateAndOpen={handleCreateTask}
        extensions={hierarchyDataExtensions as any}
        task={editingTask}
        isEdit={true} // Set to true to pre-fill form, but ID is removed so it will create new task
        taskType="regular"
      />

    </React.Fragment>
  );
};

DialTodo.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

// Task Item Component
interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onClick: (task: Task) => void;
    isSelected: boolean;
  }
  
  const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onClick, isSelected }) => {
    return (
      <div
        onClick={() => onClick(task)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px',
          backgroundColor: isSelected ? '#edf6ff' : (task.completed ? '#f8fafb' : 'transparent'),
          borderRadius: '6px',
          marginBottom: '6px',
          cursor: 'pointer',
          border: isSelected ? '1px solid #5b8fd8' : '1px solid #f0f4f8',
          transition: 'all 0.15s',
          opacity: task.completed ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = task.completed ? '#f0f4f8' : '#f8fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = task.completed ? '#f8fafb' : 'transparent';
            e.currentTarget.style.borderColor = '#f0f4f8';
          }
        }}
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          style={{
            width: '16px',
            height: '16px',
            cursor: 'pointer',
            accentColor: '#5b8fd8'
          }}
        />
        {/* {task.time && (
          <span style={{ 
            fontWeight: '700',
            fontSize: '13px',
            minWidth: '45px',
            color: task.completed ? '#a0aec0' : '#2d3748',
            textDecoration: task.completed ? 'line-through' : 'none'
          }}>
            {task.time}
          </span>
        )} */}
        <span style={{ 
          flex: 1,
          fontSize: '13px',
          textDecoration: task.completed ? 'line-through' : 'none',
          color: task.completed ? '#a0aec0' : '#2d3748',
          fontWeight: '500'
        }}>
          {task.title}
        </span>
        {task.completed ? (
          <>  
          <span
             style={{
              display: 'inline-block',
              padding: '4px 10px',
              backgroundColor: '#5b8fd8',
              color: 'white',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            Completed on: <b >{formatDateForTable(task.rawData.completed_at??task.rawData.updated_at)}</b>
          </span>
          </>
        ) : (
          <>
          { task.rawData?.due_date && (
              <span style={{ fontSize: '12px', color: '#dc3545', fontWeight: '500', flexShrink: 0 }}>
                Due Date: {formatDateForTable(task.rawData.due_date)}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(task.id);
              }}
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                backgroundColor: '#5b8fd8',
                color: 'white',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Mark as completed"
            >
              Mark complete
            </button>
            
          </>
        )}
        {/* <span style={{
          padding: '3px 8px',
          backgroundColor: task.completed ? '#e2e8f0' : task.labelColor,
          color: task.completed ? '#718096' : 'white',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          textTransform: 'uppercase',
          letterSpacing: '0.3px'
        }}>
          {task.priority}
          
        </span> */}
        {/* <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          <MoreVertical size={16} color="#718096" />
        </button> */}
      </div>
    );
  };
  
export default DialTodo;
