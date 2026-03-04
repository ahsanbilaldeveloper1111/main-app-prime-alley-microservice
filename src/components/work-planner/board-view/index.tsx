import React, { useState } from 'react';
import { 
  Search, ChevronDown, Plus, MoreVertical, Calendar,
  MessageSquare, Paperclip, CheckSquare, Users, Grid3x3, Bell,
  Folder, FileText, Clock, CheckCircle2, AlertCircle, LayoutGrid,
  X
} from 'lucide-react';
import { Row, Col, Button, Offcanvas, Badge, Nav } from 'react-bootstrap';
import StatsCard from '@components/work-planner/stats-cards';

interface TaskLabel {
  name: string;
  color: string;
}

interface TaskSubtasks {
  completed: number;
  total: number;
}

interface Task {
  id: string;
  title: string;
  labels: TaskLabel[];
  assignees: string[];
  comments: number;
  attachments: number;
  subtasks?: TaskSubtasks;
  category?: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  description?: string;
}

interface TasksState {
  backlog: Task[];
  todo: Task[];
  inProgress: Task[];
  review: Task[];
  done: Task[];
}

interface DraggedTask {
  task: Task;
  fromColumn: string;
}

interface KanbanBoardProps {
  embedded?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ embedded = false }) => {
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState('Website Redesign');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('activity');
  
  const [tasks, setTasks] = useState<TasksState>({
    backlog: [
      {
        id: 'task-1',
        title: 'Review Analytics Reports',
        labels: [{ name: 'Analysis', color: '#10B981' }],
        assignees: ['👨‍💼'],
        comments: 0,
        attachments: 0
      },
      {
        id: 'task-2',
        title: 'Gather Competitor Research',
        labels: [],
        assignees: ['👩'],
        comments: 0,
        attachments: 1
      },
      {
        id: 'task-3',
        title: 'Review Blog Feedback',
        labels: [{ name: 'CRM', color: '#06B6D4' }],
        assignees: ['👨‍💻'],
        comments: 0,
        attachments: 0,
        subtasks: { completed: 0, total: 0 },
        category: 'CRM'
      }
    ],
    todo: [
      {
        id: 'task-4',
        title: 'Design Homepage Layout',
        labels: [{ name: 'UI/UX', color: '#3B82F6' }],
        assignees: ['👩‍🦰'],
        dueDate: 'May 1',
        status: 'in-progress',
        comments: 0,
        attachments: 0
      },
      {
        id: 'task-5',
        title: 'Write Homepage Copy',
        labels: [{ name: 'Business', color: '#8B5CF6' }],
        assignees: ['👨'],
        comments: 0,
        attachments: 0
      }
    ],
    inProgress: [
      {
        id: 'task-6',
        title: 'Fix login issue',
        labels: [],
        priority: 'High',
        assignees: ['👨‍💼', '👩'],
        dueDate: 'May 1',
        comments: 0,
        attachments: 0
      },
      {
        id: 'task-7',
        title: 'Create Banner Images',
        labels: [],
        priority: 'Urgent',
        assignees: ['👩‍💻', '👨‍🦱'],
        comments: 0,
        attachments: 1
      },
      {
        id: 'task-8',
        title: 'Optimize Page Speed',
        labels: [{ name: 'SEO', color: '#14B8A6' }],
        assignees: ['👨‍💻'],
        comments: 0,
        attachments: 0,
        subtasks: { completed: 0, total: 0 }
      }
    ],
    review: [
      {
        id: 'task-9',
        title: 'Prepare Sales Report',
        labels: [{ name: 'Marketing', color: '#3B82F6' }],
        assignees: ['👨‍💼'],
        comments: 0,
        attachments: 4
      },
      {
        id: 'task-10',
        title: 'Mobile App Integration',
        labels: [],
        priority: 'High',
        assignees: ['👨'],
        comments: 0,
        attachments: 3
      }
    ],
    done: [
      {
        id: 'task-11',
        title: 'Create Landing Page Mockup',
        labels: [
          { name: 'QA', color: '#3B82F6' },
          { name: 'UI/UX', color: '#8B5CF6' }
        ],
        assignees: ['👨‍💻'],
        comments: 0,
        attachments: 0
      },
      {
        id: 'task-12',
        title: 'Set Up Staging Environment',
        labels: [{ name: 'CRM', color: '#06B6D4' }],
        assignees: [],
        comments: 0,
        attachments: 2,
        subtasks: { completed: 0, total: 0 }
      }
    ]
  });

  const columns = [
    { id: 'backlog', title: 'Backlog', count: 8, color: '#6B7280' },
    { id: 'todo', title: 'To Do', count: 16, color: '#3B82F6' },
    { id: 'inProgress', title: 'In Progress', count: 10, color: '#F59E0B' },
    { id: 'review', title: 'Review / QA', count: 4, color: '#8B5CF6' },
    { id: 'done', title: 'Done', count: 138, color: '#10B981' }
  ];

  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    setDraggedTask({ task, fromColumn: columnId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toColumnId: keyof TasksState) => {
    e.preventDefault();
    if (!draggedTask) return;

    const { task, fromColumn } = draggedTask;
    
    if (fromColumn === toColumnId) {
      setDraggedTask(null);
      return;
    }

    setTasks(prev => {
      const newTasks = { ...prev };
      newTasks[fromColumn as keyof TasksState] = newTasks[fromColumn as keyof TasksState].filter((t: Task) => t.id !== task.id);
      newTasks[toColumnId] = [...newTasks[toColumnId], task];
      return newTasks;
    });

    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return { bg: '#FEE2E2', text: '#991B1B' };
      case 'Urgent': return { bg: '#FED7AA', text: '#9A3412' };
      default: return { bg: '#E5E7EB', text: '#4B5563' };
    }
  };

  const styles = {
    container: {
      backgroundColor: '#F4F7FA',
      minHeight: '100vh',
      paddingBottom: '2rem'
    },
    contentContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 1.5rem',
      marginTop: '1.5rem'
    },
    card: {
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    filterRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #E5E9F2',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      fontFamily: 'inherit'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #E5E9F2',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      fontFamily: 'inherit',
      cursor: 'pointer',
      backgroundColor: 'white'
    },
    inputGroup: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center'
    },
    inputIcon: {
      position: 'absolute' as const,
      left: '0.75rem',
      pointerEvents: 'none' as const
    },
    inputWithIcon: {
      paddingLeft: '2.5rem'
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
      transition: 'all 0.2s'
    },
    filters: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap' as const,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    searchBox: {
      position: 'relative' as const,
      flex: '1',
      minWidth: '250px'
    },
    searchInput: {
      width: '100%',
      padding: '0.625rem 0.75rem 0.625rem 2.5rem',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      fontFamily: 'inherit'
    },
    searchIcon: {
      position: 'absolute' as const,
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9CA3AF',
      pointerEvents: 'none' as const
    },
    selectFilter: {
      padding: '0.625rem 2.5rem 0.625rem 0.75rem',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      fontSize: '0.9rem',
      outline: 'none',
      fontFamily: 'inherit',
      backgroundColor: 'white',
      cursor: 'pointer',
      appearance: 'none' as const,
      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236B7280\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 0.75rem center'
    },
    board: {
      display: 'flex',
      gap: '1rem',
      overflowX: 'auto' as const,
      paddingBottom: '1rem'
    },
    column: {
      minWidth: '280px',
      maxWidth: '300px',
      backgroundColor: '#E5E7EB',
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column' as const,
      height: 'fit-content'
    },
    columnHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    columnTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.95rem',
      fontWeight: '600',
      color: '#1F2937'
    },
    columnCount: {
      fontSize: '0.85rem',
      color: '#6B7280',
      fontWeight: '500'
    },
    moreButton: {
      background: 'none',
      border: 'none',
      padding: '0.25rem',
      cursor: 'pointer',
      color: '#6B7280',
      display: 'flex',
      alignItems: 'center',
      borderRadius: '4px',
      transition: 'background 0.2s'
    },
    addButton: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: 'white',
      border: '2px dashed #D1D5DB',
      borderRadius: '8px',
      color: '#4B5563',
      fontSize: '0.9rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      marginBottom: '0.75rem',
      transition: 'all 0.2s'
    },
    taskCard: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '1.125rem',
      marginBottom: '0.875rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      cursor: 'grab',
      transition: 'all 0.2s ease',
      border: '1px solid #f1f5f9'
    },
    taskTitle: {
      fontSize: '0.925rem',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '0.875rem',
      lineHeight: '1.5',
      letterSpacing: '-0.01em'
    },
    taskMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap' as const,
      marginBottom: '0.875rem'
    },
    label: {
      padding: '0.3rem 0.75rem',
      borderRadius: '6px',
      fontSize: '0.725rem',
      fontWeight: '600',
      color: 'white',
      letterSpacing: '0.3px'
    },
    priority: {
      padding: '0.3rem 0.75rem',
      borderRadius: '6px',
      fontSize: '0.725rem',
      fontWeight: '600',
      letterSpacing: '0.3px'
    },
    taskFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '0.625rem',
      borderTop: '1px solid #f1f5f9'
    },
    taskIcons: {
      display: 'flex',
      gap: '0.875rem',
      alignItems: 'center'
    },
    iconGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      color: '#64748b',
      fontSize: '0.8rem',
      fontWeight: '500'
    },
    assignees: {
      display: 'flex',
      gap: '0.25rem',
      marginLeft: '-0.25rem'
    },
    avatar: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: '2px solid white',
      fontSize: '0.7rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e2e8f0',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      marginLeft: '-0.25rem'
    },
    dueDate: {
      fontSize: '0.75rem',
      color: '#DC2626',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    statusIndicator: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      marginRight: '0.25rem'
    },
    dropdown: {
      position: 'relative' as const,
      display: 'inline-block'
    },
    dropdownButton: {
      backgroundColor: '#F4F7FA',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontWeight: '500',
      color: '#1F2937',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.95rem'
    },
    dropdownMenu: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      marginTop: '0.5rem',
      backgroundColor: '#fff',
      border: '1px solid #E5E9F2',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      minWidth: '180px',
      zIndex: 1000
    },
    dropdownItem: {
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      fontSize: '0.9rem',
      color: '#4B5563',
      borderBottom: '1px solid #F3F4F6',
      transition: 'background 0.2s'
    },
    buttonLight: {
      padding: '0.625rem',
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in-progress': return 'warning';
      case 'done': return 'success';
      case 'review': return 'secondary';
      default: return 'info';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'High': return 'danger';
      case 'Urgent': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <>
      <style>{`
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
      `}</style>
      {!embedded && (
        <>
          {/* Top Header */}
          <header className="header-todo" style={{
            backgroundColor: '#4e6fa5',
            color: 'white',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Grid3x3 size={24} />
          <span style={{ fontSize: '18px', fontWeight: '600' }}>
            Project Dashboard - Board View
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button style={{ 
            background: 'rgba(255,255,255,0.15)', 
            border: 'none', 
            color: 'white', 
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          >
            <Bell size={18} />
          </button>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontWeight: '600',
            color: '#4e6fa5',
            fontSize: '14px'
          }}>
            JD
          </div>
        </div>
      </header>

      <div style={styles.container}>
        {/* Secondary Header */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2', padding: '1rem 0' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Folder size={32} style={{ color: '#4680FF' }} />
                  <h2 style={{ margin: 0, fontWeight: '600', fontSize: '1.5rem' }}>Projects</h2>
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
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} />
                  <span>Create Task</span>
                </Button>
                
                <Button 
                  variant="outline-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
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
      </div>
        </>
      )}

      {/* Board Content - Always Visible */}
      <div style={embedded ? {} : styles.contentContainer}>
          {!embedded && (
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
          </>
          )}

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

          {/* Kanban Board */}
          <div style={styles.board}>
        {columns.map((column) => (
          <div 
            key={column.id}
            style={styles.column}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id as keyof TasksState)}
          >
            <div style={styles.columnHeader}>
              <div style={styles.columnTitle}>
                {column.title}
                <span style={styles.columnCount}>{column.count}</span>
              </div>
              <button 
                style={styles.moreButton}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <MoreVertical size={16} />
              </button>
            </div>

            <button 
              style={styles.addButton}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.borderColor = '#9CA3AF';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
            >
              <Plus size={16} />
              Add Task
            </button>

            {tasks[column.id as keyof TasksState].map((task: Task) => (
              <div
                key={task.id}
                style={styles.taskCard}
                draggable
                onDragStart={(e) => handleDragStart(e, task, column.id)}
                onClick={() => handleTaskClick(task)}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.cursor = 'pointer';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                <div style={styles.taskTitle}>{task.title}</div>

                {(task.labels.length > 0 || task.priority || task.status) && (
                  <div style={styles.taskMeta}>
                    {task.labels.map((label: TaskLabel, idx: number) => (
                      <span 
                        key={idx}
                        style={{...styles.label, backgroundColor: label.color}}
                      >
                        {label.name}
                      </span>
                    ))}
                    {task.priority && (
                      <span 
                        style={{
                          ...styles.priority,
                          backgroundColor: getPriorityColor(task.priority).bg,
                          color: getPriorityColor(task.priority).text
                        }}
                      >
                        {task.priority}
                      </span>
                    )}
                    {task.status === 'in-progress' && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{...styles.statusIndicator, backgroundColor: '#FCD34D'}} />
                        <div style={{...styles.statusIndicator, backgroundColor: '#10B981'}} />
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.taskFooter}>
                  <div style={styles.taskIcons}>
                    {task.category && (
                      <div style={styles.iconGroup}>
                        <MessageSquare size={14} />
                        <span>{task.category}</span>
                      </div>
                    )}
                    {task.comments !== undefined && task.comments > 0 && (
                      <div style={styles.iconGroup}>
                        <MessageSquare size={14} />
                        <span>{task.comments}</span>
                      </div>
                    )}
                    {task.attachments !== undefined && task.attachments > 0 && (
                      <div style={styles.iconGroup}>
                        <Paperclip size={14} />
                        <span>{task.attachments}</span>
                      </div>
                    )}
                    {task.subtasks && (
                      <div style={styles.iconGroup}>
                        <CheckSquare size={14} />
                        <span>{task.subtasks.completed}/{task.subtasks.total}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <span style={styles.dueDate}>{task.dueDate}</span>
                    )}
                  </div>

                  {task.assignees.length > 0 && (
                    <div style={styles.assignees}>
                      {task.assignees.map((assignee: string, idx: number) => (
                        <div key={idx} style={styles.avatar}>
                          {assignee}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      </div>

      {/* Task Detail Sidebar */}
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
                    <Badge bg={getStatusVariant(selectedTask.status || 'active')} className="px-3 py-2 w-100">
                      {selectedTask.status === 'in-progress' ? 'In Progress' : selectedTask.status || 'Active'}
                    </Badge>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Priority</div>
                    {selectedTask.priority ? (
                      <Badge bg={getPriorityVariant(selectedTask.priority)} className="px-3 py-2 w-100">
                        {selectedTask.priority}
                      </Badge>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Not set</span>
                    )}
                  </div>
                </Col>
              </Row>

              <div className="detail-section">
                <div className="detail-label">Assignees</div>
                <div className="assignee-group">
                  {selectedTask.assignees && selectedTask.assignees.map((assignee: string, idx: number) => (
                    <div key={idx} className="assignee-badge" title={assignee}>
                      {assignee}
                    </div>
                  ))}
                  <div className="add-assignee">
                    <Plus size={16} />
                  </div>
                </div>
              </div>

              {selectedTask.dueDate && (
                <div className="detail-section">
                  <div className="detail-label">Due Date</div>
                  <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    <Calendar size={16} className="me-2 text-muted" />
                    <span>{selectedTask.dueDate}</span>
                  </div>
                </div>
              )}

              {selectedTask.category && (
                <div className="detail-section">
                  <div className="detail-label">Project</div>
                  <Badge bg="light" text="dark" className="px-3 py-2" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    {selectedTask.category}
                  </Badge>
                </div>
              )}

              {selectedTask.labels && selectedTask.labels.length > 0 && (
                <div className="detail-section">
                  <div className="detail-label">Labels</div>
                  <div className="d-flex gap-2 flex-wrap">
                    {selectedTask.labels.map((label: TaskLabel, idx: number) => (
                      <Badge 
                        key={idx}
                        style={{ 
                          backgroundColor: label.color,
                          fontSize: '0.75rem',
                          padding: '0.375rem 0.75rem'
                        }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.description && (
                <div className="detail-section">
                  <div className="detail-label">Description</div>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                    {selectedTask.description}
                  </p>
                </div>
              )}

              <Nav variant="tabs" className="detail-tabs">
                <Nav.Item>
                  <Nav.Link 
                    active={activeDetailTab === 'activity'}
                    onClick={() => setActiveDetailTab('activity')}
                  >
                    Activity
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeDetailTab === 'comments'}
                    onClick={() => setActiveDetailTab('comments')}
                  >
                    Comments {selectedTask.comments ? `(${selectedTask.comments})` : ''}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeDetailTab === 'history'}
                    onClick={() => setActiveDetailTab('history')}
                  >
                    History
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {activeDetailTab === 'activity' && (
                <div className="activity-section">
                  <div className="activity-date" style={{ fontWeight: '600', marginBottom: '1rem' }}>Recent Activity</div>
                  
                  <div className="activity-item" style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      flexShrink: 0 
                    }}>
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
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0 
                    }}>
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
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0 
                    }}>
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
              )}

              {activeDetailTab === 'comments' && (
                <div className="activity-section">
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', margin: '2rem 0' }}>
                    No comments yet
                  </p>
                </div>
              )}

              {activeDetailTab === 'history' && (
                <div className="activity-section">
                  <div className="activity-item">
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: '#e2e8f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0 
                    }}>
                      <CheckCircle2 size={16} color="#64748b" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                        Task created
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Apr 20, 2024 at 9:00 AM</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default KanbanBoard;