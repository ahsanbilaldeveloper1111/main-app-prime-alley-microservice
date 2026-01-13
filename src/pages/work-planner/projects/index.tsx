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
  InputGroup,
  Offcanvas,
  ProgressBar
} from 'react-bootstrap';
import { 
  FolderOpen,
  Folder,
  Plus, 
  ChevronDown, 
  Search, 
  X,
  MoreVertical,
  Calendar,
  AlertCircle,
  CalendarDays,
  Users,
  Grid3x3,
  Bell,
  ChevronUp,
  Settings,
  Palette,
  Smartphone,
  Megaphone,
  Monitor,
  Headphones,
  Rocket,
  MessageCircle,
  Clock,
  CheckCircle2,
  UserPlus,
  Edit3,
  Trash2
} from 'lucide-react';
interface Project {
    id: string;
    name: string;
    icon: React.ElementType;
    iconColor: string;
    members: Array<{ name: string; initials: string; color: string }>;
    open: number;
    overdue: number;
    lastUpdate: string;
    status: 'Active' | 'Completed' | 'On Hold';
    owner: string;
    team: string;
  }

const WorkPlannerProjects = () => {
    const [projects, setProjects] = useState<Project[]>([
        {
          id: 'PRJ-001',
          name: 'Website Redesign',
          icon: Palette,
          iconColor: '#3b82f6',
          members: [
            { name: 'John D.', initials: 'JD', color: '#667eea' },
            { name: 'Sarah K.', initials: 'SK', color: '#f56565' },
            { name: 'Mike W.', initials: 'MW', color: '#48bb78' },
            { name: 'Emily R.', initials: 'ER', color: '#ed64a6' },
            { name: 'Jason T.', initials: 'JT', color: '#4299e1' },
            { name: 'Lisa M.', initials: 'LM', color: '#9f7aea' },
            { name: 'Tom H.', initials: 'TH', color: '#fc8181' }
          ],
          open: 19,
          overdue: 2,
          lastUpdate: 'Apr 23, 2024',
          status: 'Active',
          owner: 'John D.',
          team: 'Design'
        },
        {
          id: 'PRJ-002',
          name: 'Mobile App Development',
          icon: Smartphone,
          iconColor: '#3b82f6',
          members: [
            { name: 'Emily R.', initials: 'ER', color: '#ed64a6' },
            { name: 'Jason T.', initials: 'JT', color: '#4299e1' },
            { name: 'Lisa M.', initials: 'LM', color: '#9f7aea' },
            { name: 'David L.', initials: 'DL', color: '#4299e1' },
            { name: 'Chris P.', initials: 'CP', color: '#ed8936' },
            { name: 'Sam R.', initials: 'SR', color: '#667eea' }
          ],
          open: 14,
          overdue: 5,
          lastUpdate: 'Apr 22, 2024',
          status: 'Active',
          owner: 'Emily R.',
          team: 'Engineering'
        },
        {
          id: 'PRJ-003',
          name: 'Marketing Campaign',
          icon: Megaphone,
          iconColor: '#f59e0b',
          members: [
            { name: 'Anna B.', initials: 'AB', color: '#f6ad55' },
            { name: 'Tom H.', initials: 'TH', color: '#fc8181' },
            { name: 'Nina P.', initials: 'NP', color: '#68d391' }
          ],
          open: 10,
          overdue: 1,
          lastUpdate: 'Apr 21, 2024',
          status: 'Active',
          owner: 'Anna B.',
          team: 'Marketing'
        },
        {
          id: 'PRJ-004',
          name: 'IT Infrastructure',
          icon: Monitor,
          iconColor: '#10b981',
          members: [
            { name: 'David L.', initials: 'DL', color: '#4299e1' },
            { name: 'Chris P.', initials: 'CP', color: '#ed8936' },
            { name: 'Sam R.', initials: 'SR', color: '#667eea' },
            { name: 'Rachel G.', initials: 'RG', color: '#9f7aea' },
            { name: 'Kevin S.', initials: 'KS', color: '#48bb78' },
            { name: 'Laura W.', initials: 'LW', color: '#f56565' }
          ],
          open: 8,
          overdue: 3,
          lastUpdate: 'Apr 20, 2024',
          status: 'Active',
          owner: 'David L.',
          team: 'IT'
        },
        {
          id: 'PRJ-005',
          name: 'Client Portal',
          icon: Users,
          iconColor: '#a855f7',
          members: [
            { name: 'Rachel G.', initials: 'RG', color: '#9f7aea' },
            { name: 'Kevin S.', initials: 'KS', color: '#48bb78' },
            { name: 'Laura W.', initials: 'LW', color: '#f56565' }
          ],
          open: 7,
          overdue: 2,
          lastUpdate: 'Apr 19, 2024',
          status: 'Active',
          owner: 'Rachel G.',
          team: 'Product'
        },
        {
          id: 'PRJ-006',
          name: 'Customer Support',
          icon: Headphones,
          iconColor: '#f97316',
          members: [
            { name: 'Mark T.', initials: 'MT', color: '#ed8936' },
            { name: 'Sophia L.', initials: 'SL', color: '#4299e1' },
            { name: 'Ben K.', initials: 'BK', color: '#68d391' }
          ],
          open: 6,
          overdue: 1,
          lastUpdate: 'Apr 13, 2024',
          status: 'Active',
          owner: 'Mark T.',
          team: 'Support'
        },
        {
          id: 'PRJ-007',
          name: 'Product Launch',
          icon: Rocket,
          iconColor: '#06b6d4',
          members: [
            { name: 'Olivia M.', initials: 'OM', color: '#4299e1' },
            { name: 'Ryan C.', initials: 'RC', color: '#f6ad55' },
            { name: 'Emma S.', initials: 'ES', color: '#9f7aea' }
          ],
          open: 5,
          overdue: 0,
          lastUpdate: 'Apr 18, 2024',
          status: 'Active',
          owner: 'Olivia M.',
          team: 'Product'
        },
        {
          id: 'PRJ-008',
          name: 'CRM Upgrade',
          icon: Settings,
          iconColor: '#8b5cf6',
          members: [
            { name: 'Alex D.', initials: 'AD', color: '#667eea' },
            { name: 'Mia F.', initials: 'MF', color: '#ed64a6' },
            { name: 'Jake W.', initials: 'JW', color: '#48bb78' }
          ],
          open: 3,
          overdue: 4,
          lastUpdate: 'Apr 17, 2024',
          status: 'Active',
          owner: 'Alex D.',
          team: 'Engineering'
        }
      ]);
    
      const [activeTab, setActiveTab] = useState('All Tasks');
      const [searchTerm, setSearchTerm] = useState('');
      const [filterStatus, setFilterStatus] = useState('Active');
      const [filterOwner, setFilterOwner] = useState('All Owners');
      const [filterTeam, setFilterTeam] = useState('All Teams');
      const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
      const [selectedProject, setSelectedProject] = useState<Project | null>(null);
      const [showProjectDetail, setShowProjectDetail] = useState(false);
      const [detailTab, setDetailTab] = useState('Activity');
    
      const stats = {
        activeProjects: 14,
        totalProjects: 20,
        tasksDueThisWeek: 63,
        overdueAcrossProjects: 18
      };
    
      const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
        setShowProjectDetail(true);
      };
    
      const handleSelectProject = (projectId: string) => {
        const newSelected = new Set(selectedProjects);
        if (newSelected.has(projectId)) {
          newSelected.delete(projectId);
        } else {
          newSelected.add(projectId);
        }
        setSelectedProjects(newSelected);
      };
    
      const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
          setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
        } else {
          setSelectedProjects(new Set());
        }
      };
    
      const clearFilters = () => {
        setFilterStatus('Active');
        setFilterOwner('All Owners');
        setFilterTeam('All Teams');
        setSearchTerm('');
      };
    
      // Current user (from header avatar)
      const currentUser = 'John D.';
    
      // Get projects based on active tab
      const getTabFilteredProjects = () => {
        let tabProjects = [...projects];
        
        if (activeTab === 'My Work') {
          // Show only projects where current user is owner or a team member
          tabProjects = tabProjects.filter(project => 
            project.owner === currentUser || 
            project.members.some(member => member.name === currentUser)
          );
        } else if (activeTab === 'Activity') {
          // Sort by last update date (most recent first)
          tabProjects = tabProjects.sort((a, b) => {
            const dateA = new Date(a.lastUpdate);
            const dateB = new Date(b.lastUpdate);
            return dateB.getTime() - dateA.getTime();
          });
        }
        // 'All Tasks' shows all projects (no additional filtering)
        
        return tabProjects;
      };
    
      const filteredProjects = getTabFilteredProjects().filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             project.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All Status' || project.status === filterStatus;
        const matchesOwner = filterOwner === 'All Owners' || project.owner === filterOwner;
        const matchesTeam = filterTeam === 'All Teams' || project.team === filterTeam;
        
        return matchesSearch && matchesStatus && matchesOwner && matchesTeam;
      });
    
      const owners = ['All Owners', ...Array.from(new Set(projects.map(p => p.owner)))];
      const teams = ['All Teams', ...Array.from(new Set(projects.map(p => p.team)))];
      const statuses = ['All Status', 'Active', 'Completed', 'On Hold'];
    

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects" />

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
        
        .stat-card.active-projects {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        }
        
        .stat-card.total-projects {
          background: linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%);
        }
        
        .stat-card.due-week {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }
        
        .stat-card.overdue {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
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
        
        .stat-icon.active-projects {
          background-color: #0ea5e9;
          color: #ffffff;
        }
        
        .stat-icon.total-projects {
          background-color: #3b82f6;
          color: #ffffff;
        }
        
        .stat-icon.due-week {
          background-color: #3b82f6;
          color: #ffffff;
        }
        
        .stat-icon.overdue {
          background-color: #ef4444;
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
          max-height: inherit !important;
        }
        
        .projects-table {
          margin: 0;
        }
        
        .projects-table thead th {
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 1rem;
          white-space: nowrap;
          border-top: none;
        }
        
        .projects-table tbody td {
          padding: 1rem;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .projects-table tbody tr {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .projects-table tbody tr:hover {
          background-color: #f8fafc;
        }
        
        .project-name {
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .project-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        
        .member-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: -8px;
          border: 2px solid white;
          position: relative;
        }
        
        .member-avatar:first-child {
          margin-left: 0;
        }
        
        .member-count {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #e2e8f0;
          color: #64748b;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: -8px;
          border: 2px solid white;
        }
        
        .overdue-count {
          color: #ef4444;
          font-weight: 600;
        }
        
        .project-detail-panel {
          width: 500px;
        }
        
        .project-detail-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 2px solid #e2e8f0;
          background-color: #f8fafc;
        }
        
        .project-detail-body {
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
        
        @media (max-width: 768px) {
          .project-detail-panel {
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

      

      <div className="project-dashboard">
        <div className="header-section">
          <Container fluid>
            <Row className="align-items-center mb-4">
              <Col>
                <div className="d-flex align-items-center">
                  <Folder size={32} className="text-primary me-2" />
                  <h2 className="mb-0 fw-bold">Projects</h2>
                </div>
              </Col>
              <Col xs="auto">
                <Button variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plus size={18} />
                  <span>Create Project</span>
                </Button>
              </Col>
            </Row>

            <Row className="g-3">
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card active-projects">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.activeProjects}</p>
                      <p className="stat-label">Active Projects</p>
                    </div>
                    <div className="stat-icon active-projects">
                      <FolderOpen />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card total-projects">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.totalProjects}</p>
                      <p className="stat-label">Total Projects</p>
                    </div>
                    <div className="stat-icon total-projects">
                      <Folder />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card due-week">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.tasksDueThisWeek}</p>
                      <p className="stat-label">Tasks Due This Week</p>
                    </div>
                    <div className="stat-icon due-week">
                      <CalendarDays />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={12} sm={6} lg={3}>
                <Card className="stat-card overdue">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="stat-number">{stats.overdueAcrossProjects}</p>
                      <p className="stat-label">Overdue Across Projects</p>
                    </div>
                    <div className="stat-icon overdue">
                      <AlertCircle />
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
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} color="#6B7280" style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search projects..."
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  width: '100%',
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
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                style={{
                  width: '100%',
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
                <option value="">Owner / PM</option>
                {owners.map(owner => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>

              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                style={{
                  width: '100%',
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
                <option value="">Team</option>
                {teams.map(team => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>

              <button
                onClick={clearFilters}
                style={{
                  padding: '0.625rem 1.25rem',
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
                  fontFamily: 'inherit'
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
                  active={activeTab === 'All Tasks'}
                  onClick={() => setActiveTab('All Tasks')}
                >
                  All Tasks ({projects.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'My Work'}
                  onClick={() => setActiveTab('My Work')}
                >
                  My Work ({getTabFilteredProjects().filter(p => p.owner === currentUser || p.members.some(m => m.name === currentUser)).length})
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
              {filteredProjects.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  <FolderOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {activeTab === 'My Work' ? 'No projects assigned to you' : 'No projects found'}
                  </p>
                  <p style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                    {activeTab === 'My Work' 
                      ? 'You are not currently assigned to any projects matching the filters.'
                      : 'Try adjusting your filters or search criteria.'}
                  </p>
                </div>
              ) : (
              <Table className="projects-table" hover>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <Form.Check 
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                      />
                    </th>
                    <th>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Project Name
                        <ChevronUp size={14} />
                      </div>
                    </th>
                    <th>Members</th>
                    <th>Open</th>
                    <th>Overdue</th>
                    <th>Last Update</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Form.Check 
                          type="checkbox"
                          checked={selectedProjects.has(project.id)}
                          onChange={() => handleSelectProject(project.id)}
                        />
                      </td>
                      <td>
                        <div className="project-name">
                          <div className="project-icon" style={{ backgroundColor: project.iconColor + '20' }}>
                            <project.icon size={20} style={{ color: project.iconColor }} />
                          </div>
                          <span>{project.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {project.members.slice(0, 3).map((member, idx) => (
                            <div
                              key={idx}
                              className="member-avatar"
                              style={{ backgroundColor: member.color }}
                              title={member.name}
                            >
                              {member.initials}
                            </div>
                          ))}
                          {project.members.length > 3 && (
                            <div className="member-count">
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{project.open}</td>
                      <td>
                        <span className={project.overdue > 0 ? 'overdue-count' : ''}>
                          {project.overdue}
                        </span>
                      </td>
                      <td>{project.lastUpdate}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Button 
                            variant="primary" 
                            size="sm"
                            style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectClick(project);
                            }}
                          >
                            Open
                          </Button>
                          <Dropdown>
                            <Dropdown.Toggle
                              as="button"
                              bsPrefix="custom-dropdown-toggle"
                              className="p-0 border-0 bg-transparent"
                              style={{ color: '#718096', cursor: 'pointer' }}
                            >
                              <MoreVertical size={16} />
                            </Dropdown.Toggle>

                            <Dropdown.Menu align="end" style={{ fontSize: '0.875rem' }}>
                              <Dropdown.Item style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings size={14} />
                                <span>Edit Project</span>
                              </Dropdown.Item>
                              <Dropdown.Item style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users size={14} />
                                <span>Manage Team</span>
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <X size={14} />
                                <span>Archive Project</span>
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Project Detail Sidebar */}
      <Offcanvas 
        show={showProjectDetail} 
        onHide={() => setShowProjectDetail(false)} 
        placement="end"
        className="project-detail-panel"
      >
        <Offcanvas.Header closeButton className="project-detail-header">
          <Offcanvas.Title>
            <div className="d-flex align-items-center gap-3">
              {selectedProject && (
                <>
                  <div className="project-icon" style={{ backgroundColor: selectedProject.iconColor + '20' }}>
                    <selectedProject.icon size={24} style={{ color: selectedProject.iconColor }} />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{selectedProject.name}</div>
                    <Badge 
                      bg={selectedProject.status === 'Active' ? 'success' : selectedProject.status === 'On Hold' ? 'warning' : 'secondary'}
                      style={{ fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.5px' }}
                    >
                      {selectedProject.status.toUpperCase()}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="project-detail-body">
          {selectedProject && (
            <>
              {/* Project Stats */}
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Open Tasks</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#3b82f6' }}>
                      {selectedProject.open}
                    </div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Overdue Tasks</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: selectedProject.overdue > 0 ? '#ef4444' : '#10b981' }}>
                      {selectedProject.overdue}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Project Progress */}
              <div className="detail-section">
                <div className="detail-label">Project Progress</div>
                <ProgressBar 
                  now={Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100)} 
                  style={{ height: '10px', marginBottom: '0.5rem' }}
                  variant="primary"
                />
                <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'right' }}>
                  {Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100)}% Complete
                </div>
              </div>

              {/* Owner/PM and Team in one row */}
              <Row className="g-2 mb-3">
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Owner / PM</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#667eea',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}
                      >
                        {selectedProject.owner.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{selectedProject.owner}</span>
                    </div>
                  </div>
                </Col>
                <Col xs={6}>
                  <div className="detail-section">
                    <div className="detail-label">Team</div>
                    <Badge 
                      bg="primary" 
                      style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        padding: '0.5rem 0.75rem',
                        display: 'inline-block'
                      }}
                    >
                      {selectedProject.team}
                    </Badge>
                  </div>
                </Col>
              </Row>

              {/* Team Members */}
              <div className="detail-section">
                <div className="detail-label">Team Members ({selectedProject.members.length})</div>
                <div className="d-flex flex-wrap gap-2">
                  {selectedProject.members.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        flex: '1 1 calc(50% - 0.25rem)',
                        minWidth: '120px'
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: member.color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}
                      >
                        {member.initials}
                      </div>
                      <span style={{ fontSize: '0.8125rem', fontWeight: '500', color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Update */}
              <div className="detail-section">
                <div className="detail-label">Last Updated</div>
                <div className="d-flex align-items-center" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                  <Calendar size={16} className="me-2 text-muted" />
                  <span>{selectedProject.lastUpdate}</span>
                </div>
              </div>

              {/* Tabs for Activity/Comments/History */}
              <Nav variant="tabs" className="detail-tabs" activeKey={detailTab} onSelect={(k) => k && setDetailTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="Activity">
                    Activity
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="Comments">
                    Comments (3)
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="History">
                    History
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {/* Tab Content */}
              <div style={{ marginTop: '1.5rem' }}>
                {/* Activity Tab */}
                {detailTab === 'Activity' && (
                  <div>
                    <div className="detail-label" style={{ marginBottom: '1rem' }}>Recent Activity</div>
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex gap-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#667eea',
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
                          <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                            <span style={{ fontWeight: '600' }}>John D.</span> completed task 
                            <span style={{ fontWeight: '600', color: '#3b82f6' }}> Homepage Design Review</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            2 hours ago
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#f56565',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          SK
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                            <span style={{ fontWeight: '600' }}>Sarah K.</span> added 
                            <span style={{ fontWeight: '600', color: '#3b82f6' }}> 3 new tasks</span> to the project
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            5 hours ago
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#48bb78',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          MW
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                            <span style={{ fontWeight: '600' }}>Mike W.</span> uploaded 
                            <span style={{ fontWeight: '600', color: '#3b82f6' }}> design-mockups.fig</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            1 day ago
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#ed64a6',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          ER
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                            <span style={{ fontWeight: '600' }}>Emily R.</span> joined the project
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            2 days ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Tab */}
                {detailTab === 'Comments' && (
                  <div>
                    <div className="detail-label" style={{ marginBottom: '1rem' }}>Project Comments</div>
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex gap-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#667eea',
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
                          <div style={{ 
                            backgroundColor: '#f8fafc', 
                            padding: '0.75rem', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                              John D.
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                              Great progress on the homepage! The new layout looks much better. Can we schedule a review meeting for next week?
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Apr 22, 2024 • 3:45 PM
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#f56565',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          SK
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            backgroundColor: '#f8fafc', 
                            padding: '0.75rem', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                              Sarah K.
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                              I've updated the color scheme to match the brand guidelines. Please review when you get a chance.
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Apr 21, 2024 • 10:30 AM
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#48bb78',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          MW
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            backgroundColor: '#f8fafc', 
                            padding: '0.75rem', 
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '0.25rem' }}>
                              Mike W.
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem' }}>
                              The responsive design looks good on mobile devices. Testing completed successfully! ✓
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              Apr 20, 2024 • 2:15 PM
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Add Comment Input */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                      <Form.Group>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          placeholder="Add a comment..."
                          style={{ fontSize: '0.875rem', borderRadius: '8px' }}
                        />
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="mt-2"
                          style={{ fontSize: '0.875rem' }}
                        >
                          Post Comment
                        </Button>
                      </Form.Group>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {detailTab === 'History' && (
                  <div>
                    <div className="detail-label" style={{ marginBottom: '1rem' }}>Project History</div>
                    <div className="d-flex flex-column gap-2">
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderLeft: '3px solid #10b981'
                      }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                            Task Completed
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>John D.</span> marked "Homepage Design Review" as complete
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Apr 23, 2024 at 2:30 PM
                        </div>
                      </div>

                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderLeft: '3px solid #3b82f6'
                      }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Edit3 size={16} style={{ color: '#3b82f6' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                            Project Updated
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>Sarah K.</span> updated the project status to "Active"
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Apr 22, 2024 at 9:15 AM
                        </div>
                      </div>

                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderLeft: '3px solid #a855f7'
                      }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <UserPlus size={16} style={{ color: '#a855f7' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                            Member Added
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>John D.</span> added <span style={{ fontWeight: '600' }}>Emily R.</span> to the project
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Apr 21, 2024 at 4:00 PM
                        </div>
                      </div>

                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderLeft: '3px solid #f59e0b'
                      }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <Clock size={16} style={{ color: '#f59e0b' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                            Due Date Changed
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>Mike W.</span> changed due date from Apr 25 to Apr 30
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Apr 20, 2024 at 11:30 AM
                        </div>
                      </div>

                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        borderLeft: '3px solid #3b82f6'
                      }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <FolderOpen size={16} style={{ color: '#3b82f6' }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#334155' }}>
                            Project Created
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>John D.</span> created the project
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Apr 15, 2024 at 9:00 AM
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>

    </React.Fragment>
  );
};

WorkPlannerProjects.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjects;
