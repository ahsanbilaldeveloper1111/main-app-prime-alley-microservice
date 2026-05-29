import type {
  TaskReportsAssigneeRow,
  TaskReportsOverview,
  TaskReportsTaskRow,
} from "@utils/taskReports";
import type { OverdueByProjectRow } from "@page-modules/planner/reports/projectReportsDomain";

export type MemberPerformanceRow = Readonly<{
  key: string;
  memberLabel: string;
  initials: string;
  avatarColor: string;
  tasks: number;
  inProgress: number;
  done: number;
  pending: number;
  stale: number;
}>;

export type OverdueProjectCountRow = Readonly<{
  projectName: string;
  count: number;
}>;

function countStaleByExtension(tasks: TaskReportsTaskRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const task of tasks) {
    const ext = task.assignee_extension?.trim();
    if (!ext) continue;
    map.set(ext, (map.get(ext) ?? 0) + 1);
  }
  return map;
}

export function buildMemberPerformanceRows(
  members: TaskReportsAssigneeRow[],
  staleTasks: TaskReportsTaskRow[],
  resolveLabel: (member: TaskReportsAssigneeRow) => {
    memberLabel: string;
    initials: string;
    avatarColor: string;
  },
): MemberPerformanceRow[] {
  const staleByExt = countStaleByExtension(staleTasks);
  return members.map((member) => {
    const ext = member.extension_number?.trim() ?? "";
    const { memberLabel, initials, avatarColor } = resolveLabel(member);
    const pending = member.todo_count ?? 0;
    const inProgress = member.in_progress_count ?? 0;
    const done = member.done_count ?? member.completed_tasks ?? 0;
    const stale = staleByExt.get(ext) ?? 0;
    const tasks = member.total_tasks ?? member.task_count ?? pending + inProgress + done;
    return {
      key: ext || memberLabel,
      memberLabel,
      initials,
      avatarColor,
      tasks,
      inProgress,
      done,
      pending,
      stale,
    };
  });
}

export function resolveTeamMemberRows(overview: TaskReportsOverview): TaskReportsAssigneeRow[] {
  if (overview.member_report.length > 0) return overview.member_report;
  return overview.top_assignees;
}

export function groupOverdueCountsByProject(
  rows: OverdueByProjectRow[],
): OverdueProjectCountRow[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.projectName, (map.get(row.projectName) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([projectName, count]) => ({ projectName, count }))
    .sort((a, b) => b.count - a.count);
}
