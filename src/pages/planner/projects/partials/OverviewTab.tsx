import React from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { FileText, Users, X } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';
import StatsCards, { StatsCardData } from '@components/GenericStatsCards';
import RecentActivitySection from './RecentActivitySection';
import OverdueTasksSection from './OverdueTasksSection';
import type { ActivityLogExtension } from '@pages/planner/partials/activityLogExtension';

interface OverviewTabProps {
  statusCards: any[];
  loadingProjectData: boolean;
  assignees: any[];
  labels: any[];
  statuses: any[];
  tasksByStatus: any[];
  workloadData: any[];
  recentActivity: any[];
  loadingActivities: boolean;
  overdueTasks: any[];
  loadingOverdue: boolean;
  projectId: number | null | undefined;
  hierarchyExtensions?: ActivityLogExtension[];
  onViewOverdue: () => void;
  styles: any;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  statusCards,
  loadingProjectData,
  assignees,
  labels,
  statuses,
  tasksByStatus,
  workloadData,
  recentActivity,
  loadingActivities,
  overdueTasks,
  loadingOverdue,
  projectId,
  hierarchyExtensions,
  onViewOverdue,
  styles
}) => {
  return (
    <>
      {/* Status Cards */}
      {loadingProjectData ? (
        <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
          <Col xs={12} className="text-center">
            <Spinner animation="border" />
          </Col>
        </Row>
      ) : (
        <div style={{ marginBottom: '1.5rem' }}>
          <StatsCards
            data={statusCards.map((card): StatsCardData => ({
              title: card.title,
              value: card.count,
              icon: card.icon,
              iconColor: card.color,
              iconBgColor: card.bgLight,
            }))}
            gridMinWidth="160px"
          />
        </div>
      )}

      {/* Filters */}
      {/* <div style={styles.card}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <Search size={16} color="#6B7280" style={styles.inputIcon} />
            <input 
              type="text" 
              placeholder="Search tasks..."
              style={{...styles.input, ...styles.inputWithIcon}}
              onFocus={(e) => e.target.style.borderColor = '#4680FF'}
              onBlur={(e) => e.target.style.borderColor = '#E5E9F2'}
            />
          </div>
          
          <select style={styles.select}>
            <option>Assignee</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
          
          <select style={styles.select}>
            <option>Label</option>
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
          
          <select style={styles.select}>
            <option>Status</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
          
          <button 
            style={{...styles.buttonOutline, justifyContent: 'center'}}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div> */}

      {/* Charts Row */}
      <div style={{...styles.grid, ...styles.gridTwo}}>
        {/* Tasks by Status */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h5 style={styles.cardTitle}>Tasks by Status</h5>
            {/* <button 
              style={{...styles.buttonLight, padding: '0.5rem'}}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
            >
              <MoreVertical size={18} />
            </button> */}
          </div>
          
          {tasksByStatus.length === 0 || tasksByStatus.every(item => item.value === 0) ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem',
              color: '#6B7280'
            }}>
              <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No tasks by status</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Tasks will appear here once they are created</p>
            </div>
          ) : (
            <div style={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div>
                {tasksByStatus.map((item, index) => (
                  <div key={index} style={styles.legendItem}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{...styles.legendDot, backgroundColor: item.color}}></div>
                      <span style={{ fontSize: '0.9rem', color: '#4B5563' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1F2937' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Workload by Assignee */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h5 style={styles.cardTitle}>Workload by Assignee</h5>
            {/* <button 
              style={{...styles.buttonLight, padding: '0.5rem'}}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
            >
              <MoreVertical size={18} />
            </button> */}
          </div>
          
          {workloadData.length === 0 || workloadData.every(person => 
            person.backlog === 0 && person.todo === 0 && person.progress === 0 && person.review === 0 && person.done === 0
          ) ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 2rem',
              color: '#6B7280'
            }}>
              <Users size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>No workload data</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>Workload will appear here once tasks are assigned</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" vertical={false} />
                  <XAxis 
                    dataKey="initials" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    interval={0}
                    axisLine={{ stroke: '#E5E9F2' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E5E9F2',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="backlog" stackId="a" fill="#9E9E9E" />
                  <Bar dataKey="todo" stackId="a" fill="#4680FF" />
                  <Bar dataKey="progress" stackId="a" fill="#FFB64D" />
                  <Bar dataKey="review" stackId="a" fill="#DC2626" />
                  <Bar dataKey="done" stackId="a" fill="#2CA87F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              
              <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#6B7280' }}>
                {workloadData.map((person, index) => (
                  <div key={index} style={{ display: 'inline-block', margin: '0 0.5rem' }}>
                    {person.initials}: {person.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{...styles.grid, ...styles.gridTwo}}>
        <RecentActivitySection
          activities={recentActivity}
          loading={loadingActivities}
          projectId={projectId}
          hierarchyExtensions={hierarchyExtensions}
          styles={styles}
        />
        
        <OverdueTasksSection
          tasks={overdueTasks}
          loading={loadingOverdue}
          onViewAll={onViewOverdue}
          styles={styles}
          showViewAll={true}
        />
      </div>
    </>
  );
};

export default OverviewTab;
