/**
 * Shared `with[]` query for work-planner project detail / expanded row task loads.
 */
export const WORK_PLANNER_PROJECT_DETAIL_RELATIONS = [
  "statuses",
  "statuses.tasks",
  "members.user",
  "tasks",
  "tasks.assignees",
  "tasks.labels",
  "tasks.status",
  "owner",
] as const;

/** `getTask` relations for CreatePlannerTaskSidebar edit mode (full form fields). */
export const WORK_PLANNER_TASK_SIDEBAR_EDIT_RELATIONS = [
  "project",
  "status",
  "assignees",
  "labels",
] as const;
