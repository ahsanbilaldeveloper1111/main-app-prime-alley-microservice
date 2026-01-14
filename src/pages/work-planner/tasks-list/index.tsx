import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import  { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Table, 
  Badge, 
  Dropdown,
  Nav,
  Offcanvas,
  InputGroup
} from 'react-bootstrap';
import { 
  CheckSquare, 
  Plus, 
  FolderPlus, 
  ChevronDown, 
  Search, 
  X,
  MoreVertical,
  User,
  Calendar,
  AlertCircle,
  CalendarDays,
  Users,
  Star,
  Grid3x3,
  Bell
} from 'lucide-react';
import CreateTaskModal from '@components/work-planner/createtask-modal';

interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High';
  project: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string;
  assignees?: Array<{ name: string; initials: string }>;
  description?: string;
  comments?: number;
}


const TasksList = () => {

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '#1023',
      title: 'Fix login issue',
      status: 'In Progress',
      priority: 'High',
      project: 'Website Redesign',
      assignee: 'John D.',
      assigneeInitials: 'JD',
      dueDate: 'Apr 25, 2024',
      assignees: [
        { name: 'John D.', initials: 'JD' },
        { name: 'Sarah K.', initials: 'SK' }
      ],
      description: 'Fix authentication issues on login page',
      comments: 3
    },
    {
      id: '#0987',
      title: 'Prepare Sales Report',
      status: 'To Do',
      priority: 'Medium',
      project: 'Sales Update',
      assignee: 'Me',
      assigneeInitials: 'ME',
      dueDate: 'Apr 24, 2024'
    },
    {
      id: '#1154',
      title: 'Customer Onboarding',
      status: 'In Review',
      priority: 'High',
      project: 'Client Portal',
      assignee: 'Alicia P.',
      assigneeInitials: 'AP',
      dueDate: 'Apr 23, 2024'
    },
    {
      id: '#0876',
      title: 'Server Backup Setup',
      status: 'Overdue',
      priority: 'High',
      project: 'IT Infrastructure',
      assignee: 'Mike W.',
      assigneeInitials: 'MW',
      dueDate: 'Apr 20, 2024'
    },
    {
      id: '#1090',
      title: 'Update User Guide',
      status: 'In Progress',
      priority: 'Low',
      project: 'Product Launch',
      assignee: 'Sarah K.',
      assigneeInitials: 'SK',
      dueDate: 'Apr 27, 2024'
    },
    {
      id: '#0945',
      title: 'Schedule Team Meeting',
      status: 'To Do',
      priority: 'Medium',
      project: 'Marketing Campaign',
      assignee: 'Me',
      assigneeInitials: 'ME',
      dueDate: 'Apr 24, 2024'
    },
    {
      id: '#1121',
      title: 'Bug Fix for Mobile App',
      status: 'In Progress',
      priority: 'High',
      project: 'Mobile App Dev',
      assignee: 'Jason T.',
      assigneeInitials: 'JT',
      dueDate: 'Apr 21, 2024'
    },
    {
      id: '#0843',
      title: 'Review Support Tickets',
      status: 'To Do',
      priority: 'Low',
      project: 'Customer Support',
      assignee: 'Emily R.',
      assigneeInitials: 'ER',
      dueDate: 'Apr 23, 2024'
    }
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0]);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [activeTab, setActiveTab] = useState('My Work');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All Projects');
  const [filterAssignee, setFilterAssignee] = useState('All Assignees');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterPriority, setFilterPriority] = useState('All Priority');
  const [filterDueDate, setFilterDueDate] = useState('All Dates');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const stats = {
    openTasks: 128,
    overdue: 12,
    dueThisWeek: 34,
    unassigned: 9,
    highPriority: 17
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'To Do': return 'info';
      case 'In Progress': return 'warning';
      case 'In Review': return 'secondary';
      case 'Overdue': return 'danger';
      default: return 'primary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const clearFilters = () => {
    setFilterProject('All Projects');
    setFilterAssignee('All Assignees');
    setFilterStatus('All Status');
    setFilterPriority('All Priority');
    setFilterDueDate('All Dates');
    setSearchTerm('');
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'All Projects' || task.project === filterProject;
    const matchesAssignee = filterAssignee === 'All Assignees' || task.assignee === filterAssignee;
    const matchesStatus = filterStatus === 'All Status' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All Priority' || task.priority === filterPriority;
    
    return matchesSearch && matchesProject && matchesAssignee && matchesStatus && matchesPriority;
  });

  const projects = ['All Projects', ...Array.from(new Set(tasks.map(t => t.project)))];
  const assignees = ['All Assignees', ...Array.from(new Set(tasks.map(t => t.assignee)))];
  const statuses = ['All Status', 'To Do', 'In Progress', 'In Review', 'Overdue'];
  const priorities = ['All Priority', 'Low', 'Medium', 'High'];

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />

      <>
      <style>{`
       
        
        .header-section {
          background-color: white;
          padding: 1.5rem 0;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .stat-card {
          border: none;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          height: 100%;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          min-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .stat-card.open-tasks {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        }
        
        .stat-card.overdue {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }
        
        .stat-card.due-week {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }
        
        .stat-card.unassigned {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
        }
        
        .stat-card.high-priority {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .stat-icon.open-tasks {
          background-color: #10b981;
          color: #ffffff;
        }

        .stat-icon.overdue {
          background-color: #ef4444;
          color: #ffffff;
        }
        
        .stat-icon.due-week {
          background-color: #3b82f6;
          color: #ffffff;
        }
        
        .stat-icon.unassigned {
          background-color: #f97316;
          color: #ffffff;
        }
        
        .stat-icon.high-priority {
          background-color: #a855f7;
          color: #ffffff;
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin: 0.5rem 0 0.25rem 0;
        }
        
        .stat-label {
          font-size: 0.875rem;
          opacity: 0.8;
          margin: 0;
        }
        
        .tabs-section {
          background-color: white;
          padding: 1rem 1.5rem 0 1.5rem;
          border-radius: 12px 12px 0 0;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .nav-tabs {
          border: none;
        }
        
        .nav-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          background: transparent;
        }
        
        .nav-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 3px solid #3b82f6;
        }
        
        .table-container {
          background-color: white;
          border-radius: 0 0 12px 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .tasks-table {
          margin: 0;
        }
        
        .tasks-table thead th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 1rem;
          white-space: nowrap;
        }
        
        .tasks-table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .tasks-table tbody tr {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .tasks-table tbody tr:hover {
          background-color: #f8fafc;
        }
        
        .task-id {
          font-weight: 600;
          color: #334155;
        }
        
        .assignee-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 0.5rem;

        }
        
        .task-detail-panel {
          width: 500px;
        }
        
        .task-detail-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 2px solid #e2e8f0;
          background-color: #f8fafc;
        }
        
        .task-detail-body {
          padding: 1.5rem;
          background-color: #ffffff;
        }
        
        .detail-section {
          margin-bottom: 1.25rem;
          padding: 1rem;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-bottom: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .assignee-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .assignee-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .add-assignee {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #e2e8f0;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .add-assignee:hover {
          background-color: #cbd5e1;
        }
        
        .activity-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        
        .activity-date {
          color: #94a3b8;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .detail-tabs {
          border-bottom: 2px solid #e2e8f0;
          margin: 1.5rem -1.5rem 1.5rem -1.5rem;
          padding: 0 1.5rem;
        }
        
        .detail-tabs .nav-link {
          color: #64748b;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.75rem 1rem;
          font-weight: 500;
          font-size: 0.875rem;
          background: transparent;
          margin-bottom: -2px;
        }
        
        .detail-tabs .nav-link.active {
          color: #3b82f6;
          background: transparent;
          border-bottom: 2px solid #3b82f6;
        }
        
        .activity-section {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .task-detail-panel {
            width: 100%;
          }
          
          .stat-card {
            margin-bottom: 1rem;
          }
          
          .table-responsive {
            font-size: 0.875rem;
          }
        }
           .table-responsive .table th:last-child, .table-responsive .table td:last-child {
          min-width: initial !important;
        }
        .table-responsive .table th:first-child, .table-responsive .table td:first-child {
          min-width: initial !important;
          max-width: initial !important;
        }
      `}</style>

     

      <div className="task-dashboard">
        <div className="header-section">
          <Container fluid>
            <Row className="align-items-center mb-4">
              <Col>
                <div className="d-flex align-items-center">
                  <CheckSquare size={32} className="text-primary me-2" />
                  <h2 className="mb-0 fw-bold">Tasks</h2>
                </div>
              </Col>
              <Col xs="auto">
                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => setShowCreateTask(true)}
                  >
                    <Plus size={18} />
                    <span>Create Task</span>
                  </Button>
                  
                  <Button variant="outline-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderPlus size={18} />
                    <span>Create Project</span>
                  </Button>
                </div>
              </Col>
            </Row>

            <Row className="g-3">
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card open-tasks w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Open Tasks</h6>
                      <h2 className="stat-number" style={{ color: '#059669' }}>{stats.openTasks}</h2>
                    </div>
                    <div className="stat-icon open-tasks">
                      <CheckSquare />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card overdue w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Overdue</h6>
                      <h2 className="stat-number" style={{ color: '#dc2626' }}>{stats.overdue}</h2>
                    </div>
                    <div className="stat-icon overdue">
                      <AlertCircle />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card due-week w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Due This Week</h6>
                      <h2 className="stat-number" style={{ color: '#2563eb' }}>{stats.dueThisWeek}</h2>
                    </div>
                    <div className="stat-icon due-week">
                      <CalendarDays />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card unassigned w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">Unassigned</h6>
                      <h2 className="stat-number" style={{ color: '#ea580c' }}>{stats.unassigned}</h2>
                    </div>
                    <div className="stat-icon unassigned">
                      <Users />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg className="d-flex">
                <Card className="stat-card high-priority w-100">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="stat-label">High Priority</h6>
                      <h2 className="stat-number" style={{ color: '#9333ea' }}>{stats.highPriority}</h2>
                    </div>
                    <div className="stat-icon high-priority">
                      <Star />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>

        <Container fluid>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap' as const,
              gap: '1rem'
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 150px' }}>
                <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    paddingLeft: '2.5rem',
                    border: '1px solid #E5E9F2',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#4680FF'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#E5E9F2'}
                />
              </div>

              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                style={{
                  flex: '1 1 130px',
                  padding: '0.75rem',
                  border: '1px solid #E5E9F2',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Project</option>
                {projects.map(project => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>

              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                style={{
                  flex: '1 1 130px',
                  padding: '0.75rem',
                  border: '1px solid #E5E9F2',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Assignee</option>
                {assignees.map(assignee => (
                  <option key={assignee} value={assignee}>
                    {assignee}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  flex: '1 1 120px',
                  padding: '0.75rem',
                  border: '1px solid #E5E9F2',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{
                  flex: '1 1 120px',
                  padding: '0.75rem',
                  border: '1px solid #E5E9F2',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Priority</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>

              <select
                value={filterDueDate}
                onChange={(e) => setFilterDueDate(e.target.value)}
                style={{
                  flex: '1 1 140px',
                  padding: '0.75rem',
                  border: '1px solid #E5E9F2',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  backgroundColor: 'white'
                }}
              >
                <option value="All Dates">Due: All Dates</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Overdue">Overdue</option>
              </select>

              <button
                onClick={clearFilters}
                style={{
                  flex: '0 1 auto',
                  padding: '0.625rem 1rem',
                  backgroundColor: 'white',
                  color: '#4680FF',
                  border: '1px solid #4680FF',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap' as const
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Clear Filters
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="tabs-section">
            <Nav variant="tabs">
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'My Work'}
                  onClick={() => setActiveTab('My Work')}
                >
                  My Work
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'All Tasks'}
                  onClick={() => setActiveTab('All Tasks')}
                >
                  All Tasks
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'Activity'}
                  onClick={() => setActiveTab('Activity')}
                >
                  Activity
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <div className="table-container">
            <div className="table-responsive">
              <Table className="tasks-table" hover>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Task ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Project</th>
                    <th>Assignee</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedTasks.has(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                        />
                      </td>
                      <td className="task-id" onClick={() => handleTaskClick(task)}>{task.id}</td>
                      <td onClick={() => handleTaskClick(task)}>{task.title}</td>
                      <td onClick={() => handleTaskClick(task)}>
                        <Badge bg={getStatusVariant(task.status)} className="px-3 py-2">
                          {task.status}
                        </Badge>
                      </td>
                      <td onClick={() => handleTaskClick(task)}>
                        <Badge bg={getPriorityVariant(task.priority)} className="px-3 py-2">
                          {task.priority}
                        </Badge>
                      </td>
                      <td onClick={() => handleTaskClick(task)}>{task.project}</td>
                      <td onClick={() => handleTaskClick(task)}>
                        <div className="d-flex align-items-center">
                          <span className="assignee-avatar">{task.assigneeInitials}</span>
                          <span>{task.assignee}</span>
                        </div>
                      </td>
                      <td onClick={() => handleTaskClick(task)}>{task.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </Container>
      </div>

      <Offcanvas 
        show={showTaskDetail} 
        onHide={() => setShowTaskDetail(false)} 
        placement="end"
        className="task-detail-panel"
      >
        <Offcanvas.Header closeButton className="task-detail-header">
          <Offcanvas.Title>
            <div className="d-flex align-items-center justify-content-between w-100">
              <span className="fw-bold">{selectedTask?.id} {selectedTask?.title}</span>
              <Button variant="link" className="text-secondary p-0">
                <MoreVertical size={20} />
              </Button>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="task-detail-body">
          {selectedTask && (
            <>
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Status</div>
                    <Badge bg={getStatusVariant(selectedTask.status)} className="px-3 py-2 w-100">
                      {selectedTask.status}
                    </Badge>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Priority</div>
                    <Badge bg={getPriorityVariant(selectedTask.priority)} className="px-3 py-2 w-100">
                      {selectedTask.priority}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <div className="detail-section">
                <div className="detail-label">Assignees</div>
                <div className="assignee-group">
                  {selectedTask.assignees?.map((assignee, idx) => (
                    <div key={idx} className="assignee-badge" title={assignee.name}>
                      {assignee.initials}
                    </div>
                  ))}
                  <div className="add-assignee">
                    <Plus size={16} />
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Due Date</div>
                <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  <Calendar size={16} className="me-2 text-muted" />
                  <span>{selectedTask.dueDate}</span>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-label">Project</div>
                <Badge bg="light" text="dark" className="px-3 py-2" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                  {selectedTask.project}
                </Badge>
              </div>

              <div className="detail-section">
                <div className="detail-label">Description</div>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                  {selectedTask.description || 'No description provided'}
                </p>
              </div>

              <Nav variant="tabs" className="detail-tabs">
                <Nav.Item>
                  <Nav.Link active>Activity</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link>
                    Comments {selectedTask.comments && `(${selectedTask.comments})`}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link>History</Nav.Link>
                </Nav.Item>
              </Nav>

              <div className="activity-section">
                <div className="activity-date" style={{ fontWeight: '600', marginBottom: '1rem' }}>Recent Activity</div>
                
                <div className="activity-item" style={{ marginBottom: '1rem' }}>
                  <div className="assignee-avatar" style={{ width: '32px', height: '32px', fontSize: '0.7rem', flexShrink: 0 }}>
                    JD
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      <strong>John D.</strong> was assigned to this task
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apr 22, 2024 at 10:30 AM</div>
                  </div>
                </div>

                <div className="activity-item" style={{ marginBottom: '1rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertCircle size={16} color="#64748b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      Status changed to <strong>"In Progress"</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apr 22, 2024 at 10:15 AM</div>
                  </div>
                </div>

                <div className="activity-item">
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus size={16} color="#64748b" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                      Task created
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apr 20, 2024 at 9:00 AM</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      <CreateTaskModal
        show={showCreateTask}
        onHide={() => setShowCreateTask(false)}
        onCreate={(data) => {
          console.log('Task created:', data);
          setShowCreateTask(false);
          // TODO: Add task to tasks array
        }}
        onCreateAndOpen={(data) => {
          console.log('Task created and opening:', data);
          setShowCreateTask(false);
          // TODO: Add task to tasks array and open detail panel
        }}
      />
    </>
     

    </React.Fragment>
  );
};

TasksList.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TasksList;
