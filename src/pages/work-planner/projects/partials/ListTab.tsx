import React, { useState } from 'react';
import { Spinner, Row, Col, Offcanvas, Badge, Nav, Button } from 'react-bootstrap';
import { FileText, Calendar, CheckCircle2, AlertCircle, Clock, Edit, Trash2, Plus } from 'lucide-react';
import StatsCard from '@components/work-planner/stats-cards';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import { deleteTask, getTask } from '@utils/tasks';

interface ListTabProps {
  tasksList: any[];
  loading: boolean;
  listSummary: any;
  styles: any;
  selectedProject?: any;
  extensions?: any[];
  labels?: any[];
  statuses?: any[];
  onRefresh?: () => void;
}

const ListTab: React.FC<ListTabProps> = ({ 
  tasksList, 
  loading, 
  listSummary, 
  styles,
  selectedProject,
  extensions = [],
  labels = [],
  statuses = [],
  onRefresh
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);
  
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return { bg: '#FEE2E2', color: '#991B1B' };
      case 'medium':
      case 'normal':
        return { bg: '#FEF3C7', color: '#92400E' };
      case 'low':
        return { bg: '#E0E7FF', color: '#3730A3' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280' };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleTaskClick = async (task: any) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    
    // Fetch full task data using getTask API with relations
    if (task.id) {
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
          'children.assignees',
          'project',
          'status',
          'assignees',
          'labels',
          'comments'
        ];
        const taskData = await getTask(task.id, withRelations);
        if (taskData) {
          setSelectedTask(taskData);
        }
      } catch (error) {
        console.error('Error fetching task details:', error);
      } finally {
        setLoadingTaskDetail(false);
      }
    }
  };

  const handleEdit = (task: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedTask(task);
    setShowTaskDetail(false);
    setShowEditModal(true);
  };

  const handleDelete = (task: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedTask(task);
    setShowDeleteModal(true);
  };

  const handleEditFromDetail = () => {
    if (!selectedTask) return;
    setShowTaskDetail(false);
    setShowEditModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedTask?.id) return;
    
    try {
      setDeleting(true);
      await deleteTask(selectedTask.id);
      setShowDeleteModal(false);
      setSelectedTask(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleTaskUpdate = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  const getStatusVariant = (status: string | any) => {
    if (typeof status === 'object' && status?.name) {
      status = status.name;
    }
    switch (status?.toLowerCase()) {
      case 'to do':
      case 'todo':
        return 'info';
      case 'in progress':
        return 'warning';
      case 'in review':
        return 'secondary';
      case 'overdue':
        return 'danger';
      case 'completed':
      case 'done':
        return 'success';
      default:
        return 'primary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'medium':
      case 'normal':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  // Helper function to get user name from extension number
  const getUserNameFromExtension = (extensionNumber: string): string => {
    if (!extensionNumber || !extensions || extensions.length === 0) {
      return extensionNumber || 'Unknown';
    }
    
    const extension = extensions.find((ext: any) => 
      ext.extension_number === extensionNumber || 
      ext.id === extensionNumber ||
      String(ext.id) === String(extensionNumber)
    );
    
    return extension?.user?.name || extension?.name || extensionNumber || 'Unknown';
  };

  const getAssigneeInfo = (assignees: any[]) => {
    if (!assignees || assignees.length === 0) {
      return [];
    }
    
    return assignees.map((assignee: any) => {
      const extensionNumber = assignee.extension_number || '';
      const name = assignee.user?.name || assignee.name || getUserNameFromExtension(extensionNumber);
      const initials = name !== extensionNumber && name !== 'Unknown'
        ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : (extensionNumber || 'UN').substring(0, 2).toUpperCase();
      
      return {
        name: name,
        initials: initials,
        extension_number: extensionNumber
      };
    });
  };

  // Prepare summary cards data
  const summaryCards = listSummary ? [
    {
      title: 'Total',
      value: listSummary.total || 0,
      icon: FileText,
      iconColor: '#4680FF',
      iconBgColor: '#E3F2FD'
    },
    {
      title: 'Open',
      value: listSummary.open || 0,
      icon: FileText,
      iconColor: '#4680FF',
      iconBgColor: '#E3F2FD'
    },
    {
      title: 'Overdue',
      value: listSummary.overdue || 0,
      icon: AlertCircle,
      iconColor: '#DC2626',
      iconBgColor: '#FFEBEE'
    },
    {
      title: 'Due This Week',
      value: listSummary.dueThisWeek || 0,
      icon: Clock,
      iconColor: '#FFB64D',
      iconBgColor: '#FFF3E0'
    },
    {
      title: 'Completed',
      value: listSummary.completed || 0,
      icon: CheckCircle2,
      iconColor: '#2CA87F',
      iconBgColor: '#E8F5E9'
    }
  ] : [];

  return (
    <>
      {/* Summary Cards */}
      {listSummary && (
        <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
          {summaryCards.map((card, index) => (
            <Col xs={12} sm={6} lg key={index} className="d-flex">
              <StatsCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                iconColor={card.iconColor}
                iconBgColor={card.iconBgColor}
                valueColor="#1F2937"
              />
            </Col>
          ))}
        </Row>
      )}

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>Tasks List</h5>
        </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spinner animation="border" />
        </div>
      ) : tasksList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No tasks found</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Tasks will appear here once they are created</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Task ID</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Assignees</th>
                <th style={styles.th}>Labels</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Progress</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasksList.map((task: any) => {
                const priorityColors = getPriorityColor(task.priority);

                return (
                  <tr 
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    style={{ cursor: 'pointer' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={styles.td}>
                      <span style={{ color: '#4680FF', fontWeight: '600' }}>
                        {task.task_id || `#${task.id}`}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <strong style={{ color: '#1F2937' }}>{task.title}</strong>
                        {task.description && (
                          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                            {task.description.replace(/<[^>]*>/g, '').substring(0, 50)}
                            {task.description.replace(/<[^>]*>/g, '').length > 50 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {task.status ? (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: task.status.color ? `${task.status.color}20` : '#E5E9F2',
                          color: task.status.color || '#6B7280',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          {task.status.name}
                        </span>
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#F3F4F6',
                          color: '#6B7280',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'inline-block'
                        }}>
                          No Status
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: priorityColors.bg,
                        color: priorityColors.color,
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'inline-block',
                        textTransform: 'capitalize'
                      }}>
                        {task.priority || 'Normal'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {task.assignees && task.assignees.length > 0 ? (
                          task.assignees.map((assignee: any, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: '#DBEAFE',
                                color: '#1E40AF',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}
                            >
                              {getUserNameFromExtension(assignee.extension_number)}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {task.labels && task.labels.length > 0 ? (
                          task.labels.map((label: any, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                padding: '0.125rem 0.5rem',
                                backgroundColor: label.color || '#06b6d4',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}
                            >
                              {label.name}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>-</span>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {task.due_date ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} color="#6B7280" />
                          <span style={{ color: '#4B5563' }}>{formatDate(task.due_date)}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>-</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '60px', 
                          height: '8px', 
                          backgroundColor: '#E5E7EB', 
                          borderRadius: '4px', 
                          overflow: 'hidden' 
                        }}>
                          <div 
                            style={{ 
                              width: `${task.progress || 0}%`, 
                              height: '100%', 
                              backgroundColor: task.progress === 100 ? '#10B981' : '#3B82F6',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#4B5563', minWidth: '35px' }}>
                          {task.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(task);
                          }}
                          style={{
                            padding: '0.375rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6B7280'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#F3F4F6';
                            e.currentTarget.style.color = '#4680FF';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6B7280';
                          }}
                          title="Edit Task"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(task, e)}
                          style={{
                            padding: '0.375rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6B7280'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEE2E2';
                            e.currentTarget.style.color = '#DC2626';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6B7280';
                          }}
                          title="Delete Task"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setSelectedTask(null);
        }}
        onConfirm={confirmDelete}
        itemName={selectedTask?.title || `Task #${selectedTask?.task_id || selectedTask?.id}`}
        itemType="task"
        loading={deleting}
      />

      {/* Edit Task Modal */}
      <CreateTaskModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        onCreate={handleTaskUpdate}
        extensions={extensions}
        labels={labels}
        statuses={statuses}
        project={selectedProject}
        task={selectedTask}
        isEdit={true}
      />

      {/* Task Details Offcanvas */}
      <Offcanvas 
        show={showTaskDetail} 
        onHide={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }} 
        placement="end"
        style={{ width: '500px' }}
      >
        <Offcanvas.Header closeButton style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '2px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <Offcanvas.Title>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontWeight: '600' }}>
                {selectedTask?.task_id || `#${selectedTask?.id}`} {selectedTask?.title}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button 
                  variant="link" 
                  className="text-primary p-0" 
                  onClick={handleEditFromDetail}
                  title="Edit Task"
                >
                  <Edit size={20} />
                </Button>
                <Button 
                  variant="link" 
                  className="text-danger p-0" 
                  onClick={() => {
                    setShowTaskDetail(false);
                    setShowDeleteModal(true);
                  }}
                  title="Delete Task"
                >
                  <Trash2 size={20} />
                </Button>
              </div>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>
          {loadingTaskDetail ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner animation="border" />
            </div>
          ) : selectedTask ? (
            <>
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div style={{
                    marginBottom: '1.25rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginBottom: '0.625rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Status</div>
                    <Badge bg={getStatusVariant(selectedTask.status)} className="px-3 py-2 w-100" style={{ display: 'block', textAlign: 'center' }}>
                      {selectedTask.status?.name || selectedTask.status || 'No Status'}
                    </Badge>
                  </div>
                </Col>
                <Col xs={6}>
                  <div style={{
                    marginBottom: '1.25rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      marginBottom: '0.625rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Priority</div>
                    <Badge bg={getPriorityVariant(selectedTask.priority)} className="px-3 py-2 w-100" style={{ display: 'block', textAlign: 'center' }}>
                      {selectedTask.priority || 'Normal'}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <div style={{
                marginBottom: '1.25rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.625rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Assignees</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {getAssigneeInfo(selectedTask.assignees || []).map((assignee: any, idx: number) => (
                    <div 
                      key={idx} 
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}
                      title={assignee.name}
                    >
                      {assignee.initials}
                    </div>
                  ))}
                  {(!selectedTask.assignees || selectedTask.assignees.length === 0) && (
                    <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Unassigned</span>
                  )}
                </div>
              </div>

              <div style={{
                marginBottom: '1.25rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.625rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Due Date</div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: '500' }}>
                  <Calendar size={16} style={{ marginRight: '0.5rem', color: '#64748b' }} />
                  <span>{selectedTask.due_date ? formatDate(selectedTask.due_date) : 'No due date'}</span>
                </div>
              </div>

              {selectedTask.project && (
                <div style={{
                  marginBottom: '1.25rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    marginBottom: '0.625rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Project</div>
                  <Badge bg="light" text="dark" className="px-3 py-2" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    {selectedTask.project?.name || 'No Project'}
                  </Badge>
                </div>
              )}

              <div style={{
                marginBottom: '1.25rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.625rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Description</div>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {selectedTask.description ? selectedTask.description.replace(/<[^>]*>/g, '') : 'No description provided'}
                </p>
              </div>

              {selectedTask.labels && selectedTask.labels.length > 0 && (
                <div style={{
                  marginBottom: '1.25rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    marginBottom: '0.625rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Labels</div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {selectedTask.labels.map((label: any, idx: number) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.125rem 0.5rem',
                          backgroundColor: label.color || '#06b6d4',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '500'
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Nav variant="tabs" style={{
                borderBottom: '2px solid #e2e8f0',
                margin: '1.5rem -1.5rem 1.5rem -1.5rem',
                padding: '0 1.5rem'
              }}>
                <Nav.Item>
                  <Nav.Link active>Activity</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link>
                    Comments {selectedTask.comments && `(${selectedTask.comments.length || selectedTask.comments})`}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link>History</Nav.Link>
                </Nav.Item>
              </Nav>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                marginTop: '1rem'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>Recent Activity</div>
                
                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  selectedTask.comments.slice(0, 5).map((comment: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {comment.user?.name ? comment.user.name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                          <strong>{comment.user?.name || 'User'}</strong> commented
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {comment.created_at ? formatDate(comment.created_at) : 'Recently'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.875rem', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                    No activity yet
                  </div>
                )}
              </div>
            </>
          ) : null}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default ListTab;
