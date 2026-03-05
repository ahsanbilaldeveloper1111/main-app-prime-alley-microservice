import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

interface OverdueTasksModalProps {
  show: boolean;
  onHide: () => void;
  tasks: any[];
  loading: boolean;
}

const OverdueTasksModal: React.FC<OverdueTasksModalProps> = ({ show, onHide, tasks, loading }) => {
  const styles = {
    tableWrapper: { overflowX: 'auto' as const },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '0.75rem', textAlign: 'left' as const, backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E9F2' },
    td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
    badge: { padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block' }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>All Overdue Tasks</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Spinner animation="border" />
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                    No overdue tasks
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr 
                    key={task.id}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={styles.td}>
                      <span style={{ color: '#6B7280', marginRight: '0.5rem' }}>
                        {task.id}
                      </span>
                      <span style={{ color: '#1F2937', fontWeight: '500' }}>
                        {task.title}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: task.priority === 'High' ? '#FEE2E2' : task.priority === 'Medium' ? '#FEF3C7' : '#D1FAE5',
                        color: task.priority === 'High' ? '#991B1B' : task.priority === 'Medium' ? '#92400E' : '#065F46'
                      }}>
                        {task.priority}
                      </span>
                    </td>
                    <td style={styles.td}>{task.assignee}</td>
                    <td style={styles.td}>{task.dueDate}</td>
                  </tr>
                ))
              )}
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
