/**
 * Builds GET/list params for the CRM Tasks listing page (dummy API + future real API).
 * Keeps filter/tab flags in one place to match {@link fetchTasks} behavior.
 */
export function buildCrmTasksListQueryParams(args: Readonly<{
  page: number;
  perPage: number;
  filters: Record<string, unknown>;
  activeTab: string;
}>): Record<string, unknown> {
  const p: Record<string, unknown> = {
    page: args.page,
    per_page: args.perPage,
  };
  const f = args.filters;
  if (f.search) p.search = f.search;
  if (f.task_type) p.task_type = f.task_type;
  if (f.priority) p.priority = f.priority;
  if (f.due_date_from) p.due_date_from = f.due_date_from;
  if (f.due_date_to) p.due_date_to = f.due_date_to;
  if (args.activeTab === "due_today") p.due_today = true;
  if (args.activeTab === "overdue") p.overdue = true;
  if (args.activeTab === "upcoming") p.upcoming = true;
  return p;
}
