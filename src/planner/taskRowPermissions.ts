import {
  canAdministerProjectFromMembers,
  getProjectMemberRoleForSessionUser,
  resolveMembersFromProject,
  resolveTaskExtensionNumberForTaskPermission,
  stringifyApiScalar,
  type ProjectMemberResolvedRole,
} from "./projectMemberRole";

export type PlannerTaskEditScope = "none" | "limited" | "full";

export interface PlannerTaskRowPermissions {
  isProjectAdmin: boolean;
  isTaskOwner: boolean;
  isSessionAssignee: boolean;
  isSessionWatcher: boolean;
  projectRole: ProjectMemberResolvedRole;
  canDeleteTask: boolean;
  /** Open edit sidebar (full or limited fields). */
  canOpenTaskEdit: boolean;
  taskEditScope: PlannerTaskEditScope;
}

function needleTrimmed(sessionUserPhoneOrExtension: string | null | undefined): string {
  return stringifyApiScalar(sessionUserPhoneOrExtension).trim();
}

function extensionListIncludesNeedle(list: unknown, needle: string): boolean {
  if (!needle || !Array.isArray(list)) return false;
  for (const item of list) {
    if (typeof item === "string" || typeof item === "number") {
      if (stringifyApiScalar(item).trim() === needle) return true;
      continue;
    }
    if (item != null && typeof item === "object") {
      const ext = stringifyApiScalar(
        (item as Record<string, unknown>).extension_number,
      ).trim();
      if (ext !== "" && ext === needle) return true;
    }
  }
  return false;
}

/** True if session phone/extension appears on `assignees` or `watchers` / `watcher_numbers`. */
export function sessionMatchesTaskAssigneesOrWatchers(
  task: unknown,
  sessionUserPhoneOrExtension: string | null | undefined,
): { isAssignee: boolean; isWatcher: boolean } {
  const needle = needleTrimmed(sessionUserPhoneOrExtension);
  if (!needle || task == null || typeof task !== "object") {
    return { isAssignee: false, isWatcher: false };
  }
  const t = task as Record<string, unknown>;
  const isAssignee = extensionListIncludesNeedle(t.assignees, needle);
  let isWatcher = extensionListIncludesNeedle(t.watchers, needle);
  if (!isWatcher && Array.isArray(t.watcher_numbers)) {
    isWatcher = (t.watcher_numbers as unknown[]).some(
      (w) => stringifyApiScalar(w).trim() === needle,
    );
  }
  return { isAssignee, isWatcher };
}

const EMPTY_PERMS: PlannerTaskRowPermissions = {
  isProjectAdmin: false,
  isTaskOwner: false,
  isSessionAssignee: false,
  isSessionWatcher: false,
  projectRole: null,
  canDeleteTask: false,
  canOpenTaskEdit: false,
  taskEditScope: "none",
};

/**
 * Task row capabilities from project membership, task ownership, and assignee/watcher lists.
 *
 * 1. **Project admin** (see {@link canAdministerProjectFromMembers}): full control on all tasks (delete, full edit).
 * 2. **Task owner** (extension from {@link resolveTaskExtensionNumberForTaskPermission}): full control on that task.
 * 3. **Project member** (role `member`, not owner): cannot delete; **limited** edit — can change the task except **assignees** and **watchers** (those stay fixed in UI and API payload).
 * 4. **Viewer or not listed in `project.members`**: no edit/delete unless (5).
 * 5. **Assignee or watcher**: same **limited** edit (no delete), even when (4) would otherwise deny.
 */
export function computePlannerTaskRowPermissions(
  task: unknown,
  project: unknown,
  sessionUserPhoneOrExtension: string | null | undefined,
): PlannerTaskRowPermissions {
  const needle = needleTrimmed(sessionUserPhoneOrExtension);
  if (!needle) {
    return { ...EMPTY_PERMS };
  }

  const isProjectAdmin = canAdministerProjectFromMembers(project, sessionUserPhoneOrExtension);
  const members = resolveMembersFromProject(project);
  const projectRole = getProjectMemberRoleForSessionUser(members, sessionUserPhoneOrExtension);
  const inProjectRoster = projectRole !== null;

  const ownerExt = resolveTaskExtensionNumberForTaskPermission(task);
  const isTaskOwner = ownerExt !== "" && needle === ownerExt;

  const { isAssignee, isWatcher } = sessionMatchesTaskAssigneesOrWatchers(
    task,
    sessionUserPhoneOrExtension,
  );
  const inAssigneesOrWatchers = isAssignee || isWatcher;

  const base = {
    isProjectAdmin,
    isTaskOwner,
    isSessionAssignee: isAssignee,
    isSessionWatcher: isWatcher,
    projectRole,
  };

  if (isProjectAdmin) {
    return {
      ...base,
      canDeleteTask: true,
      canOpenTaskEdit: true,
      taskEditScope: "full",
    };
  }

  if (isTaskOwner) {
    return {
      ...base,
      canDeleteTask: true,
      canOpenTaskEdit: true,
      taskEditScope: "full",
    };
  }

  if (projectRole === "member") {
    return {
      ...base,
      canDeleteTask: false,
      canOpenTaskEdit: true,
      taskEditScope: "limited",
    };
  }

  if (projectRole === "viewer" || !inProjectRoster) {
    if (inAssigneesOrWatchers) {
      return {
        ...base,
        canDeleteTask: false,
        canOpenTaskEdit: true,
        taskEditScope: "limited",
      };
    }
    return {
      ...base,
      canDeleteTask: false,
      canOpenTaskEdit: false,
      taskEditScope: "none",
    };
  }

  return {
    ...base,
    canDeleteTask: false,
    canOpenTaskEdit: inAssigneesOrWatchers,
    taskEditScope: inAssigneesOrWatchers ? "limited" : "none",
  };
}

/** Tooltip for the task row "Edit" action when opening the menu is denied. */
export function plannerTaskRowEditDeniedTitle(canOpenTaskEdit: boolean): string | undefined {
  return canOpenTaskEdit ? undefined : "You are not authorized to edit this task";
}

/** Tooltip for the task row "Delete" action when delete is denied. */
export function plannerTaskRowDeleteDeniedTitle(perm: PlannerTaskRowPermissions): string | undefined {
  if (perm.canDeleteTask) return undefined;
  if (perm.projectRole === "member") {
    return "Project members cannot delete tasks (only admins and task owners can delete)";
  }
  if (perm.isSessionAssignee || perm.isSessionWatcher) {
    return "Assignees and watchers cannot delete tasks";
  }
  return "You are not authorized to delete this task";
}
