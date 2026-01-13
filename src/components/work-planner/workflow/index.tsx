import React, { useState } from 'react';
import { 
  LayoutDashboard, ChevronDown, FileText, CheckSquare, 
  PieChart, AlertTriangle, Plus, MoreVertical, GripVertical,
  Link, Clock, Archive, X, ArrowRight
} from 'lucide-react';
import { Row, Col } from 'react-bootstrap';
import StatsCard from '@components/work-planner/stats-cards';

interface Status {
  id: number;
  name: string;
  color: string;
  tasks: any[];
}

interface Task {
  id: number;
  name: string;
  status: string;
  priority: string;
  assignee: string;
  avatar: string;
  color: string;
}

const WorkflowSettings = () => {
  const [draggedStatus, setDraggedStatus] = useState<Status | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  
  const [statuses, setStatuses] = useState<Status[]>([
    { id: 1, name: 'Backlog', color: '#9CA3AF', tasks: [] },
    { id: 2, name: 'To Do', color: '#93C5FD', tasks: [] },
    { id: 3, name: 'In Progress', color: '#FCD34D', tasks: [] },
    { id: 4, name: 'In Review', color: '#F87171', tasks: [] },
    { id: 5, name: 'QA', color: '#FCD34D', tasks: [] },
    { id: 6, name: 'Done', color: '#34D399', tasks: [] }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: 'Update Homepage Design', status: 'In Progress', priority: 'High', assignee: 'John D.', avatar: 'JD', color: '#FCD34D' },
    { id: 2, name: 'Fix Navigation Menu', status: 'To Do', priority: 'Medium', assignee: 'Sarah K.', avatar: 'SK', color: '#93C5FD' },
    { id: 3, name: 'Optimize Images', status: 'In Progress', priority: 'High', assignee: 'Alicia P.', avatar: 'AP', color: '#FCD34D' },
    { id: 4, name: 'Setup Analytics', status: 'In Review', priority: 'High', assignee: 'Mike W.', avatar: 'MW', color: '#F87171' },
    { id: 5, name: 'Mobile Responsiveness', status: 'QA', priority: 'High', assignee: 'Jason T.', avatar: 'JT', color: '#FCD34D' },
    { id: 6, name: 'Contact Form Integration', status: 'Done', priority: 'Medium', assignee: 'Sarah K.', avatar: 'SK', color: '#34D399' },
    { id: 7, name: 'SEO Optimization', status: 'Backlog', priority: 'Medium', assignee: 'John D.', avatar: 'JD', color: '#9CA3AF' },
    { id: 8, name: 'Add Blog Section', status: 'Backlog', priority: 'Medium', assignee: 'Alicia P.', avatar: 'AP', color: '#9CA3AF' },
    { id: 9, name: 'Security Audit', status: 'In Review', priority: 'High', assignee: 'Mike W.', avatar: 'MW', color: '#F87171' },
    { id: 10, name: 'Performance Testing', status: 'QA', priority: 'High', assignee: 'Jason T.', avatar: 'JT', color: '#FCD34D' },
    { id: 11, name: 'Documentation Update', status: 'Done', priority: 'Medium', assignee: 'Sarah K.', avatar: 'SK', color: '#34D399' },
    { id: 12, name: 'User Feedback Review', status: 'To Do', priority: 'Medium', assignee: 'John D.', avatar: 'JD', color: '#93C5FD' }
  ]);

  // Helper functions
  const getTasksByStatus = (statusName: string) => {
    return tasks.filter(task => task.status === statusName).length;
  };

  const getTotalTasksInStatuses = () => {
    return tasks.filter(task => statuses.some(s => s.name === task.status)).length;
  };

  const addNewStatus = () => {
    if (newStatusName.trim()) {
      const newStatus: Status = {
        id: Math.max(...statuses.map(s => s.id)) + 1,
        name: newStatusName.trim(),
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
        tasks: []
      };
      setStatuses([...statuses, newStatus]);
      setNewStatusName('');
    }
  };

  const deleteStatus = (statusId: number) => {
    if (confirm('Are you sure you want to delete this status? Tasks with this status will need to be reassigned.')) {
      setStatuses(statuses.filter(s => s.id !== statusId));
    }
  };

  const updateStatusColor = (statusId: number, newColor: string) => {
    setStatuses(statuses.map(s => s.id === statusId ? {...s, color: newColor} : s));
  };

  const filteredTasks = selectedStatusFilter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === selectedStatusFilter);

  const handleDragStart = (e: React.DragEvent, status: Status) => {
    setDraggedStatus(status);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedStatus) return;

    const newStatuses = [...statuses];
    const draggedIndex = newStatuses.findIndex(s => s.id === draggedStatus.id);
    
    newStatuses.splice(draggedIndex, 1);
    newStatuses.splice(targetIndex, 0, draggedStatus);
    
    setStatuses(newStatuses);
    setDraggedStatus(null);
  };

  const getPriorityStyle = (priority: string) => {
    switch(priority) {
      case 'High':
        return { bg: '#FEE2E2', color: '#991B1B', text: 'High' };
      case 'Medium':
        return { bg: '#FEF3C7', color: '#92400E', text: 'Medium' };
      case 'Marketing Campaign':
        return { bg: '#E0E7FF', color: '#3730A3', text: 'Marketing Campaign' };
      default:
        return { bg: '#F3F4F6', color: '#4B5563', text: priority };
    }
  };

  const styles = {
    container: { backgroundColor: '#F4F7FA', minHeight: '100vh' },
    header: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2', padding: '1rem 0' },
    headerInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' },
    headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    logoBox: { width: '36px', height: '36px', backgroundColor: '#4680FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
    breadcrumbText: { fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', margin: 0 },
    breadcrumbSeparator: { color: '#9CA3AF', margin: '0 0.5rem' },
    breadcrumbItem: { fontSize: '1.25rem', color: '#6B7280', textDecoration: 'none' },
    dropdown: { position: 'relative' as const, display: 'inline-block' },
    dropdownButton: { backgroundColor: '#F4F7FA', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500', color: '#1F2937', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    tabs: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
    tabsInner: { maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
    tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
    content: { maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '1rem' },
    statIcon: { width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    statInfo: { flex: 1 },
    statNumber: { fontSize: '2rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.25rem' },
    statLabel: { fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' },
    alert: { backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#92400E' },
    card: { backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', marginBottom: '0.5rem' },
    cardDescription: { fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem', lineHeight: '1.5' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '0.75rem', textAlign: 'left' as const, borderBottom: '1px solid #E5E9F2' },
    td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' },
    statusRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'move' },
    statusDot: { width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0 },
    statusName: { fontSize: '0.9rem', color: '#1F2937', fontWeight: '500' },
    badge: { padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block' },
    iconButton: { background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer', color: '#6B7280', borderRadius: '4px', display: 'flex', alignItems: 'center' },
    addButton: { width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '2px dashed #D1D5DB', borderRadius: '8px', color: '#6B7280', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.5rem', marginTop: '0.5rem', transition: 'all 0.2s' },
    statusList: { display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' },
    statusItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E9F2', cursor: 'move', transition: 'all 0.2s' },
    statusLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    statusActions: { display: 'flex', gap: '0.5rem' },
    newStatusInput: { width: '100%', padding: '0.75rem', border: '2px dashed #D1D5DB', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
    modalContent: { backgroundColor: 'white', borderRadius: '12px', padding: '2rem', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    modalTitle: { fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    modalDescription: { fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem' },
    mappingRow: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' },
    select: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'white' },
    modalFooter: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' },
    button: { padding: '0.75rem 1.5rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', border: 'none', transition: 'all 0.2s' },
    buttonPrimary: { backgroundColor: '#4680FF', color: 'white' },
    buttonSecondary: { backgroundColor: 'white', color: '#4680FF', border: '1px solid #4680FF' },
    buttonLight: { backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none' },
    twoColumn: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', backgroundColor: '#F3F4F6', border: '2px solid white' },
    checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4680FF' }
  };

  return (
    <div>
        {/* Stats Cards */}
        <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
          <Col xs={12} sm={6} lg={3} className="d-flex">
            <StatsCard
              title="Total Statuses"
              value={statuses.length}
              icon={FileText}
              iconColor="#4F46E5"
              iconBgColor="#EEF2FF"
              valueColor="#1F2937"
            />
          </Col>
          <Col xs={12} sm={6} lg={3} className="d-flex">
            <StatsCard
              title="Total Tasks"
              value={tasks.length}
              icon={CheckSquare}
              iconColor="#2563EB"
              iconBgColor="#DBEAFE"
              valueColor="#1F2937"
            />
          </Col>
          <Col xs={12} sm={6} lg={3} className="d-flex">
            <StatsCard
              title="Tasks in Workflow"
              value={getTotalTasksInStatuses()}
              icon={PieChart}
              iconColor="#0EA5E9"
              iconBgColor="#E0F2FE"
              valueColor="#1F2937"
            />
          </Col>
          <Col xs={12} sm={6} lg={3} className="d-flex">
            <StatsCard
              title="In Progress"
              value={tasks.filter(t => t.status === 'In Progress').length}
              icon={AlertTriangle}
              iconColor="#F59E0B"
              iconBgColor="#FEF3C7"
              valueColor="#1F2937"
            />
          </Col>
        </Row>

        {/* Info Banner */}
        <Row className="g-3" style={{ marginBottom: '1.5rem' }}>
          <Col xs={12}>
            <div style={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                <div style={{ 
                  backgroundColor: '#FEF3C7', 
                  borderRadius: '8px', 
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AlertTriangle size={20} color="#F59E0B" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1F2937', margin: 0, marginBottom: '0.25rem' }}>Workflow Management</h4>
                  <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: 0 }}>Define and manage workflow statuses. Drag to reorder, click to edit colors, or delete unused statuses.</p>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Main Content Grid */}
        <Row className="g-3">
          {/* Left Column - Task List */}
          <Col xs={12} lg={8}>
            <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={styles.cardTitle}>Tasks Overview</h3>
                <p style={{...styles.cardDescription, marginBottom: 0}}>
                  View all tasks organized by their current workflow status.
                </p>
              </div>
            </div>

            {/* Status Filter */}
            <div style={{ marginBottom: '1rem' }}>
              <select 
                style={styles.select}
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses ({tasks.length} tasks)</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.name}>
                    {status.name} ({getTasksByStatus(status.name)} tasks)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{...styles.th, width: '40px'}}></th>
                    <th style={styles.th}>Task</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Assignee</th>
                    <th style={{...styles.th, width: '80px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{...styles.td, textAlign: 'center', padding: '2rem', color: '#9CA3AF'}}>
                        No tasks found for this status
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task, index) => (
                    <tr key={task.id}>
                      <td style={styles.td}>
                        <input type="checkbox" style={styles.checkbox} />
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <GripVertical size={16} color="#9CA3AF" style={{ cursor: 'move' }} />
                          <div style={{...styles.statusDot, backgroundColor: task.color}} />
                          <span style={styles.statusName}>{task.name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: task.status === 'Overdue' ? '#FEE2E2' : task.status === 'In Review' ? '#E9D5FF' : task.status === 'To Do' ? '#DBEAFE' : task.status === 'In Progress' ? '#FEF3C7' : '#F3F4F6',
                          color: task.status === 'Overdue' ? '#991B1B' : task.status === 'In Review' ? '#6B21A8' : task.status === 'To Do' ? '#1E40AF' : task.status === 'In Progress' ? '#92400E' : '#4B5563'
                        }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: getPriorityStyle(task.priority).bg,
                          color: getPriorityStyle(task.priority).color
                        }}>
                          {getPriorityStyle(task.priority).text}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            ...styles.avatar,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>{task.avatar}</div>
                          <span style={{ fontSize: '0.875rem', color: '#4B5563' }}>{task.assignee}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button 
                            style={styles.iconButton}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Link size={16} />
                          </button>
                          <button 
                            style={styles.iconButton}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#F9FAFB', borderRadius: '6px', fontSize: '0.85rem', color: '#6B7280' }}>
              💡 <strong>Tip:</strong> Tasks automatically update their color based on their assigned status. Manage statuses in the panel on the right.
            </div>
          </div>
          </Col>

          {/* Right Column - Status Manager */}
          <Col xs={12} lg={4}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Status Management</h3>
              <p style={styles.cardDescription}>
                Create, edit, and organize workflow statuses. Each status has a unique color to help identify tasks at a glance.
              </p>

              <div style={styles.statusList}>
                {statuses.map((status, index) => (
                  <div
                    key={status.id}
                    style={styles.statusItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, status)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                      e.currentTarget.style.borderColor = '#E5E9F2';
                    }}
                  >
                    <div style={styles.statusLeft}>
                      <GripVertical size={18} color="#9CA3AF" style={{ cursor: 'grab' }} />
                      <input 
                        type="color" 
                        value={status.color}
                        onChange={(e) => updateStatusColor(status.id, e.target.value)}
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          border: '2px solid #E5E9F2', 
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        title="Click to change color"
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={styles.statusName}>{status.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {getTasksByStatus(status.name)} {getTasksByStatus(status.name) === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>
                    <div style={styles.statusActions}>
                      <button 
                        style={styles.iconButton}
                        onClick={() => deleteStatus(status.id)}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#FEE2E2';
                          e.currentTarget.style.color = '#DC2626';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6B7280';
                        }}
                        title="Delete status"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Enter new status name..."
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewStatus()}
                  style={{...styles.newStatusInput, flex: 1, border: '1px solid #E5E9F2'}}
                  onFocus={(e) => e.target.style.borderColor = '#4680FF'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E9F2'}
                />
                <button
                  onClick={addNewStatus}
                  disabled={!newStatusName.trim()}
                  style={{
                    ...styles.button,
                    ...styles.buttonPrimary,
                    opacity: newStatusName.trim() ? 1 : 0.5,
                    cursor: newStatusName.trim() ? 'pointer' : 'not-allowed'
                  }}
                  onMouseOver={(e) => {
                    if (newStatusName.trim()) {
                      e.currentTarget.style.backgroundColor = '#3D6FD9';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#4680FF';
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '6px', fontSize: '0.85rem', color: '#0369A1' }}>
                💡 <strong>Quick Actions:</strong>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                  <li>Drag statuses to reorder them</li>
                  <li>Click color box to customize status color</li>
                  <li>Click X to delete unused statuses</li>
                </ul>
              </div>
            </div>

            {/* Workflow Insights */}
            <div style={styles.card} className="mt-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <PieChart size={20} color="#6B7280" />
                <h3 style={{...styles.cardTitle, marginBottom: 0}}>Workflow Distribution</h3>
              </div>
              <p style={styles.cardDescription}>
                Current task distribution across all workflow statuses.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {statuses.map((status) => {
                  const taskCount = getTasksByStatus(status.name);
                  const percentage = tasks.length > 0 ? (taskCount / tasks.length * 100) : 0;
                  return (
                    <div key={status.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{...styles.statusDot, width: '12px', height: '12px', backgroundColor: status.color}} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1F2937' }}>{status.name}</span>
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                          {taskCount} {taskCount === 1 ? 'task' : 'tasks'} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: status.color, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {tasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
                  No tasks available to show distribution
                </div>
              )}
            </div>
          </Col>
        </Row>
    </div>
  );
};

export default WorkflowSettings;