import type { ComponentProps, Dispatch, SetStateAction } from "react";
import type { ApiProject, Project, SubTask, Task } from "@planner/workPlannerProjectsDomain";
import {
  plannerTaskRowDeleteDeniedTitle,
  plannerTaskRowEditDeniedTitle,
  resolvePlannerTaskRowPermissionsWithSession,
  type PlannerTaskRowPermissions,
} from "@planner/taskRowPermissions";
import CreateTaskSidebar from "@components/CreatePlannerTaskSidebar";

export type CreatePlannerSidebarTaskProp = NonNullable<
  ComponentProps<typeof CreateTaskSidebar>["task"]
>;

/** Coerce API / route project id to a positive number for CreatePlannerTaskSidebar. */
export function coercePlannerSidebarProjectId(id: unknown): number {
  const num = Number(id);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

/** `project` prop shape for `CreatePlannerTaskSidebar` from a project detail / API record. */
export function mapApiProjectToPlannerSidebarProject(apiProject: {
  id: unknown;
  name: string;
  color?: string | null;
  statuses?: ApiProject["statuses"];
  labels?: ApiProject["labels"];
}): {
  id: number;
  name: string;
  icon: string;
  color: string;
  statuses?: ApiProject["statuses"];
  labels?: ApiProject["labels"];
} {
  return {
    id: coercePlannerSidebarProjectId(apiProject.id),
    name: apiProject.name,
    icon: "",
    color: apiProject.color || "#3b82f6",
    statuses: apiProject.statuses,
    labels: apiProject.labels,
  };
}

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
    return mapApiProjectToPlannerSidebarProject(row.apiData);
  }
  return {
    id: coercePlannerSidebarProjectId(row.id),
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

type ExpandedTaskPermissionSubject = Pick<
  Task,
  "id" | "status" | "assigneeExtensionNumbers" | "watcherExtensionNumbers"
>;

/** Minimal task shape for {@link computePlannerTaskRowPermissions} on expanded project rows. */
export function buildPlannerTaskPermissionPayload(
  task: ExpandedTaskPermissionSubject | SubTask,
): Record<string, unknown> {
  const assignees =
    task.assigneeExtensionNumbers?.map((extension_number) => ({ extension_number })) ??
    [];
  const watchers =
    task.watcherExtensionNumbers?.map((extension_number) => ({ extension_number })) ??
    [];
  return {
    id: task.id,
    assignees,
    watchers,
    extension_number: task.assigneeExtensionNumbers?.[0],
  };
}

export function resolveExpandedPlannerTaskRowPermissions(
  task: ExpandedTaskPermissionSubject | SubTask,
  project: Project,
  sessionUserPhoneOrExtension: string,
  sessionFlags: { canUpdateTask: boolean; canDeleteTask: boolean },
): PlannerTaskRowPermissions {
  const projectForCheck = project.apiData ?? project;
  return resolvePlannerTaskRowPermissionsWithSession(
    buildPlannerTaskPermissionPayload(task),
    projectForCheck,
    sessionUserPhoneOrExtension,
    sessionFlags,
  );
}

export function expandedTaskCompleteButtonTitle(
  task: ExpandedTaskPermissionSubject | SubTask,
  canToggleComplete: boolean,
): string {
  if (!canToggleComplete) {
    return plannerTaskRowEditDeniedTitle(false) ?? "You are not authorized to edit this task";
  }
  return task.status === "done" ? "Mark incomplete" : "Mark complete";
}

export function expandedTaskDeleteButtonTitle(
  permissions: PlannerTaskRowPermissions,
): string {
  return plannerTaskRowDeleteDeniedTitle(permissions) ?? "Delete task";
}
