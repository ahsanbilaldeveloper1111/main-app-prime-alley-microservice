import axiosInstance from './axios';

const prefix = 'finesse';

// ==================== Storage ====================

export const FINESSE_USER_DATA_KEY = 'finesseResponseData';
export const FINESSE_TOKEN_KEY = 'finesseToken';

export interface FinesseUserData {
  dialogsUri?: string;
  uri?: string;
  extension?: string;
  firstName?: string;
  lastName?: string;
  loginId?: string;
  loginName?: string;
  mediaType?: number;
  pendingState?: string;
  state?: string;
  stateChangeTime?: string;
  wrapUpTimer?: number;
  reasonCodeId?: number | null;
  reasonCode?: string | null;
  roles?: string[];
  teamId?: number;
  teamName?: string;
  teams?: Array<{ id: number; name: string; uri: string }>;
  settings?: Record<string, string>;
}

export const setFinesseUserData = (data: FinesseUserData): void => {
  if (typeof globalThis.window === 'undefined') return;
  try {
    globalThis.sessionStorage.setItem(FINESSE_USER_DATA_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const getFinesseUserData = (): FinesseUserData | null => {
  if (typeof globalThis.window === 'undefined') return null;
  try {
    const raw = globalThis.sessionStorage.getItem(FINESSE_USER_DATA_KEY);
    return raw ? (JSON.parse(raw) as FinesseUserData) : null;
  } catch {
    return null;
  }
};

export const setFinesseToken = (token: string): void => {
  if (typeof globalThis.window === 'undefined') return;
  try {
    globalThis.sessionStorage.setItem(FINESSE_TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const getFinesseToken = (): string | null => {
  if (typeof globalThis.window === 'undefined') return null;
  try {
    return globalThis.sessionStorage.getItem(FINESSE_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const clearFinesseUserData = (): void => {
  if (typeof globalThis.window === 'undefined') return;
  try {
    globalThis.sessionStorage.removeItem(FINESSE_USER_DATA_KEY);
    globalThis.sessionStorage.removeItem(FINESSE_TOKEN_KEY);
  } catch {
    // ignore
  }
};

/**
 * Resolve effective teamId from user data. API may return teamId null while teams[] has ids.
 * Use this when calling team-scoped endpoints.
 */
export const getEffectiveTeamId = (data: FinesseUserData | null): number | string | null => {
  if (!data) return null;
  if (data.teamId != null) return data.teamId;
  const teams = data.teams;
  if (!teams?.length) return null;
  const byName = data.teamName ? teams.find((t) => t.name === data.teamName) : undefined;
  return byName?.id ?? teams[0]?.id ?? null;
};

/**
 * Normalize user data so teamId is set from teams when API returns teamId null.
 * Call before setFinesseUserData when storing link or getFinesseUser response.
 */
export const normalizeFinesseUserData = (data: FinesseUserData): FinesseUserData => {
  if (data.teamId != null) return data;
  const teams = data.teams;
  if (!teams?.length) return data;
  const byName = data.teamName ? teams.find((t) => t.name === data.teamName) : undefined;
  const resolvedId = byName?.id ?? teams[0]?.id;
  if (resolvedId == null) return data;
  return { ...data, teamId: resolvedId };
};

// ==================== Types/Interfaces ====================

export interface FinesseLinkPayload {
  teamId: number | string;
  finesseUserId: string;
  finessePassword: string;
  extension: string;
}

/**
 * POST link - Link Finesse user with credentials, teamId and extension
 */
export const finesseLink = async (payload: FinesseLinkPayload) => {
  const response = await axiosInstance.post(`${prefix}/link`, payload);
  return response.data;
};

/**
 * POST /finesse/unlink/{username} - Unlink Finesse user (Bearer token required)
 */
export const finesseUnlink = async (username: string) => {
  const response = await axiosInstance.post(
    `${prefix}/unlink/${encodeURIComponent(username)}`,
    {}
  );
  return response.data;
};

/**
 * GET /finesse/teams/{teamId}/users/{finesseUserId} - Fetch Finesse user data
 */
export const getFinesseUser = async (teamId: number | string, finesseUserId: string) => {
  const response = await axiosInstance.get(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}`
  );
  return response.data;
};

/**
 * POST /finesse/teams/{teamId}/users/{finesseUserId}/state - Update agent state (READY | NOT_READY)
 */
export const finesseSetState = async (
  teamId: number | string,
  finesseUserId: string,
  newState: 'READY' | 'NOT_READY'
) => {
  const response = await axiosInstance.post(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/state`,
    { newState }
  );
  return response.data;
};

// ==================== Capabilities ====================

/**
 * GET finesse/admins/capabilities/teams/{teamId}/users/{finesseUserId} - Get User Capabilities
 */
export const getFinesseUserCapabilities = async (teamId: number | string, finesseUserId: string) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/capabilities/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}`
  );
  return response.data;
};

// ==================== Campaigns ====================

/**
 * GET finesse/admins/teams/{teamId}/users/{finesseUserId}/campaigns - Get Campaigns
 */
export const getFinesseCampaigns = async (teamId: number | string, finesseUserId: string) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns`
  );
  return response.data;
};

/**
 * POST finesse/admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/enabled - Enable/disable campaign
 */
export const setFinesseCampaignEnabled = async (
  teamId: number | string,
  finesseUserId: string,
  campaignId: number | string,
  enable: boolean
) => {
  const response = await axiosInstance.post(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/enabled`,
    { enable }
  );
  return response.data;
};

/**
 * GET finesse/admins/teams/{teamId}/users/{finesseUserId}/campaigns/contacts/status - Contacts Status
 */
export const getFinesseCampaignsContactsStatus = async (
  teamId: number | string,
  finesseUserId: string
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/contacts/status`
  );
  return response.data;
};

// ==================== Dialog Actions (call answer, decline, wrap-up) ====================

export interface FinesseDialogActionPayload {
  extension: string;
  action: string;
  actionParam?: string | null;
  wrapUpItems?: Array<{ reason?: string }>;
  callVariables?: Record<string, string>;
}

/**
 * POST finesse/teams/{teamId}/user/{finesseUserId}/dialog/{dialogId}/action - Send dialog action (ACCEPT, REJECT, CLOSE, DROP, UPDATE_CALL_DATA, RECLASSIFY)
 */
export const sendFinesseDialogAction = async (
  teamId: number | string,
  finesseUserId: string,
  dialogId: string,
  payload: FinesseDialogActionPayload
) => {
  const body: Record<string, unknown> = {
    extension: payload.extension,
    action: payload.action,
  };
  if (payload.actionParam != null) body.actionParam = payload.actionParam;
  if (payload.action === 'UPDATE_CALL_DATA') {
    if (payload.wrapUpItems != null) body.wrapUpItems = payload.wrapUpItems;
    if (payload.callVariables != null) body.callVariables = payload.callVariables;
  }
  const response = await axiosInstance.post(
    `${prefix}/teams/${teamId}/user/${encodeURIComponent(finesseUserId)}/dialog/${encodeURIComponent(dialogId)}/action`,
    body
  );
  return response.data;
};

// ==================== Campaign Contacts Import ====================

/**
 * POST finesse/admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/contacts/import - Upload + Import Contacts
 */
export const importFinesseCampaignContacts = async (
  teamId: number | string,
  finesseUserId: string,
  campaignId: number | string,
  file: File
) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/contacts/import`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// ==================== Users / Teams ====================

/**
 * GET finesse/users/{username}/teams/{eamId} - Get user team by eamId
 * @param includeLoggedOutAgents - when true, include offline/logged-out agents (default false)
 */
export const getFinesseUserTeam = async (
  username: string,
  teamId: number | string,
  includeLoggedOutAgents: boolean = false
) => {
  const baseUrl = `${prefix}/teams/${teamId}/users/${encodeURIComponent(username)}/teamUsers`;
  const url = includeLoggedOutAgents
    ? `${baseUrl}?includeLoggedOutAgents=true`
    : baseUrl;
  const response = await axiosInstance.get(url);
  return response.data;
};

// ==================== Not yet used (moved to end) ====================

/**
 * GET admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId} - Get single campaign
 */
export const getFinesseCampaign = async (
  teamId: number | string,
  finesseUserId: string,
  campaignId: number | string
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}`
  );
  return response.data;
};

/**
 * POST admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/schedule - Schedule campaign
 */
export const scheduleFinesseCampaign = async (
  teamId: number | string,
  finesseUserId: string,
  campaignId: number | string,
  payload: Record<string, unknown>
) => {
  const response = await axiosInstance.post(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/schedule`,
    payload
  );
  return response.data;
};

/**
 * GET admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/contacts/config - Get contacts config
 */
export const getFinesseCampaignContactsConfig = async (
  teamId: number | string,
  finesseUserId: string,
  campaignId: number | string
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/contacts/config`
  );
  return response.data;
};

/**
 * GET teams/{teamId}/users/{finesseUserId}/wrapUpReasons - Get wrap-up reasons for user
 */
export const getFinesseWrapUpReasons = async (
  teamId: number | string,
  finesseUserId: string
) => {
  const response = await axiosInstance.get(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/wrapUpReasons`
  );
  return response.data;
};

/**
 * GET teams/{teamId}/users/{finesseUserId}/teamUsers - Get team users
 */
export const getFinesseTeamUsers = async (
  teamId: number | string,
  finesseUserId: string
) => {
  const response = await axiosInstance.get(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/teamUsers`
  );
  return response.data;
};
