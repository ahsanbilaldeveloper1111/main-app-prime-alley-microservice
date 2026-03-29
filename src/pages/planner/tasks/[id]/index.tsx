import React, { useEffect, useState, useCallback, useMemo, useRef, ReactElement } from 'react';
import { useSession } from 'next-auth/react';
import {
  canManageProjectFromMembers,
  getSessionPhoneOrExtension,
} from '@planner/projectMemberRole';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import {
  Container,
  Card,
  Button,
  Spinner,
  Row,
  Col,
  Badge,
  Nav,
  Form,
  Modal,
} from 'react-bootstrap';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, Send, Upload, FileText, Download } from 'lucide-react';
import {
  getTask,
  deleteTask,
  getTaskActivities,
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment,
  getTaskDocuments,
  postTaskDocuments,
  getTaskDocumentDownload,
  deleteTaskDocument,
} from '@utils/tasks';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import { ModuleSlug } from '@utils/Helper';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';

const WITH_RELATIONS = [
  'project',
  'project.members',
  'status',
  'assignees',
  'labels',
  'comments',
  'parent',
  'parent.status',
  'parent.project',
  'children',
  'children.status',
  'children.assignees',
];

function getStatusVariant(status: string | { name?: string } | null | undefined) {
  const raw = typeof status === 'object' && status?.name ? status.name : (status ?? '');
  const s = String(raw).toLowerCase();
  if (s.includes('progress')) return 'warning';
  if (s.includes('review')) return 'secondary';
  if (s.includes('overdue')) return 'danger';
  if (s.includes('complete')) return 'success';
  return 'info';
}

function getPriorityVariant(priority: string) {
  const p = (priority || '').toLowerCase();
  if (p === 'urgent' || p === 'high') return 'danger';
  if (p === 'normal') return 'warning';
  return 'success';
}

function formatActivityDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

function getExtensionDisplay(extNumber: string, hierarchyDataExtensions: unknown) {
  if (!hierarchyDataExtensions || !extNumber) {
    return { name: extNumber, initials: (extNumber || 'UN').toUpperCase().slice(0, 2) };
  }
  const extension = (hierarchyDataExtensions as any[]).find(
    (ext: any) => ext.id === extNumber || ext.extension_number === extNumber,
  );
  const name = extension?.name || extNumber;
  if (name === extNumber) {
    return { name, initials: (extNumber || 'UN').toUpperCase().slice(0, 2) };
  }
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  return { name, initials };
}

type ActivityListProps = Readonly<{
  activities: any[];
  avatarSize?: string;
  fontSize?: string;
  hierarchyDataExtensions: unknown;
}>;

function ActivityList({
  activities,
  avatarSize = '32px',
  fontSize = '0.7rem',
  hierarchyDataExtensions,
}: ActivityListProps) {
  return (
    <>
      {activities.map((activity: any, idx: number) => {
        const extNumber = activity.extension_number || '';
        const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(
          extNumber,
          hierarchyDataExtensions,
        );
        const activityDate = formatActivityDate(activity.created_at || '');
        const actionText = activity.description || activity.action || 'Activity';
        return (
          <div
            key={activity.id ?? `activity-${idx}`}
            style={{
              marginBottom: avatarSize === '32px' ? '1rem' : 0,
              display: 'flex',
              gap: '12px',
              padding: avatarSize === '40px' ? '1rem 0' : 0,
              borderBottom:
                avatarSize === '40px' && idx < activities.length - 1 ? '1px solid #e2e8f0' : 'none',
            }}
          >
            <div
              style={{
                width: avatarSize,
                height: avatarSize,
                fontSize,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 600,
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
      })}
    </>
  );
}

type TaskActivityTabPanelProps = Readonly<{
  loadingActivities: boolean;
  taskActivities: any[];
  onViewAll: () => void;
  hierarchyDataExtensions: unknown;
}>;

function TaskActivityTabPanel({
  loadingActivities,
  taskActivities,
  onViewAll,
  hierarchyDataExtensions,
}: TaskActivityTabPanelProps) {
  if (loadingActivities) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }
  if (taskActivities.length === 0) {
    return <div className="text-center py-3 text-muted small">No activities found</div>;
  }
  return (
    <>
      <ActivityList activities={taskActivities} hierarchyDataExtensions={hierarchyDataExtensions} />
      <div className="text-center mt-3">
        <Button variant="link" size="sm" onClick={onViewAll} style={{ color: '#4e6fa5' }}>
          View All
        </Button>
      </div>
    </>
  );
}

type AllActivitiesModalBodyProps = Readonly<{
  loadingAllActivities: boolean;
  allActivities: any[];
  hierarchyDataExtensions: unknown;
}>;

function AllActivitiesModalBody({
  loadingAllActivities,
  allActivities,
  hierarchyDataExtensions,
}: AllActivitiesModalBodyProps) {
  if (loadingAllActivities) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
      </div>
    );
  }
  if (allActivities.length === 0) {
    return <div className="text-center py-4 text-muted">No activities found</div>;
  }
  return (
    <ActivityList
      activities={allActivities}
      avatarSize="40px"
      fontSize="0.8rem"
      hierarchyDataExtensions={hierarchyDataExtensions}
    />
  );
}

type TaskDocumentsTabPanelProps = Readonly<{
  loadingDocuments: boolean;
  taskDocuments: any[];
  uploadingDocument: boolean;
  documentInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  onDownload: (doc: any) => void;
  onDelete: (doc: any) => void;
}>;

function TaskDocumentsTabPanel({
  loadingDocuments,
  taskDocuments,
  uploadingDocument,
  documentInputRef,
  onUploadChange,
  onUploadClick,
  onDownload,
  onDelete,
}: TaskDocumentsTabPanelProps) {
  const documentCountLabel = taskDocuments.length === 1 ? 'document' : 'documents';

  if (loadingDocuments) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <span className="small text-muted">
          {taskDocuments.length} {documentCountLabel}
        </span>
        <input
          ref={documentInputRef}
          type="file"
          accept="*/*"
          multiple
          style={{ display: 'none' }}
          onChange={onUploadChange}
        />
        <Button variant="primary" size="sm" disabled={uploadingDocument} onClick={onUploadClick}>
          {uploadingDocument ? (
            <Spinner animation="border" size="sm" style={{ width: 14, height: 14 }} />
          ) : (
            <Upload size={14} className="me-1" />
          )}
          Upload
        </Button>
      </div>
      {taskDocuments.length === 0 ? (
        <div className="text-center py-4 text-muted small">
          No documents yet. Upload a file to attach it to this task.
        </div>
      ) : (
        <ul className="list-unstyled mb-0">
          {taskDocuments.map((doc: any, idx: number) => {
            const label = doc.original_name || doc.name || doc.file_name || `Document ${idx + 1}`;
            const rowKey =
              doc.id === undefined || doc.id === null ? `doc-${label}-${idx}` : String(doc.id);
            return (
              <li
                key={rowKey}
                className="d-flex align-items-center justify-content-between p-2 bg-light rounded mb-2"
              >
                <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                  <FileText size={18} className="text-muted flex-shrink-0" />
                  <span className="small text-truncate">{label}</span>
                </div>
                <div className="d-flex gap-1 flex-shrink-0">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-1"
                    onClick={() => onDownload(doc)}
                    title="Download"
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-1 text-danger"
                    onClick={() => onDelete(doc)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type TaskCommentsTabPanelProps = Readonly<{
  taskId: number | string | undefined;
  loadingComments: boolean;
  taskComments: any[];
  setTaskComments: React.Dispatch<React.SetStateAction<any[]>>;
  editingCommentId: number | null;
  setEditingCommentId: React.Dispatch<React.SetStateAction<number | null>>;
  editingCommentText: string;
  setEditingCommentText: React.Dispatch<React.SetStateAction<string>>;
  newComment: string;
  setNewComment: React.Dispatch<React.SetStateAction<string>>;
  submittingComment: boolean;
  setSubmittingComment: React.Dispatch<React.SetStateAction<boolean>>;
  hierarchyDataExtensions: unknown;
}>;

function TaskCommentsTabPanel({
  taskId,
  loadingComments,
  taskComments,
  setTaskComments,
  editingCommentId,
  setEditingCommentId,
  editingCommentText,
  setEditingCommentText,
  newComment,
  setNewComment,
  submittingComment,
  setSubmittingComment,
  hierarchyDataExtensions,
}: TaskCommentsTabPanelProps) {
  if (loadingComments) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  const refreshComments = async () => {
    if (!taskId) return;
    const res = await getTaskComments(taskId);
    setTaskComments(Array.isArray(res) ? res : []);
  };

  return (
    <>
      <div className="mb-3">
        {taskComments.length === 0 ? (
          <div className="text-center py-4 text-muted small">No comments yet</div>
        ) : (
          taskComments.map((comment: any, idx: number) => {
            const extNumber = comment.extension_number || comment.user?.extension_number || '';
            const { name: extensionName, initials: extensionInitials } = getExtensionDisplay(
              extNumber,
              hierarchyDataExtensions,
            );
            const commentDate = formatActivityDate(comment.created_at || '');
            const isEditing = editingCommentId === comment.id;
            const commentKey =
              comment.id === undefined || comment.id === null
                ? `comment-idx-${idx}`
                : `comment-${comment.id}`;
            return (
              <div key={commentKey} className="p-3 bg-light rounded mb-2">
                {isEditing ? (
                  <>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      className="mb-2"
                    />
                    <div className="d-flex gap-2 justify-content-end">
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
                        disabled={submittingComment || !editingCommentText.trim()}
                        onClick={async () => {
                          if (!taskId || !editingCommentText.trim()) {
                            return;
                          }
                          try {
                            setSubmittingComment(true);
                            await updateTaskComment(taskId, comment.id, editingCommentText.trim());
                            await refreshComments();
                            setEditingCommentId(null);
                            setEditingCommentText('');
                          } finally {
                            setSubmittingComment(false);
                          }
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="d-flex gap-2 mb-2">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        {extensionInitials}
                      </div>
                      <div className="flex-grow-1">
                        <strong className="small">{extensionName}</strong>
                        <div className="small text-muted">{commentDate}</div>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0"
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingCommentText(comment.comment || '');
                        }}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-danger"
                        onClick={async () => {
                          if (!taskId) return;
                          await deleteTaskComment(taskId, comment.id);
                          await refreshComments();
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                    <div className="small">{comment.comment}</div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="border-top pt-3">
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
        />
        <Button
          variant="primary"
          size="sm"
          disabled={submittingComment || !newComment.trim()}
          onClick={async () => {
            if (!taskId || !newComment.trim()) {
              return;
            }
            try {
              setSubmittingComment(true);
              await createTaskComment(taskId, newComment.trim());
              setNewComment('');
              await refreshComments();
            } finally {
              setSubmittingComment(false);
            }
          }}
        >
          <Send size={14} className="me-1" />
          Post Comment
        </Button>
      </div>
    </>
  );
}

const TaskDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'activity' | 'comments' | 'documents'>('activity');
  const [taskComments, setTaskComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [taskDocuments, setTaskDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [loadingAllActivities, setLoadingAllActivities] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.USER_DIRECTORY);

  const { data: session } = useSession();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );

  const fetchTask = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setLoading(true);
      const data = await getTask(id, WITH_RELATIONS);
      setTask(data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const canManageTaskProject = useMemo(
    () =>
      canManageProjectFromMembers(
        task?.project ?? null,
        sessionUserPhoneOrExtension,
      ),
    [task?.project, sessionUserPhoneOrExtension],
  );

  useEffect(() => {
    if (!task?.id) {
      setTaskActivities([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingActivities(true);
      try {
        const activitiesResponse = await getTaskActivities(task.id, 1, 5);
        if (!cancelled && activitiesResponse != null) {
          setTaskActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
        }
      } catch (err) {
        console.error('Error loading task activities:', err);
        if (!cancelled) {
          setTaskActivities([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingActivities(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [task?.id]);

  const handleDelete = async () => {
    if (!task?.id || !canManageTaskProject) return;
    try {
      setDeleting(true);
      await deleteTask(task.id);
      setShowDeleteModal(false);
      router.push('/planner/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCommentsTabClick = async () => {
    setActiveDetailTab('comments');
    if (task?.id && taskComments.length === 0) {
      try {
        setLoadingComments(true);
        const commentsResponse = await getTaskComments(task.id);
        if (commentsResponse && Array.isArray(commentsResponse)) {
          setTaskComments(commentsResponse);
        } else {
          setTaskComments([]);
        }
      } catch (err) {
        console.error('Error loading task comments:', err);
        setTaskComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const fetchTaskDocuments = useCallback(async () => {
    if (!task?.id) return;
    try {
      setLoadingDocuments(true);
      const data = await getTaskDocuments(task.id);
      setTaskDocuments(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err) {
      console.error('Error loading task documents:', err);
      setTaskDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  }, [task?.id]);

  const handleDocumentsTabClick = async () => {
    setActiveDetailTab('documents');
    if (task?.id) await fetchTaskDocuments();
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !task?.id) return;
    try {
      setUploadingDocument(true);
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append('documents[]', file);
      }
      await postTaskDocuments(task.id, formData);
      await fetchTaskDocuments();
      if (documentInputRef.current) documentInputRef.current.value = '';
    } catch (err) {
      console.error('Error uploading document:', err);
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    if (!task?.id || !doc?.id) return;
    try {
      const blob = await getTaskDocumentDownload(task.id, doc.id);
      if (!blob) return;
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_name || doc.name || doc.file_name || 'document';
      a.click();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!task?.id || !doc?.id) return;
    try {
      await deleteTaskDocument(task.id, doc.id);
      await fetchTaskDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleViewAllActivities = async () => {
    if (!task?.id) return;
    try {
      setLoadingAllActivities(true);
      setShowAllActivitiesModal(true);
      const activitiesResponse = await getTaskActivities(task.id, 1, 100);
      setAllActivities(Array.isArray(activitiesResponse) ? activitiesResponse : []);
    } catch (err) {
      console.error('Error loading all activities:', err);
      setAllActivities([]);
    } finally {
      setLoadingAllActivities(false);
    }
  };

  if (loading && !task) {
    return (
      <>
        <BreadcrumbItem mainTitle="Tasks" mainLink="/planner/tasks" subTitle="Task" />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Loading task…</p>
        </Container>
      </>
    );
  }

  if (!task) {
    return (
      <>
        <BreadcrumbItem mainTitle="Tasks" mainLink="/planner/tasks" subTitle="Task" />
        <Container className="py-5">
          <Card>
            <Card.Body className="text-center py-5">
              <p className="text-muted mb-3">Task not found.</p>
              <Button variant="primary" onClick={() => router.push('/planner/tasks')}>
                Back to Tasks
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  const taskId = task.task_id || `#${task.id}`;
  const statusName = task.status?.name || task.status || 'N/A';
  const priorityVal = task.priority || 'normal';
  const projectName = task.project?.name || 'No Project';
  const watchers =
    task.watchers ??
    (task.watcher_numbers?.map((extNum: string) => ({ extension_number: extNum })) ?? []);

  return (
    <>
      <BreadcrumbItem
        mainTitle="Tasks"
        mainLink="/planner/tasks"
        subTitle={`Task ${taskId}`}
      />

      <Container className="py-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => router.push('/planner/tasks')}
            className="d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to list
          </Button>
          {canManageTaskProject && (
            <div className="d-flex align-items-center gap-1">
              <Button
                variant="link"
                className="text-primary p-0"
                onClick={() => setShowEditModal(true)}
                title="Edit Task"
              >
                <Edit size={20} />
              </Button>
              <Button
                variant="link"
                className="text-danger p-0"
                onClick={() => setShowDeleteModal(true)}
                title="Delete Task"
              >
                <Trash2 size={20} />
              </Button>
            </div>
          )}
        </div>

        <Card className="border shadow-sm">
          <Card.Header className="bg-light py-3">
            <h5 className="mb-0 fw-bold">{task.title || 'Untitled Task'}</h5>
            <span className="text-muted small">{taskId}</span>
          </Card.Header>
          <Card.Body>
            <Row className="g-2 mb-3">
              <Col xs={6} md={3}>
                <div className="p-3 bg-light rounded border">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Status</div>
                  <Badge bg={getStatusVariant(statusName)} className="px-3 py-2 w-100">
                    {statusName}
                  </Badge>
                </div>
              </Col>
              <Col xs={6} md={3}>
                <div className="p-3 bg-light rounded border">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Priority</div>
                  <Badge bg={getPriorityVariant(priorityVal)} className="px-3 py-2 w-100">
                    {priorityVal}
                  </Badge>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="p-3 bg-light rounded border">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Due Date</div>
                  <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    <Calendar size={16} className="me-2 text-muted" />
                    {task.due_date || '—'}
                    {task.due_time && <span className="ms-1 small">({task.due_time})</span>}
                  </div>
                </div>
              </Col>
            </Row>

            <div className="p-3 bg-light rounded border mb-3">
              <div className="small text-muted text-uppercase fw-semibold mb-2">Assignees</div>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                {(task.assignees || []).map((assignee: any) => {
                  const extNumber = assignee.extension_number || '';
                  const { name, initials } = getExtensionDisplay(extNumber, hierarchyDataExtensions);
                  const assigneeKey =
                    assignee.id === undefined || assignee.id === null
                      ? `assignee-ext-${extNumber || 'unknown'}`
                      : `assignee-${assignee.id}`;
                  return (
                    <div
                      key={assigneeKey}
                      title={name}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {initials || 'UN'}
                    </div>
                  );
                })}
                {canManageTaskProject && (
                  <Button
                    type="button"
                    variant="light"
                    aria-label="Edit assignees"
                    className="d-flex align-items-center justify-content-center rounded-circle p-0 border-0"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: '#e2e8f0',
                      color: '#64748b',
                    }}
                    onClick={() => setShowEditModal(true)}
                  >
                    <Plus size={16} />
                  </Button>
                )}
              </div>
            </div>

            {watchers.length > 0 && (
              <div className="p-3 bg-light rounded border mb-3">
                <div className="small text-muted text-uppercase fw-semibold mb-2">Watchers</div>
                <div className="d-flex flex-wrap gap-2">
                  {watchers.map((watcher: any, idx: number) => {
                    const extNumber = watcher.extension_number ?? watcher ?? '';
                    const extStr = String(extNumber);
                    const { name, initials } = getExtensionDisplay(extStr, hierarchyDataExtensions);
                    const watcherKey =
                      watcher.id === undefined || watcher.id === null
                        ? `watcher-${extStr || 'idx'}-${idx}`
                        : `watcher-${watcher.id}`;
                    return (
                      <div
                        key={watcherKey}
                        title={name}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {initials || '—'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-3 bg-light rounded border mb-3">
              <div className="small text-muted text-uppercase fw-semibold mb-1">Project</div>
              <span>{projectName}</span>
            </div>

            <div className="p-3 bg-light rounded border mb-3">
              <div className="small text-muted text-uppercase fw-semibold mb-2">Description</div>
              <div
                className="task-description-html"
                style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, overflowX: 'auto' }}
                dangerouslySetInnerHTML={{
                  __html:
                    (task.description || '').trim() ||
                    '<span class="text-muted">No description provided</span>',
                }}
              />
            </div>

            <Nav variant="tabs" className="mb-3 border-bottom">
              <Nav.Item>
                <Nav.Link
                  active={activeDetailTab === 'activity'}
                  onClick={() => setActiveDetailTab('activity')}
                  style={{ cursor: 'pointer' }}
                >
                  Recent Activity
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeDetailTab === 'comments'}
                  onClick={handleCommentsTabClick}
                  style={{ cursor: 'pointer' }}
                >
                  Comments {taskComments.length > 0 && `(${taskComments.length})`}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeDetailTab === 'documents'}
                  onClick={handleDocumentsTabClick}
                  style={{ cursor: 'pointer' }}
                >
                  Documents
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {activeDetailTab === 'activity' && (
              <div className="p-3 border rounded bg-white">
                <TaskActivityTabPanel
                  loadingActivities={loadingActivities}
                  taskActivities={taskActivities}
                  onViewAll={handleViewAllActivities}
                  hierarchyDataExtensions={hierarchyDataExtensions}
                />
              </div>
            )}

            {activeDetailTab === 'comments' && (
              <div className="p-3 border rounded bg-white">
                <TaskCommentsTabPanel
                  taskId={task.id}
                  loadingComments={loadingComments}
                  taskComments={taskComments}
                  setTaskComments={setTaskComments}
                  editingCommentId={editingCommentId}
                  setEditingCommentId={setEditingCommentId}
                  editingCommentText={editingCommentText}
                  setEditingCommentText={setEditingCommentText}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  submittingComment={submittingComment}
                  setSubmittingComment={setSubmittingComment}
                  hierarchyDataExtensions={hierarchyDataExtensions}
                />
              </div>
            )}

            {activeDetailTab === 'documents' && (
              <div className="p-3 border rounded bg-white">
                <TaskDocumentsTabPanel
                  loadingDocuments={loadingDocuments}
                  taskDocuments={taskDocuments}
                  uploadingDocument={uploadingDocument}
                  documentInputRef={documentInputRef}
                  onUploadChange={handleUploadDocument}
                  onUploadClick={() => documentInputRef.current?.click()}
                  onDownload={handleDownloadDocument}
                  onDelete={handleDeleteDocument}
                />
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

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
          <AllActivitiesModalBody
            loadingAllActivities={loadingAllActivities}
            allActivities={allActivities}
            hierarchyDataExtensions={hierarchyDataExtensions}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAllActivitiesModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <CreateTaskModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        task={task}
        isEdit
        extensions={hierarchyDataExtensions as any}
        labels={task?.labels || []}
        linkedRecords={[]}
        onCreate={async () => {
          setShowEditModal(false);
          await fetchTask();
        }}
        onCreateAndOpen={async () => {
          setShowEditModal(false);
          await fetchTask();
        }}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={task ? `${taskId} ${task.title || ''}` : undefined}
        itemType="task"
        loading={deleting}
      />
    </>
  );
};

TaskDetailPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default TaskDetailPage;
