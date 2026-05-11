import React from 'react';
import { Spinner } from 'react-bootstrap';
import { AlertCircle } from 'lucide-react';

interface OverdueTasksSectionProps {
  tasks: any[];
  loading: boolean;
  onViewAll?: () => void;
  styles: any;
  showViewAll?: boolean;
}

const OverdueTasksSection: React.FC<OverdueTasksSectionProps> = ({ 
  tasks, 
  loading, 
  onViewAll,
  styles,
  showViewAll = true
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h5 style={styles.cardTitle}>Top Overdue Tasks</h5>
        {showViewAll && tasks.length > 0 && onViewAll && (
          <span 
            style={{...styles.link, cursor: 'pointer'}}
            onClick={onViewAll}
          >
            View All →
          </span>
        )}
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Spinner animation="border" />
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 2rem',
          color: '#6B7280'
        }}>
          <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No overdue tasks</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>All tasks are up to date</p>
        </div>
      ) : (
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
                <tr 
                  key={task.id}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#4680FF', fontWeight: '600', cursor: 'pointer' }}>{task.id}</span>
                      <span style={{ color: '#6B7280' }}>{task.title}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: task.priority === 'High' ? '#FEE2E2' : task.priority === 'Medium' ? '#FEF3C7' : '#E0E7FF',
                      color: task.priority === 'High' ? '#991B1B' : task.priority === 'Medium' ? '#92400E' : '#3730A3'
                    }}>
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
      )}
    </div>
  );
};

export default OverdueTasksSection;
