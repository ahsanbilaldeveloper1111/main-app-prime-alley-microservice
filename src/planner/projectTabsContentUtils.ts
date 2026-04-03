import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatDateForTable } from '@utils/Helper';
import type { listTasks } from '@utils/tasks';

/** `listTasks` has a default param, so TypeScript may treat the first argument as optional. */
export type ListTasksParams = NonNullable<Parameters<typeof listTasks>[0]>;

export type ListTabFiltersState = {
  searchTerm: string;
  filterAssignee: string[];
  filterStatus: string;
  filterPriority: string;
  filterCreatedAtFrom: string;
  filterCreatedAtTo: string;
};

const LIST_FILTER_PRIORITY_MAP: Record<string, string> = {
  Low: 'low',
  Medium: 'normal',
  High: 'high',
  Urgent: 'urgent',
};

export type ListTasksEnvelope = {
  success?: boolean;
  data?: unknown[];
  pagination?: unknown;
  summary?: unknown;
};

export function listTasksEnvelopeOk(res: unknown): res is ListTasksEnvelope {
  if (res == null || typeof res !== 'object') {
    return false;
  }
  return (res as ListTasksEnvelope).success !== false;
}

export function readListTasksEnvelope(res: unknown): {
  data: unknown[];
  pagination: unknown;
  summary: unknown;
} {
  const e = res as ListTasksEnvelope;
  return {
    data: e.data ?? [],
    pagination: e.pagination ?? null,
    summary: e.summary ?? null,
  };
}

export function applyListTabFiltersToParams(
  params: ListTasksParams,
  filters: ListTabFiltersState,
  statuses: { id?: number; name: string }[],
): void {
  const trimmed = filters.searchTerm?.trim();
  if (trimmed) {
    params.search = trimmed;
  }

  if (filters.filterStatus && filters.filterStatus !== 'All Status') {
    const statusObj = statuses.find((s) => s.name === filters.filterStatus);
    const id = statusObj?.id;
    if (id != null) {
      params.status_id = id;
    }
  }

  if (filters.filterPriority && filters.filterPriority !== 'All Priority') {
    const mapped = LIST_FILTER_PRIORITY_MAP[filters.filterPriority];
    params.priority =
      mapped ?? filters.filterPriority.toLowerCase();
  }

  if (filters.filterAssignee?.length) {
    params.assignees = filters.filterAssignee;
  }
  if (filters.filterCreatedAtFrom) {
    params.created_at_from = filters.filterCreatedAtFrom;
  }
  if (filters.filterCreatedAtTo) {
    params.created_at_to = filters.filterCreatedAtTo;
  }
}

type WorkloadRow = {
  name: string;
  initials: string;
  backlog: number;
  todo: number;
  progress: number;
  review: number;
  done: number;
};

function ensureWorkloadRow(
  map: Record<string, WorkloadRow>,
  key: string,
  name: string,
  initials: string,
): WorkloadRow {
  let row = map[key];
  if (!row) {
    row = {
      name,
      initials,
      backlog: 0,
      todo: 0,
      progress: 0,
      review: 0,
      done: 0,
    };
    map[key] = row;
  }
  return row;
}

function applyStatusToWorkloadRow(
  row: WorkloadRow,
  statusNameLower: string,
  isCompleted: boolean,
): void {
  if (statusNameLower.includes('backlog')) {
    row.backlog += 1;
  } else if (
    statusNameLower.includes('todo') ||
    statusNameLower.includes('to do')
  ) {
    row.todo += 1;
  } else if (statusNameLower.includes('progress')) {
    row.progress += 1;
  } else if (statusNameLower.includes('review')) {
    row.review += 1;
  } else if (isCompleted) {
    row.done += 1;
  }
}

function buildStatusIdMap(projectStatuses: { id: number | string; name: string }[]) {
  const statusMap: Record<string, { name: string; color?: string }> = {};
  for (const status of projectStatuses) {
    statusMap[String(status.id)] = status;
  }
  return statusMap;
}

function getTaskStatusName(
  task: { status?: { name?: string }; status_id?: number | string },
  statusMap: Record<string, { name: string }>,
): string {
  if (task.status?.name) {
    return task.status.name;
  }
  return statusMap[String(task.status_id)]?.name ?? '';
}

function buildWorkloadMap(
  tasks: any[],
  getName: (task: any) => string,
): WorkloadRow[] {
  const workloadMap: Record<string, WorkloadRow> = {};

  for (const task of tasks) {
    const statusName = getName(task).toLowerCase();
    const assignees = task.assignees || [];

    if (assignees.length === 0) {
      const row = ensureWorkloadRow(workloadMap, 'Unassigned', 'Unassigned', 'UN');
      applyStatusToWorkloadRow(row, statusName, !!task.is_completed);
    } else {
      for (const assignee of assignees) {
        const assigneeName =
          assignee.user?.name || assignee.extension_number || 'Unknown';
        const initials = assigneeName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        const row = ensureWorkloadRow(
          workloadMap,
          assigneeName,
          assigneeName,
          initials,
        );
        applyStatusToWorkloadRow(row, statusName, !!task.is_completed);
      }
    }
  }

  return Object.values(workloadMap);
}

export type ProjectOverviewDerived = {
  assignees: {
    id: unknown;
    name: string;
    extension_number: string;
  }[];
  labels: unknown[];
  statuses: unknown[];
  members: unknown[];
  tasksByStatus: { id: string | number; name: string; value: number; color: string }[];
  statusCards: {
    title: string;
    count: number;
    icon: LucideIcon;
    color: string;
    bgLight: string;
  }[];
  workloadData: WorkloadRow[];
};

export function deriveProjectOverviewFromDetails(
  projectDetails: any,
): ProjectOverviewDerived {
  const projectAssignees =
    projectDetails.members?.map((member: any) => ({
      id: member.user?.id || member.extension_number,
      name:
        member.user?.name ||
        member.user?.display_name ||
        member.extension_number,
      extension_number: member.extension_number,
    })) ?? [];

  const projectLabels = projectDetails.labels || [];
  const projectStatuses = projectDetails.statuses || [];
  const projectMembers = projectDetails.members || [];
  const tasks = projectDetails.tasks || [];

  const statusMap = buildStatusIdMap(projectStatuses);

  const statusTaskCounts: Record<string, number> = {};
  for (const task of tasks) {
    const status = statusMap[String(task.status_id)];
    if (status) {
      const statusName = status.name;
      statusTaskCounts[statusName] = (statusTaskCounts[statusName] || 0) + 1;
    }
  }

  const tasksByStatusData = projectStatuses.map((status: any) => ({
    id: status.id ?? status.name,
    name: status.name,
    value: statusTaskCounts[status.name] || 0,
    color: status.color || '#9E9E9E',
  }));

  const statusNameFor = (task: any) => getTaskStatusName(task, statusMap);

  const openTasks = tasks.filter((t: any) => !t.is_completed).length;
  const inProgressTasks = tasks.filter((t: any) => {
    const n = statusNameFor(t).toLowerCase();
    return n.includes('progress') || n.includes('in progress');
  }).length;
  const doneTasks = tasks.filter((t: any) => t.is_completed).length;
  const now = new Date();
  const overdueCount = tasks.filter((t: any) => {
    if (t.is_completed || !t.due_date) {
      return false;
    }
    return new Date(t.due_date) < now;
  }).length;
  const unassignedTasks = tasks.filter(
    (t: any) => !t.assignees || t.assignees.length === 0,
  ).length;

  const statusCards = [
    {
      title: 'Open',
      count: openTasks,
      icon: FileText,
      color: '#4680FF',
      bgLight: '#E3F2FD',
    },
    {
      title: 'In Progress',
      count: inProgressTasks,
      icon: Clock,
      color: '#FFB64D',
      bgLight: '#FFF3E0',
    },
    {
      title: 'Done (30d)',
      count: doneTasks,
      icon: CheckCircle2,
      color: '#2CA87F',
      bgLight: '#E8F5E9',
    },
    {
      title: 'Overdue',
      count: overdueCount,
      icon: AlertCircle,
      color: '#DC2626',
      bgLight: '#FFEBEE',
    },
    {
      title: 'Unassigned',
      count: unassignedTasks,
      icon: Users,
      color: '#4FC3F7',
      bgLight: '#E1F5FE',
    },
  ];

  const workloadData = buildWorkloadMap(tasks, statusNameFor);

  return {
    assignees: projectAssignees,
    labels: projectLabels,
    statuses: projectStatuses,
    members: projectMembers,
    tasksByStatus: tasksByStatusData,
    statusCards,
    workloadData,
  };
}

export function normalizeActivitiesPayload(activities: unknown): unknown[] {
  return Array.isArray(activities) ? activities : [];
}

export function formatOverdueTasksForUi(overdue: unknown) {
  if (!Array.isArray(overdue)) {
    return { all: [] as any[], preview: [] as any[] };
  }
  const formatted = overdue.map((task: any) => ({
    id: `#${task.id}`,
    title: task.title || 'Untitled Task',
    priority: task.priority || 'Medium',
    assignee:
      task.assignees?.[0]?.user?.name ||
      task.assignees?.[0]?.extension_number ||
      'Unassigned',
    dueDate: task.due_date ? formatDateForTable(task.due_date) : 'N/A',
  }));
  return { all: formatted, preview: formatted.slice(0, 5) };
}

export function sortStringsLocale(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

export type BoardTabColumnFilters = {
  searchTerm: string;
  showCompletedTasks: boolean;
  selectedAssignee: string;
  selectedPriority: string;
  selectedLabel: string;
  /** `'All Statuses'` or a project status id as string (matches `task.status_id` / `task.status.id`). */
  selectedStatus: string;
};

/** True when this workflow column represents completed/done work (API flag or name). */
function statusColumnLooksCompleted(status: any): boolean {
  if (status?.is_completed === true) {
    return true;
  }
  const n = String(status?.name ?? '').toLowerCase();
  return (
    n.includes('done') ||
    n.includes('complete') ||
    n.includes('closed') ||
    n === 'complete'
  );
}

function buildCompletedColumnStatusIdSet(projectStatuses: any[]): Set<string> {
  return new Set(
    (projectStatuses || [])
      .filter((s: any) => statusColumnLooksCompleted(s))
      .map((s: any) => String(s.id)),
  );
}

function taskStatusIdForColumnMatch(task: any): string | null {
  const raw = task.status_id ?? task.status?.id;
  if (raw == null || raw === '') {
    return null;
  }
  return String(raw);
}

function boardSearchExcludesTask(task: any, termLower: string): boolean {
  return Boolean(termLower && !task.title?.toLowerCase().includes(termLower));
}

function boardHideCompletedExcludesTask(
  task: any,
  showCompletedTasks: boolean,
  doneColumnStatusIds: Set<string>,
): boolean {
  if (showCompletedTasks || !task.is_completed) {
    return false;
  }
  const sid = taskStatusIdForColumnMatch(task);
  return sid == null || !doneColumnStatusIds.has(sid);
}

function taskAssigneeMatchesSelection(task: any, selected: string): boolean {
  return Boolean(
    task.assignees?.some((a: any) => {
      const ext = String(a.extension_number ?? a.extension ?? a.id ?? '').trim();
      if (ext && ext === selected) {
        return true;
      }
      const assigneeName = String(a.user?.name || '').trim();
      return assigneeName.length > 0 && assigneeName === selected;
    }),
  );
}

function boardAssigneeFilterExcludesTask(task: any, selectedAssignee: string): boolean {
  if (selectedAssignee === 'All Assignees') {
    return false;
  }
  const selected = String(selectedAssignee).trim();
  return !taskAssigneeMatchesSelection(task, selected);
}

function boardPriorityFilterExcludesTask(task: any, selectedPriority: string): boolean {
  if (selectedPriority === 'All Priorities') {
    return false;
  }
  return task.priority?.toLowerCase() !== selectedPriority.toLowerCase();
}

function boardLabelFilterExcludesTask(task: any, selectedLabel: string): boolean {
  if (selectedLabel === 'All Labels') {
    return false;
  }
  const hasLabel = task.labels?.some((l: any) => l.name === selectedLabel);
  return !hasLabel;
}

function boardStatusFilterExcludesTask(task: any, selectedStatus: string): boolean {
  if (selectedStatus === 'All Statuses') {
    return false;
  }
  const sid = taskStatusIdForColumnMatch(task);
  return sid !== String(selectedStatus);
}

export function filterBoardTasksForColumns(
  tasks: any[],
  filters: BoardTabColumnFilters,
  projectStatuses: any[] = [],
): any[] {
  const term = filters.searchTerm.toLowerCase();
  const doneColumnStatusIds = buildCompletedColumnStatusIdSet(projectStatuses);
  return tasks.filter((task: any) => {
    if (boardSearchExcludesTask(task, term)) {
      return false;
    }
    if (boardHideCompletedExcludesTask(task, filters.showCompletedTasks, doneColumnStatusIds)) {
      return false;
    }
    if (boardAssigneeFilterExcludesTask(task, filters.selectedAssignee)) {
      return false;
    }
    if (boardPriorityFilterExcludesTask(task, filters.selectedPriority)) {
      return false;
    }
    if (boardLabelFilterExcludesTask(task, filters.selectedLabel)) {
      return false;
    }
    if (boardStatusFilterExcludesTask(task, filters.selectedStatus)) {
      return false;
    }
    return true;
  });
}

export function sliceBoardTasksByStatusId(
  filteredTasks: any[],
  statusId: string | number | null,
): any[] {
  if (statusId === null) {
    return filteredTasks.filter((task: any) => taskStatusIdForColumnMatch(task) == null);
  }
  return filteredTasks.filter(
    (task: any) => taskStatusIdForColumnMatch(task) === String(statusId),
  );
}
