import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { usePermissions } from '@utils/permissionUtils';
import { HEADER_CONSTANTS } from '@constants/headerConstants';
import {
  canAdministerProjectFromMembers,
  canManageProjectFromMembers,
  getSessionPhoneOrExtension,
} from '@planner/projectMemberRole';
import CreateTaskSidebar from '@components/CreatePlannerTaskSidebar';
import { mapApiProjectToPlannerSidebarProject } from '@components/planner/workPlannerProjects/expandableProjectTableHelpers';
import {
  BOARD_FILTER_STANDARD_PRIORITIES,
  extensionOrIdToTrimmedString,
  filterBoardTasksForColumns,
  firstExtensionOrIdString,
  sliceBoardTasksByStatusId,
  sortStringsLocale,
} from '@planner/projectTabsContentUtils';
import {
  useProjectTabsContentData,
  type UseProjectTabsContentDataOptions,
} from '@planner/useProjectTabsContentData';

const PROJECT_DETAIL_LIST_TAB_OPTS = {
  skipAutomaticListTabFetch: true,
} as const satisfies UseProjectTabsContentDataOptions;
import TabsNavigation from './TabsNavigation';
import OverviewTab from './OverviewTab';
import BoardTab from './BoardTab';
import ListTab from './ListTab';
import MembersTab from './MembersTab';
import StatusesTab from './StatusesTab';
import LabelsTab from './LabelsTab';
import OverdueTasksModal from './OverdueTasksModal';
import type { ActivityLogExtension } from '@planner/activityLogExtension';
const { PERMISSIONS } = HEADER_CONSTANTS;

type NextRouterQueryValue = string | string[] | undefined;
type NextRouterQuery = Record<string, NextRouterQueryValue>;

function readProjectTabFromQuery(tab: NextRouterQueryValue): string {
  if (typeof tab === 'string' && tab.trim()) {
    return tab.toLowerCase();
  }
  return '';
}

function resolveProjectRouteId(
  projectId: string | number | null | undefined,
  routeId: NextRouterQueryValue,
): string | undefined {
  if (projectId != null && String(projectId).trim() !== '') {
    return String(projectId);
  }
  if (typeof routeId === 'string' && routeId.trim() !== '') {
    return routeId;
  }
  return undefined;
}

function buildProjectTabsRouteQuery(
  routerQuery: NextRouterQuery,
  tab: string,
  projectId?: string | number | null,
): NextRouterQuery {
  const nextQuery: NextRouterQuery = { ...routerQuery, tab };
  const idValue = resolveProjectRouteId(projectId, routerQuery.id);
  if (idValue) {
    nextQuery.id = idValue;
  }
  return nextQuery;
}

interface ProjectTabsContentProps {
  selectedProject: any;
  hierarchyDataExtensions?: any[];
  hierarchyLoading?: boolean;
  onCreateTask?: (formData: any) => Promise<void>;
  /** When set (e.g. project detail page), board task cards open the parent sidebar instead of BoardView's modal. */
  onBoardTaskClick?: (task: any) => void | Promise<void>;
}

export interface ProjectTabsContentRef {
  openCreateTaskModal: () => void;
  switchToBoardView: () => void;
  /** Refetch project overview, board, and list data (e.g. after creating a task from the header). */
  refreshAfterTaskChange: () => Promise<void>;
}

const ProjectTabsContent = forwardRef<ProjectTabsContentRef, ProjectTabsContentProps>(({
  selectedProject,
  hierarchyDataExtensions = [],
  hierarchyLoading: _hierarchyLoading = false,
  onCreateTask,
  onBoardTaskClick,
}, ref) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const sessionUserPhoneOrExtension = useMemo(
    () => getSessionPhoneOrExtension(session),
    [session],
  );
  /** Tasks / board / create task — admin + member (+ owner); not viewer. */
  const canManageProject = useMemo(
    () => canManageProjectFromMembers(selectedProject, sessionUserPhoneOrExtension),
    [selectedProject, sessionUserPhoneOrExtension],
  );
  /** Members, statuses, labels, project metadata — admin (+ owner) only. */
  const canAdministerProject = useMemo(
    () => canAdministerProjectFromMembers(selectedProject, sessionUserPhoneOrExtension),
    [selectedProject, sessionUserPhoneOrExtension],
  );
  const canCreateTask = hasPermission(PERMISSIONS.CREATE_TASKS_WORK_PLANNER);
  const canViewProjectDetails = hasPermission(PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER);
  const canViewTaskDetails = hasPermission(PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER);
  const canViewMembersTab =
    canAdministerProject && hasPermission(PERMISSIONS.VIEW_PROJECT_MEMBERS_WORK_PLANNER);
  const canViewStatusesTab = hasPermission(PERMISSIONS.VIEW_STATUSES_WORK_PLANNER);
  const canViewLabelsTab =
    canAdministerProject &&
    hasAnyPermission([
      PERMISSIONS.CREATE_LABELS_WORK_PLANNER,
      PERMISSIONS.UPDATE_LABELS_WORK_PLANNER,
      PERMISSIONS.DELETE_LABELS_WORK_PLANNER,
    ]);
  const visibleTabs = useMemo(
    () =>
      [
        ...(canViewProjectDetails ? ['Overview'] : []),
        ...(canViewTaskDetails ? ['Board', 'List'] : []),
        ...(canViewMembersTab ? ['Members'] : []),
        ...(canViewStatusesTab ? ['Statuses'] : []),
        ...(canViewLabelsTab ? ['Labels'] : []),
      ] as string[],
    [
      canViewLabelsTab,
      canViewMembersTab,
      canViewProjectDetails,
      canViewStatusesTab,
      canViewTaskDetails,
    ],
  );

  const [activeTab, setActiveTab] = useState('overview');
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [selectedStatusForTask, setSelectedStatusForTask] = useState<number | null>(null);
  const [embeddedListRefreshSignal, setEmbeddedListRefreshSignal] = useState(0);
  const [boardSearchTerm, setBoardSearchTerm] = useState('');
  const [boardSelectedAssignee, setBoardSelectedAssignee] = useState('All Assignees');
  const [boardSelectedPriority, setBoardSelectedPriority] = useState('All Priorities');
  const [boardSelectedLabel, setBoardSelectedLabel] = useState('All Labels');
  const [boardSelectedStatus, setBoardSelectedStatus] = useState('All Statuses');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const selectedProjectId = selectedProject?.id;
  const sidebarProject = useMemo(
    () =>
      selectedProject
        ? mapApiProjectToPlannerSidebarProject(selectedProject)
        : undefined,
    [selectedProject],
  );
  const projectTabsDataOptions = useMemo<UseProjectTabsContentDataOptions>(
    () => ({
      ...PROJECT_DETAIL_LIST_TAB_OPTS,
      boardFilters: {
        searchTerm: boardSearchTerm,
        selectedAssignee: boardSelectedAssignee,
        selectedPriority: boardSelectedPriority,
        selectedStatus: boardSelectedStatus,
      },
    }),
    [
      boardSearchTerm,
      boardSelectedAssignee,
      boardSelectedPriority,
      boardSelectedStatus,
    ],
  );
  const {
    assignees,
    labels,
    statuses,
    members,
    loadingProjectData,
    recentActivity,
    overdueTasks,
    allOverdueTasks,
    loadingActivities,
    loadingOverdue,
    boardTasks,
    loadingBoardTasks,
    tasksList,
    loadingListTasks,
    listPagination,
    listSummary,
    listPage,
    listLimit,
    statusCards,
    tasksByStatus,
    workloadData,
    fetchProjectData,
    fetchBoardTasks,
    handleListApplyFilters,
    handleListClearFilters,
    handleListPaginationChange,
    ingestEmbeddedListSummary,
  } = useProjectTabsContentData(selectedProjectId, activeTab, projectTabsDataOptions);

  useEffect(() => {
    if (!router.isReady || visibleTabs.length === 0) {
      return;
    }
    const tabFromUrl = readProjectTabFromQuery(router.query.tab);
    if (!tabFromUrl) {
      return;
    }
    const validTabs = visibleTabs.map((tab) => tab.toLowerCase());
    if (validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      return;
    }
    setActiveTab(validTabs[0]);
  }, [router.isReady, router.query.tab, visibleTabs]);

  useEffect(() => {
    if (visibleTabs.length === 0) {
      return;
    }
    const validTabs = visibleTabs.map((tab) => tab.toLowerCase());
    setActiveTab((current) => (validTabs.includes(current) ? current : validTabs[0]));
  }, [visibleTabs]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (!router.isReady) {
      return;
    }
    router.push(
      {
        pathname: router.pathname,
        query: buildProjectTabsRouteQuery(router.query, tab, selectedProjectId),
      },
      undefined,
      { shallow: true },
    );
  }, [router, selectedProjectId]);

  const getTasksByStatus = (statusId: string | number | null) => {
    const filtered = filterBoardTasksForColumns(
      boardTasks,
      {
        // Search/assignee/priority/status are now applied by backend query.
        searchTerm: '',
        showCompletedTasks,
        selectedAssignee: 'All Assignees',
        selectedPriority: 'All Priorities',
        selectedLabel: boardSelectedLabel,
        selectedStatus: 'All Statuses',
      },
      statuses,
    );
    return sliceBoardTasksByStatusId(filtered, statusId);
  };

  const getAllBoardAssignees = (): string[] => {
    const assigneeSet = new Set<string>();
    boardTasks.forEach((task: any) => {
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach((assignee: any) => {
          const ext = firstExtensionOrIdString(
            assignee.extension_number,
            assignee.extension,
            assignee.id,
          );
          if (ext) {
            assigneeSet.add(ext);
          } else {
            const nameOnly = extensionOrIdToTrimmedString(assignee.user?.name);
            if (nameOnly) assigneeSet.add(nameOnly);
          }
        });
      }
    });
    (assignees || []).forEach((row: any) => {
      const ext = firstExtensionOrIdString(row.extension_number, row.id);
      if (ext) assigneeSet.add(ext);
    });
    return Array.from(assigneeSet).sort(sortStringsLocale);
  };

  const getAllBoardPriorities = (): string[] => {
    const prioritySet = new Set<string>(BOARD_FILTER_STANDARD_PRIORITIES);
    boardTasks.forEach((task: any) => {
      if (task.priority) {
        const raw = String(task.priority).trim().toLowerCase();
        const label =
          raw === 'normal'
            ? 'Medium'
            : raw.charAt(0).toUpperCase() + raw.slice(1);
        prioritySet.add(label);
      }
    });
    return Array.from(prioritySet).sort(sortStringsLocale);
  };

  const refreshTaskViewsForActiveTab = useCallback(async () => {
    if (activeTab === 'board') {
      await fetchBoardTasks();
    } else if (activeTab === 'list') {
      setEmbeddedListRefreshSignal((n) => n + 1);
    }
  }, [activeTab, fetchBoardTasks]);

  const handleCreateTask = async (formData: any) => {
    if (!selectedProject) {
      return;
    }

    try {
      if (onCreateTask) {
        await onCreateTask(formData);
      }
      await fetchProjectData();
      await refreshTaskViewsForActiveTab();
    } catch (error) {
      console.error('Error refreshing task data:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    openCreateTaskModal: () => {
      if (selectedProject && canManageProject && canCreateTask) {
        setShowCreateTaskModal(true);
      }
    },
    switchToBoardView: () => {
      handleTabChange('board');
    },
    refreshAfterTaskChange: async () => {
      await fetchProjectData();
      await refreshTaskViewsForActiveTab();
    },
  }), [selectedProject, canManageProject, canCreateTask, handleTabChange, fetchProjectData, refreshTaskViewsForActiveTab]);

  const styles = {
    tabsContainer: { backgroundColor: '#fff', borderBottom: '1px solid #E5E9F2' },
    tabsInner: {  display: 'flex', gap: '2rem' },
    tab: { background: 'none', border: 'none', padding: '1rem 0', fontSize: '0.95rem', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' as const },
    contentContainer: {
      margin: '0 auto',
      paddingTop: '1.5rem',
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem',
      backgroundColor: '#ffffff',
      maxWidth: '100%',
      minWidth: 0,
      overflowX: 'hidden' as const,
      boxSizing: 'border-box' as const,
    },
    grid: { display: 'grid', gap: '1rem', marginBottom: '1.5rem' },
    gridTwo: { gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' },
    card: { backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '1.5rem' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    cardTitle: { margin: 0, fontWeight: '600', color: '#1F2937', fontSize: '1.1rem' },
    filterRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' },
    input: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
    select: { width: '100%', padding: '0.75rem', border: '1px solid #E5E9F2', borderRadius: '6px', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', backgroundColor: 'white' },
    inputGroup: { position: 'relative' as const, display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute' as const, left: '0.75rem', pointerEvents: 'none' as const },
    inputWithIcon: { paddingLeft: '2.5rem' },
    buttonOutline: { padding: '0.625rem 1.25rem', backgroundColor: 'white', color: '#4680FF', border: '1px solid #4680FF', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', transition: 'all 0.2s' },
    buttonLight: { padding: '0.625rem', backgroundColor: '#F4F7FA', color: '#6B7280', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' },
    chartContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' },
    legendItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    legendDot: { width: '12px', height: '12px', borderRadius: '50%', marginRight: '0.5rem' },
    badge: { padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', display: 'inline-block' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { fontSize: '0.75rem', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.5px', padding: '0.75rem', textAlign: 'left' as const, backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E9F2' },
    td: { padding: '1rem 0.75rem', borderBottom: '1px solid #F3F4F6', color: '#4B5563', fontSize: '0.9rem' },
    activityItem: { display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' },
    activityContent: { flex: 1 },
    activityText: { fontSize: '0.9rem', color: '#4B5563', marginBottom: '0.25rem', lineHeight: '1.5' },
    activityTime: { fontSize: '0.8rem', color: '#9CA3AF' },
    link: { color: '#4680FF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' },
    tableWrapper: { overflowX: 'auto' as const }
  };

  const emptyProjectMessage = (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
      <p>Please select a project to view details</p>
    </div>
  );

  const tabsLoadingMessage = (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
      <p>Loading project tabs…</p>
    </div>
  );

  const renderTabBody = () => {
    if (!selectedProject) {
      return emptyProjectMessage;
    }
    if (visibleTabs.length === 0) {
      return tabsLoadingMessage;
    }
    return renderProjectTabPanel(selectedProject);
  };

  const renderProjectTabPanel = (project: NonNullable<typeof selectedProject>) => {
    switch (activeTab) {
      case 'overview':
        if (!canViewProjectDetails) return null;
        return (
          <OverviewTab
            statusCards={statusCards}
            loadingProjectData={loadingProjectData}
            assignees={assignees}
            labels={labels}
            statuses={statuses}
            tasksByStatus={tasksByStatus}
            workloadData={workloadData}
            recentActivity={recentActivity}
            loadingActivities={loadingActivities}
            overdueTasks={overdueTasks}
            loadingOverdue={loadingOverdue}
            projectId={project.id}
            hierarchyExtensions={hierarchyDataExtensions as ActivityLogExtension[] | undefined}
            onViewOverdue={() => setShowTasksModal(true)}
            styles={styles}
          />
        );
      case 'board':
        if (!canViewTaskDetails) return null;
        return (
          <BoardTab
            selectedProject={project}
            hierarchyDataExtensions={hierarchyDataExtensions}
            statuses={statuses}
            boardTasks={boardTasks}
            loadingBoardTasks={loadingBoardTasks}
            labels={labels}
            boardSearchTerm={boardSearchTerm}
            setBoardSearchTerm={setBoardSearchTerm}
            boardSelectedAssignee={boardSelectedAssignee}
            setBoardSelectedAssignee={setBoardSelectedAssignee}
            boardSelectedPriority={boardSelectedPriority}
            setBoardSelectedPriority={setBoardSelectedPriority}
            boardSelectedLabel={boardSelectedLabel}
            setBoardSelectedLabel={setBoardSelectedLabel}
            boardSelectedStatus={boardSelectedStatus}
            setBoardSelectedStatus={setBoardSelectedStatus}
            showCompletedTasks={showCompletedTasks}
            setShowCompletedTasks={setShowCompletedTasks}
            onCreateTask={(statusId) => {
              if (!canManageProject || !canCreateTask) return;
              setSelectedStatusForTask(statusId);
              setShowCreateTaskModal(true);
            }}
            getAllBoardAssignees={getAllBoardAssignees}
            getAllBoardPriorities={getAllBoardPriorities}
            getTasksByStatus={getTasksByStatus}
            recentActivity={recentActivity}
            loadingActivities={loadingActivities}
            overdueTasks={overdueTasks}
            loadingOverdue={loadingOverdue}
            onViewOverdue={() => setShowTasksModal(true)}
            styles={styles}
            onTaskStatusChange={() => {
              if (activeTab === 'board' && project?.id) {
                fetchBoardTasks().catch(() => undefined);
                fetchProjectData().catch(() => undefined);
              }
            }}
            onTaskClick={onBoardTaskClick}
          />
        );
      case 'list':
        if (!canViewTaskDetails) return null;
        return (
          <ListTab
            tasksList={tasksList}
            loading={loadingListTasks}
            listSummary={listSummary}
            listPagination={listPagination ?? { page: listPage, limit: listLimit, total: 0, last_page: 1, from: 0, to: 0 }}
            setListPagination={handleListPaginationChange}
            styles={styles}
            selectedProject={project}
            extensions={hierarchyDataExtensions as any}
            labels={labels}
            statuses={statuses}
            embeddedListRefreshSignal={embeddedListRefreshSignal}
            onEmbeddedListSummary={ingestEmbeddedListSummary}
            onApplyFilters={handleListApplyFilters}
            onClearFilters={handleListClearFilters}
            onRefresh={() => {
              if (activeTab === 'list' && project?.id) {
                setEmbeddedListRefreshSignal((n) => n + 1);
                fetchProjectData().catch(() => undefined);
              }
            }}
          />
        );
      case 'members':
        return (
          <MembersTab
            selectedProject={project}
            members={members}
            loading={loadingProjectData}
            onRefresh={fetchProjectData}
            styles={styles}
            hierarchyDataExtensions={hierarchyDataExtensions}
            canManageProject={canAdministerProject}
          />
        );
      case 'statuses':
        return (
          <StatusesTab
            selectedProject={project}
            statuses={statuses}
            loading={loadingProjectData}
            onRefresh={fetchProjectData}
            styles={styles}
            canManageProject={canAdministerProject}
          />
        );
      case 'labels':
        return (
          <LabelsTab
            selectedProject={project}
            labels={labels}
            loading={loadingProjectData}
            onRefresh={fetchProjectData}
            styles={styles}
            canManageProject={canAdministerProject}
          />
        );
      case 'reports':
        return (
          <>
            Coming Soon
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <TabsNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={visibleTabs}
      />

      <div style={styles.contentContainer}>
        {renderTabBody()}
      </div>

      <OverdueTasksModal
        show={showTasksModal}
        onHide={() => setShowTasksModal(false)}
        tasks={allOverdueTasks}
        loading={loadingOverdue}
      />

      <CreateTaskSidebar
        isOpen={showCreateTaskModal}
        onClose={() => {
          setShowCreateTaskModal(false);
          setSelectedStatusForTask(null);
        }}
        onCreate={handleCreateTask}
        onCreateAndOpen={handleCreateTask}
        extensions={hierarchyDataExtensions as any}
        labels={labels}
        project={sidebarProject}
        statuses={statuses.map((status: any) => ({
          id: status.id,
          name: status.name,
          icon: '',
          color: status.color || '',
          is_default:
            status.is_default === true || status.is_deefault === true,
        }))}
        selectedStatusForTask={selectedStatusForTask}
        taskTypeChoices={['regular', 'recurring']}
        lockProjectSelection={Boolean(sidebarProject)}
      />
    </>
  );
});

ProjectTabsContent.displayName = 'ProjectTabsContent';

export default ProjectTabsContent;
