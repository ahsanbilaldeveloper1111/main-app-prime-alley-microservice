import React, { useState } from 'react';
import { 
  FileText, Download, Calendar, AlertCircle, CheckCircle2,
  ChevronDown, Search, X, MoreVertical
} from 'lucide-react';
import { Row, Col } from 'react-bootstrap';
import StatsCard from '@components/work-planner/stats-cards';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

interface TasksReportsProps {
  embedded?: boolean;
}

const TasksReports: React.FC<TasksReportsProps> = ({ embedded = false }) => {
  const summaryStats = [
    { title: 'Open', value: 54, icon: FileText, iconColor: '#4680FF', iconBgColor: '#E3F2FD' },
    { title: 'Overdue', value: 6, icon: AlertCircle, iconColor: '#DC2626', iconBgColor: '#FFEBEE' },
    { title: 'Completed (30d)', value: 180, icon: CheckCircle2, iconColor: '#4FC3F7', iconBgColor: '#E1F5FE' }
  ];

  const avgCompletionStat = {
    title: 'Avg completion time, 3 day',
    value: '2.8d',
    icon: CheckCircle2,
    iconColor: '#4FC3F7',
    iconBgColor: '#E1F5FE'
  };

  const tasksCompletedData = [
    { date: 'Apr 1', tasks: 2 },
    { date: 'Apr 3', tasks: 3 },
    { date: 'Apr 5', tasks: 4 },
    { date: 'Apr 7', tasks: 3 },
    { date: 'Apr 9', tasks: 5 },
    { date: 'Apr 11', tasks: 6 },
    { date: 'Apr 13', tasks: 9 },
    { date: 'Apr 15', tasks: 7 },
    { date: 'Apr 17', tasks: 5 },
    { date: 'Apr 19', tasks: 4 },
    { date: 'Apr 21', tasks: 6 },
    { date: 'Apr 23', tasks: 7 },
    { date: 'Apr 25', tasks: 8 },
    { date: 'Apr 27', tasks: 7 },
    { date: 'Apr 30', tasks: 9 }
  ];

  const overdueByAssigneeData = [
    { name: 'Jason T.', tasks: 3.5, color: '#4680FF' },
    { name: 'Alicia P.', tasks: 3, color: '#DC2626' },
    { name: 'Me', tasks: 2.5, color: '#10B981' },
    { name: 'Mike W.', tasks: 1.8, color: '#DC2626' },
    { name: 'Sarah K.', tasks: 1.5, color: '#4680FF' }
  ];

  const overdueTasks = [
    {
      id: '#0876',
      title: 'Server Backup Setup',
      description: 'Server Backup',
      priority: 'High',
      assignee: 'Mike W.',
      avatar: 'MW',
      dueDate: 'Apr 20, 2024',
      dueTime: '10:1AM',
      status: 'Overdue'
    },
    {
      id: '#0987',
      title: 'Prepare Sales Report',
      description: 'Prepare Sales Report',
      priority: 'High',
      assignee: 'Me',
      avatar: 'ME',
      dueDate: 'Apr 24, 2024',
      dueTime: '8:36AM',
      status: 'Overdue'
    },
    {
      id: '#1102',
      title: 'UI Testing Phase',
      description: 'UI Testing Phase',
      priority: 'High',
      assignee: 'Jason T.',
      avatar: 'JT',
      dueDate: 'Apr 22, 2024',
      dueTime: '3:30PM',
      status: 'Overdue'
    },
    {
      id: '#1101',
      title: 'Review Client Feedback',
      description: 'Review Client Feedba',
      priority: 'High',
      assignee: 'Alicia P.',
      avatar: 'AP',
      dueDate: 'Apr 22, 2024',
      dueTime: '2:30AM',
      status: 'Overdue'
    },
    {
      id: '#0865',
      title: 'Update Support Docs',
      description: 'Update Support Docs',
      priority: 'High',
      assignee: 'Emily R.',
      avatar: 'ER',
      dueDate: 'Apr 20, 2024',
      dueTime: '2:00AM',
      status: 'Overdue'
    }
  ];

  const styles = {
    card: { backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    cardTitle: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.1rem' },
    filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' },
    inputGroup: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute' as const, left: '0.75rem', pointerEvents: 'none' as const },
    select: { 
      width: '100%', 
      padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
      border: '1px solid #E5E9F2', 
      borderRadius: '6px', 
      fontSize: '0.9rem', 
      outline: 'none', 
      fontFamily: 'inherit', 
      cursor: 'pointer', 
      backgroundColor: 'white' 
    },
    buttonOutline: { 
      padding: '0.625rem 1.25rem', 
      backgroundColor: 'white', 
      color: '#4680FF', 
      border: '1px solid #4680FF', 
      borderRadius: '6px', 
      fontWeight: '500', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      fontSize: '0.9rem', 
      transition: 'all 0.2s',
      justifyContent: 'center' as const
    },
    grid: { display: 'grid', gap: '1rem', marginBottom: '1.5rem' },
    gridTwo: { gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { 
      fontSize: '0.75rem', 
      fontWeight: '600', 
      color: '#6B7280', 
      textTransform: 'uppercase' as const, 
      letterSpacing: '0.5px', 
      padding: '0.75rem', 
      textAlign: 'left' as const, 
      backgroundColor: '#F9FAFB', 
      borderBottom: '1px solid #E5E9F2' 
    },
    td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
    badge: { padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block' },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      fontWeight: '600'
    },
    taskId: { color: '#4680FF', fontWeight: '600', cursor: 'pointer', textDecoration: 'none' },
    tableWrapper: { overflowX: 'auto' as const },
    buttonLight: { 
      padding: '0.5rem', 
      backgroundColor: '#F4F7FA', 
      color: '#6B7280', 
      border: 'none', 
      borderRadius: '6px', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      transition: 'background 0.2s' 
    }
  };

  return (
    <>
      {/* Summary Stats Cards */}
      <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
        {summaryStats.map((stat, index) => (
          <Col key={index} xs={12} sm={6} lg={3} className="d-flex">
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              iconBgColor={stat.iconBgColor}
              valueColor="#1F2937"
            />
          </Col>
        ))}
        <Col xs={12} sm={6} lg={3} className="d-flex">
          <div className="stat-card w-100" style={{ 
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem 1.5rem'
          }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="stat-label">{avgCompletionStat.title}</h6>
                <h2 className="stat-number" style={{ color: '#1F2937' }}>
                  {avgCompletionStat.value}
                </h2>
              </div>
              <div 
                className="stat-icon" 
                style={{ 
                  backgroundColor: avgCompletionStat.iconBgColor,
                  color: avgCompletionStat.iconColor
                }}
              >
                <avgCompletionStat.icon />
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Filter Bar */}
      <div style={styles.card}>
        <div style={styles.filterRow}>
          <div style={styles.inputGroup}>
            <Calendar size={16} color="#6B7280" style={styles.inputIcon} />
            <select style={styles.select}>
              <option>Apr 1, 2024 - Apr 30, 2024</option>
              <option>Mar 1, 2024 - Mar 31, 2024</option>
              <option>Feb 1, 2024 - Feb 29, 2024</option>
            </select>
          </div>
          
          <select style={{ ...styles.select, paddingLeft: '0.75rem' }}>
            <option>Assignee</option>
            <option>Jason T.</option>
            <option>Mike W.</option>
            <option>Alicia P.</option>
            <option>Me</option>
            <option>Sarah K.</option>
            <option>Emily R.</option>
          </select>
          
          <select style={{ ...styles.select, paddingLeft: '0.75rem' }}>
            <option>Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Overdue</option>
            <option>Completed</option>
          </select>
          
          <select style={{ ...styles.select, paddingLeft: '0.75rem' }}>
            <option>Priority</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          
          <select style={{ ...styles.select, paddingLeft: '0.75rem' }}>
            <option>Labels</option>
            <option>Bug</option>
            <option>Feature</option>
            <option>Enhancement</option>
          </select>
          
          <button 
            style={styles.buttonOutline}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{...styles.grid, ...styles.gridTwo}}>
        {/* Tasks Completed Chart */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h5 style={styles.cardTitle}>Tasks Completed</h5>
            <button 
              style={styles.buttonLight}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
            >
              <MoreVertical size={18} />
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={tasksCompletedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4680FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4680FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E9F2' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 10]}
              />
              <RechartsTooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E9F2',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="tasks" 
                stroke="#4680FF" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTasks)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Overdue by Assignee Chart */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h5 style={styles.cardTitle}>Overdue by Assignee</h5>
            <button 
              style={styles.buttonLight}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
            >
              <MoreVertical size={18} />
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overdueByAssigneeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E9F2" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E9F2' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 4]}
              />
              <RechartsTooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E9F2',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="tasks" 
                radius={[6, 6, 0, 0]}
                fill="#4680FF"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue Tasks Table */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h5 style={styles.cardTitle}>Overdue Tasks</h5>
        </div>
        
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Avatar</th>
                <th style={styles.th}>Task ID</th>
                <th style={styles.th}>Task Name</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Assignee</th>
                <th style={styles.th}>Due</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {overdueTasks.map((task) => (
                <tr 
                  key={task.id}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <td style={styles.td}>
                    <div style={styles.avatar}>{task.avatar}</div>
                  </td>
                  <td style={styles.td}>
                    <a href="#" style={styles.taskId}>{task.id}</a>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontWeight: '500', color: '#1F2937' }}>{task.title}</span>
                  </td>
                  <td style={styles.td}>{task.description}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B'
                    }}>
                      {task.priority}
                    </span>
                  </td>
                  <td style={styles.td}>{task.assignee}</td>
                  <td style={styles.td}>
                    <div>{task.dueDate}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>{task.dueTime}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: '#FEE2E2',
                      color: '#991B1B'
                    }}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TasksReports;
