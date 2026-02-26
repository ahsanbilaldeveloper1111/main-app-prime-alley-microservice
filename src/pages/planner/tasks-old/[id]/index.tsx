import React, { useEffect, useState, useCallback, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Layout from '@layout/index';
import BreadcrumbItem from '@common/BreadcrumbItem';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { ArrowLeft, Pencil, Trash2, Calendar, User, FolderOpen } from 'lucide-react';
import { getTask, deleteTask } from '@utils/tasks';
import { useHierarchyData } from '@components/filters/useHierarchyData';
import { ModuleSlug } from '@utils/Helper';
import CreateTaskModal from '@components/work-planner/createtask-modal';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';

const WITH_RELATIONS = [
  'project',
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

const TaskDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.USER_DIRECTORY);

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

  const handleDelete = async () => {
    if (!task?.id) return;
    try {
      setDeleting(true);
      await deleteTask(task.id);
      setShowDeleteModal(false);
      router.push('/work-planner/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusVariant = (status: string | { name?: string } | null | undefined) => {
    const raw = typeof status === 'object' && status?.name ? status.name : (status ?? '');
    const s = String(raw).toLowerCase();
    if (s.includes('progress')) return 'warning';
    if (s.includes('review')) return 'secondary';
    if (s.includes('overdue')) return 'danger';
    if (s.includes('complete')) return 'success';
    return 'info';
  };

  const getPriorityVariant = (priority: string) => {
    const p = (priority || '').toLowerCase();
    if (p === 'urgent' || p === 'high') return 'danger';
    if (p === 'normal') return 'warning';
    return 'success';
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const assigneeNames = (assignees: any[]) => {
    if (!assignees?.length) return 'Unassigned';
    return assignees
      .map((a: any) => {
        const ext = (hierarchyDataExtensions as any[])?.find(
          (e: any) => e.id === a.extension_number || e.extension_number === a.extension_number
        );
        return ext?.name || a.extension_number || '—';
      })
      .join(', ');
  };

  if (loading && !task) {
    return (
      <>
        <BreadcrumbItem mainTitle="Tasks" mainLink="/work-planner/tasks" subTitle="Task" />
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

  return (
    <>
      <BreadcrumbItem
        mainTitle="Tasks"
        mainLink="/planner/tasks"
        subTitle={`Task ${taskId}`}
      />

      <Container className="py-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => router.push('/planner/tasks')}
            className="d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back to list
          </Button>
          <div className="flex-grow-1" />
          <Button
            variant="outline-primary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={() => setShowEditModal(true)}
          >
            <Pencil size={16} />
            Edit
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>

        <Card>
          <Card.Header className="bg-light">
            <h5 className="mb-0">{task.title || 'Untitled Task'}</h5>
            <span className="text-muted small">{taskId}</span>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <span className="text-muted small d-block mb-1">Status</span>
                  <Badge bg={getStatusVariant(statusName)}>{statusName}</Badge>
                </div>
                <div className="mb-3">
                  <span className="text-muted small d-block mb-1">Priority</span>
                  <Badge bg={getPriorityVariant(priorityVal)}>{priorityVal}</Badge>
                </div>
                <div className="mb-3 d-flex align-items-center gap-2">
                  <FolderOpen size={18} className="text-muted" />
                  <div>
                    <span className="text-muted small d-block">Project</span>
                    <span>{projectName}</span>
                  </div>
                </div>
                <div className="mb-3 d-flex align-items-center gap-2">
                  <Calendar size={18} className="text-muted" />
                  <div>
                    <span className="text-muted small d-block">Due date</span>
                    <span>{formatDate(task.due_date)}</span>
                    {task.due_time && <span className="ms-1 small">({task.due_time})</span>}
                  </div>
                </div>
                <div className="mb-3 d-flex align-items-center gap-2">
                  <User size={18} className="text-muted" />
                  <div>
                    <span className="text-muted small d-block">Assignees</span>
                    <span>{assigneeNames(task.assignees || [])}</span>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <span className="text-muted small d-block mb-1">Description</span>
                  <div className="small" style={{ whiteSpace: 'pre-wrap' }}>
                    {task.description?.replace(/<[^>]*>/g, '') || '—'}
                  </div>
                </div>
                {Array.isArray(task.labels) && task.labels.length > 0 && (
                  <div className="mb-3">
                    <span className="text-muted small d-block mb-1">Labels</span>
                    <div className="d-flex flex-wrap gap-1">
                      {task.labels.map((l: any, i: number) => (
                        <Badge key={i} bg="secondary">
                          {l?.name ?? l?.label ?? (typeof l === 'string' ? l : '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {task.is_completed != null && (
                  <div className="mb-3">
                    <span className="text-muted small d-block mb-1">Completed</span>
                    <Badge bg={task.is_completed ? 'success' : 'light'} text={task.is_completed ? 'light' : 'dark'}>
                      {task.is_completed ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>

      <CreateTaskModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        task={task}
        isEdit={true}
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
