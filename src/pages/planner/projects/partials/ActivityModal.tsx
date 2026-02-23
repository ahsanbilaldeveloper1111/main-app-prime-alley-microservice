import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { formatDateForTable } from '@utils/Helper';

interface ActivityModalProps {
  show: boolean;
  onHide: () => void;
  activities: any[];
  loading: boolean;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ show, onHide, activities, loading }) => {
  const styles = {
    activityItem: { display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' },
    activityContent: { flex: 1 },
    activityText: { fontSize: '0.9rem', color: '#4B5563', marginBottom: '0.25rem', lineHeight: '1.5' },
    activityTime: { fontSize: '0.8rem', color: '#9CA3AF' },
    badge: { padding: '0.125rem 0.5rem', backgroundColor: '#D1F2EB', color: '#0C7064', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500', marginLeft: '0.5rem' }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>All Recent Activity</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner animation="border" />
            </div>
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
              No activity found
            </div>
          ) : (
            activities.map((activity: any, index: number) => {
              const user = activity.user || activity.action_by || 'Unknown';
              const initials = user.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
              const colors = ['#48bb78', '#f56565', '#4299e1', '#ed64a6', '#667eea', '#9f7aea', '#fc8181', '#ed8936'];
              const color = colors[index % colors.length];
              
              return (
                <div key={activity.id || index} style={styles.activityItem}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  
                  <div style={styles.activityContent}>
                    <div style={styles.activityText}>
                      <strong style={{ color: '#1F2937' }}>{user}</strong>
                      {' '}{activity.action || activity.activity_type || 'performed action on'}{' '}
                      <strong style={{ color: '#1F2937' }}>{activity.task?.title || activity.description || 'task'}</strong>
                      {activity.status && (
                        <span style={styles.badge}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                    <div style={styles.activityTime}>
                      {activity.created_at ? formatDateForTable(activity.created_at) : activity.time || 'Recently'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
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

export default ActivityModal;
