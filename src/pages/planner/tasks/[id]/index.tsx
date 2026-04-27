import React, { useEffect, useState, useCallback, useMemo, useRef, ReactElement } from 'react';
import { useSession } from 'next-auth/react';
import { getSessionPhoneOrExtension } from '@planner/projectMemberRole';
import {
  applyPlannerTaskSessionCrud,
  computePlannerTaskRowPermissions,
} from '@planner/taskRowPermissions';
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Send,
  Upload,
  FileText,
  Download,
  ListTodo,
} from 'lucide-react';
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
import CreateTaskSidebar from '@components/CreatePlannerTaskSidebar';
import DeleteConfirmationModal from '@pages/partial/DeleteConfirmationModal';
import { toast } from 'react-toastify';
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from '@constants/headerConstants';

const { PERMISSIONS } = HEADER_CONSTANTS;

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

function readNestedRecurringRecord(task: Record<string, unknown>): Record<string, unknown> | null {
  const top = task.recurring;
  if (top && typeof top === 'object' && !Array.isArray(top)) {
    return top as Record<string, unknown>;
  }
  return null;
}

function pickTaskScalar(task: Record<string, unknown>, key: string): unknown {
  const top = task[key];
  if (top != null && top !== '') return top;
  const nested = readNestedRecurringRecord(task);
  if (nested) {
    const nv = nested[key];
    if (nv != null && nv !== '') return nv;
  }
  return undefined;
}

/** Coerce API values for display/type checks; objects become '' to avoid '[object Object]'. */
function plannerDetailScalarString(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

function plannerTaskTypeFromTask(
  task: Record<string, unknown> | null | undefined,
): 'todo' | 'regular' | 'recurring' {
  if (task == null) return 'regular';
  const t = plannerDetailScalarString(task.type ?? task.task_type).toLowerCase();
  if (t === 'todo') return 'todo';
  if (t === 'recurring') return 'recurring';
  // Explicit API type wins; do not infer recurring from leftover schedule fields.
  if (t === 'regular') return 'regular';
  if (task.is_recurring === true || task.is_recurring === 1) return 'recurring';
  const nested = readNestedRecurringRecord(task);
  if (nested) {
    const nt = plannerDetailScalarString(nested.type).toLowerCase();
    if (nt === 'recurring') return 'recurring';
    if (nested.is_recurring === true || nested.is_recurring === 1) return 'recurring';
  }
  const freq = pickTaskScalar(task, 'frequency');
  const hasRecurringSignals =
    (typeof freq === 'string' && freq.trim() !== '') ||
    pickTaskScalar(task, 'repeat_interval') != null ||
    pickTaskScalar(task, 'last_run_at') != null ||
    pickTaskScalar(task, 'next_run_at') != null;
  if (hasRecurringSignals && t !== 'todo') return 'recurring';
  return 'regular';
}

function readTaskScheduleField(
  task: Record<string, unknown>,
  field: 'last_run_at' | 'next_run_at',
): string | undefined {
  const from = (o: Record<string, unknown> | null | undefined): string | undefined => {
    if (!o) return undefined;
    const v = o[field];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };
  return from(task) ?? from(readNestedRecurringRecord(task));
}

/** e.g. "23 December 2025" — stable for API `YYYY-MM-DD` (parsed as local calendar date). */
const PLANNER_DETAIL_LONG_DATE: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

function formatPlannerDetailDateLong(value: string | null | undefined): string {
  if (value == null || String(value).trim() === '') return '—';
  const s = String(value).trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})(?:$|[^\d])/.exec(s);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]) - 1;
    const day = Number(ymd[3]);
    const local = new Date(y, m, day);
    if (!Number.isNaN(local.getTime())) {
      return local.toLocaleDateString('en-GB', PLANNER_DETAIL_LONG_DATE);
    }
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-GB', PLANNER_DETAIL_LONG_DATE);
}

function formatPlannerDetailDateTime(iso: string | null | undefined): string {
  if (iso == null || String(iso).trim() === '') return '—';
  const d = new Date(String(iso).trim());
  if (Number.isNaN(d.getTime())) return '—';
  const datePart = d.toLocaleDateString('en-GB', PLANNER_DETAIL_LONG_DATE);
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

function taskTypeBadgeLabel(kind: 'todo' | 'regular' | 'recurring'): string {
  if (kind === 'todo') return 'Todo';
  if (kind === 'recurring') return 'Recurring';
  return 'Regular';
}

function formatFrequencyLabel(raw: unknown): string {
  const s = plannerDetailScalarString(raw).trim().toLowerCase();
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatRepeatOnForDetail(frequency: unknown, repeatOn: unknown): string {
  const f = plannerDetailScalarString(frequency).toLowerCase();
  const ro = plannerDetailScalarString(repeatOn).trim();
  if (!ro) return '—';
  if (f === 'weekly') {
    const day = ro.toLowerCase();
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  if (f === 'monthly') return `Day ${ro} of month`;
  return ro;
}

function formatDueTimeForDetail(raw: unknown): string {
  if (raw == null || raw === '') return '—';
  const s = plannerDetailScalarString(raw).trim();
  if (!s) return '—';
  if (s.includes('T')) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    }
  }
  return s;
}

function getPriorityVariant(priority: string) {
    const p = (priority || '').toLowerCase();
    if (p === 'urgent' || p === 'high') return 'danger';
    if (p === 'normal') return 'warning';
    return 'success';
}

function formatPriorityLabel(priority: string): string {
  const p = String(priority || "").trim().toLowerCase();
  if (!p) return "—";
  if (p === "normal") return "Medium";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function formatActivityDate(dateString: string) {
  return formatPlannerDetailDateTime(dateString);
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

function recurringIntervalSuffix(frequencyRaw: unknown): string {
  const f = plannerDetailScalarString(frequencyRaw).toLowerCase();
  if (f === 'daily') return 'day(s)';
  if (f === 'weekly') return 'week(s)';
  if (f === 'monthly') return 'month(s)';
  if (f === 'yearly') return 'year(s)';
  return '';
}

type TaskDetailRecurringSchedulePanelProps = Readonly<{
  taskRecord: Record<string, unknown>;
  endDateDisplay: string | null;
  lastRunAt: string | undefined;
  nextRunAt: string | undefined;
}>;

function TaskDetailRecurringSchedulePanel({
  taskRecord,
  endDateDisplay,
  lastRunAt,
  nextRunAt,
}: TaskDetailRecurringSchedulePanelProps) {
  const pick = (key: string) => pickTaskScalar(taskRecord, key);
  const freq = pick('frequency');
  const intervalRaw = pick('repeat_interval');
  const intervalStr = plannerDetailScalarString(intervalRaw);
  const intervalMain = intervalStr === '' ? '—' : intervalStr;
  const suffix = typeof freq === 'string' ? recurringIntervalSuffix(freq) : '';

  return (
    <div className="p-3 bg-light rounded border mb-3">
      <div className="small text-muted text-uppercase fw-semibold mb-2">Recurring schedule</div>
      <Row className="g-3">
        <Col xs={6} md={4}>
          <div className="small text-muted">Frequency</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {formatFrequencyLabel(freq)}
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="small text-muted">Repeat every</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {intervalMain}
            {suffix ? <span className="text-muted small ms-1">{suffix}</span> : null}
          </div>
        </Col>
        <Col xs={12} md={4}>
          <div className="small text-muted">Repeat on / day</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {formatRepeatOnForDetail(freq, pick('repeat_on'))}
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Scheduled time</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {formatDueTimeForDetail(pick('due_time'))}
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Schedule ends</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {formatPlannerDetailDateLong(endDateDisplay)}
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Last run at</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {formatPlannerDetailDateTime(lastRunAt)}
          </div>
        </Col>
        <Col xs={12} md={6}>
          <div className="small text-muted">Next run at</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            {formatPlannerDetailDateTime(nextRunAt)}
          </div>
        </Col>
      </Row>
    </div>
  );
}

type PlannerTaskDetailKind = ReturnType<typeof plannerTaskTypeFromTask>;

type PlannerTaskDetailViewModel = Readonly<{
  taskId: string;
  statusName: string;
  priorityVal: string;
  projectName: string;
  watchers: any[];
  taskRecord: Record<string, unknown>;
  detailTaskKind: PlannerTaskDetailKind;
  showRecurringBlock: boolean;
  startDateDisplay: string | null;
  endDateDisplay: string | null;
  dueTimeDetailLabel: string;
  lastRunAt: string | undefined;
  nextRunAt: string | undefined;
}>;

function buildPlannerTaskDetailViewModel(task: any): PlannerTaskDetailViewModel {
  const taskId = task.task_id || `#${task.id}`;
  const statusName = task.status?.name || task.status || 'N/A';
  const priorityVal = task.priority || 'normal';
  const projectName = task.project?.name || 'No Project';
  const watchers =
    task.watchers ??
    (task.watcher_numbers?.map((extNum: string) => ({ extension_number: extNum })) ?? []);

  const taskRecord = task as Record<string, unknown>;
  const detailTaskKind = plannerTaskTypeFromTask(taskRecord);
  const pickScalar = (key: string) => pickTaskScalar(taskRecord, key);
  const lastRunAt = readTaskScheduleField(taskRecord, 'last_run_at');
  const nextRunAt = readTaskScheduleField(taskRecord, 'next_run_at');
  const freqScalar = pickScalar('frequency');
  const showRecurringBlock =
    detailTaskKind === 'recurring' ||
    lastRunAt != null ||
    nextRunAt != null ||
    (typeof freqScalar === 'string' && freqScalar.trim() !== '');
  const startDateDisplay =
    (typeof task.start_date === 'string' && task.start_date.trim() !== ''
      ? task.start_date
      : null) ??
    (typeof pickScalar('start_date') === 'string' ? String(pickScalar('start_date')) : null);
  const endDateDisplay =
    (typeof task.due_date === 'string' && task.due_date.trim() !== '' ? task.due_date : null) ??
    (typeof pickScalar('end_date') === 'string' ? String(pickScalar('end_date')) : null);
  const dueTimeDetailLabel = formatDueTimeForDetail(task.due_time);

  return {
    taskId,
    statusName,
    priorityVal,
    projectName,
    watchers,
    taskRecord,
    detailTaskKind,
    showRecurringBlock,
    startDateDisplay,
    endDateDisplay,
    dueTimeDetailLabel,
    lastRunAt,
    nextRunAt,
  };
}

/** Loads the recent-activities strip for a task id (complexity isolated for Sonar). */
function usePlannerTaskActivitiesPreview(taskId: number | string | undefined | null) {
  const [taskActivities, setTaskActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    if (taskId == null || taskId === '') {
      setTaskActivities([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoadingActivities(true);
      try {
        const activitiesResponse = await getTaskActivities(taskId, 1, 5);
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
    void load();
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  return { taskActivities, loadingActivities };
}

const TaskDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { taskActivities, loadingActivities } = usePlannerTaskActivitiesPreview(task?.id);
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

  const { hierarchyDataExtensions } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  const sidebarProjectFromTask = useMemo(() => {
    const p = task?.project;
    if (p == null || typeof p !== 'object' || p.id == null) return undefined;
    return {
      id: Number(p.id),
      name: String(p.name ?? ''),
      icon: '',
      color: typeof p.color === 'string' && p.color ? p.color : '#3b82f6',
      statuses: Array.isArray(p.statuses) ? p.statuses : undefined,
      labels: Array.isArray(p.labels) ? p.labels : undefined,
    };
  }, [task?.project]);

  const { data: session } = useSession();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  const sessionCanUpdatePlannerTask = useMemo(
    () => hasPermission(PERMISSIONS.EDIT_TASKS_WORK_PLANNER),
    [hasPermission],
  );
  const sessionCanDeletePlannerTask = useMemo(
    () =>
      hasAnyPermission([
        PERMISSIONS.DELETE_TASKS_WORK_PLANNER,
        PERMISSIONS.EDIT_TASKS_WORK_PLANNER,
      ]),
    [hasAnyPermission],
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

  const taskDetailPermissions = useMemo(
    () =>
      applyPlannerTaskSessionCrud(
        computePlannerTaskRowPermissions(
          task,
          task?.project ?? null,
          sessionUserPhoneOrExtension,
        ),
        {
          canUpdateTask: sessionCanUpdatePlannerTask,
          canDeleteTask: sessionCanDeletePlannerTask,
        },
      ),
    [
      task,
      sessionUserPhoneOrExtension,
      sessionCanUpdatePlannerTask,
      sessionCanDeletePlannerTask,
    ],
  );

  const handleDelete = async () => {
    if (!task?.id) return;
    if (!taskDetailPermissions.canDeleteTask) {
      toast.error('You cannot delete this task');
      return;
    }
    try {
      setDeleting(true);
      await deleteTask(task.id);
      setShowDeleteModal(false);
      router.push('/planner/tasks');
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
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

  const {
    taskId,
    statusName,
    priorityVal,
    projectName,
    watchers,
    taskRecord,
    detailTaskKind,
    showRecurringBlock,
    startDateDisplay,
    endDateDisplay,
    dueTimeDetailLabel,
    lastRunAt,
    nextRunAt,
  } = buildPlannerTaskDetailViewModel(task);

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
          {(taskDetailPermissions.canOpenTaskEdit ||
            taskDetailPermissions.canDeleteTask) && (
            <div className="d-flex align-items-center gap-1">
              {taskDetailPermissions.canOpenTaskEdit && (
                <Button
                  variant="link"
                  className="text-primary p-0"
                  onClick={() => setShowEditModal(true)}
                  title="Edit task"
                >
                  <Edit size={20} />
                </Button>
              )}
              {taskDetailPermissions.canDeleteTask && (
                <Button
                  variant="link"
                  className="text-danger p-0"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete task"
                >
                  <Trash2 size={20} />
                </Button>
              )}
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
              <Col xs={6} md={4}>
                <div className="p-3 bg-light rounded border">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Status</div>
                  <Badge bg={getStatusVariant(statusName)} className="px-3 py-2 w-100">
                    {statusName}
                  </Badge>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="p-3 bg-light rounded border">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Priority</div>
                  <Badge bg={getPriorityVariant(priorityVal)} className="px-3 py-2 w-100">
                    {formatPriorityLabel(priorityVal)}
                  </Badge>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="p-3 bg-light rounded border">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Type</div>
                  <Badge bg="secondary" className="px-3 py-2 w-100 text-capitalize">
                    {taskTypeBadgeLabel(detailTaskKind)}
                  </Badge>
                </div>
              </Col>
              <Col xs={6} md={4}>
                <div className="p-3 bg-light rounded border">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Due Date</div>
                  <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                    <Calendar size={16} className="me-2 text-muted" />
                    {formatPlannerDetailDateLong(endDateDisplay)}
                    {dueTimeDetailLabel !== '—' && (
                      <span className="ms-1 small text-muted">({dueTimeDetailLabel})</span>
                    )}
                  </div>
                </div>
              </Col>
              {startDateDisplay ? (
                <Col xs={12} md={4}>
                  <div className="p-3 bg-light rounded border">
                    <div className="small text-muted text-uppercase fw-semibold mb-1">Start date</div>
                    <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                      <Calendar size={16} className="me-2 text-muted" />
                      {formatPlannerDetailDateLong(startDateDisplay)}
                    </div>
                  </div>
                </Col>
              ) : null}
            </Row>

            {showRecurringBlock && (
              <TaskDetailRecurringSchedulePanel
                taskRecord={taskRecord}
                endDateDisplay={endDateDisplay}
                lastRunAt={lastRunAt}
                nextRunAt={nextRunAt}
              />
            )}

            {detailTaskKind !== 'todo' && (
              <div className="p-3 bg-light rounded border mb-3">
                <div className="small text-muted text-uppercase fw-semibold mb-2">Assignees</div>
                <div className="d-flex flex-column gap-2">
                  {(task.assignees || []).length === 0 ? (
                    <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                      —
                    </span>
                  ) : (
                    (task.assignees || []).map((assignee: any) => {
                      const extNumber = assignee.extension_number || "";
                      const { name } = getExtensionDisplay(extNumber, hierarchyDataExtensions);
                      const assigneeKey =
                        assignee.id === undefined || assignee.id === null
                          ? `assignee-ext-${extNumber || "unknown"}`
                          : `assignee-${assignee.id}`;
                      return (
                        <span
                          key={assigneeKey}
                          style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1e293b" }}
                        >
                          {name}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {watchers.length > 0 && (
              <div className="p-3 bg-light rounded border mb-3">
                <div className="small text-muted text-uppercase fw-semibold mb-2">Watchers</div>
                <div className="d-flex flex-column gap-2">
                  {watchers.map((watcher: any, idx: number) => {
                    const extNumber = watcher.extension_number ?? watcher ?? "";
                    const extStr = String(extNumber);
                    const { name } = getExtensionDisplay(extStr, hierarchyDataExtensions);
                    const watcherKey =
                      watcher.id === undefined || watcher.id === null
                        ? `watcher-${extStr || "idx"}-${idx}`
                        : `watcher-${watcher.id}`;
                    return (
                      <span
                        key={watcherKey}
                        style={{ fontSize: "0.9rem", fontWeight: 500, color: "#1e293b" }}
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-3 bg-light rounded border mb-3">
              <div className="small text-muted text-uppercase fw-semibold mb-1">Project</div>
              <span>{projectName}</span>
            </div>

            {typeof task.parent === 'object' && task.parent?.id != null && (
                <div className="p-3 bg-light rounded border mb-3">
                  <div className="small text-muted text-uppercase fw-semibold mb-1">Parent task</div>
                  <Button
                    variant="link"
                    className="p-0 d-inline-flex align-items-center gap-1"
                    onClick={() => {
                      router.push(`/planner/tasks/${String(task.parent.id)}`).catch(() => undefined);
                    }}
                  >
                    <ListTodo size={16} className="text-muted" />
                    {task.parent.title ||
                      task.parent.reference ||
                      `Task #${task.parent.id}`}
                  </Button>
                </div>
              )}

            {Array.isArray(task.labels) && task.labels.length > 0 && (
              <div className="p-3 bg-light rounded border mb-3">
                <div className="small text-muted text-uppercase fw-semibold mb-2">Labels</div>
                <div className="d-flex flex-wrap gap-2">
                  {task.labels.map((label: { id?: number; name?: string; color?: string }, idx: number) => {
                    const labelKey =
                      label.id == null ? `label-idx-${idx}` : `label-${label.id}`;
                    return (
                      <Badge
                        key={labelKey}
                        className="px-2 py-1"
                        style={{
                          backgroundColor: label.color || '#94a3b8',
                          color: '#141414',
                        }}
                      >
                        {label.name ?? 'Label'}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {Array.isArray(task.children) && task.children.length > 0 && (
              <div className="p-3 bg-light rounded border mb-3">
                <div className="small text-muted text-uppercase fw-semibold mb-2">Subtasks</div>
                <ul className="list-unstyled mb-0">
                  {task.children
                    .filter(
                      (child: { id?: number }): child is { id: number; title?: string; reference?: string } =>
                        child.id != null,
                    )
                    .map(
                      (
                        child: { id: number; title?: string; reference?: string },
                        idx: number,
                      ) => {
                      const childKey = `child-${child.id}-${idx}`;
                      return (
                        <li key={childKey} className="mb-1">
                          <Button
                            variant="link"
                            className="p-0"
                            onClick={() => {
                              router.push(`/planner/tasks/${String(child.id)}`).catch(() => undefined);
                            }}
                          >
                            {child.title || child.reference || `Task #${child.id}`}
                          </Button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}

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

      <CreateTaskSidebar
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onCreate={async () => {
          setShowEditModal(false);
          await fetchTask();
        }}
        extensions={hierarchyDataExtensions as any}
        labels={sidebarProjectFromTask?.labels ?? task?.labels ?? []}
        project={sidebarProjectFromTask}
        statuses={
          sidebarProjectFromTask?.statuses?.map(
            (s: {
              id: number;
              name: string;
              color?: string;
              is_default?: boolean;
              is_deefault?: boolean;
            }) => ({
              id: s.id,
              name: s.name,
              icon: '',
              color: s.color || '#3b82f6',
              is_default: s.is_default === true || s.is_deefault === true,
            }),
          ) ?? []
        }
        task={task ? { ...task, rawData: task } : undefined}
        isEdit={Boolean(showEditModal && task)}
        lockProjectSelection={false}
        taskEditScope={task ? taskDetailPermissions.taskEditScope : 'full'}
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
