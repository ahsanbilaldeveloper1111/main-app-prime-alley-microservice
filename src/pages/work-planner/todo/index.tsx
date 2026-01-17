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
  Tag, 
  Phone, 
  FileText, 
  CreditCard, 
  Users, 
  Briefcase, 
  Mail,
  ChevronDown,
  MoreVertical,
  Plus,
  X,
  Bell,
  Grid3x3,
  User,
  Link as LinkIcon,
  Copy,
  Trash2,
  Pencil,
  Clock,
  Pin,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import ConvertToTaskModal from '@components/converttotask';

// Types
interface Task {
  id: string;
  time?: string;
  title: string;
  label: string;
  labelColor: string;
  icon: React.ReactNode;
  completed: boolean;
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
    const [activeTab, setActiveTab] = useState<'today' | 'completed' | 'overdue' | 'upcoming'>('today');
    const [filterDate, setFilterDate] = useState('today');
    const [filterLabel, setFilterLabel] = useState('labels');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
      page: 1,
      limit: 20,
      total: 0,
      last_page: 1
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTask, setDeletingTask] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
    
    // Fetch extensions for assignees
    const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);
  
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

    // Map API task to Todo Task format
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

      // Determine category based on due_date and completion status
      const getCategory = (): 'scheduled' | 'anytime' | 'overdue' => {
        if (apiTask.is_completed) return 'scheduled'; // Completed tasks go to scheduled
        
        if (!apiTask.due_date) return 'anytime';
        
        try {
          const dueDate = new Date(apiTask.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueDate.getTime() < today.getTime()) {
            return 'overdue';
          }
          
          if (dueDate.getTime() === today.getTime() || apiTask.due_time) {
            return 'scheduled';
          }
          
          return 'anytime';
        } catch {
          return 'anytime';
        }
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
        category: getCategory(),
        rawData: apiTask
      };
    };

    // Fetch todo tasks from API
    const fetchTasks = useCallback(async () => {
      try {
        setLoading(true);
        
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
          type: 'to_do', // Key difference: type is 'todo'
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

        // Add filters based on activeTab
        if (activeTab === 'completed') {
          params.is_completed = true;
        } else if (activeTab === 'overdue') {
          params.is_completed = false;
          // Filter for overdue will be handled client-side based on due_date
        }

        const response = await listTasks(params);
        
        if (response && response.data) {
          let mappedTasks = response.data.map(mapApiTaskToTodoTask);
          
          // Client-side filtering for overdue
          if (activeTab === 'overdue') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            mappedTasks = mappedTasks.filter((task: Task) => {
              if (task.completed || !task.rawData?.due_date) return false;
              try {
                const dueDate = new Date(task.rawData.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate.getTime() < today.getTime();
              } catch {
                return false;
              }
            });
          }
          
          setTasks(mappedTasks);
          
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
        console.error('Error fetching todo tasks:', error);
      } finally {
        setLoading(false);
      }
    }, [pagination.page, pagination.limit, searchTerm, activeTab, hierarchyDataExtensions]);

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
        await fetchTasks();
        setShowCreateTaskModal(false);
        setEditingTask(null);
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
  
    
  
    // Hardcoded linked records for fallback (when API doesn't provide linked_records)
    const linkedRecords: LinkedRecord[] = [
      {
        id: '1',
        type: 'call',
        title: 'Call with Ahmad',
        subtitle: 'Today, 9:00 AM',
        icon: <Phone size={18} />
      },
      {
        id: '2',
        type: 'contact',
        title: 'Ahmad Hasan',
        subtitle: 'Lead',
        icon: <User size={18} />
      },
      {
        id: '3',
        type: 'ticket',
        title: 'Support Ticket #2145',
        subtitle: 'Website Redesign',
        icon: <Pencil size={18} />
      }
    ];
  
    const getTaskCounts = () => {
      const today = tasks.filter(t => t.category === 'scheduled' || t.category === 'anytime').length;
      const completed = tasks.filter(t => t.completed).length;
      const overdue = tasks.filter(t => t.category === 'overdue' && !t.completed).length;
      const upcoming = tasks.filter(t => !t.completed && t.category !== 'overdue').length;
      return { today, completed, overdue, upcoming };
    };
  
    const counts = getTaskCounts();
  
    const filteredTasks = tasks.filter(task => {
      if (activeTab === 'completed') return task.completed;
      if (activeTab === 'overdue') return task.category === 'overdue' && !task.completed;
      if (activeTab === 'today') return task.category === 'scheduled' || task.category === 'anytime' || task.category === 'overdue';
      if (activeTab === 'upcoming') return !task.completed && task.category !== 'overdue';
      return true;
    });
  
    const scheduledTasks = filteredTasks.filter(t => t.category === 'scheduled' && !t.completed);
    const anytimeTasks = filteredTasks.filter(t => t.category === 'anytime' && !t.completed);
    const overdueTasks = filteredTasks.filter(t => t.category === 'overdue' && !t.completed);
  

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
                <Plus size={16} /> Add To-Do
              </button>
              <button
                onClick={() => setActiveTab('today')}
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
                  {counts.today}
                </span>
                Today
              </button>
              <button
                onClick={() => setActiveTab('completed')}
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
                  {counts.completed}
                </span>
                Completed
              </button>
              <button
                onClick={() => setActiveTab('overdue')}
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
                  {counts.overdue}
                </span>
                Overdue
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
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
                  {counts.upcoming}
                </span>
                Upcoming
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
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This Week</option>
                    <option value="next-week">Next Week</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                </div>

                <button style={{
                  padding: '7px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}>
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
                  placeholder="Search tasks..."
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

              {/* Scheduled Tasks */}
              {scheduledTasks.length > 0 && (
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
              {anytimeTasks.length > 0 && (
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
              {overdueTasks.length > 0 && (
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
                    Task Overview
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
                          Total Tasks
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748', marginTop: '4px' }}>
                          {tasks.length}
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
                        {tasks.filter(t => t.completed).length}
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
                        {tasks.filter(t => t.category === 'overdue' && !t.completed).length}
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
                      Pending Today
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                      {tasks.filter(t => !t.completed && (t.category === 'scheduled' || t.category === 'anytime')).length}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '20px' }}>
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
                </div>

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
                        {tasks.filter(t => t.category === 'scheduled').length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pin size={16} color="#805ad5" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Anytime</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#805ad5' }}>
                        {tasks.filter(t => t.category === 'anytime').length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} color="#e53e3e" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Overdue</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#e53e3e' }}>
                        {tasks.filter(t => t.category === 'overdue').length}
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
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}>
                      <MoreVertical size={18} color="#718096" />
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
                    {selectedTask?.time && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '13px'
                      }}>
                        <span style={{ color: '#718096', fontWeight: '500' }}>Due Time:</span>
                        <span style={{ fontWeight: '600', color: '#2d3748' }}>{selectedTask.time}</span>
                      </div>
                    )}
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
                    <div style={{ 
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
                    </div>
                  </div>
                </>
              )}

              <div style={{ 
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  fontSize: '13px', 
                  fontWeight: '700',
                  marginBottom: '12px',
                  color: '#2d3748',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <LinkIcon size={14} /> Linked Records
                </h3>
                {selectedTask?.rawData?.linked_records && selectedTask.rawData.linked_records.length > 0 ? (
                  selectedTask.rawData.linked_records.map((record: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        cursor: 'pointer',
                        border: '1px solid #e8eef5',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#edf2f7';
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e8eef5';
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#4e6fa5',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <LinkIcon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '13px',
                          color: '#2d3748'
                        }}>
                          {record.title || record.name || 'Linked Record'}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#718096'
                        }}>
                          {record.type || 'Record'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ 
                    padding: '10px',
                    color: '#718096',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}>
                    No linked records
                  </div>
                )}
                {/* Fallback to hardcoded records if no API data */}
                {(!selectedTask?.rawData?.linked_records || selectedTask.rawData.linked_records.length === 0) && linkedRecords.map(record => (
                  <div
                    key={record.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      border: '1px solid #e8eef5',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#edf2f7';
                      e.currentTarget.style.borderColor = '#cbd5e0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e8eef5';
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#4e6fa5',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {record.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '13px',
                        color: '#2d3748'
                      }}>
                        {record.title}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#718096'
                      }}>
                        {record.subtitle}
                      </div>
                    </div>
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}>
                      <MoreVertical size={16} color="#718096" />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <button 
                  onClick={handleEditTask}
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
                  <Pencil size={14} />
                  Edit Task
                </button>
                <button 
                  onClick={() => setShowConvertModal(true)}
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
                  <LinkIcon size={14} />
                  Link Record
                </button>
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <button 
                  onClick={() => {
                    if (selectedTask?.rawData) {
                      setEditingTask({ ...selectedTask.rawData, title: `${selectedTask.rawData.title} (Copy)` });
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
              </div>
            </>
            )}
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
      <ConvertToTaskModal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        onConvert={(data) => {
          console.log('Task converted:', data);
          // Handle task conversion logic here
        }}
        onConvertAndOpen={(data) => {
          console.log('Task converted and opening:', data);
          // Handle task conversion and open logic here
        }}
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
        {task.time && (
          <span style={{ 
            fontWeight: '700',
            fontSize: '13px',
            minWidth: '45px',
            color: task.completed ? '#a0aec0' : '#2d3748',
            textDecoration: task.completed ? 'line-through' : 'none'
          }}>
            {task.time}
          </span>
        )}
        <span style={{ 
          flex: 1,
          fontSize: '13px',
          textDecoration: task.completed ? 'line-through' : 'none',
          color: task.completed ? '#a0aec0' : '#2d3748',
          fontWeight: '500'
        }}>
          {task.title}
        </span>
        <span style={{
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
          {task.icon}
          {task.label}
        </span>
        <button
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
        </button>
      </div>
    );
  };
  
export default DialTodo;
