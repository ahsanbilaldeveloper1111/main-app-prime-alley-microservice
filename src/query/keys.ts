/**
 * Namespaced query keys for project-wide TanStack Query use.
 * Add domains here (e.g. `crmKeys`, `plannerKeys`) as migrations expand.
 */

export const communicationsKeys = {
  root: ["communications"] as const,

  callLogs: {
    all: () => [...communicationsKeys.root, "callLogs"] as const,
    list: (params: {
      page: number;
      perPage: number;
      search: string;
      /** Serialized applied filters + refresh generation */
      filtersKey: string;
      refreshKey: number;
    }) =>
      [
        ...communicationsKeys.callLogs.all(),
        "list",
        params.page,
        params.perPage,
        params.search,
        params.filtersKey,
        params.refreshKey,
      ] as const,
  },

  finesse: {
    all: () => [...communicationsKeys.root, "finesse"] as const,
    campaigns: (teamId: string | number, username: string) =>
      [...communicationsKeys.finesse.all(), "campaigns", teamId, username] as const,
  },
};

export const plannerKeys = {
  root: ["planner"] as const,

  tasks: {
    all: () => [...plannerKeys.root, "tasks"] as const,
    list: (params: {
      scope: "embed" | "page";
      embedProjectId: number | null;
      embedRefresh: number | undefined;
      page: number;
      perPage: number;
      sortCol: string;
      sortDir: string;
      filtersKey: string;
      activeTab: string;
      projectsForFiltersKey: string;
      assigneeExtensionsKey: string;
    }) =>
      [
        ...plannerKeys.tasks.all(),
        "list",
        params.scope,
        params.embedProjectId ?? "none",
        params.embedRefresh ?? "—",
        params.page,
        params.perPage,
        params.sortCol,
        params.sortDir,
        params.filtersKey,
        params.activeTab,
        params.projectsForFiltersKey,
        params.assigneeExtensionsKey,
      ] as const,
    detail: (taskId: string) =>
      [...plannerKeys.tasks.all(), "detail", taskId] as const,
  },

  projects: {
    all: () => [...plannerKeys.root, "projects"] as const,
    detail: (projectId: string) =>
      [...plannerKeys.projects.all(), "detail", projectId] as const,
    filterDirectory: () =>
      [...plannerKeys.projects.all(), "filterDirectory"] as const,
  },

  statuses: {
    all: () => [...plannerKeys.root, "statuses"] as const,
    global: () => [...plannerKeys.statuses.all(), "global"] as const,
    /** Workflow statuses for task filters: project-scoped or global list */
    workflow: (projectId: number | null) =>
      [
        ...plannerKeys.statuses.all(),
        "workflow",
        projectId ?? "global",
      ] as const,
  },
};
