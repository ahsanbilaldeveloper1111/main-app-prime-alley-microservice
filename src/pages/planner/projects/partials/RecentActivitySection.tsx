import React from 'react';
import { Spinner } from 'react-bootstrap';
import { formatDateForTable } from '@utils/Helper';

interface RecentActivitySectionProps {
  activities: any[];
  loading: boolean;
  onViewAll: () => void;
  styles: any;
}

const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ 
  activities, 
  loading, 
  onViewAll,
  styles 
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h5 style={styles.cardTitle}>Recent Activity</h5>
        <span 
          style={{...styles.link, cursor: 'pointer'}}
          onClick={onViewAll}
        >
          View All →
        </span>
      </div>
      
      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner animation="border" />
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
            No recent activity
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
                      <>
                        {' '}to{' '}
                        <span style={{
                          padding: '0.125rem 0.5rem',
                          backgroundColor: '#E0F2FE',
                          color: '#0369A1',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          {activity.status}
                        </span>
                      </>
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
    </div>
  );
};

export default RecentActivitySection;
