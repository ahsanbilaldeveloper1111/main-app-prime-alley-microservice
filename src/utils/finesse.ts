import axiosInstance from './axios';

const prefix = 'finesse';

// ==================== Storage ====================

export const FINESSE_USER_DATA_KEY = 'finesseResponseData';

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

export const clearFinesseUserData = (): void => {
  if (typeof globalThis.window === 'undefined') return;
  try {
    globalThis.sessionStorage.removeItem(FINESSE_USER_DATA_KEY);
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
  const response = await axiosInstance.post(`${prefix}/finesse/link`, payload);
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
