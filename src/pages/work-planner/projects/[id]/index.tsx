import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { Container, Spinner, Button } from "react-bootstrap";
import { getProject } from "@utils/tasks";
import ProjectTabsContent, { ProjectTabsContentRef } from "../partials/ProjectTabsContent";
import { useRouter } from "next/router";
import { ModuleSlug } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { Plus, LayoutGrid } from "lucide-react";

const WorkPlannerProjectsDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const projectTabsContentRef = useRef<ProjectTabsContentRef>(null);

  // Fetch extensions using hierarchy API
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  // Fetch project data
  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const withRelations = [
        'statuses',
        'statuses.tasks',
        'members.user',
        'tasks',
        'tasks.assignees',
        'tasks.labels',
        'tasks.status',
        'owner'
      ];
      
      const projectData = await getProject(id as string, withRelations);

      if (projectData) {
        setProject(projectData);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle task creation - ProjectTabsContent will handle refreshing its own data
  const handleCreateTask = async (formData: any) => {
    // The ProjectTabsContent component handles task creation and data refresh internally
    // This callback can be used for additional logic if needed
  };

  // Handle create task button click
  const handleCreateTaskClick = () => {
    projectTabsContentRef.current?.openCreateTaskModal();
  };

  // Handle board view button click
  const handleBoardViewClick = () => {
    projectTabsContentRef.current?.switchToBoardView();
  };

  if (loading) {
    return (
      <React.Fragment>
        <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects Details" />
        <PageHeader title="Work Planner Projects Details" showSearch={false} />
        <Container>
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        </Container>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects Details" />
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
      <PageHeader
        title={project?.name || "Work Planner Projects Details"}
        showSearch={false}
        buttons={
          <>
            <Button 
              variant="primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}
              onClick={handleCreateTaskClick}
              disabled={!project || hierarchyLoading}
            >
              <Plus size={18} />
              <span>Create Task</span>
            </Button>
            
            <Button 
              variant="outline-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleBoardViewClick}
              disabled={!project}
            >
              <LayoutGrid size={18} />
              Board View
            </Button>
          </>
        }
      />

      <Container fluid className="py-4">
        <ProjectTabsContent
          ref={projectTabsContentRef}
          selectedProject={project}
          hierarchyDataExtensions={hierarchyDataExtensions}
          hierarchyLoading={hierarchyLoading}
          onCreateTask={handleCreateTask}
        />
      </Container>
    </React.Fragment>
  );
};

WorkPlannerProjectsDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjectsDetails;
