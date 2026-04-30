import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
} from "react";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  canManageProjectFromMembers,
  getSessionPhoneOrExtension,
} from "@planner/projectMemberRole";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";
import { Container, Spinner, Button } from "react-bootstrap";
import { getProject, getTask } from "@utils/tasks";
import {
  WORK_PLANNER_PROJECT_DETAIL_RELATIONS,
  WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS,
  mapGetTaskResponseToSidebarEditTask,
} from "@planner/workPlannerProjectRelations";
import ProjectTabsContent, { ProjectTabsContentRef } from "../partials/ProjectTabsContent";
import { useRouter } from "next/router";
import { ModuleSlug } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { Plus, LayoutGrid } from "lucide-react";
import { toast } from "react-toastify";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";

const { PERMISSIONS } = HEADER_CONSTANTS;

type PlannerSidebarEditTask = NonNullable<
  ComponentProps<typeof CreateTaskSidebar>["task"]
>;

const WorkPlannerProjectsDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [showCreateTaskSidebar, setShowCreateTaskSidebar] = useState(false);
  const [sidebarEditTask, setSidebarEditTask] = useState<PlannerSidebarEditTask | null>(null);
  const [loadingSidebarEditTask, setLoadingSidebarEditTask] = useState(false);
  const projectTabsContentRef = useRef<ProjectTabsContentRef>(null);

  // Fetch extensions using hierarchy API
  const { hierarchyDataExtensions, loading: hierarchyLoading } = useHierarchyData(ModuleSlug.WORK_PLANNER);

  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  const canCreateTaskByPermission = hasPermission(PERMISSIONS.CREATE_TASKS_WORK_PLANNER);
  const canEditTaskByPermission = hasPermission(PERMISSIONS.EDIT_TASKS_WORK_PLANNER);
  const canCreateTaskByMemberRole = useMemo(
    () => canManageProjectFromMembers(project, sessionUserPhoneOrExtension),
    [project, sessionUserPhoneOrExtension],
  );

  // Fetch project data
  useEffect(() => {
    if (id) {
      fetchProjectData();
    }
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const projectData = await getProject(
        id as string,
        Array.from(WORK_PLANNER_PROJECT_DETAIL_RELATIONS),
      );

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

  const handleCreateTaskClick = () => {
    if (!project || hierarchyLoading || !canCreateTaskByMemberRole || !canCreateTaskByPermission) return;
    setSidebarEditTask(null);
    setShowCreateTaskSidebar(true);
  };

  const handleCreateTaskSidebarClose = () => {
    setShowCreateTaskSidebar(false);
    setSidebarEditTask(null);
  };

  const handleCreateTaskSidebarSuccess = async () => {
    setShowCreateTaskSidebar(false);
    setSidebarEditTask(null);
    await fetchProjectData();
    await projectTabsContentRef.current?.refreshAfterTaskChange();
  };

  const handleBoardTaskClick = async (task: { id?: string | number }) => {
    if (task?.id == null) return;
    if (!canCreateTaskByMemberRole || !canEditTaskByPermission) {
      await router.push(`/planner/tasks/${task.id}`);
      return;
    }
    if (loadingSidebarEditTask) return;
    setLoadingSidebarEditTask(true);
    try {
      const raw = await getTask(
        task.id,
        Array.from(WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS),
      );
      if (raw == null || typeof raw !== "object") {
        return;
      }
      setSidebarEditTask(mapGetTaskResponseToSidebarEditTask(raw));
      setShowCreateTaskSidebar(true);
    } catch (err) {
      console.error("[WorkPlannerProjectDetail] getTask failed for board task", task.id, err);
      toast.error("Failed to load task");
    } finally {
      setLoadingSidebarEditTask(false);
    }
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
            {canCreateTaskByMemberRole && canCreateTaskByPermission && (
              <Button
                variant="primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}
                onClick={handleCreateTaskClick}
                disabled={!project || hierarchyLoading}
              >
                <Plus size={18} />
                <span>Create Task</span>
              </Button>
            )}

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

<ProjectTabsContent
          ref={projectTabsContentRef}
          selectedProject={project}
          hierarchyDataExtensions={hierarchyDataExtensions}
          hierarchyLoading={hierarchyLoading}
          onCreateTask={handleCreateTask}
          onBoardTaskClick={handleBoardTaskClick}
        />

      <CreateTaskSidebar
        isOpen={showCreateTaskSidebar}
        onClose={handleCreateTaskSidebarClose}
        onCreate={handleCreateTaskSidebarSuccess}
        extensions={hierarchyDataExtensions as any}
        labels={project?.labels ?? []}
        project={
          project
            ? {
                id: project.id,
                name: project.name,
                icon: "",
                color: project.color || "",
                statuses: project.statuses,
                labels: project.labels,
              }
            : undefined
        }
        statuses={(project?.statuses ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          icon: "",
          color: s.color || "",
          is_default: s.is_default === true || s.is_deefault === true,
        }))}
        isEdit={!!sidebarEditTask}
        task={sidebarEditTask ?? undefined}
        taskTypeChoices={["regular", "recurring"]}
        lockProjectSelection
      />
        
    </React.Fragment>
  );
};

WorkPlannerProjectsDetails.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjectsDetails;
