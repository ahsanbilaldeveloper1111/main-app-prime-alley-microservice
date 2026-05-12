import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import type { OverdueTaskRow } from './overdueTasksTypes';
import { overduePriorityBadgeStyle } from './overdueTasksHelpers';

interface OverdueTasksModalProps {
  show: boolean;
  onHide: () => void;
  tasks: OverdueTaskRow[];
  loading: boolean;
}

const tableWrapperStyle: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  padding: '0.75rem',
  textAlign: 'left',
  backgroundColor: '#F9FAFB',
  borderBottom: '1px solid #E5E9F2',
};

const tdStyle: React.CSSProperties = {
  padding: '1rem 0.75rem',
  borderBottom: '1px solid #F3F4F6',
  color: '#4B5563',
  fontSize: '0.9rem',
};

const badgeBaseStyle: React.CSSProperties = {
  padding: '0.25rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.75rem',
  fontWeight: '600',
  display: 'inline-block',
};

const OverdueTasksModal: React.FC<OverdueTasksModalProps> = ({
  show,
  onHide,
  tasks,
  loading,
}) => {
  const renderTableRows = (): React.ReactNode => {
    if (loading) {
      return (
        <tr>
          <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner animation="border" />
          </td>
        </tr>
      );
    }
    if (tasks.length === 0) {
      return (
        <tr>
          <td
            colSpan={4}
            style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}
          >
            No overdue tasks
          </td>
        </tr>
      );
    }
    return tasks.map((task) => (
      <tr key={String(task.id)} className="overdue-tasks-modal-row">
        <td style={tdStyle}>
          <span style={{ color: '#6B7280', marginRight: '0.5rem' }}>
            {task.id}
          </span>
          <span style={{ color: '#1F2937', fontWeight: '500' }}>
            {task.title}
          </span>
        </td>
        <td style={tdStyle}>
          <span
            style={{
              ...badgeBaseStyle,
              ...overduePriorityBadgeStyle(task.priority),
            }}
          >
            {task.priority}
          </span>
        </td>
        <td style={tdStyle}>{task.assignee}</td>
        <td style={tdStyle}>{task.dueDate}</td>
      </tr>
    ));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>All Overdue Tasks</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <style>
          {`.overdue-tasks-modal-row:hover { background-color: #F9FAFB; }`}
        </style>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Assignee</th>
                <th style={thStyle}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows()}
            </tbody>
          </table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OverdueTasksModal;
