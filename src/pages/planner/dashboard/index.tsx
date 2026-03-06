import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useRef
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import { 
  Plus, LayoutGrid, ChevronDown,
  MoreVertical, Folder
} from 'lucide-react';
import { Button, Spinner } from 'react-bootstrap';
import ProjectTabsContent, { type ProjectTabsContentRef } from '../projects/partials/ProjectTabsContent';
import { listProjects } from '@utils/tasks';
import { ModuleSlug } from '@utils/Helper';
import { useHierarchyData } from '@components/filters/useHierarchyData';

const WorkPlannerProjectsDashboard = () => {
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);
    const projectTabsContentRef = useRef<ProjectTabsContentRef>(null);
    
    // Fetch extensions for CreateTaskModal
    const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.USER_DIRECTORY);
    
    // Fetch projects list
    useEffect(() => {
      const fetchProjects = async () => {
        try {
          setLoadingProjects(true);
          const response = await listProjects({ page: 1, limit: 100 });
          if (response && response.success === true && response.data && Array.isArray(response.data)) {
            setProjects(response.data);
            // Auto-select first project if available
            if (response.data.length > 0 && !selectedProject) {
              handleProjectSelect(response.data[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
        } finally {
          setLoadingProjects(false);
        }
      };
      
      fetchProjects();
    }, []);
    
    // Handle project selection - just set the selected project
    // The partial component will handle fetching project data
    const handleProjectSelect = (project: any) => {
      setSelectedProject(project);
    };
    
    // Handle task creation - the partial component will refresh its own data
    const handleCreateTask = async (formData: any) => {
      // The partial component handles refreshing its own data
      // This is just a placeholder that can be used for additional logic if needed
    };
  
    const styles = {
      container: { backgroundColor: '#F4F7FA', minHeight: '100vh', paddingBottom: '2rem' },
      header: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2', padding: '1rem 0' },
      headerInner: {  margin: '0 auto', padding: '0 1.5rem' },
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
      tabsInner: {  margin: '0 auto', padding: '0 1.5rem', display: 'flex', gap: '2rem' },
      tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
      contentContainer: {  margin: '0 auto', padding: '0 1.5rem', marginTop: '1.5rem' },
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

{/* Projects title with icon */}
<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  <Folder
    size={22}
    style={{ color: '#141414', flexShrink: 0 }}
  />
  <h2
    style={{
      margin: 0,
      fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
      fontSize: '20px',
      fontWeight: 600,
      color: '#141414',
      letterSpacing: '0px',
      lineHeight: '24px',
    }}
  >
    Projects
  </h2>
</div>

{/* Project selector dropdown */}
<div style={styles.dropdown}>
  <button
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
      fontSize: '14px',
      fontWeight: 300,
      color: '#141414',
      background: '#fff',
      border: '1px solid #d0d0d0',
      borderRadius: '4px',
      cursor: loadingProjects ? 'not-allowed' : 'pointer',
      transition: 'border-color 0.15s',
      whiteSpace: 'nowrap',
      letterSpacing: '0px',
      lineHeight: '20px',
    }}
    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
    onMouseEnter={e => {
      if (!loadingProjects) e.currentTarget.style.borderColor = '#141414';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#d0d0d0';
    }}
    disabled={loadingProjects}
  >
    {loadingProjects ? (
      <Spinner size="sm" animation="border" />
    ) : (
      <>
        <span>{selectedProject?.name || 'Select Project'}</span>
        <ChevronDown size={14} style={{ color: '#555', flexShrink: 0 }} />
      </>
    )}
  </button>

  {/* Dropdown menu */}
  {showProjectDropdown && !loadingProjects && (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        minWidth: '200px',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {projects.length === 0 ? (
        <div
          style={{
            padding: '10px 14px',
            fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
            fontSize: '14px',
            fontWeight: 300,
            color: '#888',
          }}
        >
          No projects available
        </div>
      ) : (
        projects.map((project, index) => (
          <div
            key={project.id}
            onClick={() => {
              handleProjectSelect(project);
              setShowProjectDropdown(false);
            }}
            style={{
              padding: '10px 14px',
              fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
              fontSize: '14px',
              fontWeight: selectedProject?.id === project.id ? 500 : 300,
              color: selectedProject?.id === project.id ? '#141414' : '#4B5563',
              borderBottom: index === projects.length - 1 ? 'none' : '1px solid #F3F4F6',
              cursor: 'pointer',
              transition: 'background 0.12s',
              background: selectedProject?.id === project.id ? '#f5f5f5' : '#fff',
            }}
            onMouseEnter={e => {
              if (selectedProject?.id !== project.id)
                e.currentTarget.style.background = '#f9f9f9';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background =
                selectedProject?.id === project.id ? '#f5f5f5' : '#fff';
            }}
          >
            {project.name}
          </div>
        ))
      )}
    </div>
  )}
</div>
</div>
            
            <div style={styles.headerRight}>
              {/* <Button 
                variant="primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={() => {
                  if (!selectedProject) {
                    alert('Please select a project first');
                    return;
                  }
                }}
                disabled={!selectedProject || hierarchyLoading}
              >
                <Plus size={18} />
                <span>Create Task</span>
              </Button>
              
              <Button 
                variant="outline-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={!selectedProject}
                onClick={() => projectTabsContentRef.current?.switchToBoardView()}
              >
                <LayoutGrid size={18} />
                Board View
              </Button> */}

                {!selectedProject || hierarchyLoading && (
<button
  style={{
    cursor: "pointer",
    transition: "150ms ease-out",
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    backgroundColor: "rgb(20, 20, 20)", // Black
    borderColor: "rgba(20, 20, 20, 0)",
    color: "rgb(255, 255, 255)", // White text
    textDecoration: "none",
    borderRadius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: "8px",
    paddingInline: "16px",
    maxWidth: "100%",
    fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
    fontSize: "12px",
    fontWeight: 300,
    letterSpacing: "0px",
    lineHeight: "14px",
    WebkitFontSmoothing: "antialiased",
    textUnderlineOffset: "24%",
    alignItems: "center",
    gap: "0.5rem"
  }}
  onClick={() => {
    if (!selectedProject) {
      alert("Please select a project first");
      return;
    }
  }}
  disabled={!selectedProject || hierarchyLoading}
>
  <Plus size={18} />
  <span>Create Task</span>
</button>
                )}

                {!selectedProject || hierarchyLoading && (

<button
  style={{
    cursor: "pointer",
    transition: "150ms ease-out",
    display: "inline-flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    backgroundColor: "rgb(255, 255, 255)", // White
    borderColor: "rgb(20, 20, 20)",
    color: "rgb(20, 20, 20)", // Black text
    textDecoration: "none",
    borderRadius: "4px",
    borderWidth: "1px",
    borderStyle: "solid",
    verticalAlign: "middle",
    paddingBlock: "8px",
    paddingInline: "16px",
    maxWidth: "100%",
    fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
    fontSize: "12px",
    fontWeight: 300,
    letterSpacing: "0px",
    lineHeight: "14px",
    WebkitFontSmoothing: "antialiased",
    textUnderlineOffset: "24%",
    alignItems: "center",
    gap: "0.5rem"
  }}
  disabled={!selectedProject}
  onClick={() => projectTabsContentRef.current?.switchToBoardView()}
>
  <LayoutGrid size={18} />
  <span>Board View</span>
                  </button>
                )}
              
            
            </div>
          </div>
        </div>
        </div>

        <ProjectTabsContent
          ref={projectTabsContentRef}
          selectedProject={selectedProject}
          hierarchyDataExtensions={hierarchyDataExtensions}
          hierarchyLoading={hierarchyLoading}
          onCreateTask={handleCreateTask}
        />
      </div>

  

    </React.Fragment>
  );
};

WorkPlannerProjectsDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjectsDashboard;
