import React from 'react';
import { Table, Spinner, Badge, Button } from 'react-bootstrap';
import { MoreVertical } from 'lucide-react';
import moment from 'moment';
import { GlobalDateFormat, GlobalDateTimeFormat } from '@utils/Helper';

export interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  rawData?: {
    assignees?: Array<{ extension_number?: string }>;
    watchers?: Array<{ extension_number?: string }>;
    watcher_numbers?: string[];
    start_date?: string;
    due_date?: string;
    created_by_extension_number?: string;
    created_at?: string;
  };
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

export interface TasksTableProps {
  tasks: TaskRow[];
  loading: boolean;
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;
  onTaskClick: (task: TaskRow) => void;
  hierarchyDataExtensions?: any;
  getStatusVariant: (status: string) => string;
  getPriorityVariant: (priority: string) => string;
  itemLabel?: string;
}

const TasksTable: React.FC<TasksTableProps> = ({
  tasks,
  loading,
  pagination,
  setPagination,
  onTaskClick,
  hierarchyDataExtensions,
  getStatusVariant,
  getPriorityVariant,
  itemLabel = 'tasks'
}) => {
  const getExtensionDisplay = (extNumber: string, fallback = 'UN') => {
    if (!hierarchyDataExtensions || !extNumber) {
      return { name: extNumber, initials: (extNumber || fallback).toUpperCase().slice(0, 2) };
    }
    const extension = (hierarchyDataExtensions as any[]).find(
      (ext: any) => ext.id === extNumber || ext.extension_number === extNumber
    );
    const name = extension?.name || extNumber;
    const initials =
      name === extNumber
        ? (extNumber || fallback).toUpperCase().slice(0, 2)
        : name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    return { name, initials };
  };

  const renderAssignees = (task: TaskRow) => {
    if (!task.rawData?.assignees || task.rawData.assignees.length === 0) {
      return <span className="text-muted">Not assigned</span>;
    }
    return task.rawData.assignees.map((assignee: any) => {
      const extNumber = assignee.extension_number || '';
      const { name, initials } = getExtensionDisplay(extNumber, 'UN');
      return (
        <div
          key={`${task.id}:assignee:${extNumber.trim() || 'unknown'}`}
          className="assignee-badge"
          title={name}
        >
          {initials}
        </div>
      );
    });
  };

  const renderWatchers = (task: TaskRow) => {
    const watchers =
      task.rawData?.watchers ??
      task.rawData?.watcher_numbers?.map((extNum: string) => ({ extension_number: extNum })) ??
      [];
    if (!watchers.length) return <span className="text-muted">—</span>;
    return watchers.map((watcher: any) => {
      const extNumber = watcher.extension_number ?? watcher ?? '';
      const extKey = String(extNumber).trim();
      const { name, initials } = getExtensionDisplay(extKey, '—');
      return (
        <div
          key={`${task.id}:watcher:${extKey || 'unknown'}`}
          className="assignee-badge"
          title={name}
        >
          {initials}
        </div>
      );
    });
  };

  const renderCreatedBy = (task: TaskRow) => {
    const extNumber = task.rawData?.created_by_extension_number || '';
    if (!extNumber) return '';
    const { name } = getExtensionDisplay(extNumber, '');
    return name || extNumber;
  };

  function renderTasksTableBodyRows(): React.ReactNode {
    if (loading) {
      return (
        <tr>
          <td colSpan={12} className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">Loading {itemLabel}...</div>
          </td>
        </tr>
      );
    }
    if (tasks.length === 0) {
      return (
        <tr>
          <td colSpan={12} className="text-center py-5 text-muted">
            No {itemLabel} found
          </td>
        </tr>
      );
    }
    return tasks.map((task) => (
      <tr key={task.id}>
        <td className="task-id" onClick={() => onTaskClick(task)}>
          {task.id}
        </td>
        <td onClick={() => onTaskClick(task)}>{task.title}</td>
        <td onClick={() => onTaskClick(task)}>
          <Badge bg={getStatusVariant(task.status)} className="px-3 py-2">
            {task.status}
          </Badge>
        </td>
        <td onClick={() => onTaskClick(task)}>
          <Badge bg={getPriorityVariant(task.priority)} className="px-3 py-2">
            {task.priority}
          </Badge>
        </td>
        <td onClick={() => onTaskClick(task)}>{task.project}</td>
        <td onClick={() => onTaskClick(task)}>
          <div className="d-flex align-items-center gap-2">{renderAssignees(task)}</div>
        </td>
        <td onClick={() => onTaskClick(task)}>
          <div className="d-flex align-items-center gap-2">{renderWatchers(task)}</div>
        </td>
        <td onClick={() => onTaskClick(task)}>
          {task.rawData?.start_date
            ? moment(task.rawData.start_date).format(GlobalDateTimeFormat)
            : ''}
        </td>
        <td onClick={() => onTaskClick(task)}>
          {task.rawData?.due_date
            ? moment(task.rawData.due_date).format(GlobalDateFormat)
            : ''}
        </td>
        <td onClick={() => onTaskClick(task)}>{renderCreatedBy(task)}</td>
        <td onClick={() => onTaskClick(task)}>
          {task.rawData?.created_at
            ? moment(task.rawData.created_at).format(GlobalDateTimeFormat)
            : ''}
        </td>
        <td>
          <Button
            variant="link"
            className="text-secondary p-0 d-flex align-items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task);
            }}
          >
            <MoreVertical size={20} />
          </Button>
        </td>
      </tr>
    ));
  }

  return (
    <>
      <div className="table-responsive">
        <Table className="tasks-table" hover>
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Project</th>
              <th>Assignees</th>
              <th>Watchers</th>
              <th>Start Date</th>
              <th>Due Date</th>
              <th>Created By</th>
              <th>DateTime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{renderTasksTableBodyRows()}</tbody>
        </Table>
      </div>

      {!loading && tasks.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e8eef5',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#718096' }}>
              Showing {pagination.from || 0} to {pagination.to || 0} of {pagination.total || 0}{' '}
              {itemLabel}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minWidth: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label
                htmlFor="per-page-select"
                style={{ fontSize: '13px', color: '#718096', margin: 0 }}
              >
                Per page
              </label>
              <select
                id="per-page-select"
                value={pagination.limit}
                onChange={(e) => {
                  const limit = Number(e.target.value);
                  if (!loading) setPagination((prev) => ({ ...prev, limit, page: 1 }));
                }}
                disabled={loading}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: loading ? '#f8fafc' : 'white',
                  color: loading ? '#cbd5e0' : '#4a5568',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minWidth: '56px'
                }}
              >
                {[15, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (pagination.page > 1 && !loading) {
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
                }
              }}
              disabled={pagination.page === 1 || loading}
              style={{
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: pagination.page === 1 || loading ? '#f8fafc' : 'white',
                color: pagination.page === 1 || loading ? '#cbd5e0' : '#4a5568',
                cursor: pagination.page === 1 || loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (pagination.page > 1 && !loading) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e0';
                }
              }}
              onMouseLeave={(e) => {
                if (pagination.page > 1 && !loading) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              Previous
            </button>

            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                let pageNum: number;
                if (pagination.last_page <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.last_page - 2) {
                  pageNum = pagination.last_page - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                const isActivePage = pagination.page === pageNum;
                let pageButtonBg: string;
                let pageButtonColor: string;
                if (isActivePage) {
                  pageButtonBg = '#5b8fd8';
                  pageButtonColor = 'white';
                } else if (loading) {
                  pageButtonBg = '#f8fafc';
                  pageButtonColor = '#cbd5e0';
                } else {
                  pageButtonBg = 'white';
                  pageButtonColor = '#4a5568';
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      if (!loading && pagination.page !== pageNum) {
                        setPagination((prev) => ({ ...prev, page: pageNum }));
                      }
                    }}
                    disabled={loading}
                    style={{
                      minWidth: '32px',
                      height: '32px',
                      padding: '0 8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: pageButtonBg,
                      color: pageButtonColor,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: isActivePage ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (pagination.page !== pageNum && !loading) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pagination.page !== pageNum && !loading) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                if (pagination.page < pagination.last_page && !loading) {
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
                }
              }}
              disabled={pagination.page >= pagination.last_page || loading}
              style={{
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor:
                  pagination.page >= pagination.last_page || loading ? '#f8fafc' : 'white',
                color:
                  pagination.page >= pagination.last_page || loading ? '#cbd5e0' : '#4a5568',
                cursor:
                  pagination.page >= pagination.last_page || loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (pagination.page < pagination.last_page && !loading) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e0';
                }
              }}
              onMouseLeave={(e) => {
                if (pagination.page < pagination.last_page && !loading) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default TasksTable;
