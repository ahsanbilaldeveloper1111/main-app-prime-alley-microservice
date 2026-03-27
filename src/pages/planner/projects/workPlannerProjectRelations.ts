/**
 * Shared `with[]` query for work-planner project detail / expanded row task loads.
 */
export const WORK_PLANNER_PROJECT_DETAIL_RELATIONS = [
  "statuses",
  "statuses.tasks",
  "labels",
  "members.user",
  "tasks",
  "tasks.assignees",
  "tasks.labels",
  "tasks.status",
  "tasks.children",
  "owner",
] as const;

/** `getTask` relations for CreatePlannerTaskSidebar edit mode (full form fields). */
export const WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS = [
  "project",
  "status",
  "assignees",
  "labels",
] as const;

/** Maps `getTask` JSON to the shape expected by `CreatePlannerTaskSidebar` in edit mode. */
export function mapGetTaskResponseToSidebarEditTask(api: Record<string, unknown>) {
  const id = api.id;
  return {
    ...api,
    rawData: { id: id as string | number | undefined },
  };
}
