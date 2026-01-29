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

// ==================== Types/Interfaces ====================

export interface FinesseLinkPayload {
  finesseUserId: string;
  finessePassword: string;
  extension: string;
}

// ==================== API Functions ====================

/**
 * POST link - Link Finesse user with credentials and extension
 */
export const finesseLink = async (payload: FinesseLinkPayload) => {
  // const params = {
  //   finesseUserId: "ali.bahadar",
  //   finessePassword: "NzKv@0cF",
  //   extension: "532",
  // };

  // const params = {
  //   finesseUserId: "ali.niaz",
  //   finessePassword: "KYIdq8@G",
  //   extension: "590",
  // };
  const response = await axiosInstance.post(`${prefix}/finesse/link`, payload);
  return response.data;
};

/**
 * POST finesse/unlink/{username} - Unlink Finesse user (Bearer token required)
 */
export const finesseUnlink = async (username: string) => {
  const response = await axiosInstance.post(
    `${prefix}/finesse/unlink/${encodeURIComponent(username)}`,{}
  );
  return response.data;
};

/**
 * GET finesse/user/{username} - Fetch Finesse user data
 */
export const getFinesseUser = async (username: string) => {
  const response = await axiosInstance.get(`${prefix}/finesse/user/${encodeURIComponent(username)}`);
  return response.data;
};

/**
 * POST finesse/user/{username}/state - Update agent state (READY | NOT_READY)
 */
export const finesseSetState = async (
  username: string,
  newState: 'READY' | 'NOT_READY'
) => {
  const response = await axiosInstance.post(
    `${prefix}/finesse/user/${encodeURIComponent(username)}/state`,
    { newState }
  );
  return response.data;
};

// ==================== Capabilities ====================

/**
 * GET finesse/admins/capabilities/users/{username} - Get User Capabilities
 */
export const getFinesseUserCapabilities = async (username: string) => {
  const response = await axiosInstance.get(
    `${prefix}/finesse/admins/capabilities/users/${encodeURIComponent(username)}`
  );
  return response.data;
};

// ==================== Campaigns ====================

/**
 * GET finesse/admins/users/{username}/campaigns - Get Campaigns
 */
export const getFinesseCampaigns = async (username: string) => {
  const response = await axiosInstance.get(
    `${prefix}/finesse/admins/users/${encodeURIComponent(username)}/campaigns`
  );
  return response.data;
};

/**
 * GET finesse/admins/users/{username}/campaigns/{campaignId} - Get Campaign
 */
export const getFinesseCampaign = async (username: string, campaignId: number | string) => {
  const response = await axiosInstance.get(
    `${prefix}/finesse/admins/users/${encodeURIComponent(username)}/campaigns/${campaignId}`
  );
  return response.data;
};

/**
 * POST finesse/admins/users/{username}/campaigns/{campaignId}/enabled - Enable/disable campaign
 */
export const setFinesseCampaignEnabled = async (
  username: string,
  campaignId: number | string,
  enable: boolean
) => {
  const response = await axiosInstance.post(
    `${prefix}/finesse/admins/users/${encodeURIComponent(username)}/campaigns/${campaignId}/enabled`,
    { enable }
  );
  return response.data;
};

/**
 * GET finesse/admins/users/{username}/campaigns/contacts/status - Contacts Status
 */
export const getFinesseCampaignsContactsStatus = async (username: string) => {
  const response = await axiosInstance.get(
    `${prefix}/finesse/admins/users/${encodeURIComponent(username)}/campaigns/contacts/status`
  );
  return response.data;
};

/**
 * GET finesse/admins/users/{username}/campaigns/{campaignId}/contacts/config - Get Config
 */
export const getFinesseCampaignContactsConfig = async (
  username: string,
  campaignId: number | string
) => {
  const response = await axiosInstance.get(
    `${prefix}/finesse/admins/users/${encodeURIComponent(username)}/campaigns/${campaignId}/contacts/config`
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
 * POST finesse/user/{username}/dialog/{dialogId}/action - Send dialog action (ACCEPT, REJECT, CLOSE, DROP, UPDATE_CALL_DATA, RECLASSIFY)
 */
export const sendFinesseDialogAction = async (
  username: string,
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
    `${prefix}/finesse/user/${encodeURIComponent(username)}/dialog/${encodeURIComponent(dialogId)}/action`,
    body
  );
  return response.data;
};

// ==================== Campaign Contacts Import ====================

/**
 * POST finesse/admins/users/{username}/campaigns/{campaignId}/contacts/import - Upload + Import Contacts
 */
export const importFinesseCampaignContacts = async (
  username: string,
  campaignId: number | string,
  file: File
) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(
    `${prefix}/finesse/admins/users/${encodeURIComponent(username)}/campaigns/${campaignId}/contacts/import`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};
