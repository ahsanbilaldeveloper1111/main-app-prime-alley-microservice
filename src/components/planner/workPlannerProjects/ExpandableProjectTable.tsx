import React, {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type MouseEventHandler,
  type SetStateAction,
} from "react";
import {
  FolderOpen,
  Plus,
  MoreVertical,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
  Eye,
  Settings,
  Trash2,
} from "lucide-react";
import { Dropdown, Spinner } from "react-bootstrap";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  canAdministerProjectFromMembers,
  canManageProjectFromMembers,
} from "@planner/projectMemberRole";
import {
  fetchTasksForExpandedProject,
  type Project,
  type SubTask,
  type Task,
} from "@planner/workPlannerProjectsDomain";
import { getTask } from "@utils/tasks";
import {
  mapGetTaskResponseToSidebarEditTask,
  WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS,
} from "@planner/workPlannerProjectRelations";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";
import GenericTable, {
  type TableAction,
  type TableColumn,
  type ToolbarConfig,
} from "@components/GenericTable";
import { type StatsCardData } from "@components/GenericStatsCards";
import { TaskRow } from "@components/planner/workPlannerProjects/TaskTreeRows";
import {
  createProjectRowActionsToggleHandler,
  mapTableProjectToPlannerSidebarProject,
  projectIdFromSidebarEditTask,
  type CreatePlannerSidebarTaskProp,
} from "@components/planner/workPlannerProjects/expandableProjectTableHelpers";
import "@components/planner/workPlannerProjects/workPlannerProjectsPage.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

/** Shape used by CreateTaskSidebar extension pickers (structurally matches its internal Extension type). */
export type PlannerTaskSidebarExtension = Readonly<{
  id: string;
  name: string;
  extension_number?: string;
}>;

type CreateTaskSidebarSubmitPayload = Parameters<
  NonNullable<React.ComponentProps<typeof CreateTaskSidebar>["onCreate"]>
>[0];

function projectExpandToggleClickHandler(
  project: Project,
  handleToggleProject: (project: Project, e: React.MouseEvent) => Promise<void>,
): MouseEventHandler<HTMLButtonElement> {
  return (e) => {
    handleToggleProject(project, e).catch((err) => {
      console.error("[WorkPlannerProjects] handleToggleProject failed", err);
    });
  };
}

function projectPreviewFloatingClickHandler(
  project: Project,
  onProjectClick: (project: Project) => void,
): MouseEventHandler<HTMLButtonElement> {
  return (e) => {
    e.stopPropagation();
    onProjectClick(project);
  };
}

function projectOverviewMenuClickHandler(
  project: Project,
  setOpenProjectActionsId: Dispatch<SetStateAction<string | null>>,
): () => void {
  return () => {
    setOpenProjectActionsId(null);
    globalThis.window?.open(`/planner/projects/${project.id}`, "_blank");
  };
}

function projectEditMenuClickHandler(
  project: Project,
  setOpenProjectActionsId: Dispatch<SetStateAction<string | null>>,
  onEditProject: (project: Project) => void,
): () => void {
  return () => {
    setOpenProjectActionsId(null);
    onEditProject(project);
  };
}

function projectDeleteMenuClickHandler(
  project: Project,
  setOpenProjectActionsId: Dispatch<SetStateAction<string | null>>,
  onDeleteProject: (project: Project) => void,
): () => void {
  return () => {
    setOpenProjectActionsId(null);
    onDeleteProject(project);
  };
}

function addExpandedProjectTaskClickHandler(
  project: Project,
  handleOpenCreateTaskForExpandedProject: (projectRow: Project) => void,
): MouseEventHandler<HTMLButtonElement> {
  return (e) => {
    e.stopPropagation();
    handleOpenCreateTaskForExpandedProject(project);
  };
}

export interface ExpandableProjectTableProps {
  projects: Project[];
  loading: boolean;
  extensions: PlannerTaskSidebarExtension[];
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  sessionPlannerProjectCrud: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
  pagination: { page: number; limit: number; total: number; last_page: number; from: number; to: number };
  onPaginationChange: (page: number, rowsPerPage: number) => void;
  toolbarConfig: ToolbarConfig;
  statsCards: StatsCardData[];
  columns: TableColumn<Project>[];
  actions: TableAction<Project>[];
  sessionUserPhoneOrExtension: string;
}

export const ExpandableProjectTable: React.FC<ExpandableProjectTableProps> = ({
  projects,
  loading,
  extensions,
  onProjectClick,
  onEditProject,
  onDeleteProject,
  sessionPlannerProjectCrud,
  pagination,
  onPaginationChange,
  toolbarConfig,
  statsCards,
  columns,
  actions,
  sessionUserPhoneOrExtension,
}) => {
  const { hasPermission } = usePermissions();
  const canPreviewEditTask = hasPermission(PERMISSIONS.EDIT_TASKS_WORK_PLANNER);
  const sessionCanCreatePlannerTask = hasPermission(PERMISSIONS.CREATE_TASKS_WORK_PLANNER);

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectTasks, setProjectTasks] = useState<Record<string, Task[]>>({});
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());
  const [fetchedEditTask, setFetchedEditTask] = useState<CreatePlannerSidebarTaskProp | null>(null);
  const loadingSidebarEditTaskRef = useRef(false);
  const [createTaskForProject, setCreateTaskForProject] = useState<Project | null>(null);
  const [showCreateTaskSidebar, setShowCreateTaskSidebar] = useState(false);
  const [openProjectActionsId, setOpenProjectActionsId] = useState<string | null>(null);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  const taskFetchGenByProjectRef = useRef<Record<string, number>>({});
  const previewTaskRequestRef = useRef(0);

  const fetchAndStoreProjectTasks = useCallback(async (projectId: string) => {
    const nextGen = (taskFetchGenByProjectRef.current[projectId] ?? 0) + 1;
    taskFetchGenByProjectRef.current[projectId] = nextGen;

    setLoadingTasks((prev) => new Set(prev).add(projectId));
    try {
      const tasks = await fetchTasksForExpandedProject(projectId);
      if (taskFetchGenByProjectRef.current[projectId] !== nextGen) {
        return;
      }
      setProjectTasks((prev) => ({ ...prev, [projectId]: tasks }));
    } catch (err) {
      console.error("[WorkPlannerProjects] Failed to load tasks for project", projectId, err);
      if (taskFetchGenByProjectRef.current[projectId] !== nextGen) {
        return;
      }
      setProjectTasks((prev) => ({ ...prev, [projectId]: [] }));
    } finally {
      if (taskFetchGenByProjectRef.current[projectId] === nextGen) {
        setLoadingTasks((prev) => {
          const next = new Set(prev);
          next.delete(projectId);
          return next;
        });
      }
    }
  }, []);

  const handleToggleProject = useCallback(
    async (project: Project, e: React.MouseEvent) => {
      e.stopPropagation();
      const projectId = project.id;
      let shouldFetch = false;
      setExpandedProjects((prev) => {
        const next = new Set(prev);
        if (next.has(projectId)) {
          next.delete(projectId);
          return next;
        }
        next.add(projectId);
        shouldFetch = true;
        return next;
      });
      if (shouldFetch) {
        await fetchAndStoreProjectTasks(projectId);
      }
    },
    [fetchAndStoreProjectTasks],
  );

  const handleToggleTask = useCallback((taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const handlePreviewTask = useCallback(async (task: Task) => {
    if (loadingSidebarEditTaskRef.current) return;
    loadingSidebarEditTaskRef.current = true;
    const requestId = ++previewTaskRequestRef.current;
    setCreateTaskForProject(null);
    setFetchedEditTask(null);
    try {
      const raw = await getTask(task.id, Array.from(WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS));
      if (previewTaskRequestRef.current !== requestId) {
        return;
      }
      if (raw == null || typeof raw !== "object") {
        return;
      }
      setFetchedEditTask(
        mapGetTaskResponseToSidebarEditTask(raw as Record<string, unknown>) as CreatePlannerSidebarTaskProp,
      );
      setShowCreateTaskSidebar(true);
    } catch (err) {
      console.error("[WorkPlannerProjects] getTask failed for sidebar edit", task.id, err);
    } finally {
      if (previewTaskRequestRef.current === requestId) {
        loadingSidebarEditTaskRef.current = false;
      }
    }
  }, []);

  const handlePreviewSubtask = useCallback(
    async (parentTask: Task, sub: SubTask) => {
      await handlePreviewTask({
        id: sub.id,
        projectId: parentTask.projectId,
        title: sub.title,
        status: sub.status,
        priority: "medium",
        assignee: sub.assignee,
        dueDate: sub.dueDate,
        description: sub.title,
        subtasks: [],
        labels: [],
      });
    },
    [handlePreviewTask],
  );

  const handleOpenCreateTaskForExpandedProject = useCallback((projectRow: Project) => {
    setFetchedEditTask(null);
    setCreateTaskForProject(projectRow);
    setShowCreateTaskSidebar(true);
  }, []);

  const handleProjectRowMouseEnter = useCallback((projectId: string) => {
    setHoveredProjectId(projectId);
  }, []);

  const handleProjectRowMouseLeave = useCallback((projectId: string) => {
    setHoveredProjectId((prev) => (prev === projectId ? null : prev));
  }, []);

  const appendExpandedProjectRows = (
    rows: React.ReactNode[],
    project: Project,
    tasks: Task[],
    isLoadingTasks: boolean,
  ) => {
    if (isLoadingTasks) {
      rows.push(
        <tr key={`loading-${project.id}`} className="wp-nested-row-muted">
          <td colSpan={6} className="wp-nested-row-loading">
            <Spinner animation="border" size="sm" className="me-2 wp-spinner-muted" />
            <span className="wp-nested-row-loading-text">Loading tasks...</span>
          </td>
        </tr>,
      );
      return;
    }
    if (tasks.length === 0) {
      rows.push(
        <tr key={`empty-${project.id}`} className="wp-nested-row-muted">
          <td colSpan={6} className="wp-nested-row-empty">
            No tasks found for this project.
          </td>
        </tr>,
      );
    } else {
      tasks.forEach((task) => {
        rows.push(
          <TaskRow
            key={`task-${task.id}`}
            task={task}
            depth={1}
            onPreview={handlePreviewTask}
            expandedTasks={expandedTasks}
            onToggleTask={handleToggleTask}
            canPreviewEditTask={canPreviewEditTask}
            onPreviewSubtask={handlePreviewSubtask}
          />,
        );
      });
    }

    if (canManageProjectFromMembers(project, sessionUserPhoneOrExtension) && sessionCanCreatePlannerTask) {
      rows.push(
        <tr key={`add-task-${project.id}`} className="wp-nested-row-muted">
          <td colSpan={6} className="wp-add-task-row">
            <button
              type="button"
              className="wp-add-task-btn"
              onClick={addExpandedProjectTaskClickHandler(project, handleOpenCreateTaskForExpandedProject)}
            >
              <Plus size={14} />
              Add task
            </button>
          </td>
        </tr>,
      );
    }
  };

  const renderTableBody = () => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={6} className="text-center py-5 wp-table-loading-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading projects...
            </td>
          </tr>
        </tbody>
      );
    }

    if (projects.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={6} className="text-center py-5">
              <FolderOpen size={48} className="wp-empty-folder-icon" />
              <div className="wp-empty-state-text">No projects found</div>
            </td>
          </tr>
        </tbody>
      );
    }

    const rows: React.ReactNode[] = [];

    projects.forEach((project) => {
      const isExpanded = expandedProjects.has(project.id);
      const isLoadingTasksRow = loadingTasks.has(project.id);
      const tasks = projectTasks[project.id] || [];

      rows.push(
        <tr
          key={`project-${project.id}`}
          className={`generic-table-row clickable${isExpanded ? " wp-project-row-expanded" : ""}`}
          onClick={() => onProjectClick(project)}
          onMouseEnter={() => handleProjectRowMouseEnter(project.id)}
          onMouseLeave={() => handleProjectRowMouseLeave(project.id)}
        >
          <td className="wp-task-tree-row__cell-name">
            <div className="wp-project-row-name-cell">
              <button
                type="button"
                className="wp-project-expand-btn"
                onClick={projectExpandToggleClickHandler(project, handleToggleProject)}
                title={isExpanded ? "Collapse tasks" : "Expand tasks"}
              >
                {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRight size={16} />}
              </button>

              <div
                className="wp-project-icon-wrap"
                style={{ "--wp-project-accent": project.iconColor } as CSSProperties}
              >
                <project.icon size={20} />
              </div>
              <span className="wp-project-name-text">{project.name}</span>

              {hoveredProjectId === project.id ? (
                <button
                  type="button"
                  className="preview-button wp-project-preview-floating"
                  onClick={projectPreviewFloatingClickHandler(project, onProjectClick)}
                >
                  Preview
                </button>
              ) : null}
            </div>
          </td>

          <td>
            <div className="member-avatar bg-primary">{project.members?.length || 0}</div>
          </td>

          <td>{project.open}</td>

          <td>
            <span className={project.overdue > 0 ? "overdue-count" : ""}>{project.overdue}</span>
          </td>

          <td>{project.lastUpdate}</td>

          <td className="generic-table-actions-cell" onClick={(e) => e.stopPropagation()}>
            <div className="generic-table-actions">
              <div>
                <Dropdown
                  show={openProjectActionsId === project.id}
                  onToggle={createProjectRowActionsToggleHandler(project.id, setOpenProjectActionsId)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown.Toggle
                    variant="link"
                    size="sm"
                    className="p-1 text-decoration-none shadow-none wp-dropdown-toggle-muted"
                    id={`project-row-actions-${project.id}`}
                  >
                    <MoreVertical size={16} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end" popperConfig={{ strategy: "fixed" }} renderOnMount>
                    <Dropdown.Item
                      as="button"
                      type="button"
                      onClick={projectOverviewMenuClickHandler(project, setOpenProjectActionsId)}
                    >
                      <Eye size={14} className="me-2" />
                      Project overview
                    </Dropdown.Item>
                    {canAdministerProjectFromMembers(project, sessionUserPhoneOrExtension) &&
                    sessionPlannerProjectCrud.canUpdate ? (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          as="button"
                          type="button"
                          onClick={projectEditMenuClickHandler(
                            project,
                            setOpenProjectActionsId,
                            onEditProject,
                          )}
                        >
                          <Settings size={14} className="me-2" />
                          Edit Project
                        </Dropdown.Item>
                      </>
                    ) : null}
                    {canAdministerProjectFromMembers(project, sessionUserPhoneOrExtension) &&
                    sessionPlannerProjectCrud.canDelete ? (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item
                          as="button"
                          type="button"
                          className="text-danger"
                          onClick={projectDeleteMenuClickHandler(
                            project,
                            setOpenProjectActionsId,
                            onDeleteProject,
                          )}
                        >
                          <Trash2 size={14} className="me-2" />
                          Delete Project
                        </Dropdown.Item>
                      </>
                    ) : null}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </td>
        </tr>,
      );

      if (isExpanded) {
        appendExpandedProjectRows(rows, project, tasks, isLoadingTasksRow);
      }
    });

    return <tbody>{rows}</tbody>;
  };

  const closeCreateSidebar = useCallback(() => {
    setShowCreateTaskSidebar(false);
    setFetchedEditTask(null);
    setCreateTaskForProject(null);
  }, []);

  const handleCreateTaskSidebarSubmit = useCallback(
    async (data: CreateTaskSidebarSubmitPayload) => {
      const projectIdNum =
        data.projectId ??
        projectIdFromSidebarEditTask(fetchedEditTask) ??
        createTaskForProject?.apiData?.id ??
        null;
      if (projectIdNum != null) {
        const projectIdStr = String(projectIdNum);
        if (expandedProjects.has(projectIdStr)) {
          await fetchAndStoreProjectTasks(projectIdStr);
        }
      }
      closeCreateSidebar();
    },
    [
      fetchedEditTask,
      createTaskForProject,
      expandedProjects,
      fetchAndStoreProjectTasks,
      closeCreateSidebar,
    ],
  );

  return (
    <>
      <CreateTaskSidebar
        isOpen={showCreateTaskSidebar}
        onClose={closeCreateSidebar}
        onCreate={handleCreateTaskSidebarSubmit}
        extensions={extensions}
        labels={createTaskForProject?.apiData?.labels ?? []}
        project={createTaskForProject ? mapTableProjectToPlannerSidebarProject(createTaskForProject) : undefined}
        task={fetchedEditTask ?? undefined}
        isEdit={!!fetchedEditTask}
      />

      <GenericTable<Project>
        data={projects}
        columns={columns}
        actions={actions}
        showActions={true}
        showToolbarActions={false}
        actionsLabel="Actions"
        pagination={{
          currentPage: pagination.page,
          rowsPerPage: pagination.limit,
          totalRows: pagination.total,
          pageSizeOptions: [10, 15, 25, 50],
        }}
        onPaginationChange={onPaginationChange}
        sortable={true}
        loading={loading}
        emptyMessage={
          <div className="wp-generic-table-empty">
            <FolderOpen size={48} className="wp-generic-table-empty-icon" />
            <p className="wp-generic-table-empty-title">No projects found</p>
          </div>
        }
        hover={true}
        uniqueKey="id"
        customizableColumns={true}
        columnStorageKey="planner-projects-columns"
        showToolbar={true}
        toolbar={toolbarConfig}
        statsCards={statsCards}
        customBody={
          <div className="generic-table-responsive wp-task-tree">
            <table className="table generic-table mb-0 wp-task-tree__table">
              <thead className="generic-table-header">
                <tr>
                  <th className="generic-table-th">Project Name</th>
                  <th className="generic-table-th">Members</th>
                  <th className="generic-table-th">Open Tasks</th>
                  <th className="generic-table-th">Overdue Tasks</th>
                  <th className="generic-table-th">Last Update</th>
                  <th className="generic-table-th generic-table-actions-header">Actions</th>
                </tr>
              </thead>
              {renderTableBody()}
            </table>
          </div>
        }
      />
    </>
  );
};
