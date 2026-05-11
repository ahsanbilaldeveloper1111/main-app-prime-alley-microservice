import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export type TaskStatKey =
  | "allTasks"
  | "highPriority"
  | "toDos"
  | "calls"
  | "emails"
  | "linkedin";

export const SALES_DASHBOARD_NAV_TABS: ReadonlyArray<{
  id: string;
  label: string;
  permission: string;
}> = [
  { id: "Summary", label: "Summary", permission: "" },
  { id: "Companies", label: "Companies", permission: PERMISSIONS.VIEW_COMPANIES_CRM },
  { id: "Deals", label: "Deals", permission: PERMISSIONS.VIEW_CRM_DEALS },
  { id: "Tasks", label: "Tasks", permission: PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER },
  {
    id: "Calendar",
    label: "Calendar",
    permission: PERMISSIONS.VIEW_CALENDAR_WORK_PLANNER,
  },
];

export const TASK_QUICK_FILTERS = [
  "All tasks",
  "Due today",
  "Overdue",
  "Due tomorrow",
] as const;

export type TaskQuickFilter = (typeof TASK_QUICK_FILTERS)[number];

export const TASK_STATS_BY_FILTER: Record<
  string,
  Record<TaskStatKey, number>
> = {
  "All tasks": {
    allTasks: 7,
    highPriority: 3,
    toDos: 4,
    calls: 2,
    emails: 1,
    linkedin: 0,
  },
  "Due today": {
    allTasks: 4,
    highPriority: 1,
    toDos: 2,
    calls: 1,
    emails: 1,
    linkedin: 0,
  },
  Overdue: {
    allTasks: 3,
    highPriority: 2,
    toDos: 1,
    calls: 1,
    emails: 0,
    linkedin: 0,
  },
  "Due tomorrow": {
    allTasks: 3,
    highPriority: 1,
    toDos: 2,
    calls: 0,
    emails: 1,
    linkedin: 0,
  },
};

export const CHART_SCALE_BY_FILTER: Record<string, number> = {
  "All tasks": 1,
  "Due today": 0.65,
  Overdue: 0.85,
  "Due tomorrow": 0.55,
};
