import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { Edit, Trash2, Plus, Calendar, Send, Upload, FileText, Download } from 'lucide-react';
import {
  getTaskActivities,
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  getTaskDocumentDownload,
  getTaskDocuments,
  postTaskDocuments,
  deleteTaskDocument
} from '@utils/tasks';

/** API-shaped task payload attached to the display model */
export interface TaskDetailRawData {
  id?: string | number;
  description?: string;
  assignees?: TaskDetailAssignee[];
  watchers?: TaskDetailWatcher[];
  watcher_numbers?: string[];
}

export interface TaskDetailTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  dueDate?: string;
  description?: string;
  rawData?: TaskDetailRawData;
}

interface HierarchyExtension {
  id?: string;
  extension_number?: string;
  name?: string;
}

interface TaskDetailAssignee {
  id?: string | number;
  extension_number?: string;
}

interface TaskDetailWatcher {
  extension_number?: string;
}

export interface TaskActivityItem {
  id?: string | number;
  extension_number?: string;
  created_at?: string;
  description?: string;
  action?: string;
}

export interface TaskCommentItem {
  id: number;
  extension_number?: string;
  user?: { extension_number?: string };
  created_at?: string;
  comment?: string;
}

export interface TaskDocumentItem {
  id?: string | number;
  original_name?: string;
  name?: string;
  file_name?: string;
}

export interface TaskDetailOffcanvasProps {
  show: boolean;
  onHide: () => void;
  selectedTask: TaskDetailTask | null;
  taskActivities: TaskActivityItem[];
  loadingActivities: boolean;
  activeDetailTab: 'activity' | 'comments' | 'documents';
  setActiveDetailTab: (tab: 'activity' | 'comments' | 'documents') => void;
  taskComments: TaskCommentItem[];
  setTaskComments: (comments: TaskCommentItem[]) => void;
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
  hierarchyDataExtensions?: HierarchyExtension[];
  getStatusVariant: (status: string) => string;
  getPriorityVariant: (priority: string) => string;
}

function normalizeTaskCommentsResponse(response: unknown): TaskCommentItem[] {
  if (Array.isArray(response)) {
    return response as TaskCommentItem[];
  }
  if (
    response !== null &&
    typeof response === 'object' &&
    'data' in response &&
    Array.isArray((response as { data: unknown }).data)
  ) {
    return (response as { data: TaskCommentItem[] }).data;
  }
  return [];
}

function getDocumentLabel(doc: TaskDocumentItem, fallbackIndex: number): string {
  return doc.original_name || doc.name || doc.file_name || `Document ${fallbackIndex + 1}`;
}

function formatActivityDate(dateString: string): string {
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
}

function getExtensionDisplay(
  extNumber: string,
  hierarchyDataExtensions: HierarchyExtension[] | undefined
): { name: string; initials: string } {
  if (!hierarchyDataExtensions || !extNumber) {
    return { name: extNumber, initials: (extNumber || 'UN').toUpperCase().slice(0, 2) };
  }
  const extension = hierarchyDataExtensions.find(
    (ext) => ext.id === extNumber || ext.extension_number === extNumber
  );
  const name = extension?.name || extNumber;
  const initials =
    name === extNumber
      ? (extNumber || 'UN').toUpperCase().slice(0, 2)
      : name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
  return { name, initials };
}

function resolveWatchers(raw: TaskDetailRawData | undefined): TaskDetailWatcher[] {
  if (raw?.watchers?.length) {
    return raw.watchers;
  }
  if (raw?.watcher_numbers?.length) {
    return raw.watcher_numbers.map((extNum) => ({ extension_number: extNum }));
  }
  return [];
}

function assigneeKey(assignee: TaskDetailAssignee, index: number): string {
  if (assignee.id !== undefined && assignee.id !== '') {
    return `assignee-id-${String(assignee.id)}`;
  }
  if (assignee.extension_number) {
    return `assignee-ext-${assignee.extension_number}`;
  }
  return `assignee-fallback-${index}`;
}

function watcherKey(watcher: TaskDetailWatcher, index: number): string {
  const ext = watcher.extension_number ?? '';
  if (ext) {
    return `watcher-${ext}`;
  }
  return `watcher-fallback-${index}`;
}

interface ActivityListProps {
  activities: TaskActivityItem[];
  avatarSize?: string;
  fontSize?: string;
  hierarchyDataExtensions: HierarchyExtension[] | undefined;
}

const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  avatarSize = '32px',
  fontSize = '0.7rem',
  hierarchyDataExtensions
}) =>
  activities.map((activity, idx) => {
    const extNumber = activity.extension_number || '';
    const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(
      extNumber,
      hierarchyDataExtensions
    );
    const activityDate = formatActivityDate(activity.created_at || '');
    const actionText = activity.description || activity.action || 'Activity';
    const isLargeAvatar = avatarSize === '40px';

    return (
      <div
        key={activity.id ?? `activity-${idx}`}
        className="activity-item"
        style={{
          marginBottom: avatarSize === '32px' ? '1rem' : 0,
          display: 'flex',
          gap: '12px',
          padding: isLargeAvatar ? '1rem 0' : 0,
          borderBottom:
            isLargeAvatar && idx < activities.length - 1 ? '1px solid #e2e8f0' : 'none'
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

interface ActivityTabPanelProps {
  loadingActivities: boolean;
  taskActivities: TaskActivityItem[];
  hierarchyDataExtensions: HierarchyExtension[] | undefined;
  onViewAll: () => void;
}

const ActivityTabPanel: React.FC<ActivityTabPanelProps> = ({
  loadingActivities,
  taskActivities,
  hierarchyDataExtensions,
  onViewAll
}) => {
  let activityContent: React.ReactNode;
  if (loadingActivities) {
    activityContent = (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner animation="border" size="sm" />
      </div>
    );
  } else if (taskActivities.length === 0) {
    activityContent = (
      <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
        No activities found
      </div>
    );
  } else {
    activityContent = (
      <ActivityList activities={taskActivities} hierarchyDataExtensions={hierarchyDataExtensions} />
    );
  }

  return (
    <div className="activity-section">
      {activityContent}
      {taskActivities.length > 0 && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Button
            variant="link"
            size="sm"
            onClick={onViewAll}
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
  );
};

interface CommentsTabPanelProps {
  loadingComments: boolean;
  taskComments: TaskCommentItem[];
  hierarchyDataExtensions: HierarchyExtension[] | undefined;
  editingCommentId: number | null;
  editingCommentText: string;
  setEditingCommentText: (value: string) => void;
  setEditingCommentId: (id: number | null) => void;
  submittingComment: boolean;
  setSubmittingComment: (value: boolean) => void;
  newComment: string;
  setNewComment: (value: string) => void;
  taskId: string | number | undefined;
  setTaskComments: (comments: TaskCommentItem[]) => void;
}

const CommentsTabPanel: React.FC<CommentsTabPanelProps> = ({
  loadingComments,
  taskComments,
  hierarchyDataExtensions,
  editingCommentId,
  editingCommentText,
  setEditingCommentText,
  setEditingCommentId,
  submittingComment,
  setSubmittingComment,
  newComment,
  setNewComment,
  taskId,
  setTaskComments
}) => {
  const refreshComments = useCallback(async () => {
    if (taskId === undefined) return;
    const commentsResponse = await getTaskComments(taskId);
    setTaskComments(normalizeTaskCommentsResponse(commentsResponse));
  }, [taskId, setTaskComments]);

  const handleSaveComment = useCallback(
    async (commentId: number) => {
      if (taskId === undefined || !editingCommentText.trim()) {
        return;
      }
      try {
        setSubmittingComment(true);
        await updateTaskComment(taskId, commentId, editingCommentText.trim());
        await refreshComments();
        setEditingCommentId(null);
        setEditingCommentText('');
      } catch (error) {
        console.error('Error updating comment:', error);
      } finally {
        setSubmittingComment(false);
      }
    },
    [
      taskId,
      editingCommentText,
      refreshComments,
      setEditingCommentId,
      setEditingCommentText,
      setSubmittingComment
    ]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      if (taskId === undefined) return;
      try {
        await deleteTaskComment(taskId, commentId);
        await refreshComments();
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    },
    [taskId, refreshComments]
  );

  const handlePostComment = useCallback(async () => {
    if (taskId === undefined || !newComment.trim()) return;
    try {
      setSubmittingComment(true);
      await createTaskComment(taskId, newComment.trim());
      setNewComment('');
      try {
        await refreshComments();
      } catch (refreshError) {
        console.error('Error refreshing comments:', refreshError);
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  }, [taskId, newComment, refreshComments, setNewComment, setSubmittingComment]);

  if (loadingComments) {
    return (
      <div className="activity-section">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner animation="border" size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="activity-section">
      <div style={{ marginBottom: '1rem' }}>
        {taskComments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
            No comments yet
          </div>
        ) : (
          taskComments.map((comment, idx) => {
            const extNumber = comment.extension_number || comment.user?.extension_number || '';
            const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(
              extNumber,
              hierarchyDataExtensions
            );
            const commentDate = formatActivityDate(comment.created_at || '');
            const isEditing = editingCommentId === comment.id;

            return (
              <div
                key={comment.id ?? `comment-${idx}`}
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
                        onClick={() => handleSaveComment(comment.id)}
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
                          onClick={() => handleDeleteComment(comment.id)}
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
              onClick={handlePostComment}
              disabled={submittingComment || !newComment.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Send size={14} />
              Post Comment
            </Button>
          </div>
        </Form.Group>
      </div>
    </div>
  );
};

interface DocumentsTabPanelProps {
  loadingDocuments: boolean;
  uploadingDocument: boolean;
  taskDocuments: TaskDocumentItem[];
  documentInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPickFile: () => void;
  onDownload: (doc: TaskDocumentItem) => void;
  onDelete: (doc: TaskDocumentItem) => void;
}

const DocumentsTabPanel: React.FC<DocumentsTabPanelProps> = ({
  loadingDocuments,
  uploadingDocument,
  taskDocuments,
  documentInputRef,
  onUploadChange,
  onPickFile,
  onDownload,
  onDelete
}) => {
  const documentCountLabel =
    taskDocuments.length === 1 ? '1 document' : `${taskDocuments.length} documents`;

  if (loadingDocuments) {
    return (
      <div className="activity-section">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner animation="border" size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="activity-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{documentCountLabel}</span>
        <div className="d-flex align-items-center gap-2">
          <input
            ref={documentInputRef}
            type="file"
            accept="*/*"
            multiple
            style={{ display: 'none' }}
            onChange={onUploadChange}
            disabled={uploadingDocument}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={uploadingDocument}
            onClick={onPickFile}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {uploadingDocument ? (
              <Spinner animation="border" size="sm" style={{ width: '14px', height: '14px' }} />
            ) : (
              <Upload size={14} />
            )}
            Upload
          </Button>
        </div>
      </div>
      {taskDocuments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
          No documents yet. Upload a file to attach it to this task.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {taskDocuments.map((doc, idx) => {
            const label = getDocumentLabel(doc, idx);
            return (
              <li
                key={doc.id ?? `doc-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                  <FileText size={18} className="text-muted" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => onDownload(doc)}
                    title="Download"
                    style={{ minWidth: 'auto', padding: '0.25rem' }}
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0"
                    onClick={() => onDelete(doc)}
                    title="Delete"
                    style={{ minWidth: 'auto', padding: '0.25rem', color: '#dc3545' }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

interface AllActivitiesModalBodyProps {
  loadingAllActivities: boolean;
  allActivities: TaskActivityItem[];
  hierarchyDataExtensions: HierarchyExtension[] | undefined;
}

const AllActivitiesModalBody: React.FC<AllActivitiesModalBodyProps> = ({
  loadingAllActivities,
  allActivities,
  hierarchyDataExtensions
}) => {
  if (loadingAllActivities) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <Spinner animation="border" />
      </div>
    );
  }
  if (allActivities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No activities found</div>
    );
  }
  return (
    <ActivityList
      activities={allActivities}
      avatarSize="40px"
      fontSize="0.8rem"
      hierarchyDataExtensions={hierarchyDataExtensions}
    />
  );
};

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
  const [allActivities, setAllActivities] = useState<TaskActivityItem[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const [taskDocuments, setTaskDocuments] = useState<TaskDocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const closeAllActivitiesModal = useCallback(() => {
    setShowAllActivitiesModal(false);
    setAllActivities([]);
  }, []);

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
        setTaskComments(normalizeTaskCommentsResponse(commentsResponse));
      } catch (error) {
        console.error('Error fetching comments:', error);
        setTaskComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const fetchTaskDocuments = useCallback(async () => {
    if (!selectedTask?.rawData?.id) return;
    try {
      setLoadingDocuments(true);
      const data = await getTaskDocuments(selectedTask.rawData.id);
      setTaskDocuments(Array.isArray(data) ? data : data?.data ?? []);
    } catch (error) {
      console.error('Error fetching task documents:', error);
      setTaskDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [selectedTask?.rawData?.id]);

  const handleDocumentsTabClick = async () => {
    setActiveDetailTab('documents');
    if (selectedTask?.rawData?.id) {
      await fetchTaskDocuments();
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !selectedTask?.rawData?.id) return;
    try {
      setUploadingDocument(true);
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('documents[]', file);
      }
      await postTaskDocuments(selectedTask.rawData.id, formData);
      await fetchTaskDocuments();
      if (documentInputRef.current) documentInputRef.current.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (doc: TaskDocumentItem) => {
    if (!selectedTask?.rawData?.id || doc.id === undefined || doc.id === '') return;
    try {
      const blob = await getTaskDocumentDownload(selectedTask.rawData.id, doc.id);
      if (!blob) return;
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_name || doc.name || doc.file_name || 'document';
      a.click();
      globalThis.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleDeleteDocument = async (doc: TaskDocumentItem) => {
    if (!selectedTask?.rawData?.id || doc.id === undefined || doc.id === '') return;
    try {
      await deleteTaskDocument(selectedTask.rawData.id, doc.id);
      await fetchTaskDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const watchersList = useMemo(() => resolveWatchers(selectedTask?.rawData), [selectedTask?.rawData]);

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
      <Offcanvas show={show} onHide={onHide} placement="end" className="task-detail-panel">
        <Offcanvas.Header closeButton className="task-detail-header d-flex align-items-center">
          <Offcanvas.Title className="d-flex align-items-center flex-grow-1 min-w-0 me-2">
            <span className="fw-bold">{selectedTask?.title} </span>
          </Offcanvas.Title>
          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            <Button variant="link" className="text-primary p-0" onClick={onEditTask} title="Edit Task">
              <Edit size={20} />
            </Button>
            <Button variant="link" className="text-danger p-0" onClick={onOpenDeleteModal} title="Delete Task">
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
                  {selectedTask.rawData?.assignees?.map((assignee, idx) => {
                    const extNumber = assignee.extension_number || '';
                    const { name, initials } = getExtensionDisplay(extNumber, hierarchyDataExtensions);
                    return (
                      <div key={assigneeKey(assignee, idx)} className="assignee-badge" title={name}>
                        {initials || 'UN'}
                      </div>
                    );
                  })}
                  <button type="button" className="add-assignee border-0" onClick={onEditTask} aria-label="Edit assignees">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Watchers</div>
                <div className="assignee-group">
                  {watchersList.length === 0 ? (
                    <span className="text-muted small">No watchers</span>
                  ) : (
                    watchersList.map((watcher, idx) => {
                      const extNumber = watcher.extension_number ?? '';
                      const { name, initials } = getExtensionDisplay(String(extNumber), hierarchyDataExtensions);
                      return (
                        <div key={watcherKey(watcher, idx)} className="assignee-badge" title={name}>
                          {initials || '—'}
                        </div>
                      );
                    })
                  )}
                  <button
                    type="button"
                    className="add-assignee border-0"
                    onClick={onEditTask}
                    aria-label="Edit watchers"
                    title="Edit watchers"
                  >
                    <Plus size={16} />
                  </button>
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
                  style={{
                    fontSize: '0.875rem',
                    color: '#475569',
                    lineHeight: '1.6',
                    margin: 0,
                    overflowX: 'auto'
                  }}
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
                  <Nav.Link
                    className="p-2"
                    active={activeDetailTab === 'activity'}
                    onClick={() => setActiveDetailTab('activity')}
                  >
                    Recent Activity
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link className="p-2" active={activeDetailTab === 'comments'} onClick={handleCommentsTabClick}>
                    Comments {taskComments.length > 0 && `(${taskComments.length})`}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link className="p-2" active={activeDetailTab === 'documents'} onClick={handleDocumentsTabClick}>
                    Documents
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {activeDetailTab === 'activity' && (
                <ActivityTabPanel
                  loadingActivities={loadingActivities}
                  taskActivities={taskActivities}
                  hierarchyDataExtensions={hierarchyDataExtensions}
                  onViewAll={handleViewAllActivities}
                />
              )}

              {activeDetailTab === 'comments' && (
                <CommentsTabPanel
                  loadingComments={loadingComments}
                  taskComments={taskComments}
                  hierarchyDataExtensions={hierarchyDataExtensions}
                  editingCommentId={editingCommentId}
                  editingCommentText={editingCommentText}
                  setEditingCommentText={setEditingCommentText}
                  setEditingCommentId={setEditingCommentId}
                  submittingComment={submittingComment}
                  setSubmittingComment={setSubmittingComment}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  taskId={selectedTask.rawData?.id}
                  setTaskComments={setTaskComments}
                />
              )}

              {activeDetailTab === 'documents' && (
                <DocumentsTabPanel
                  loadingDocuments={loadingDocuments}
                  uploadingDocument={uploadingDocument}
                  taskDocuments={taskDocuments}
                  documentInputRef={documentInputRef}
                  onUploadChange={handleUploadDocument}
                  onPickFile={() => documentInputRef.current?.click()}
                  onDownload={handleDownloadDocument}
                  onDelete={handleDeleteDocument}
                />
              )}
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      <Modal show={showAllActivitiesModal} onHide={closeAllActivitiesModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>All Activities</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <AllActivitiesModalBody
            loadingAllActivities={loadingAllActivities}
            allActivities={allActivities}
            hierarchyDataExtensions={hierarchyDataExtensions}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAllActivitiesModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TaskDetailOffcanvas;
