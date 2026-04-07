import moment from "moment";

export const ALL_STATUS_VALUE = "All Status";

/**
 * Mutates Planner listTasks params from sidebar / quick filter state.
 */
export function applyPlannerTaskFiltersToListParams(
  params: Record<string, unknown>,
  filters: Record<string, unknown>,
  allProjects: Array<{ id: number; name: string }>,
) {
  if (filters.priority) {
    const priorityMap: Record<string, string> = {
      low: "low",
      medium: "normal",
      high: "high",
      urgent: "urgent",
    };
    params.priority =
      priorityMap[String(filters.priority)] || "normal";
  }
  if (filters.due_date_from) params.due_date_from = filters.due_date_from;
  if (filters.due_date_to) params.due_date_to = filters.due_date_to;

  if (filters.project && filters.project !== "All Projects") {
    const proj = allProjects.find((p) => p.name === filters.project);
    if (proj) params.project_id = proj.id;
  }

  if (filters.assignee && Array.isArray(filters.assignee) && filters.assignee.length) {
    params.assignees = filters.assignee;
  }

  const taskTypeFilter = filters.task_type;
  if (
    taskTypeFilter &&
    (taskTypeFilter === "regular" ||
      taskTypeFilter === "todo" ||
      taskTypeFilter === "recurring")
  ) {
    params.type = taskTypeFilter;
  }

  if (filters.status && filters.status !== ALL_STATUS_VALUE) {
    const statusId = Number(filters.status);
    if (Number.isFinite(statusId)) {
      params.status_id = statusId;
    }
  }
}

/**
 * Applies active view tab constraints to Planner listTasks params.
 */
export function applyPlannerTaskTabToListParams(
  params: Record<string, unknown>,
  activeTab: string,
  dates: { today: string; yesterday: string; tomorrow: string },
) {
  if (activeTab === "due_today") {
    params.due_date_from = dates.today;
    params.due_date_to = dates.today;
    return;
  }
  if (activeTab === "overdue") {
    params.due_date_to = dates.yesterday;
    params.is_completed = false;
    return;
  }
  if (activeTab === "upcoming") {
    params.due_date_from = dates.tomorrow;
    return;
  }
  if (activeTab === "completed") {
    params.is_completed = true;
    return;
  }
  if (activeTab === "pending") {
    params.is_completed = false;
    params.due_date_from = dates.today;
  }
}

export function plannerTaskListTodayTriple() {
  return {
    today: moment().format("YYYY-MM-DD"),
    yesterday: moment().subtract(1, "day").format("YYYY-MM-DD"),
    tomorrow: moment().add(1, "day").format("YYYY-MM-DD"),
  };
}
