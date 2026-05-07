import type { ComponentProps, Dispatch, SetStateAction } from "react";
import type { ApiProject, Project } from "@planner/workPlannerProjectsDomain";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";

export type CreatePlannerSidebarTaskProp = NonNullable<
  ComponentProps<typeof CreateTaskSidebar>["task"]
>;

/** `project` prop shape for `CreatePlannerTaskSidebar` (numeric API project id). */
export function mapTableProjectToPlannerSidebarProject(row: Project): {
  id: number;
  name: string;
  icon: string;
  color: string;
  statuses?: ApiProject["statuses"];
  labels?: ApiProject["labels"];
} {
  if (row.apiData) {
    return {
      id: row.apiData.id,
      name: row.apiData.name,
      icon: "",
      color: row.apiData.color || "#3b82f6",
      statuses: row.apiData.statuses,
      labels: row.apiData.labels,
    };
  }
  const id = Number(row.id);
  return {
    id: Number.isFinite(id) ? id : 0,
    name: row.name,
    icon: "",
    color: row.iconColor || "#3b82f6",
  };
}

export function projectIdFromSidebarEditTask(
  task: CreatePlannerSidebarTaskProp | null | undefined,
): number | null {
  if (task == null || typeof task !== "object") return null;
  const t = task as Record<string, unknown>;
  const pid = t.project_id;
  if (typeof pid === "number" && Number.isFinite(pid)) return pid;
  const proj = t.project as { id?: unknown } | undefined;
  if (proj != null && typeof proj === "object" && typeof proj.id === "number") {
    return proj.id;
  }
  return null;
}

export function resolveProjectActionsMenuOpenState(
  projectId: string,
  nextShow: boolean,
  previousOpenId: string | null,
): string | null {
  if (nextShow) {
    return projectId;
  }
  return previousOpenId === projectId ? null : previousOpenId;
}

export function createProjectRowActionsToggleHandler(
  projectId: string,
  setOpenProjectActionsId: Dispatch<SetStateAction<string | null>>,
): (nextShow: boolean) => void {
  return (nextShow: boolean) => {
    setOpenProjectActionsId((prev) => resolveProjectActionsMenuOpenState(projectId, nextShow, prev));
  };
}
