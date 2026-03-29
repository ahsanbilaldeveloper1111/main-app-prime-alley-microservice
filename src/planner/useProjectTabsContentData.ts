import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
} from 'lucide-react';
import {
  getProject,
  getRecentActivity,
  getOverdueTasks,
  listTasks,
  type ListTasksSummary,
} from '@utils/tasks';
import {
  applyListTabFiltersToParams,
  deriveProjectOverviewFromDetails,
  formatOverdueTasksForUi,
  listTasksEnvelopeOk,
  type ListTabFiltersState,
  type ListTasksParams,
  normalizeActivitiesPayload,
  readListTasksEnvelope,
} from './projectTabsContentUtils';

const emptyStatusCards = () => [
  { title: 'Open', count: 0, icon: FileText, color: '#4680FF', bgLight: '#E3F2FD' },
  { title: 'In Progress', count: 0, icon: Clock, color: '#FFB64D', bgLight: '#FFF3E0' },
  { title: 'Done (30d)', count: 0, icon: CheckCircle2, color: '#2CA87F', bgLight: '#E8F5E9' },
  { title: 'Overdue', count: 0, icon: AlertCircle, color: '#DC2626', bgLight: '#FFEBEE' },
  { title: 'Unassigned', count: 0, icon: Users, color: '#4FC3F7', bgLight: '#E1F5FE' },
];

export type UseProjectTabsContentDataOptions = {
  /**
   * When true, do not auto-fetch list tab tasks on tab switch (embedded `TasksListingPage` loads tasks).
   * Use `ingestEmbeddedListSummary` to update stats cards from that response.
   */
  skipAutomaticListTabFetch?: boolean;
};

export function useProjectTabsContentData(
  selectedProjectId: string | number | undefined,
  activeTab: string,
  options?: UseProjectTabsContentDataOptions,
) {
  const [assignees, setAssignees] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingProjectData, setLoadingProjectData] = useState(false);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [allOverdueTasks, setAllOverdueTasks] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingOverdue, setLoadingOverdue] = useState(false);

  const [boardTasks, setBoardTasks] = useState<any[]>([]);
  const [loadingBoardTasks, setLoadingBoardTasks] = useState(false);

  const [tasksList, setTasksList] = useState<any[]>([]);
  const [loadingListTasks, setLoadingListTasks] = useState(false);
  const [listPagination, setListPagination] = useState<any>(null);
  const [listSummary, setListSummary] = useState<any>(null);
  const [listPage, setListPage] = useState(1);
  const [listLimit, setListLimit] = useState(15);
  const [listFilters, setListFilters] = useState<ListTabFiltersState | null>(null);

  const skipAutomaticListTabFetch = Boolean(options?.skipAutomaticListTabFetch);

  const ingestEmbeddedListSummary = useCallback((summary: ListTasksSummary | null | undefined) => {
    if (summary != null && typeof summary === 'object') {
      setListSummary(summary);
    }
  }, []);

  const [statusCards, setStatusCards] = useState(emptyStatusCards);
  const [tasksByStatus, setTasksByStatus] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);

  const fetchProjectData = useCallback(async () => {
    if (selectedProjectId == null || selectedProjectId === '') {
      return;
    }

    setLoadingProjectData(true);
    setLoadingActivities(true);
    setLoadingOverdue(true);

    try {
      const withRelations = [
        'members.user',
        'tasks',
        'tasks.assignees',
        'tasks.labels',
        'tasks.status',
        'statuses',
        'owner',
      ];
      const projectIdForActivity = Number(selectedProjectId);

      const [projectDetails, activities, overdue] = await Promise.all([
        getProject(selectedProjectId, withRelations),
        getRecentActivity(projectIdForActivity),
        getOverdueTasks(projectIdForActivity),
      ]);

      if (projectDetails) {
        const derived = deriveProjectOverviewFromDetails(projectDetails);
        setAssignees(derived.assignees);
        setLabels(derived.labels);
        setStatuses(derived.statuses);
        setMembers(derived.members);
        setTasksByStatus(derived.tasksByStatus);
        setStatusCards(derived.statusCards);
        setWorkloadData(derived.workloadData);
      }

      const activityList = normalizeActivitiesPayload(activities);
      setRecentActivity(activityList.slice(0, 4));

      const { all: overdueAll, preview: overduePreview } =
        formatOverdueTasksForUi(overdue);
      setAllOverdueTasks(overdueAll);
      setOverdueTasks(overduePreview);
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoadingProjectData(false);
      setLoadingActivities(false);
      setLoadingOverdue(false);
    }
  }, [selectedProjectId]);

  const fetchBoardTasks = useCallback(async () => {
    if (selectedProjectId == null || selectedProjectId === '') {
      return;
    }

    try {
      setLoadingBoardTasks(true);
      const withRelations = ['assignees', 'labels', 'status'];
      const response = await listTasks({
        project_id: Number(selectedProjectId),
        withRelations,
      });

      if (listTasksEnvelopeOk(response)) {
        setBoardTasks(readListTasksEnvelope(response).data as any[]);
      }
    } catch (error) {
      console.error('Error fetching board tasks:', error);
    } finally {
      setLoadingBoardTasks(false);
    }
  }, [selectedProjectId]);

  const fetchListTasks = useCallback(
    async (
      filtersOverride?: ListTabFiltersState | null,
      pageOverride?: number,
      limitOverride?: number,
    ) => {
      if (selectedProjectId == null || selectedProjectId === '') {
        return;
      }
      const filters = filtersOverride ?? listFilters;
      const page = pageOverride ?? listPage;
      const limit = limitOverride ?? listLimit;
      try {
        setLoadingListTasks(true);
        const withRelations = ['assignees', 'labels', 'status'];
        const params: ListTasksParams = {
          project_id: Number(selectedProjectId),
          withRelations,
          order: { column: 'created_at', dir: 'desc' as const },
          page,
          limit,
        };
        if (filters) {
          applyListTabFiltersToParams(params, filters, statuses);
        }
        const response = await listTasks(params);

        if (listTasksEnvelopeOk(response)) {
          const payload = readListTasksEnvelope(response);
          setTasksList(payload.data as any[]);
          setListPagination(payload.pagination);
          setListSummary(payload.summary);
        }
      } catch (error) {
        console.error('Error fetching list tasks:', error);
      } finally {
        setLoadingListTasks(false);
      }
    },
    [selectedProjectId, listFilters, listPage, listLimit, statuses],
  );

  const fetchProjectDataRef = useRef(fetchProjectData);
  fetchProjectDataRef.current = fetchProjectData;
  const fetchBoardTasksRef = useRef(fetchBoardTasks);
  fetchBoardTasksRef.current = fetchBoardTasks;
  const fetchListTasksRef = useRef(fetchListTasks);
  fetchListTasksRef.current = fetchListTasks;

  useEffect(() => {
    if (selectedProjectId != null && selectedProjectId !== '') {
      fetchProjectDataRef.current().catch(() => undefined);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (activeTab === 'board' && selectedProjectId != null && selectedProjectId !== '') {
      fetchBoardTasksRef.current().catch(() => undefined);
    }
  }, [activeTab, selectedProjectId]);

  useEffect(() => {
    if (skipAutomaticListTabFetch) {
      return;
    }
    if (activeTab === 'list' && selectedProjectId != null && selectedProjectId !== '') {
      fetchListTasksRef.current().catch(() => undefined);
    }
  }, [activeTab, selectedProjectId, skipAutomaticListTabFetch]);

  const handleListApplyFilters = (filters: ListTabFiltersState) => {
    setListFilters(filters);
    setListPage(1);
    fetchListTasks(filters, 1, listLimit).catch(() => undefined);
  };

  const handleListClearFilters = () => {
    setListFilters(null);
    setListPage(1);
    fetchListTasks(null, 1, listLimit).catch(() => undefined);
  };

  const defaultListPagination = {
    page: 1,
    limit: listLimit,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  };

  const handleListPaginationChange = (
    updater: SetStateAction<{
      page: number;
      limit: number;
      total: number;
      last_page: number;
      from: number;
      to: number;
    }>,
  ) => {
    const next =
      typeof updater === 'function'
        ? updater(listPagination || defaultListPagination)
        : updater;
    setListPage(next.page);
    setListLimit(next.limit);
    fetchListTasks(undefined, next.page, next.limit).catch(() => undefined);
  };

  return {
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
    fetchListTasks,
    handleListApplyFilters,
    handleListClearFilters,
    handleListPaginationChange,
    ingestEmbeddedListSummary,
  };
}
