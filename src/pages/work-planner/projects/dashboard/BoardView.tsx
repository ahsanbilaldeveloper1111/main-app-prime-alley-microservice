import React, { useMemo, useState } from 'react';
import { 
  Search, Plus, MoreVertical, Calendar,
  X
} from 'lucide-react';
import { Offcanvas, Button, Badge, Row, Col, Nav } from 'react-bootstrap';
import { formatDateForTable } from '@utils/Helper';
import { updateTask } from '@utils/tasks';
import { toast } from 'react-toastify';

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
  const [activeDetailTab, setActiveDetailTab] = useState('activity');
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverStatus, setDragOverStatus] = useState<number | null>(null);

  const extensionNameByNumber = useMemo(() => {
    const map = new Map<string, string>();
    (hierarchyDataExtensions || []).forEach((ext: any) => {
      const extNumber = String(ext?.extension_number || ext?.id || '').trim();
      const name = String(ext?.user?.name || ext?.name || '').trim();
      if (extNumber && name) map.set(extNumber, name);
    });
    return map;
  }, [hierarchyDataExtensions]);

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

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    if (onTaskClick) {
      onTaskClick(task);
    }
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

  const styles = {
    card: {
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    filterRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #E5E9F2',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      fontFamily: 'inherit'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #E5E9F2',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      fontFamily: 'inherit',
      cursor: 'pointer',
      backgroundColor: 'white'
    },
    inputGroup: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center'
    },
    inputIcon: {
      position: 'absolute' as const,
      left: '0.75rem',
      pointerEvents: 'none' as const
    },
    inputWithIcon: {
      paddingLeft: '2.5rem'
    },
    buttonOutline: {
      padding: '0.625rem 1.25rem',
      backgroundColor: 'white',
      color: '#4680FF',
      border: '1px solid #4680FF',
      borderRadius: '6px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      transition: 'all 0.2s'
    },
    board: {
      display: 'flex',
      gap: '1rem',
      overflowX: 'auto' as const,
      paddingBottom: '1rem'
    },
    column: {
      minWidth: '280px',
      maxWidth: '300px',
      backgroundColor: '#E5E7EB',
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column' as const,
      height: 'fit-content'
    },
    columnHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    columnTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#1F2937'
    },
    columnCount: {
      fontSize: '0.85rem',
      color: '#6B7280',
      fontWeight: '500'
    },
    moreButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0.25rem',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6B7280',
      transition: 'background 0.2s'
    },
    addButton: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: 'white',
      border: '2px dashed #D1D5DB',
      borderRadius: '8px',
      color: '#4B5563',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginBottom: '0.75rem',
      transition: 'all 0.2s'
    },
    taskCard: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '1.125rem',
      marginBottom: '0.875rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      cursor: 'grab',
      transition: 'all 0.2s ease',
      border: '1px solid #f1f5f9',
      userSelect: 'none' as const
    },
    columnDropZone: {
      minHeight: '100px',
      transition: 'background-color 0.2s'
    },
    taskTitle: {
      fontSize: '0.925rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '0.875rem',
      lineHeight: '1.5',
      letterSpacing: '-0.01em'
    },
    taskMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap' as const,
      marginBottom: '0.875rem'
    },
    label: {
      padding: '0.3rem 0.75rem',
      borderRadius: '6px',
      fontSize: '0.725rem',
      fontWeight: '600',
      color: 'white',
      letterSpacing: '0.3px'
    },
    priority: {
      padding: '0.3rem 0.75rem',
      borderRadius: '6px',
      fontSize: '0.725rem',
      fontWeight: '600',
      letterSpacing: '0.3px'
    },
    taskFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '0.625rem',
      borderTop: '1px solid #f1f5f9'
    },
    taskIcons: {
      display: 'flex',
      gap: '0.875rem',
      alignItems: 'center'
    },
    dueDate: {
      fontSize: '0.75rem',
      color: '#DC2626',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    assignees: {
      display: 'flex',
      gap: '0.25rem',
      marginLeft: '-0.25rem'
    },
    avatar: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: '2px solid white',
      fontSize: '0.7rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e2e8f0',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      marginLeft: '-0.25rem'
    }
  };

  if (!selectedProject) {
    return (
      <div style={styles.card}>
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6B7280' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No project selected</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Please select a project to view the board</p>
        </div>
      </div>
    );
  }

  if (loadingBoardTasks) {
    return (
      <div style={styles.card}>
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

      {/* Filters */}
      <div style={styles.card}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <Search size={16} color="#6B7280" style={styles.inputIcon} />
            <input 
              type="text" 
              placeholder="Search tasks..."
              value={boardSearchTerm}
              onChange={(e) => setBoardSearchTerm(e.target.value)}
              style={{...styles.input, ...styles.inputWithIcon}}
              onFocus={(e) => e.target.style.borderColor = '#4680FF'}
              onBlur={(e) => e.target.style.borderColor = '#E5E9F2'}
            />
          </div>
          
          <select 
            style={styles.select}
            value={boardSelectedAssignee}
            onChange={(e) => setBoardSelectedAssignee(e.target.value)}
          >
            <option>All Assignees</option>
            {getAllBoardAssignees().map((assignee) => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
          
          <select 
            style={styles.select}
            value={boardSelectedPriority}
            onChange={(e) => setBoardSelectedPriority(e.target.value)}
          >
            <option>All Priorities</option>
            {getAllBoardPriorities().map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          
          <select 
            style={styles.select}
            value={boardSelectedLabel}
            onChange={(e) => setBoardSelectedLabel(e.target.value)}
          >
            <option>All Labels</option>
            {labels.map((label) => (
              <option key={label.id} value={label.name}>{label.name}</option>
            ))}
          </select>
          
          <button 
            style={{...styles.buttonOutline, justifyContent: 'center'}}
            onClick={onClearFilters}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={styles.board}>
        {statuses.map((status: any) => {
          const statusTasks = getTasksByStatus(status.id);
          return (
            <div 
              key={status.id} 
              style={{
                ...styles.column,
                borderTop: `3px solid ${status.color || '#6B7280'}`,
                backgroundColor: dragOverStatus === status.id ? '#F0F9FF' : '#E5E7EB',
                border: dragOverStatus === status.id ? '2px dashed #4680FF' : 'none'
              }}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              <div style={styles.columnHeader}>
                <div style={styles.columnTitle}>
                  {status.name}
                  <span style={styles.columnCount}>{statusTasks.length}</span>
                </div>
                <button 
                  style={styles.moreButton}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              <button 
                style={styles.addButton}
                onClick={() => onCreateTask(status.id)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
              >
                <Plus size={16} />
                Add Task
              </button>

              {statusTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF', fontSize: '0.875rem' }}>
                  No tasks
                </div>
              ) : (
                statusTasks.map((task: any) => {
                  return (
                    <div
                      key={task.id}
                      draggable
                      style={styles.taskCard}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleTaskClick(task)}
                      onMouseOver={(e) => {
                        if (draggedTask?.id !== task.id) {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.cursor = 'grab';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (draggedTask?.id !== task.id) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
                          e.currentTarget.style.borderColor = '#f1f5f9';
                          e.currentTarget.style.cursor = 'grab';
                        }
                      }}
                      onMouseDown={(e) => {
                        // Prevent text selection while dragging
                        if (e.button === 0) {
                          e.currentTarget.style.cursor = 'grabbing';
                        }
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.cursor = 'grab';
                      }}
                    >
                      <div style={styles.taskTitle}>{task.title || 'Untitled Task'}</div>

                      {(task.labels?.length > 0 || task.priority) && (
                        <div style={styles.taskMeta}>
                          {task.labels?.map((label: any, idx: number) => (
                            <span 
                              key={idx}
                              style={{...styles.label, backgroundColor: label.color || '#06b6d4'}}
                            >
                              {label.name}
                            </span>
                          ))}
                          {task.priority && (
                            <span 
                              style={{
                                ...styles.priority,
                                backgroundColor: getPriorityColor(task.priority).bg,
                                color: getPriorityColor(task.priority).text
                              }}
                            >
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          )}
                        </div>
                      )}

                      <div style={styles.taskFooter}>
                        <div style={styles.taskIcons}>
                          {task.due_date && (
                            <span style={styles.dueDate}>
                              <Calendar size={14} />
                              {formatDateForTable(task.due_date)}
                            </span>
                          )}
                        </div>

                        {task.assignees && task.assignees.length > 0 && (
                          <div style={styles.assignees}>
                            {task.assignees.slice(0, 3).map((assignee: any, idx: number) => {
                              const name = getAssigneeDisplayName(assignee);
                              const assigneeInitials = name !== '' 
                                ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                : 'UN';
                              return (
                                  <div key={idx} style={styles.avatar} title={name}>
                                    {assigneeInitials}
                                </div>
                              );
                            })}
                            {task.assignees.length > 3 && (
                              <div style={{...styles.avatar, backgroundColor: '#E5E7EB', color: '#6B7280'}}>
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Task Detail Sidebar */}
      <Offcanvas 
        show={showTaskDetail} 
        onHide={() => setShowTaskDetail(false)} 
        placement="end"
        className="task-detail-panel"
      >
        <Offcanvas.Header closeButton className="task-detail-header">
          <Offcanvas.Title>
            <div className="d-flex align-items-center justify-content-between w-100">
              <span className="fw-bold">{selectedTask?.task_id || `#${selectedTask?.id}`} {selectedTask?.title}</span>
              <Button variant="link" className="text-secondary p-0">
                <MoreVertical size={20} />
              </Button>
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
                    <Badge bg={getStatusVariant(selectedTask.status?.name || 'active')} className="px-3 py-2 w-100">
                      {selectedTask.status?.name || 'Active'}
                    </Badge>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Priority</div>
                    {selectedTask.priority ? (
                      <Badge bg={getPriorityVariant(selectedTask.priority)} className="px-3 py-2 w-100">
                        {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                      </Badge>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Not set</span>
                    )}
                  </div>
                </Col>
              </Row>

              <div className="detail-section">
                <div className="detail-label">Assignees</div>
                <div className="assignee-group">
                  {selectedTask.assignees && selectedTask.assignees.length > 0 ? (
                    selectedTask.assignees.map((assignee: any, idx: number) => {
                      const name = getAssigneeDisplayName(assignee);
                      const initials = name !== '' 
                        ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                        : 'UN';
                      return (
                        <div key={idx} className="assignee-badge" title={name}>
                          {initials}
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Unassigned</span>
                  )}
                </div>
              </div>

              {selectedTask.due_date && (
                <div className="detail-section">
                  <div className="detail-label">Due Date</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="#6B7280" />
                    <span>{formatDateForTable(selectedTask.due_date)}</span>
                  </div>
                </div>
              )}

              {selectedTask.description && (
                <div className="detail-section">
                  <div className="detail-label">Description</div>
                  <div 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#4B5563',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedTask.description }}
                  />
                </div>
              )}

              {selectedTask.labels && selectedTask.labels.length > 0 && (
                <div className="detail-section">
                  <div className="detail-label">Labels</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedTask.labels.map((label: any, idx: number) => (
                      <Badge 
                        key={idx}
                        style={{ 
                          backgroundColor: label.color || '#06b6d4',
                          color: 'white',
                          padding: '0.25rem 0.75rem'
                        }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Nav variant="tabs" className="mt-4" defaultActiveKey="activity">
                <Nav.Item>
                  <Nav.Link eventKey="activity" onClick={() => setActiveDetailTab('activity')}>
                    Activity
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="history" onClick={() => setActiveDetailTab('history')}>
                    History
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <div className="mt-3">
                {activeDetailTab === 'activity' && (
                  <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                    Activity feed will be displayed here
                  </div>
                )}
                {activeDetailTab === 'history' && (
                  <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                    History will be displayed here
                  </div>
                )}
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default BoardView;
