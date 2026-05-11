import React from 'react';
import { Spinner } from 'react-bootstrap';
import { AlertCircle } from 'lucide-react';
import type { OverdueTasksUiStyles, OverdueTaskRow } from './overdueTasksTypes';
import { overduePriorityBadgeStyle } from './overdueTasksHelpers';

interface OverdueTasksSectionProps {
  tasks: OverdueTaskRow[];
  loading: boolean;
  onViewAll?: () => void;
  styles: OverdueTasksUiStyles;
  showViewAll?: boolean;
}

const OverdueTasksSection: React.FC<OverdueTasksSectionProps> = ({
  tasks,
  loading,
  onViewAll,
  styles,
  showViewAll = true,
}) => {
  const renderBody = (): React.ReactNode => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Spinner animation="border" />
        </div>
      );
    }
    if (tasks.length === 0) {
      return (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            color: '#6B7280',
          }}
        >
          <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>
            No overdue tasks
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
            All tasks are up to date
          </p>
        </div>
      );
    }
    return (
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Priority</th>
              <th style={styles.th}>Assignee</th>
              <th style={styles.th}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={String(task.id)} className="overdue-tasks-section-row">
                <td style={styles.td}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <span style={{ color: '#4680FF', fontWeight: '600', cursor: 'pointer' }}>
                      {task.id}
                    </span>
                    <span style={{ color: '#6B7280' }}>{task.title}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...overduePriorityBadgeStyle(task.priority),
                    }}
                  >
                    {task.priority}
                  </span>
                </td>
                <td style={styles.td}>{task.assignee}</td>
                <td style={styles.td}>{task.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <style>
        {`.overdue-tasks-section-row:hover { background-color: #F9FAFB; }`}
      </style>
      <div style={styles.cardHeader}>
        <h5 style={styles.cardTitle}>Top Overdue Tasks</h5>
        {showViewAll && tasks.length > 0 && onViewAll && (
          <button
            type="button"
            style={{
              ...styles.link,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              padding: 0,
              font: 'inherit',
            }}
            onClick={onViewAll}
          >
            View All →
          </button>
        )}
      </div>

      {renderBody()}
    </div>
  );
};

export default OverdueTasksSection;
