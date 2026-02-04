import React, { useState } from 'react';
import {
  Row,
  Col,
  Button,
  Form,
  Badge,
  Nav,
  Offcanvas,
  Modal,
  Spinner
} from 'react-bootstrap';
import { Edit, Trash2, Plus, Calendar, Send } from 'lucide-react';
import {
  getTaskActivities,
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment
} from '@utils/tasks';

export interface TaskDetailTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  dueDate?: string;
  description?: string;
  rawData?: any;
}

export interface TaskDetailOffcanvasProps {
  show: boolean;
  onHide: () => void;
  selectedTask: TaskDetailTask | null;
  taskActivities: any[];
  loadingActivities: boolean;
  activeDetailTab: 'activity' | 'comments';
  setActiveDetailTab: (tab: 'activity' | 'comments') => void;
  taskComments: any[];
  setTaskComments: (comments: any[]) => void;
  loadingComments: boolean;
  setLoadingComments: (loading: boolean) => void;
  newComment: string;
  setNewComment: (value: string) => void;
  submittingComment: boolean;
  setSubmittingComment: (value: boolean) => void;
  editingCommentId: number | null;
  setEditingCommentId: (id: number | null) => void;
  editingCommentText: string;
  setEditingCommentText: (value: string) => void;
  onEditTask: () => void;
  onOpenDeleteModal: () => void;
  hierarchyDataExtensions?: any;
  getStatusVariant: (status: string) => string;
  getPriorityVariant: (priority: string) => string;
}

const TaskDetailOffcanvas: React.FC<TaskDetailOffcanvasProps> = ({
  show,
  onHide,
  selectedTask,
  taskActivities,
  loadingActivities,
  activeDetailTab,
  setActiveDetailTab,
  taskComments,
  setTaskComments,
  loadingComments,
  setLoadingComments,
  newComment,
  setNewComment,
  submittingComment,
  setSubmittingComment,
  editingCommentId,
  setEditingCommentId,
  editingCommentText,
  setEditingCommentText,
  onEditTask,
  onOpenDeleteModal,
  hierarchyDataExtensions,
  getStatusVariant,
  getPriorityVariant
}) => {
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);

  const handleViewAllActivities = async () => {
    if (!selectedTask?.rawData?.id) return;
    try {
      setLoadingAllActivities(true);
      setShowAllActivitiesModal(true);
      const activitiesResponse = await getTaskActivities(selectedTask.rawData.id, 1, 100);
      if (activitiesResponse) {
        setAllActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
      } else {
        setAllActivities([]);
      }
    } catch (error) {
      console.error('Error fetching all activities:', error);
      setAllActivities([]);
    } finally {
      setLoadingAllActivities(false);
    }
  };

  const handleCommentsTabClick = async () => {
    setActiveDetailTab('comments');
    if (selectedTask?.rawData?.id && taskComments.length === 0) {
      try {
        setLoadingComments(true);
        const commentsResponse = await getTaskComments(selectedTask.rawData.id);
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
  };

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

  const getExtensionDisplay = (extNumber: string) => {
    if (!hierarchyDataExtensions || !extNumber) {
      return { name: extNumber, initials: (extNumber || 'UN').toUpperCase().slice(0, 2) };
    }
    const extension = (hierarchyDataExtensions as any[]).find(
      (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
    );
    const name = extension?.name || extNumber;
    const initials =
      name !== extNumber
        ? name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
        : (extNumber || 'UN').toUpperCase().slice(0, 2);
    return { name, initials };
  };

  const renderActivityList = (activities: any[], avatarSize = '32px', fontSize = '0.7rem') =>
    activities.map((activity: any, idx: number) => {
      const extNumber = activity.extension_number || '';
      const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(extNumber);
      const activityDate = formatActivityDate(activity.created_at || '');
      const actionText = activity.description || activity.action || 'Activity';

      return (
        <div
          key={activity.id || idx}
          className="activity-item"
          style={{
            marginBottom: avatarSize === '32px' ? '1rem' : 0,
            display: 'flex',
            gap: '12px',
            padding: avatarSize === '40px' ? '1rem 0' : 0,
            borderBottom:
              avatarSize === '40px' && idx < activities.length - 1
                ? '1px solid #e2e8f0'
                : 'none'
          }}
        >
          <div
            className="assignee-avatar"
            style={{
              width: avatarSize,
              height: avatarSize,
              fontSize,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
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
    });

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
        .assignee-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
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
        }
      `}</style>
      <Offcanvas
        show={show}
        onHide={onHide}
        placement="end"
        className="task-detail-panel"
      >
        <Offcanvas.Header closeButton className="task-detail-header d-flex align-items-center">
          <Offcanvas.Title className="d-flex align-items-center flex-grow-1 min-w-0 me-2">
            <span className="fw-bold">{selectedTask?.title} </span>
          </Offcanvas.Title>
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            <Button
              variant="link"
              className="text-primary p-0"
              onClick={onEditTask}
              title="Edit Task"
            >
              <Edit size={20} />
            </Button>
            <Button
              variant="link"
              className="text-danger p-0"
              onClick={onOpenDeleteModal}
              title="Delete Task"
            >
              <Trash2 size={20} />
            </Button>
          </div>
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
                    const { name, initials } = getExtensionDisplay(extNumber);
                    return (
                      <div key={idx} className="assignee-badge" title={name}>
                        {initials || 'UN'}
                      </div>
                    );
                  })}
                  <div className="add-assignee" onClick={onEditTask}>
                    <Plus size={16} />
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Watchers</div>
                <div className="assignee-group">
                  {(() => {
                    const watchers =
                      selectedTask.rawData?.watchers ??
                      selectedTask.rawData?.watcher_numbers?.map((extNum: string) => ({
                        extension_number: extNum
                      })) ??
                      [];
                    if (watchers.length === 0) {
                      return <span className="text-muted small">No watchers</span>;
                    }
                    return watchers.map((watcher: any, idx: number) => {
                      const extNumber = watcher.extension_number ?? watcher ?? '';
                      const { name, initials } = getExtensionDisplay(String(extNumber));
                      return (
                        <div key={idx} className="assignee-badge" title={name}>
                          {initials || '—'}
                        </div>
                      );
                    });
                  })()}
                  <div className="add-assignee" onClick={onEditTask} title="Edit watchers">
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
                <div
                  style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', margin: 0,overflowX: 'auto' }}
                  className="task-description-html"
                  dangerouslySetInnerHTML={{
                    __html:
                      (selectedTask.rawData?.description ?? selectedTask.description)?.trim() ||
                      '<span class="text-muted">No description provided</span>'
                  }}
                />
              </div>

              <Nav variant="tabs" className="detail-tabs">
                <Nav.Item>
                  <Nav.Link active={activeDetailTab === 'activity'} onClick={() => setActiveDetailTab('activity')}>
                    Recent Activity
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link active={activeDetailTab === 'comments'} onClick={handleCommentsTabClick}>
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
                    renderActivityList(taskActivities)
                  )}
                  {taskActivities.length > 0 && (
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleViewAllActivities}
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
                      <div style={{ marginBottom: '1rem' }}>
                        {taskComments.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                            No comments yet
                          </div>
                        ) : (
                          taskComments.map((comment: any, idx: number) => {
                            const extNumber = comment.extension_number || comment.user?.extension_number || '';
                            const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(extNumber);
                            const commentDate = formatActivityDate(comment.created_at || '');
                            const isEditing = editingCommentId === comment.id;

                            return (
                              <div
                                key={comment.id || idx}
                                style={{
                                  marginBottom: '1rem',
                                  padding: '0.75rem',
                                  backgroundColor: '#f8fafc',
                                  borderRadius: '6px'
                                }}
                              >
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
                                              await updateTaskComment(
                                                selectedTask.rawData.id,
                                                comment.id,
                                                editingCommentText.trim()
                                              );
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
                                      <div
                                        className="assignee-avatar"
                                        style={{
                                          width: '32px',
                                          height: '32px',
                                          fontSize: '0.7rem',
                                          flexShrink: 0
                                        }}
                                      >
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
                                            if (selectedTask?.rawData?.id) {
                                              try {
                                                await deleteTaskComment(selectedTask.rawData.id, comment.id);
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
                                    <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6' }}>
                                      {comment.comment}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div
                        style={{
                          borderTop: '1px solid #e2e8f0',
                          paddingTop: '1rem',
                          marginTop: '1rem'
                        }}
                      >
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
            renderActivityList(allActivities, '40px', '0.8rem')
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAllActivitiesModal(false);
              setAllActivities([]);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TaskDetailOffcanvas;
