import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  canManageProjectFromMembers,
  getSessionPhoneOrExtension,
} from '@planner/projectMemberRole';
import { sortStringsLocale } from '@planner/projectTabsContentUtils';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  FileText,
  MapPin,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { formatDateForTable } from '@utils/Helper';
import { updateTask, getTask } from '@utils/tasks';
import { toast } from 'react-toastify';
import CreateTaskSidebar from '@components/CreatePlannerTaskSidebar';
import GenericFilterSidebar, { FilterField } from '@components/GenericFilterSidebar';

const FONT = "'Lexend Deca', Helvetica, Arial, sans-serif";
const TEAL = "#006162";
const HEADER_H = 34;
const ARROW_W = 10;

/** Map key for extension lookups; avoids `String(object)` → `[object Object]`. */
function extensionNumberToMapKey(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.trim();
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value).trim();
  }
  return '';
}

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
  boardSelectedStatus: string;
  setBoardSelectedStatus: (status: string) => void;
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

function buildTaskMovePayload(
  draggedTask: any,
  targetStatusId: number,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { status_id: targetStatusId };
  if (draggedTask.title) payload.title = draggedTask.title;
  if (draggedTask.description) payload.description = draggedTask.description;
  if (draggedTask.priority) payload.priority = draggedTask.priority;
  if (draggedTask.due_date) payload.due_date = draggedTask.due_date;
  if (
    draggedTask.project_id !== undefined &&
    draggedTask.project_id !== null
  ) {
    payload.project_id = draggedTask.project_id;
  }
  if (
    draggedTask.assignees &&
    Array.isArray(draggedTask.assignees) &&
    draggedTask.assignees.length > 0
  ) {
    payload.extension_numbers = draggedTask.assignees
      .map(
        (assignee: any) =>
          assignee.extension_number || assignee.extension || assignee.id,
      )
      .filter(Boolean);
  } else if (
    draggedTask.extension_numbers &&
    Array.isArray(draggedTask.extension_numbers)
  ) {
    payload.extension_numbers = draggedTask.extension_numbers;
  }
  if (
    draggedTask.labels &&
    Array.isArray(draggedTask.labels) &&
    draggedTask.labels.length > 0
  ) {
    payload.label_ids = draggedTask.labels
      .map((label: any) => label.id)
      .filter((id: unknown) => id !== undefined && id !== null);
  } else if (
    draggedTask.label_ids &&
    Array.isArray(draggedTask.label_ids)
  ) {
    payload.label_ids = draggedTask.label_ids;
  }
  return payload;
}

type BoardColumnHeaderProps = {
  title: string;
  count: number;
  color: string;
  isCollapsed: boolean;
  isLast: boolean;
  onToggle: () => void;
};

const BoardColumnHeader: React.FC<BoardColumnHeaderProps> = ({
  title,
  count,
  color,
  isCollapsed,
  isLast,
  onToggle,
}) => {
  const [hov, setHov] = useState(false);

  const onKeyToggle = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      onToggle();
    }
  };

  if (isCollapsed) {
    return (
      <div
        style={{
          position: 'relative',
          height: '100%',
          minHeight: 120,
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={onKeyToggle}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          onFocus={() => setHov(true)}
          onBlur={() => setHov(false)}
          style={{
            height: HEADER_H,
            width: '100%',
            backgroundColor: color || '#ccc',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
            border: 'none',
            padding: 0,
            transition: 'all 0.2s',
            opacity: hov ? 0.9 : 1,
            boxShadow: hov ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            marginBottom: 8,
          }}
          title={`${title} (${count}) - Click to expand`}
        >
          <ChevronRight size={14} style={{ color: '#fff', marginBottom: 2 }} />
          {count > 0 && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: '#fff',
                fontFamily: FONT,
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '1px 4px',
                minWidth: 16,
                textAlign: 'center',
              }}
            >
              {count}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={onKeyToggle}
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
            userSelect: 'none',
            background: 'none',
            border: 'none',
            padding: '4px 0',
            display: 'block',
          }}
          title={`${title} - Click to expand`}
        >
          {title}
        </button>
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
        width: '102%',
      }}
    >
      <section
        aria-label={title}
        style={{
          position: 'absolute',
          padding:0,
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
          userSelect: 'none',
          margin: 0,
        }}
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
            flex: 1,
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
            textAlign: 'center',
          }}
        >
          {count}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          onFocus={() => setHov(true)}
          onBlur={() => setHov(false)}
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
            transition: 'color .12s',
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </section>
    </div>
  );
};

type BoardActBtnProps = {
  icon: React.ReactNode;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  actBtnBase: React.CSSProperties;
};

const BoardActBtn: React.FC<BoardActBtnProps> = ({
  icon,
  title,
  onClick,
  actBtnBase,
}) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onFocus={() => setHov(true)}
      onBlur={() => setHov(false)}
      style={{
        ...actBtnBase,
        color: hov ? '#000' : '#141414',
      }}
    >
      {icon}
    </button>
  );
};

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
  boardSelectedStatus,
  setBoardSelectedStatus,
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
  const router = useRouter();
  const { data: session } = useSession();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  /** Admin + member: add/move/edit from board. Viewer: read-only. */
  const canEditTasksOnBoard = useMemo(
    () => canManageProjectFromMembers(selectedProject, sessionUserPhoneOrExtension),
    [selectedProject, sessionUserPhoneOrExtension],
  );

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverStatus, setDragOverStatus] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  /** Draft values for the filter sidebar; applied to the board only after Search (Apply). */
  const [boardFilterDraft, setBoardFilterDraft] = useState({
    search: '',
    assignee: 'All Assignees',
    priority: 'All Priorities',
    status: 'All Statuses',
    label: 'All Labels',
  });
  const [savingTaskMove, setSavingTaskMove] = useState(false);

  const extensionNameByNumber = useMemo(() => {
    const map = new Map<string, string>();
    (hierarchyDataExtensions || []).forEach((ext: any) => {
      const extNumber = String(ext?.extension_number || ext?.id || '').trim();
      const name = String(ext?.user?.name || ext?.name || '').trim();
      if (extNumber && name) map.set(extNumber, name);
    });
    return map;
  }, [hierarchyDataExtensions]);

  const getUserNameFromExtension = useCallback(
    (extensionNumber: unknown): string => {
      const key = extensionNumberToMapKey(extensionNumber);
      if (!key) return '';
      return extensionNameByNumber.get(key) || key;
    },
    [extensionNameByNumber],
  );

  /** Project members + board task assignees + hierarchy extensions (for full filter list). */
  const boardAssigneeFilterIds = useMemo(() => {
    const ids = new Set<string>(getAllBoardAssignees());
    (hierarchyDataExtensions || []).forEach((ext: any) => {
      const key = extensionNumberToMapKey(ext?.extension_number ?? ext?.id);
      if (key) ids.add(key);
    });
    return Array.from(ids).sort(sortStringsLocale);
  }, [getAllBoardAssignees, hierarchyDataExtensions]);

  const getAssigneeDisplayName = (assignee: any): string => {
    if (!assignee) return '';
    if (assignee.user?.name) return String(assignee.user.name);
    const extNum = assignee.extension_number || assignee.extension || assignee.id;
    return getUserNameFromExtension(extNum);
  };

  /** Open CreatePlannerTaskSidebar in edit mode after loading full task. */
  const loadTaskAndOpenEditModal = async (task: any) => {
    if (!task?.id) return;
    try {
      const withRelations = [
        'project',
        'status',
        'assignees',
        'labels',
        'parent',
        'children',
      ];
      const taskData = await getTask(task.id, withRelations);
      if (taskData) {
        setSelectedTask(taskData);
        setShowEditModal(true);
      }
    } catch (err) {
      console.error('Error loading task for edit:', err);
      toast.error('Failed to load task');
    }
  };

  const handleTaskClick = async (task: any) => {
    if (onTaskClick) {
      await Promise.resolve(onTaskClick(task));
      return;
    }
    if (!canEditTasksOnBoard && task?.id != null) {
      await router.push(`/planner/tasks/${task.id}`);
      return;
    }
    await loadTaskAndOpenEditModal(task);
  };

  const handleTaskUpdate = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    if (onTaskStatusChange) onTaskStatusChange();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: any) => {
    if (!canEditTasksOnBoard || savingTaskMove) {
      e.preventDefault();
      return;
    }
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

    if (!canEditTasksOnBoard || !draggedTask || !selectedProject?.id) {
      return;
    }

    // Don't update if dropped in the same status
    if (draggedTask.status_id === targetStatusId || draggedTask.status?.id === targetStatusId) {
      setDraggedTask(null);
      return;
    }

    setSavingTaskMove(true);
    try {
      const payload = buildTaskMovePayload(draggedTask, targetStatusId);
      await updateTask(draggedTask.id, payload as Parameters<typeof updateTask>[1]);
      onTaskStatusChange?.();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setSavingTaskMove(false);
      setDraggedTask(null);
    }
  };

  const boardFilterFields: FilterField[] = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search',
        type: 'text',
        value: boardFilterDraft.search,
        onChange: (v: string) =>
          setBoardFilterDraft((d) => ({ ...d, search: v ?? '' })),
        placeholder: 'Search tasks...',
      },
      {
        id: 'assignee',
        label: 'Assignee',
        type: 'dropdown',
        value: boardFilterDraft.assignee,
        onChange: (v) =>
          setBoardFilterDraft((d) => ({ ...d, assignee: v ?? 'All Assignees' })),
        options: [
          { value: 'All Assignees', label: 'All Assignees' },
          ...boardAssigneeFilterIds.map((ext) => ({
            value: ext,
            label: getUserNameFromExtension(ext) || ext,
          })),
        ],
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'dropdown',
        value: boardFilterDraft.priority,
        onChange: (v) =>
          setBoardFilterDraft((d) => ({ ...d, priority: v ?? 'All Priorities' })),
        options: [
          { value: 'All Priorities', label: 'All Priorities' },
          ...getAllBoardPriorities().map((p) => ({ value: p, label: p })),
        ],
      },
      {
        id: 'status',
        label: 'Status',
        type: 'dropdown',
        value: boardFilterDraft.status,
        onChange: (v) =>
          setBoardFilterDraft((d) => ({ ...d, status: v ?? 'All Statuses' })),
        options: [
          { value: 'All Statuses', label: 'All Statuses' },
          ...(statuses || []).map((s: any) => ({
            value: String(s.id),
            label: String(s.name ?? s.id),
          })),
        ],
      },
      {
        id: 'label',
        label: 'Label',
        type: 'dropdown',
        value: boardFilterDraft.label,
        onChange: (v) =>
          setBoardFilterDraft((d) => ({ ...d, label: v ?? 'All Labels' })),
        options: [
          { value: 'All Labels', label: 'All Labels' },
          ...(labels || []).map((l: any) => ({ value: l.name, label: l.name })),
        ],
      },
    ],
    [
      boardFilterDraft.search,
      boardFilterDraft.assignee,
      boardFilterDraft.priority,
      boardFilterDraft.status,
      boardFilterDraft.label,
      labels,
      statuses,
      boardAssigneeFilterIds,
      getAllBoardPriorities,
      getUserNameFromExtension,
    ],
  );

  const handleApplyBoardFilters = useCallback(() => {
    setBoardSearchTerm(boardFilterDraft.search);
    setBoardSelectedAssignee(boardFilterDraft.assignee);
    setBoardSelectedPriority(boardFilterDraft.priority);
    setBoardSelectedStatus(boardFilterDraft.status);
    setBoardSelectedLabel(boardFilterDraft.label);
  }, [
    boardFilterDraft.search,
    boardFilterDraft.assignee,
    boardFilterDraft.priority,
    boardFilterDraft.status,
    boardFilterDraft.label,
    setBoardSearchTerm,
    setBoardSelectedAssignee,
    setBoardSelectedPriority,
    setBoardSelectedStatus,
    setBoardSelectedLabel,
  ]);

  const handleResetBoardFilters = useCallback(() => {
    setBoardFilterDraft({
      search: '',
      assignee: 'All Assignees',
      priority: 'All Priorities',
      status: 'All Statuses',
      label: 'All Labels',
    });
    onClearFilters();
    setShowFilterSidebar(false);
  }, [onClearFilters]);

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
      maxHeight: '100%',
      overflow: 'hidden',
      transition: 'flex-basis .15s ease, min-width .15s ease',
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
          <output className="d-block" aria-live="polite" aria-busy="true">
            <span className="visually-hidden">Loading board</span>
            <span className="spinner-border" aria-hidden="true" />
          </output>
        </div>
      </div>
    );
  }

  return (
    <>
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
          onClick={() => {
            setBoardFilterDraft({
              search: boardSearchTerm,
              assignee: boardSelectedAssignee,
              priority: boardSelectedPriority,
              status: boardSelectedStatus,
              label: boardSelectedLabel,
            });
            setShowFilterSidebar(true);
          }}
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
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = '#F9FAFB';
          }}
          onBlur={(e) => {
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
        subtitle="Adjust filters, then Search to update the board"
        filters={boardFilterFields}
        onApply={handleApplyBoardFilters}
        onReset={handleResetBoardFilters}
        width="400px"
        showApplyButton
        showResetButton
      />

      {/* Kanban Board */}
      <div style={{ position: 'relative', width: '100%' }}>
        {savingTaskMove && (
          <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.72)',
              cursor: 'wait',
            }}
          >
            <span className="visually-hidden">Updating task position</span>
            <span className="spinner-border text-primary" style={{ width: '2.5rem', height: '2.5rem' }} aria-hidden />
          </div>
        )}
        <div
          className="kb-scroll"
          style={{
            ...styles.board,
            pointerEvents: savingTaskMove ? 'none' : 'auto',
          }}
        >
        {statuses.map((status: any, idx: number) => {
          const statusTasks = getTasksByStatus(status.id);
          const isCollapsed = !!collapsedColumns[status.id];
          const isLast = idx === statuses.length - 1;
          
          return (
            <div 
              key={status.id} 
              style={{
                ...styles.column,
                ...(isCollapsed
                  ? {
                      flex: '0 0 46px',
                      width: '46px',
                      minWidth: '46px',
                      maxWidth: '46px',
                    }
                  : {
                      flex: '1 1 280px',
                      minWidth: '280px',
                      width: 'auto',
                      maxWidth: 'none',
                    }),
                borderRight: isCollapsed ? '1px solid #e5e7eb' : 'none'
              }}
            >
              {/* White top bar that contains the arrow header */}
              <div style={{
                backgroundColor: '#ffffff',
                flexShrink: 0,
                padding: isCollapsed ? '5px 5px 5px 5px' : '5px 5px 0 5px'
              }}>
                <BoardColumnHeader
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
                <section
                  className="kb-col-cards"
                  aria-label={`${status.name} tasks`}
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
                  {canEditTasksOnBoard && (
                    <button
                      type="button"
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
                      onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                        e.currentTarget.style.color = '#000';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.color = TEAL;
                      }}
                    >
                      <Plus size={16} />
                      Add Task
                    </button>
                  )}

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
                      const firstAssignee = task.assignees?.[0];
                      const primaryName = firstAssignee
                        ? getAssigneeDisplayName(firstAssignee)
                        : '';
                      const assigneeInitials =
                        primaryName === ''
                          ? 'UN'
                          : primaryName
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase();
                      const hueSeed =
                        primaryName.length > 0
                          ? primaryName.codePointAt(0) ?? 0
                          : 0;
                      const assigneeColor = `hsl(${(hueSeed * 137) % 360}, 70%, 50%)`;
                      const assigneeListTitle = task.assignees
                        ?.map((a: any) => getAssigneeDisplayName(a))
                        .join(', ');

                      return (
                        <article
                          key={task.id}
                          aria-label={task.title || 'Task'}
                          draggable={canEditTasksOnBoard && !savingTaskMove}
                          style={{
                            ...styles.taskCard,
                            boxShadow: cardHov
                              ? '0 2px 8px rgba(0,0,0,.10)'
                              : '0 1px 2px rgba(0,0,0,.05)',
                          }}
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onMouseEnter={() => setHoveredTaskId(task.id)}
                          onMouseLeave={() => setHoveredTaskId(null)}
                        >
                          <div style={{ marginBottom: 2 }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleTaskClick(task);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecoration = 'underline';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecoration = 'none';
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.textDecoration = 'underline';
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.textDecoration = 'none';
                              }}
                              style={{
                                ...styles.taskTitle,
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                textAlign: 'left',
                              }}
                            >
                              {task.title || 'Untitled Task'}
                            </button>
                          </div>

                          {(task.due_date ||
                            (task.assignees && task.assignees.length > 0)) && (
                            <div style={styles.taskMeta}>
                              {firstAssignee && (
                                <>
                                  <div
                                    style={{
                                      ...styles.miniAvatar,
                                      background: assigneeColor,
                                    }}
                                    title={primaryName}
                                  >
                                    {assigneeInitials}
                                  </div>
                                  <span
                                    title={assigneeListTitle}
                                    style={{
                                      fontSize: '11.5px',
                                      color: TEAL,
                                      fontFamily: FONT,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: 180,
                                      lineHeight: '18px',
                                    }}
                                  >
                                    {primaryName}
                                    {task.assignees.length > 1 &&
                                      ` +${task.assignees.length - 1}`}
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {(task.labels?.length > 0 ||
                            task.priority ||
                            task.description) && (
                            <div style={{ marginBottom: 5 }}>
                              {task.labels?.slice(0, 2).map((label: any) => (
                                <div
                                  key={
                                    label.id == null
                                      ? `label-${label.name}`
                                      : `label-${label.id}`
                                  }
                                  style={{
                                    fontSize: '11.5px',
                                    color: '#555',
                                    lineHeight: '18px',
                                    fontFamily: FONT,
                                  }}
                                >
                                  Label: {label.name}
                                </div>
                              ))}
                              {task.priority && (
                                <div
                                  style={{
                                    fontSize: '11.5px',
                                    color: '#555',
                                    lineHeight: '18px',
                                    fontFamily: FONT,
                                  }}
                                >
                                  Priority:{' '}
                                  {task.priority.charAt(0).toUpperCase() +
                                    task.priority.slice(1)}
                                </div>
                              )}
                              {task.due_date && (
                                <div style={styles.dueDate}>
                                  Due: {formatDateForTable(task.due_date)}
                                </div>
                              )}
                            </div>
                          )}

                          <div
                            style={{
                              ...styles.taskFooter,
                              borderTop: 'none',
                              paddingTop: 4,
                              marginTop: 0,
                            }}
                          >
                            <div style={styles.taskIcons}>
                              <BoardActBtn
                                actBtnBase={styles.actBtn}
                                icon={<FileText size={13} />}
                                title="View record"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleTaskClick(task);
                                }}
                              />
                              <BoardActBtn
                                actBtnBase={styles.actBtn}
                                icon={<MapPin size={13} />}
                                title="Pin"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              />
                              <BoardActBtn
                                actBtnBase={styles.actBtn}
                                icon={<Mail size={13} />}
                                title="Send email"
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              />
                              <BoardActBtn
                                actBtnBase={styles.actBtn}
                                icon={<ExternalLink size={13} />}
                                title="Open record"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleTaskClick(task);
                                }}
                              />
                            </div>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>
              )}
            </div>
          );
        })}
        </div>
      </div>

      <CreateTaskSidebar
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        onCreate={handleTaskUpdate}
        extensions={hierarchyDataExtensions as any}
        labels={labels}
        statuses={statuses.map((status: any) => ({
          id: status.id,
          name: status.name,
          icon: '',
          color: status.color || '',
          is_default:
            status.is_default === true || status.is_deefault === true,
        }))}
        project={
          selectedProject
            ? {
                id: selectedProject.id,
                name: selectedProject.name,
                icon: '',
                color: selectedProject.color || '#3b82f6',
                statuses: selectedProject.statuses,
                labels: selectedProject.labels,
              }
            : undefined
        }
        task={selectedTask}
        isEdit
        taskTypeChoices={['regular', 'recurring']}
        lockProjectSelection
      />
    </>
  );
};

export default BoardView;
