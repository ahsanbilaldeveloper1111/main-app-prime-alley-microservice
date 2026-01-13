import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import  { useState } from 'react';
import { 
  LayoutDashboard, Plus, LayoutGrid, ChevronDown, Search,
  MoreVertical, Clock, AlertCircle, CheckCircle2, 
  FileText, Users, Calendar, TrendingUp, Filter, X, User, Grid3x3, Bell, Folder
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip 
} from 'recharts';
import { Row, Col, Modal, Button, Container } from 'react-bootstrap';
import StatsCard from '@components/work-planner/stats-cards';
import KanbanBoard from '@components/work-planner/board-view';
import TasksReports from '@components/work-planner/tasks-reports';

const WorkPlannerProjectsDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedProject, setSelectedProject] = useState('Website Redesign');
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const [showMoreDropdown, setShowMoreDropdown] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showTasksModal, setShowTasksModal] = useState(false);
    
    const statusCards = [
      { title: 'Open', count: 54, icon: FileText, color: '#4680FF', bgLight: '#E3F2FD' },
      { title: 'In Progress', count: 22, icon: Clock, color: '#FFB64D', bgLight: '#FFF3E0' },
      { title: 'Done (30d)', count: 180, icon: CheckCircle2, color: '#2CA87F', bgLight: '#E8F5E9' },
      { title: 'Overdue', count: 6, icon: AlertCircle, color: '#DC2626', bgLight: '#FFEBEE' },
      { title: 'Unassigned', count: 3, icon: Users, color: '#4FC3F7', bgLight: '#E1F5FE' }
    ];
  
    const tasksByStatus = [
      { name: 'Backlog', value: 8, color: '#9E9E9E' },
      { name: 'To Do', value: 16, color: '#4680FF' },
      { name: 'In Progress', value: 22, color: '#FFB64D' },
      { name: 'In Review', value: 10, color: '#9C27B0' },
      { name: 'Done', value: 138, color: '#2CA87F' }
    ];
  
    const workloadData = [
      { name: 'Jason T.', initials: 'JT', backlog: 2, todo: 3, progress: 3, review: 0, done: 0 },
      { name: 'Me', initials: 'ME', backlog: 1, todo: 2, progress: 4, review: 2, done: 1 },
      { name: 'Mike W.', initials: 'MW', backlog: 1, todo: 3, progress: 2, review: 1, done: 1 },
      { name: 'Alicia P.', initials: 'AP', backlog: 1, todo: 1, progress: 1, review: 2, done: 0 },
      { name: 'John D.', initials: 'JD', backlog: 0, todo: 1, progress: 1, review: 1, done: 0 },
      { name: 'David L.', initials: 'DL', backlog: 0, todo: 1, progress: 0, review: 2, done: 0 },
      { name: 'Sarah K.', initials: 'SK', backlog: 0, todo: 1, progress: 1, review: 0, done: 0 }
    ];
  
    const allActivity = [
      { id: 1, user: 'Mike W.', initials: 'MW', color: '#48bb78', action: 'moved', task: '#0876 Server Backup Setup', status: 'In Review', time: '2 hours ago' },
      { id: 2, user: 'Sarah K.', initials: 'SK', color: '#f56565', action: 'was assigned to', task: 'Update User Guide', time: 'Yesterday' },
      { id: 3, user: 'Jason T.', initials: 'JT', color: '#4299e1', action: 'changed label of', task: '#1121 Bug Fix for Mobile', badge: 'App', time: '2 days ago' },
      { id: 4, user: 'Laura N.', initials: 'LN', color: '#ed64a6', action: 'completed', task: '#0788 Social Media Visuals', time: '2 days ago' },
      { id: 5, user: 'John D.', initials: 'JD', color: '#667eea', action: 'commented on', task: '#0921 Database Migration', time: '3 days ago' },
      { id: 6, user: 'Emily R.', initials: 'ER', color: '#9f7aea', action: 'created', task: '#1234 New Feature Request', time: '3 days ago' },
      { id: 7, user: 'Tom H.', initials: 'TH', color: '#fc8181', action: 'updated', task: '#0654 API Documentation', time: '4 days ago' },
      { id: 8, user: 'Lisa M.', initials: 'LM', color: '#ed8936', action: 'completed', task: '#0432 Code Review', time: '5 days ago' }
    ];
  
    const recentActivity = allActivity.slice(0, 4);
  
    const allOverdueTasks = [
      { id: '#0876', title: 'Server Backup Setup', priority: 'High', assignee: 'Mike W.', dueDate: 'Apr 20, 2024' },
      { id: '#0987', title: 'Prepare Sales Report', priority: 'Medium', assignee: 'Me', dueDate: 'Apr 24, 2024' },
      { id: '#1102', title: 'UI Testing Phase', priority: 'High', assignee: 'Jason T.', dueDate: 'Apr 22, 2024' },
      { id: '#1101', title: 'Review Client Feedback', priority: 'High', assignee: 'Alicia P.', dueDate: 'Apr 22, 2024' },
      { id: '#0865', title: 'Update Support Docs', priority: 'Low', assignee: 'Emily R.', dueDate: 'Apr 20, 2024' },
      { id: '#0923', title: 'Security Audit', priority: 'High', assignee: 'Tom H.', dueDate: 'Apr 18, 2024' },
      { id: '#0745', title: 'Update Dependencies', priority: 'Medium', assignee: 'Lisa M.', dueDate: 'Apr 19, 2024' },
      { id: '#0632', title: 'Performance Testing', priority: 'High', assignee: 'John D.', dueDate: 'Apr 21, 2024' }
    ];
  
    const overdueTasks = allOverdueTasks.slice(0, 5);
  
    const styles = {
      container: { backgroundColor: '#F4F7FA', minHeight: '100vh', paddingBottom: '2rem' },
      header: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2', padding: '1rem 0' },
      headerInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' },
      headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '1rem' },
      headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
      logoBox: { width: '40px', height: '40px', backgroundColor: '#4680FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 },
      title: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.5rem' },
      dropdown: { position: 'relative' as const, display: 'inline-block' },
      dropdownButton: { backgroundColor: '#F4F7FA', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' },
      dropdownMenu: { position: 'absolute' as const, top: '100%', left: 0, marginTop: '0.5rem', backgroundColor: '#fff', border: '1px solid #E5E9F2', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '180px', zIndex: 1000 },
      dropdownItem: { padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#4B5563', borderBottom: '1px solid #F3F4F6', transition: 'background 0.2s' },
      headerRight: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as const },
      button: { padding: '0.625rem 1.25rem', backgroundColor: '#4680FF', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'background 0.2s' },
      buttonOutline: { padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#4680FF', border: '1px solid #4680FF', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'all 0.2s' },
      buttonLight: { padding: '0.625rem', backgroundColor: '#F4F7FA', color: '#6B7280', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' },
      tabsContainer: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
      tabsInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
      tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
      contentContainer: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', marginTop: '1.5rem' },
      grid: { display: 'grid', gap: '1rem', marginBottom: '1.5rem' },
      gridFive: { gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' },
      gridTwo: { gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' },
      card: { backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem' },
      cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
      cardTitle: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.1rem' },
      statusCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'start' },
      statusInfo: { flex: 1 },
      statusLabel: { color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: '500' },
      statusCount: { fontSize: '2rem', fontWeight: '600', color: '#1F2937' },
      iconBox: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
      filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' },
      input: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
      select: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'white' },
      inputGroup: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
      inputIcon: { position: 'absolute' as const, left: '0.75rem', pointerEvents: 'none' as const },
      inputWithIcon: { paddingLeft: '2.5rem' },
      chartContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' },
      legendItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
      legendDot: { width: '12px', height: '12px', borderRadius: '50%', marginRight: '0.5rem' },
      badge: { padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block' },
      table: { width: '100%', borderCollapse: 'collapse' as const },
      th: { fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '0.75rem', textAlign: 'left' as const, backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E9F2' },
      td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
      activityItem: { display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' },
      activityAvatar: { fontSize: '2rem', flexShrink: 0 },
      activityContent: { flex: 1 },
      activityText: { fontSize: '0.9rem', color: '#4B5563', marginBottom: '0.25rem', lineHeight: '1.5' },
      activityTime: { fontSize: '0.8rem', color: '#9CA3AF' },
      link: { color: '#4680FF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' },
      tableWrapper: { overflowX: 'auto' as const }
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects Dashboard" />

    <>
      <style>{`
        .stat-card {
          border: none;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #6B7280;
          font-weight: 500;
          margin: 0;
        }
      `}</style>
     
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <div style={styles.headerContent}>
              <div style={styles.headerLeft}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Folder size={32} className="text-primary" style={{ marginRight: '0.5rem' }} />
                <h2 className="mb-0 fw-bold">Projects</h2>
              </div>
              
              <div style={styles.dropdown}>
                <button 
                  style={styles.dropdownButton}
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
                >
                  {selectedProject}
                  <ChevronDown size={16} />
                </button>
                {showProjectDropdown && (
                  <div style={styles.dropdownMenu}>
                    <div 
                      style={styles.dropdownItem}
                      onClick={() => { setSelectedProject('Website Redesign'); setShowProjectDropdown(false); }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      Website Redesign
                    </div>
                    <div 
                      style={styles.dropdownItem}
                      onClick={() => { setSelectedProject('Mobile App'); setShowProjectDropdown(false); }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      Mobile App
                    </div>
                    <div 
                      style={{...styles.dropdownItem, borderBottom: 'none'}}
                      onClick={() => { setSelectedProject('API Integration'); setShowProjectDropdown(false); }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      API Integration
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div style={styles.headerRight}>
              <Button variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={18} />
                <span>Create Task</span>
              </Button>
              
              <Button 
                variant="outline-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => setActiveTab('board')}
              >
                <LayoutGrid size={18} />
                Board View
              </Button>
              
              <div style={styles.dropdown}>
                <button 
                  style={styles.buttonLight}
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
                >
                  <MoreVertical size={18} />
                </button>
                {showMoreDropdown && (
                  <div style={{...styles.dropdownMenu, right: 0, left: 'auto'}}>
                    <div 
                      style={styles.dropdownItem}
                      onClick={() => setShowMoreDropdown(false)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      Export Data
                    </div>
                    <div 
                      style={{...styles.dropdownItem, borderBottom: 'none'}}
                      onClick={() => setShowMoreDropdown(false)}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      Settings
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsInner}>
          {['Overview', 'Board', 'List', 'Reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              style={{
                ...styles.tab,
                color: activeTab === tab.toLowerCase() ? '#4680FF' : '#6B7280',
                borderBottom: activeTab === tab.toLowerCase() ? '2px solid #4680FF' : '2px solid transparent'
              } as React.CSSProperties}
              onMouseOver={(e) => {
                if (activeTab !== tab.toLowerCase()) {
                  e.currentTarget.style.color = '#4680FF';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.toLowerCase()) {
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.contentContainer}>
        {activeTab === 'overview' ? (
          <>
        {/* Status Cards */}
        <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
          <Col xs={12} sm={6} lg className="d-flex">
            <StatsCard
              title="Open"
              value={54}
              icon={FileText}
              iconColor="#4680FF"
              iconBgColor="#E3F2FD"
              valueColor="#1F2937"
            />
          </Col>
          <Col xs={12} sm={6} lg className="d-flex">
            <StatsCard
              title="In Progress"
              value={22}
              icon={Clock}
              iconColor="#FFB64D"
              iconBgColor="#FFF3E0"
              valueColor="#1F2937"
            />
          </Col>
          <Col xs={12} sm={6} lg className="d-flex">
            <StatsCard
              title="Done (30d)"
              value={180}
              icon={CheckCircle2}
              iconColor="#2CA87F"
              iconBgColor="#E8F5E9"
              valueColor="#1F2937"
            />
          </Col>
          <Col xs={12} sm={6} lg className="d-flex">
            <StatsCard
              title="Overdue"
              value={6}
              icon={AlertCircle}
              iconColor="#DC2626"
              iconBgColor="#FFEBEE"
              valueColor="#1F2937"
            />
          </Col>
          <Col xs={12} sm={6} lg className="d-flex">
            <StatsCard
              title="Unassigned"
              value={3}
              icon={Users}
              iconColor="#4FC3F7"
              iconBgColor="#E1F5FE"
              valueColor="#1F2937"
            />
          </Col>
        </Row>

        {/* Filters */}
        <div style={styles.card}>
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
              <option>Jason T.</option>
              <option>Mike W.</option>
              <option>Alicia P.</option>
            </select>
            
            <select style={styles.select}>
              <option>Label</option>
              <option>Bug</option>
              <option>Feature</option>
              <option>Enhancement</option>
            </select>
            
            <select style={styles.select}>
              <option>Priority: This Month</option>
              <option>High Priority</option>
              <option>Medium Priority</option>
              <option>Low Priority</option>
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
        </div>

        {/* Charts Row */}
        <div style={{...styles.grid, ...styles.gridTwo}}>
          {/* Tasks by Status */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Tasks by Status</h5>
              <button 
                style={{...styles.buttonLight, padding: '0.5rem'}}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
              >
                <MoreVertical size={18} />
              </button>
            </div>
            
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
          </div>

          {/* Workload by Assignee */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Workload by Assignee</h5>
              <button 
                style={{...styles.buttonLight, padding: '0.5rem'}}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E5E9F2'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F4F7FA'}
              >
                <MoreVertical size={18} />
              </button>
            </div>
            
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
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{...styles.grid, ...styles.gridTwo}}>
          {/* Recent Activity */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Recent Activity</h5>
              <span 
                style={{...styles.link, cursor: 'pointer'}}
                onClick={() => setShowActivityModal(true)}
              >
                View All →
              </span>
            </div>
            
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {recentActivity.map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: activity.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {activity.initials}
                  </div>
                  
                  <div style={styles.activityContent}>
                    <div style={styles.activityText}>
                      <strong style={{ color: '#1F2937' }}>{activity.user}</strong>
                      {' '}{activity.action}{' '}
                      <strong style={{ color: '#1F2937' }}>{activity.task}</strong>
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
                      {activity.badge && (
                        <>
                          {' '}
                          <span style={{
                            padding: '0.125rem 0.5rem',
                            backgroundColor: '#F3E8FF',
                            color: '#7C3AED',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {activity.badge}
                          </span>
                        </>
                      )}
                    </div>
                    <div style={styles.activityTime}>{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Overdue Tasks */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h5 style={styles.cardTitle}>Top Overdue Tasks</h5>
              <span 
                style={{...styles.link, cursor: 'pointer'}}
                onClick={() => setShowTasksModal(true)}
              >
                View All →
              </span>
            </div>
            
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
                  {overdueTasks.map((task) => (
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
          </div>
        </div>
        </>
        ) : activeTab === 'board' ? (
          <>
            <KanbanBoard embedded={true} />
            
            {/* Bottom Row - Recent Activity & Overdue Tasks */}
            <div style={{...styles.grid, ...styles.gridTwo, marginTop: '1.5rem'}}>
              {/* Recent Activity */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h5 style={styles.cardTitle}>Recent Activity</h5>
                  <span 
                    style={{...styles.link, cursor: 'pointer'}}
                    onClick={() => setShowActivityModal(true)}
                  >
                    View All →
                  </span>
                </div>
                
                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} style={styles.activityItem}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: activity.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {activity.initials}
                      </div>
                      
                      <div style={styles.activityContent}>
                        <div style={styles.activityText}>
                          <strong style={{ color: '#1F2937' }}>{activity.user}</strong>
                          {' '}{activity.action}{' '}
                          <strong style={{ color: '#1F2937' }}>{activity.task}</strong>
                          {activity.status && (
                            <span style={{
                              ...styles.badge,
                              backgroundColor: '#D1F2EB',
                              color: '#0C7064',
                              marginLeft: '0.5rem'
                            }}>
                              {activity.status}
                            </span>
                          )}
                          {activity.badge && (
                            <span style={{
                              ...styles.badge,
                              backgroundColor: '#FFF3CD',
                              color: '#856404',
                              marginLeft: '0.5rem'
                            }}>
                              {activity.badge}
                            </span>
                          )}
                        </div>
                        <div style={styles.activityTime}>{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Overdue Tasks */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h5 style={styles.cardTitle}>Top Overdue Tasks</h5>
                  <span 
                    style={{...styles.link, cursor: 'pointer'}}
                    onClick={() => setShowTasksModal(true)}
                  >
                    View All →
                  </span>
                </div>
                
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
                      {overdueTasks.map((task) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'list' ? (
          <div style={styles.card}>
            <h5 style={styles.cardTitle}>List View</h5>
            <p style={{ color: '#6B7280' }}>List view coming soon...</p>
          </div>
        ) : activeTab === 'reports' ? (
          <TasksReports embedded={true} />
        ) : null}
      </div>
      </div>

      {/* Recent Activity Modal */}
      <Modal show={showActivityModal} onHide={() => setShowActivityModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>All Recent Activity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            {allActivity.map((activity) => (
              <div key={activity.id} style={styles.activityItem}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: activity.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {activity.initials}
                </div>
                
                <div style={styles.activityContent}>
                  <div style={styles.activityText}>
                    <strong style={{ color: '#1F2937' }}>{activity.user}</strong>
                    {' '}{activity.action}{' '}
                    <strong style={{ color: '#1F2937' }}>{activity.task}</strong>
                    {activity.status && (
                      <span style={{
                        ...styles.badge,
                        backgroundColor: '#D1F2EB',
                        color: '#0C7064',
                        marginLeft: '0.5rem'
                      }}>
                        {activity.status}
                      </span>
                    )}
                    {activity.badge && (
                      <span style={{
                        ...styles.badge,
                        backgroundColor: '#FFF3CD',
                        color: '#856404',
                        marginLeft: '0.5rem'
                      }}>
                        {activity.badge}
                      </span>
                    )}
                  </div>
                  <div style={styles.activityTime}>{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActivityModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* All Overdue Tasks Modal */}
      <Modal show={showTasksModal} onHide={() => setShowTasksModal(false)} size="lg">
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
                {allOverdueTasks.map((task) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTasksModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>

    </React.Fragment>
  );
};

WorkPlannerProjectsDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjectsDashboard;
