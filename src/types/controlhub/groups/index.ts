/** Assigned module on a group list row */
export interface GroupAssignedModule {
  id: number;
  name?: string;
  slug?: string;
}

/** Assigned team on a group list row */
export interface GroupAssignedTeam {
  id: number;
  name?: string;
}

/** Row shape for POST groups/list and the groups directory table */
export interface GroupRow {
  id: number;
  name: string;
  assigned_modules?: GroupAssignedModule[];
  assigned_teams?: GroupAssignedTeam[];
  total_team_users?: number;
  total_team_owners?: number;
}

/** Paginated list response from POST groups/list */
export interface GroupListResponse {
  draw?: number;
  recordsTotal?: number;
  recordsFiltered?: number;
  dataList?: GroupRow[];
  data?: GroupRow[];
  meta?: {
    current_page?: number;
    total?: number;
    per_page?: number;
    last_page?: number;
  };
  total?: number;
}
