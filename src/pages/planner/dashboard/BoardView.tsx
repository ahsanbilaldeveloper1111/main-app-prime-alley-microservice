import React, { useMemo, useState } from 'react';
import { 
  Plus, MoreVertical, Calendar, ChevronLeft, ChevronRight,
  SlidersHorizontal, FileText, MapPin, Mail, ExternalLink
} from 'lucide-react';
import { formatDateForTable } from '@utils/Helper';
import { updateTask, deleteTask, getTask, getTaskActivities } from '@utils/tasks';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import TaskDetailOffcanvas from '@pages/planner/partials/TaskDetailOffcanvas';
import GenericFilterSidebar, { FilterField } from '@components/GenericFilterSidebar';

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";
const TEAL = "#006162";
const HEADER_H = 34;
const ARROW_W = 10;

interface BoardViewProps {
  selectedProject: any;
  hierarchyDataExtensions?: any[];
  statuses: any[];
  boardTasks: any[];
  loadingBoardTasks: boolean;
  labels: any[];
  boardSearchTerm: string;
  setBoardSearchTerm: (term: string) => void;
  boardSelectedAssignee: string;
  setBoardSelectedAssignee: (assignee: string) => void;
  boardSelectedPriority: string;
  setBoardSelectedPriority: (priority: string) => void;
  boardSelectedLabel: string;
  setBoardSelectedLabel: (label: string) => void;
  showCompletedTasks: boolean;
  setShowCompletedTasks: (show: boolean) => void;
  onClearFilters: () => void;
  onTaskClick?: (task: any) => void;
  onCreateTask: (statusId: number) => void;
  getAllBoardAssignees: () => string[];
  getAllBoardPriorities: () => string[];
  getTasksByStatus: (statusId: string | number | null) => any[];
  onTaskStatusChange?: () => void; // Callback to refresh board data after status change
}

const BoardView: React.FC<BoardViewProps> = ({
  selectedProject,
  hierarchyDataExtensions = [],
  statuses,
  boardTasks,
  loadingBoardTasks,
  labels,
  boardSearchTerm,
  setBoardSearchTerm,
  boardSelectedAssignee,
  setBoardSelectedAssignee,
  boardSelectedPriority,
  setBoardSelectedPriority,
  boardSelectedLabel,
  setBoardSelectedLabel,
  showCompletedTasks,
  setShowCompletedTasks,
  onClearFilters,
  onTaskClick,
  onCreateTask,
  getAllBoardAssignees,
  getAllBoardPriorities,
  getTasksByStatus,
  onTaskStatusChange
}) => {
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'activity' | 'comments' | 'documents'>('activity');
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverStatus, setDragOverStatus] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingTaskForEdit, setLoadingTaskForEdit] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);

  const extensionNameByNumber = useMemo(() => {
    const map = new Map<string, string>();
    (hierarchyDataExtensions || []).forEach((ext: any) => {
      const extNumber = String(ext?.extension_number || ext?.id || '').trim();
      const name = String(ext?.user?.name || ext?.name || '').trim();
      if (extNumber && name) map.set(extNumber, name);
    });
    return map;
  }, [hierarchyDataExtensions]);

  const extensionsForModal = useMemo(() => (hierarchyDataExtensions || []).map((ext: any) => ({
    id: String(ext?.extension_number ?? ext?.id ?? ''),
    name: String(ext?.user?.name || ext?.name || '')
  })), [hierarchyDataExtensions]);

  const getUserNameFromExtension = (extensionNumber: any): string => {
    const key = String(extensionNumber || '').trim();
    if (!key) return '';
    return extensionNameByNumber.get(key) || key;
  };

  const getAssigneeDisplayName = (assignee: any): string => {
    if (!assignee) return '';
    if (assignee.user?.name) return String(assignee.user.name);
    const extNum = assignee.extension_number || assignee.extension || assignee.id;
    return getUserNameFromExtension(extNum);
  };

  const handleTaskClick = async (task: any) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    setTaskActivities([]);
    setTaskComments([]);
    setActiveDetailTab('activity');
    if (onTaskClick) {
      onTaskClick(task);
    }
    if (task?.id) {
      try {
        setLoadingActivities(true);
        const activitiesResponse = await getTaskActivities(task.id, 1, 5);
        if (activitiesResponse) {
          setTaskActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
        }
      } catch (err) {
        console.error('Error fetching task activities:', err);
        setTaskActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    }
  };

  const handleEditClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedTask?.id) return;
    try {
      setLoadingTaskForEdit(true);
      const withRelations = ['project', 'status', 'assignees', 'labels', 'parent', 'children'];
      const taskData = await getTask(selectedTask.id, withRelations);
      if (taskData) {
        setSelectedTask(taskData);
        setShowTaskDetail(false);
        setShowEditModal(true);
      }
    } catch (err) {
      console.error('Error loading task for edit:', err);
      toast.error('Failed to load task');
    } finally {
      setLoadingTaskForEdit(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask?.id) return;
    try {
      setDeleting(true);
      await deleteTask(selectedTask.id);
      setShowDeleteModal(false);
      setShowTaskDetail(false);
      setSelectedTask(null);
      if (onTaskStatusChange) onTaskStatusChange();
      toast.success('Task deleted');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskUpdate = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    if (onTaskStatusChange) onTaskStatusChange();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: any) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', task.id.toString());
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedTask(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStatus(statusId);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: number) => {
    e.preventDefault();
    setDragOverStatus(null);

    if (!draggedTask || !selectedProject?.id) {
      return;
    }

    // Don't update if dropped in the same status
    if (draggedTask.status_id === targetStatusId || draggedTask.status?.id === targetStatusId) {
      setDraggedTask(null);
      return;
    }

    try {
      // Build complete payload with all task fields
      const payload: any = {
        status_id: targetStatusId
      };

      // Include all existing task fields
      if (draggedTask.title) payload.title = draggedTask.title;
      if (draggedTask.description) payload.description = draggedTask.description;
      if (draggedTask.priority) payload.priority = draggedTask.priority;
      if (draggedTask.due_date) payload.due_date = draggedTask.due_date;
      if (draggedTask.project_id !== undefined && draggedTask.project_id !== null) {
        payload.project_id = draggedTask.project_id;
      }

      // Map assignees to extension_numbers
      if (draggedTask.assignees && Array.isArray(draggedTask.assignees) && draggedTask.assignees.length > 0) {
        payload.extension_numbers = draggedTask.assignees.map((assignee: any) => 
          assignee.extension_number || assignee.extension || assignee.id
        ).filter(Boolean);
      } else if (draggedTask.extension_numbers && Array.isArray(draggedTask.extension_numbers)) {
        payload.extension_numbers = draggedTask.extension_numbers;
      }

      // Map labels to label_ids
      if (draggedTask.labels && Array.isArray(draggedTask.labels) && draggedTask.labels.length > 0) {
        payload.label_ids = draggedTask.labels.map((label: any) => label.id).filter((id: any) => id !== undefined && id !== null);
      } else if (draggedTask.label_ids && Array.isArray(draggedTask.label_ids)) {
        payload.label_ids = draggedTask.label_ids;
      }

      // Update task via API with complete payload
      await updateTask(draggedTask.id, payload);

      // Refresh board data
      if (onTaskStatusChange) {
        onTaskStatusChange();
      }

      setDraggedTask(null);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
      setDraggedTask(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': 
      case 'urgent': 
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'medium': 
        return { bg: '#FEF3C7', text: '#92400E' };
      default: 
        return { bg: '#E5E7EB', text: '#4B5563' };
    }
  };

  const getStatusVariant = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'done': 
      case 'completed': 
        return 'success';
      case 'in progress': 
      case 'in-progress': 
        return 'warning';
      case 'review': 
        return 'info';
      default: 
        return 'secondary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': 
      case 'urgent': 
        return 'danger';
      case 'medium': 
        return 'warning';
      default: 
        return 'secondary';
    }
  };

  const boardFilterFields: FilterField[] = useMemo(() => [
    { id: 'search', label: 'Search', type: 'text', value: boardSearchTerm, onChange: (v: string) => setBoardSearchTerm(v ?? ''), placeholder: 'Search tasks...' },
    { id: 'assignee', label: 'Assignee', type: 'dropdown', value: boardSelectedAssignee, onChange: (v) => setBoardSelectedAssignee(v ?? 'All Assignees'), options: [{ value: 'All Assignees', label: 'All Assignees' }, ...getAllBoardAssignees().map((a) => ({ value: a, label: a }))] },
    { id: 'priority', label: 'Priority', type: 'dropdown', value: boardSelectedPriority, onChange: (v) => setBoardSelectedPriority(v ?? 'All Priorities'), options: [{ value: 'All Priorities', label: 'All Priorities' }, ...getAllBoardPriorities().map((p) => ({ value: p, label: p }))] },
    { id: 'label', label: 'Label', type: 'dropdown', value: boardSelectedLabel, onChange: (v) => setBoardSelectedLabel(v ?? 'All Labels'), options: [{ value: 'All Labels', label: 'All Labels' }, ...(labels || []).map((l: any) => ({ value: l.name, label: l.name }))] },
  ], [boardSearchTerm, boardSelectedAssignee, boardSelectedPriority, boardSelectedLabel, labels, getAllBoardAssignees, getAllBoardPriorities]);

  const [collapsedColumns, setCollapsedColumns] = useState<Record<number, boolean>>({});
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);

  const styles = {
    board: {
      display: 'flex',
      gap: 0,
      overflowX: 'auto' as const,
      paddingBottom: '1rem',
      background: '#ffffff',
      height: '80vh',
      width: '100%',
      overflowY: 'hidden' as const
    },
    column: {
      display: 'flex',
      flexDirection: 'column' as const,
      flexShrink: 0,
      minWidth: '280px',
      maxHeight: '100%',
      overflow: 'hidden',
      transition: 'width .15s ease',
      backgroundColor: '#ffffff'
    },
    addButton: {
      width: '100%',
      padding: '0.5rem',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      color: TEAL,
      fontSize: '0.85rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginBottom: '0.75rem',
      transition: 'all 0.12s',
      fontFamily: FONT
    },
    taskCard: {
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '11px 13px 12px',
      marginBottom: '11px',
      cursor: 'grab',
      boxShadow: '0 1px 2px rgba(0,0,0,.05)',
      transition: 'box-shadow .12s',
      fontFamily: FONT,
      userSelect: 'none' as const
    },
    taskTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: TEAL,
      cursor: 'pointer',
      fontFamily: FONT,
      lineHeight: '18px',
      marginBottom: '2px'
    },
    taskMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      margin: '5px 0 6px',
      flexWrap: 'wrap' as const
    },
    miniAvatar: {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '7px',
      fontWeight: 700,
      flexShrink: 0,
      userSelect: 'none' as const,
      fontFamily: FONT
    },
    label: {
      padding: '0.25rem 0.5rem',
      borderRadius: '6px',
      fontSize: '11.5px',
      fontWeight: '600',
      color: '#fff',
      fontFamily: FONT
    },
    priority: {
      padding: '0.25rem 0.5rem',
      borderRadius: '6px',
      fontSize: '11.5px',
      fontWeight: '600',
      fontFamily: FONT
    },
    taskFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '4px',
      marginTop: '4px'
    },
    taskIcons: {
      display: 'flex',
      gap: 0,
      alignItems: 'center',
      justifyContent: 'flex-end'
    },
    actBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '3px 4px',
      borderRadius: '3px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#141414',
      transition: 'color .1s'
    },
    dueDate: {
      fontSize: '11.5px',
      color: '#555',
      lineHeight: '18px',
      fontFamily: FONT,
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    }
  };

  const ColumnHeader: React.FC<{
    title: string;
    count: number;
    color: string;
    isCollapsed: boolean;
    isLast: boolean;
    onToggle: () => void;
  }> = ({ title, count, color, isCollapsed, isLast, onToggle }) => {
    const [hov, setHov] = useState(false);

    // Render simplified vertical header when collapsed
    if (isCollapsed) {
      return (
        <div
          style={{
            position: 'relative',
            height: '100%',
            minHeight: 120
          }}
        >
          <div
            onClick={onToggle}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
              height: HEADER_H,
              backgroundColor: color || '#ccc',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '3px',
              transition: 'all 0.2s',
              opacity: hov ? 0.9 : 1,
              boxShadow: hov ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              marginBottom: 8
            }}
            title={`${title} (${count}) - Click to expand`}
          >
            <ChevronRight size={14} style={{ color: '#fff', marginBottom: 2 }} />
            {count > 0 && (
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                color: '#fff',
                fontFamily: FONT,
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '1px 4px',
                minWidth: 16,
                textAlign: 'center'
              }}>
                {count}
              </span>
            )}
          </div>
          {/* Vertical status name */}
          <div
            onClick={onToggle}
            style={{
              writingMode: 'vertical-rl' as const,
              textOrientation: 'mixed',
              fontSize: 11,
              fontWeight: 600,
              color: '#666',
              fontFamily: FONT,
              cursor: 'pointer',
              textAlign: 'center',
              margin: '8px auto',
              whiteSpace: 'nowrap',
              userSelect: 'none'
            }}
            title={`${title} - Click to expand`}
          >
            {title}
          </div>
        </div>
      );
    }

    const clipPathValue = isLast
      ? `polygon(0px 0px, 100% 0px, 100% 100%, 0px 100%, ${ARROW_W}px 50%)`
      : `polygon(0px 0px, calc(100% - ${ARROW_W}px) 0px, 100% 50%, calc(100% - ${ARROW_W}px) 100%, 0px 100%, ${ARROW_W}px 50%)`;

    return (
      <div
        style={{
          position: 'relative',
          height: HEADER_H,
          flexShrink: 0,
          backgroundColor: color || '#ccc',
          borderTopLeftRadius: 0,
          clipPath: clipPathValue,
          zIndex: 1,
          width: '102%'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 1,
            left: 1,
            right: isLast ? 1 : 0,
            bottom: 1,
            backgroundColor: '#f7f2f7',
            borderTopLeftRadius: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: ARROW_W + 6,
            paddingRight: isLast ? 7 : ARROW_W + 5,
            clipPath: isLast
              ? `polygon(1px 0px, 100% 0px, 100% 100%, 1px 100%, ${ARROW_W}px 50%)`
              : `polygon(1px 0px, calc(100% - ${ARROW_W}px) 0px, calc(100% - 1px) 50%, calc(100% - ${ARROW_W}px) 100%, 1px 100%, ${ARROW_W}px 50%)`,
            cursor: 'default',
            userSelect: 'none'
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
        >
          <span
            style={{
              fontSize: 12,
              fontStyle: 'normal',
              fontWeight: 600,
              textTransform: 'unset',
              margin: 0,
              padding: 0,
              backgroundColor: 'unset',
              fontFamily: FONT,
              letterSpacing: 0,
              lineHeight: '18px',
              color: '#141414',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1
            }}
          >
            {title}
          </span>

          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: '#888',
              fontFamily: FONT,
              marginLeft: 5,
              marginRight: 4,
              flexShrink: 0,
              width: 27,
              height: 20,
              borderRadius: 20,
              background: '#fff',
              textAlign: 'center'
            }}
          >
            {count}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 3px',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hov ? '#555' : '#141414',
              flexShrink: 0,
              transition: 'color .12s'
            }}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    );
  };

  const ActBtn: React.FC<{
    icon: React.ReactNode;
    title: string;
    onClick: (e: React.MouseEvent) => void;
  }> = ({ icon, title, onClick }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        title={title}
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          ...styles.actBtn,
          color: hov ? '#000' : '#141414'
        }}
      >
        {icon}
      </button>
    );
  };

  if (!selectedProject) {
    return (
      <div style={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6B7280' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No project selected</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Please select a project to view the board</p>
        </div>
      </div>
    );
  }

  if (loadingBoardTasks) {
    return (
      <div style={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
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
          border: 2px dashed #cbd5e1;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .add-assignee:hover {
          border-color: #667eea;
          color: #667eea;
        }
      `}</style>

      {/* Page header with Filters button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1F2937' }}>
          {selectedProject?.name ? `${selectedProject.name} - Board` : 'Board'}
        </div>
        <button
          type="button"
          onClick={() => setShowFilterSidebar(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            color: '#4680FF',
            border: '1px solid #4680FF',
            borderRadius: '6px',
            fontWeight: '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <SlidersHorizontal size={18} />
          Filters
        </button>
      </div>

      <GenericFilterSidebar
        isOpen={showFilterSidebar}
        onClose={() => setShowFilterSidebar(false)}
        title="Filters"
        subtitle="Filter board tasks"
        filters={boardFilterFields}
        onApply={() => setShowFilterSidebar(false)}
        onReset={() => {
          onClearFilters();
          setShowFilterSidebar(false);
        }}
        width="400px"
        showApplyButton
        showResetButton
      />

      {/* Kanban Board */}
      <div className="kb-scroll" style={styles.board}>
        {statuses.map((status: any, idx: number) => {
          const statusTasks = getTasksByStatus(status.id);
          const isCollapsed = !!collapsedColumns[status.id];
          const isLast = idx === statuses.length - 1;
          
          return (
            <div 
              key={status.id} 
              style={{
                ...styles.column,
                width: isCollapsed ? '46px' : '280px',
                minWidth: isCollapsed ? '46px' : '280px',
                borderRight: isCollapsed ? '1px solid #e5e7eb' : 'none'
              }}
            >
              {/* White top bar that contains the arrow header */}
              <div style={{
                backgroundColor: '#ffffff',
                flexShrink: 0,
                padding: isCollapsed ? '5px 5px 5px 5px' : '5px 5px 0 5px'
              }}>
                <ColumnHeader
                  title={status.name}
                  count={statusTasks.length}
                  color={status.color || '#ccc'}
                  isCollapsed={isCollapsed}
                  isLast={isLast}
                  onToggle={() => setCollapsedColumns(prev => ({ ...prev, [status.id]: !prev[status.id] }))}
                />
              </div>

              {/* Cards area with 5px margin on all sides */}
              {!isCollapsed && (
                <div
                  className="kb-col-cards"
                  onDragOver={(e) => { e.preventDefault(); handleDragOver(e, status.id); }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => { handleDrop(e, status.id); }}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    margin: '5px',
                    padding: '9px 10px 10px',
                    borderRadius: 3,
                    background: dragOverStatus === status.id ? '#dde8f3' : 'whitesmoke',
                    transition: 'background .12s',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#c8c8c8 transparent',
                    borderTop: '1px solid #cccccc'
                  }}
                >
                  <button 
                    style={styles.addButton}
                    onClick={() => onCreateTask(status.id)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = TEAL;
                    }}
                  >
                    <Plus size={16} />
                    Add Task
                  </button>

                  {statusTasks.length === 0 ? (
                    <div style={{
                      padding: '28px 8px',
                      textAlign: 'center',
                      color: '#ccc',
                      fontSize: 12,
                      fontFamily: FONT
                    }}>
                      No records
                    </div>
                  ) : (
                    statusTasks.map((task: any) => {
                      const cardHov = hoveredTaskId === task.id;
                      
                      return (
                        <div
                          key={task.id}
                          draggable
                          style={{
                            ...styles.taskCard,
                            boxShadow: cardHov ? '0 2px 8px rgba(0,0,0,.10)' : '0 1px 2px rgba(0,0,0,.05)'
                          }}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onMouseEnter={() => setHoveredTaskId(task.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                        >
                          {/* Task title as clickable link */}
                          <div style={{ marginBottom: 2 }}>
                            <span
                              onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                              style={styles.taskTitle}
                            >
                              {task.title || 'Untitled Task'}
                            </span>
                          </div>

                          {/* Due date and assignee info */}
                          {(task.due_date || (task.assignees && task.assignees.length > 0)) && (
                            <div style={styles.taskMeta}>
                              {task.assignees && task.assignees.length > 0 && (
                                <>
                                  {task.assignees.slice(0, 1).map((assignee: any, idx: number) => {
                                    const name = getAssigneeDisplayName(assignee);
                                    const assigneeInitials = name !== '' 
                                      ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                      : 'UN';
                                    const assigneeColor = `hsl(${(name.charCodeAt(0) * 137) % 360}, 70%, 50%)`;
                                    
                                    return (
                                      <div key={idx} style={{...styles.miniAvatar, background: assigneeColor}} title={name}>
                                        {assigneeInitials}
                                      </div>
                                    );
                                  })}
                                  <span
                                    title={task.assignees.map((a: any) => getAssigneeDisplayName(a)).join(', ')}
                                    style={{
                                      fontSize: '11.5px',
                                      color: TEAL,
                                      fontFamily: FONT,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: 180,
                                      lineHeight: '18px'
                                    }}
                                  >
                                    {getAssigneeDisplayName(task.assignees[0])}
                                    {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Labels and priority */}
                          {(task.labels?.length > 0 || task.priority || task.description) && (
                            <div style={{ marginBottom: 5 }}>
                              {task.labels?.slice(0, 2).map((label: any, idx: number) => (
                                <div key={idx} style={{ fontSize: '11.5px', color: '#555', lineHeight: '18px', fontFamily: FONT }}>
                                  Label: {label.name}
                                </div>
                              ))}
                              {task.priority && (
                                <div style={{ fontSize: '11.5px', color: '#555', lineHeight: '18px', fontFamily: FONT }}>
                                  Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </div>
                              )}
                              {task.due_date && (
                                <div style={styles.dueDate}>
                                  Due: {formatDateForTable(task.due_date)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              ...styles.taskFooter,
                              borderTop: 'none',
                              paddingTop: 4,
                              marginTop: 0
                            }}
                          >
                            <div style={styles.taskIcons}>
                              <ActBtn 
                                icon={<FileText size={13} />} 
                                title="View record" 
                                onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }} 
                              />
                              <ActBtn 
                                icon={<MapPin size={13} />} 
                                title="Pin" 
                                onClick={(e) => { e.stopPropagation(); }} 
                              />
                              <ActBtn 
                                icon={<Mail size={13} />} 
                                title="Send email" 
                                onClick={(e) => { e.stopPropagation(); }} 
                              />
                              <ActBtn 
                                icon={<ExternalLink size={13} />} 
                                title="Open record" 
                                onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }} 
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Detail Sidebar */}
      {/* <TaskDetailOffcanvas
        show={showTaskDetail}
        onHide={() => {
          setShowTaskDetail(false);
          setTaskActivities([]);
        }}
        selectedTask={selectedTask ? {
          id: String(selectedTask.id),
          title: selectedTask.title,
          status: selectedTask.status?.name || 'Active',
          priority: selectedTask.priority || 'Normal',
          project: selectedTask.project?.name || 'No Project',
          dueDate: selectedTask.due_date ? formatDateForTable(selectedTask.due_date) : undefined,
          description: selectedTask.description,
          rawData: selectedTask
        } : null}
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
        onEditTask={() => handleEditClick({ stopPropagation: () => {} } as React.MouseEvent)}
        onOpenDeleteModal={() => {
          setShowTaskDetail(false);
          setShowDeleteModal(true);
        }}
        hierarchyDataExtensions={hierarchyDataExtensions}
        getStatusVariant={(s) => getStatusVariant(s)}
        getPriorityVariant={(p) => getPriorityVariant(p || '')}
      /> */}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
        }}
        onConfirm={confirmDelete}
        itemName={selectedTask?.title ? `"${selectedTask.title}"` : `Task #${selectedTask?.task_id || selectedTask?.id}`}
        itemType="task"
        loading={deleting}
      />

      <CreateTaskModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        onCreate={handleTaskUpdate}
        extensions={extensionsForModal}
        labels={labels}
        statuses={statuses}
        project={selectedProject}
        task={selectedTask}
        isEdit={true}
      />
    </>
  );
};

export default BoardView;
