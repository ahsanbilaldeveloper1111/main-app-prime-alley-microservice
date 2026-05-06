import { listProjects } from "@utils/tasks";
import type { DashboardProjectRow } from "@planner/workPlannerDashboardTypes";

/**
 * Shared `queryFn` for `plannerKeys.projects.filterDirectory()` — used by task filters
 * and planner dashboard project picker so one cache serves both.
 */
export async function fetchPlannerProjectFilterDirectory(): Promise<
  DashboardProjectRow[]
> {
  const res = await listProjects({ page: 1, limit: 100 });
  const rows = res?.data;
  if (res?.success !== true || !Array.isArray(rows)) {
    return [];
  }
  return rows as DashboardProjectRow[];
}
