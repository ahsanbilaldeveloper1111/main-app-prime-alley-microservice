import React from 'react';
import { Spinner } from 'react-bootstrap';
import { FileText, Calendar } from 'lucide-react';

interface ListTabProps {
  tasksList: any[];
  loading: boolean;
  listSummary: any;
  styles: any;
}

const ListTab: React.FC<ListTabProps> = ({ tasksList, loading, listSummary, styles }) => {
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

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h5 style={styles.cardTitle}>Tasks List</h5>
      </div>
      
      {listSummary && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#E3F2FD',
            color: '#1976D2',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Total: {listSummary.total || 0}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#E1F5FE',
            color: '#0277BD',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Open: {listSummary.open || 0}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Overdue: {listSummary.overdue || 0}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#FFF3E0',
            color: '#E65100',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Due This Week: {listSummary.dueThisWeek || 0}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#E8F5E9',
            color: '#2E7D32',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Completed: {listSummary.completed || 0}
          </span>
        </div>
      )}

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
              </tr>
            </thead>
            <tbody>
              {tasksList.map((task: any) => {
                const priorityColors = getPriorityColor(task.priority);

                return (
                  <tr 
                    key={task.id}
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
                              {assignee.extension_number || assignee.user?.name || 'Unknown'}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListTab;
