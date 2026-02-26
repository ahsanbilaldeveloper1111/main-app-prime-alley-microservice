// Types for Teams API

/**
 * Simple team object (id and name only)
 * Used in GET /api/teams/get endpoint
 */
export interface TeamSimple {
    id: number;
    name: string;
}

/**
 * Team user with pivot data (team-user relationship)
 */
export interface TeamUser {
    id: number;
    name: string;
    email: string;
    username?: string;
    phone?: string;
    status?: string;
    pivot: {
        team_id: number;
        user_id: number;
        created_at: string;
        updated_at: string;
    };
}

/**
 * Basic team object
 */
export interface Team {
    id: number;
    name: string;
    user_id: number;
    company_id: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * Team with assigned users
 * Used in view, edit, assign-users, remove-users endpoints
 */
export interface TeamWithUsers extends Team {
    users: TeamUser[];
}

/**
 * Pagination meta information
 */
export interface PaginationMeta {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    from: number;
    to: number;
}

/**
 * Paginated list response structure
 * Used in POST /api/teams/list endpoint
 */
export interface TeamListResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    dataList: Team[];
    meta: PaginationMeta;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
    status: boolean;
    data: T;
    message: string;
}

/**
 * API Error response
 */
export interface ApiError {
    status: false;
    error: {
        Error?: string;
        Code?: number;
        message?: string;
        errors?: Record<string, string[]>;
    };
    message: string;
}

/**
 * Request payload for list teams endpoint
 */
export interface ListTeamsParams {
    page?: number;
    perPage?: number;
    search?: string;
    name?: string;
    isExport?: boolean;
    draw?: number;
}

/**
 * Request payload for create team endpoint
 */
export interface CreateTeamParams {
    name: string;
}

/**
 * Request payload for view/edit team endpoint
 */
export interface ViewTeamParams {
    id: number;
}

/**
 * Request payload for update team endpoint
 */
export interface UpdateTeamParams {
    team_id: number;
    name: string;
}

/**
 * Request payload for delete team endpoint
 */
export interface DeleteTeamParams {
    id: number;
}

/**
 * Request payload for assign users to team endpoint
 */
export interface AssignUsersToTeamParams {
    team_id: number;
    user_ids: number[];
}

/**
 * Request payload for remove users from team endpoint
 */
export interface RemoveUsersFromTeamParams {
    team_id: number;
    user_ids: number[];
}

/**
 * Request payload for get team users endpoint
 */
export interface GetTeamUsersParams {
    team_id?: number;
    id?: number;
}

