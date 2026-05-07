/** List row from `listProjects`; index fields required, rest passed through for project tabs. */
export type DashboardProjectRow = { id: number; name: string } & Record<string, unknown>;
