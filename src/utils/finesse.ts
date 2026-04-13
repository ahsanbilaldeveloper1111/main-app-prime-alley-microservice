import axiosInstance from "./axios";

const prefix = "finesse";

// ==================== Storage ====================

export const FINESSE_USER_DATA_KEY = "finesseResponseData";
export const FINESSE_TOKEN_KEY = "finesseToken";
/** Stored selected team id; use this for all APIs (payloads/query params). Default 15 when not set. */
export const FINESSE_SELECTED_TEAM_ID_KEY = "finesseSelectedTeamId";

const NEXT_PUBLIC_FINESSED_DEFAULT_TEAM_ID =
  process.env.NEXT_PUBLIC_FINESSED_DEFAULT_TEAM_ID || "2";
const DEFAULT_TEAM_ID = Number(NEXT_PUBLIC_FINESSED_DEFAULT_TEAM_ID);

export const getStoredTeamId = (): number => {
  if (globalThis.window === undefined) return DEFAULT_TEAM_ID;
  try {
    const raw = globalThis.sessionStorage.getItem(FINESSE_SELECTED_TEAM_ID_KEY);
    if (raw == null || raw === "") return DEFAULT_TEAM_ID;
    const n = Number(raw);
    return Number.isFinite(n) ? n : DEFAULT_TEAM_ID;
  } catch {
    return DEFAULT_TEAM_ID;
  }
};

export const setStoredTeamId = (teamId: number): void => {
  if (globalThis.window === undefined) return;
  try {
    globalThis.sessionStorage.setItem(
      FINESSE_SELECTED_TEAM_ID_KEY,
      String(teamId),
    );
  } catch {
    // ignore
  }
};

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
  if (globalThis.window === undefined) return;
  try {
    globalThis.sessionStorage.setItem(
      FINESSE_USER_DATA_KEY,
      JSON.stringify(data),
    );
  } catch {
    // ignore
  }
};

export const getFinesseUserData = (): FinesseUserData | null => {
  if (globalThis.window === undefined) return null;
  try {
    const raw = globalThis.sessionStorage.getItem(FINESSE_USER_DATA_KEY);
    return raw ? (JSON.parse(raw) as FinesseUserData) : null;
  } catch {
    return null;
  }
};

export const setFinesseToken = (token: string): void => {
  if (globalThis.window === undefined) return;
  try {
    globalThis.sessionStorage.setItem(FINESSE_TOKEN_KEY, token);
  } catch {
    // ignore
  }
};

export const getFinesseToken = (): string | null => {
  if (globalThis.window === undefined) return null;
  try {
    return globalThis.sessionStorage.getItem(FINESSE_TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Clears Finesse user data and token from sessionStorage.
 * Called on team switch and logout so the next link (re-auth) gets a fresh token from the API.
 * Finesse token is thus cleared here and replaced when user authenticates again (setFinesseToken(response.token)).
 */
export const clearFinesseUserData = (): void => {
  if (globalThis.window === undefined) return;
  try {
    globalThis.sessionStorage.removeItem(FINESSE_USER_DATA_KEY);
    globalThis.sessionStorage.removeItem(FINESSE_TOKEN_KEY);
  } catch {
    // ignore
  }
};

/**
 * Resolve effective teamId for API calls and UI. When user is linked (data present), uses
 * finesseSelectedTeamId from storage so the teams dropdown and all APIs use the same team.
 * When no user data, returns null. getStoredTeamId() (default 15) is the single source of truth when linked.
 */
export const getEffectiveTeamId = (
  data: FinesseUserData | null,
): number | string | null => {
  if (!data) return null;
  return getStoredTeamId();
};

/**
 * Normalize user data so teamId is set from teams when API returns teamId null.
 * Call before setFinesseUserData when storing link or getFinesseUser response.
 */
export const normalizeFinesseUserData = (
  data: FinesseUserData,
): FinesseUserData => {
  if (data.teamId != null) return data;
  const teams = data.teams;
  if (!teams?.length) return data;
  const byName = data.teamName
    ? teams.find((t) => t.name === data.teamName)
    : undefined;
  const resolvedId = byName?.id ?? teams[0]?.id;
  if (resolvedId == null) return data;
  return { ...data, teamId: resolvedId };
};

// ==================== Types/Interfaces ====================

export interface FinesseLinkPayload {
  teamId: number | string;
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
export const finesseUnlink = async (
  finesseUserId: string,
  teamId: number | string,
) => {
  const response = await axiosInstance.post(`${prefix}/unlink`, {
    finesseUserId: finesseUserId,
    teamId: teamId,
  });
  return response.data;
};

/**
 * GET /finesse/teams/{teamId}/users/{finesseUserId} - Fetch Finesse user data
 */
export const getFinesseUser = async (
  teamId: number | string,
  finesseUserId: string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}`,
  );
  return response.data;
};

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const TOAST_MESSAGE_MAX_LEN = 2000;

function truncateToastText(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.length > TOAST_MESSAGE_MAX_LEN
    ? `${t.slice(0, TOAST_MESSAGE_MAX_LEN)}…`
    : t;
}

function appendValidationErrorPart(parts: string[], item: unknown): void {
  if (typeof item === "string") {
    const t = item.trim();
    if (t) parts.push(t);
    return;
  }
  if (typeof item === "number" || typeof item === "boolean") {
    parts.push(String(item));
  }
}

function collectValidationPartsForValue(parts: string[], v: unknown): void {
  if (Array.isArray(v)) {
    for (const item of v) {
      appendValidationErrorPart(parts, item);
    }
    return;
  }
  appendValidationErrorPart(parts, v);
}

function flattenValidationErrors(errors: unknown): string | undefined {
  if (!isPlainRecord(errors)) return undefined;
  const parts: string[] = [];
  for (const v of Object.values(errors)) {
    collectValidationPartsForValue(parts, v);
  }
  if (parts.length === 0) return undefined;
  return truncateToastText(parts.join(". "));
}

/**
 * Plain text or parsed JSON → user-facing line. Never returns raw stringified JSON when the value parses as JSON.
 */
function extractStringBody(data: string): string | undefined {
  const trimmed = data.trim();
  if (!trimmed) return undefined;
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  if (looksJson) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const inner = extractMessageFromResponseData(parsed);
      if (inner) return inner;
    } catch {
      return truncateToastText(trimmed);
    }
    return undefined;
  }
  return truncateToastText(trimmed);
}

function extractFromMessageField(msg: unknown): string | undefined {
  if (typeof msg === "string") {
    return extractStringBody(msg);
  }
  if (isPlainRecord(msg)) {
    return extractMessageFromResponseData(msg);
  }
  return undefined;
}

function extractFromResponseDataField(rd: unknown): string | undefined {
  if (typeof rd === "string") {
    return extractStringBody(rd);
  }
  if (isPlainRecord(rd)) {
    return extractMessageFromResponseData(rd);
  }
  return undefined;
}

function extractMessageFromResponseData(data: unknown): string | undefined {
  if (data == null) return undefined;
  if (typeof data === "string") {
    return extractStringBody(data);
  }
  if (!isPlainRecord(data)) return undefined;

  const fromMsg = extractFromMessageField(data.message);
  if (fromMsg) return fromMsg;

  if (typeof data.detail === "string" && data.detail.trim()) {
    return truncateToastText(data.detail);
  }
  if (typeof data.title === "string" && data.title.trim()) {
    return truncateToastText(data.title);
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return truncateToastText(data.error);
  }

  const fromRd = extractFromResponseDataField(data.responseData);
  if (fromRd) return fromRd;

  const dataNested = data.data;
  if (isPlainRecord(dataNested)) {
    const nested = extractMessageFromResponseData(dataNested);
    if (nested) return nested;
  }

  const fromErrors = flattenValidationErrors(data.errors);
  if (fromErrors) return fromErrors;

  return undefined;
}

const AXIOS_STATUS_ONLY = /^Request failed with status code \d+$/i;

/**
 * Single line for toasts: prefers API `message` (and nested `data.message`), not status codes or timestamps.
 */
export function getFinesseApiErrorMessage(
  err: unknown,
  fallback: string,
): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data;
    const fromBody = extractMessageFromResponseData(data);
    if (fromBody) return fromBody;
  }
  if (
    err instanceof Error &&
    err.message &&
    !AXIOS_STATUS_ONLY.test(err.message)
  ) {
    const m = err.message.trim();
    if (m.startsWith("{") || m.startsWith("[")) {
      const fromEmbedded = extractStringBody(m);
      if (fromEmbedded) return fromEmbedded;
      return fallback;
    }
    return truncateToastText(m);
  }
  return fallback;
}

/**
 * Ensures a team id is safe to persist: it must appear in a known team list, and when username is set,
 * GET user for that team must succeed. Call before unlink / setStoredTeamId to avoid a bad id on refresh.
 */
export async function assertFinesseTeamSwitchable(
  newTeamId: number,
  username: string | undefined,
  teamLists: ReadonlyArray<ReadonlyArray<{ id: number }> | undefined | null>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const normalizedId = Number(newTeamId);
  if (!Number.isFinite(normalizedId)) {
    return { ok: false, message: "Invalid team selection." };
  }
  const inList = teamLists.some(
    (list) => list?.some((t) => Number(t.id) === normalizedId) ?? false,
  );
  if (!inList) {
    return {
      ok: false,
      message: "Selected team is not available for your account.",
    };
  }
  if (username) {
    try {
      await getFinesseUser(normalizedId, username);
      return { ok: true };
    } catch (err: unknown) {
      console.error(
        "[assertFinesseTeamSwitchable] getFinesseUser failed",
        { teamId: normalizedId, username },
        err,
      );
      return {
        ok: false,
        message: "This team is not available.",
      };
    }
  }
  return { ok: true };
}

/**
 * POST /finesse/teams/{teamId}/users/{finesseUserId}/state - Update agent state (READY | NOT_READY)
 */
export const finesseSetState = async (
  teamId: number | string,
  finesseUserId: string,
  newState: "READY" | "NOT_READY",
) => {
  const response = await axiosInstance.post(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/state`,
    { newState },
  );
  return response.data;
};

// ==================== Capabilities ====================

/**
 * GET finesse/admins/capabilities/teams/{teamId}/users/{finesseUserId} - Get User Capabilities
 */
export const getFinesseUserCapabilities = async (
  teamId: number | string,
  finesseUserId: string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/capabilities/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}`,
  );
  return response.data;
};

// ==================== Campaigns ====================

/**
 * GET finesse/admins/teams/{teamId}/users/{finesseUserId}/campaigns - Get Campaigns
 */
export const getFinesseCampaigns = async (
  teamId: number | string,
  finesseUserId: string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns`,
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
  enable: boolean,
) => {
  const response = await axiosInstance.post(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/enabled`,
    { enable },
  );
  return response.data;
};

/**
 * GET finesse/admins/teams/{teamId}/users/{finesseUserId}/campaigns/contacts/status - Contacts Status
 */
export const getFinesseCampaignsContactsStatus = async (
  teamId: number | string,
  finesseUserId: string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/contacts/status`,
  );
  return response.data;
};

// ==================== Dialog Actions (call answer, decline, wrap-up) ====================

/** API expects callVariables as array of { name, value }; we accept object and convert. */
export interface FinesseDialogActionPayload {
  extension: string;
  action: string;
  actionParam?: string | null;
  wrapUpReason?: string;
  wrapUpItems?: string[];
  /** Pass Record<string, string> (from form); sent to API as Array<{ name, value }>. */
  callVariables?:
    | Record<string, string>
    | Array<{ name: string; value: string }>;
  actionParamCombinationValid?: boolean;
  wrapUpItemsValidIfProvided?: boolean;
  callVariableNamesUnique?: boolean;
  updateCallDataRequiresItemsOrCallVars?: boolean;
  updateCallDataFieldsOnlyForUpdateCallData?: boolean;
  wrapUpReasonNotAllowedForUpdateCallData?: boolean;
}

type FinesseCallVariableRow = { name: string; value: string };

const UPDATE_CALL_DATA_FLAG_KEYS = [
  "actionParamCombinationValid",
  "wrapUpItemsValidIfProvided",
  "callVariableNamesUnique",
  "updateCallDataRequiresItemsOrCallVars",
  "updateCallDataFieldsOnlyForUpdateCallData",
  "wrapUpReasonNotAllowedForUpdateCallData",
] as const satisfies ReadonlyArray<keyof FinesseDialogActionPayload>;

function normalizeCallVariablesForDialogAction(
  callVariables: FinesseDialogActionPayload["callVariables"],
): FinesseCallVariableRow[] | undefined {
  if (callVariables == null) return undefined;
  if (Array.isArray(callVariables)) {
    return callVariables.length > 0 ? callVariables : undefined;
  }
  const arr = Object.entries(callVariables)
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([name, value]) => ({ name, value: String(value) }));
  return arr.length > 0 ? arr : undefined;
}

function applyUpdateCallDataPayloadToBody(
  body: Record<string, unknown>,
  payload: FinesseDialogActionPayload,
): void {
  if (payload.wrapUpReason != null) body.wrapUpReason = payload.wrapUpReason;
  if (payload.wrapUpItems != null) body.wrapUpItems = payload.wrapUpItems;
  const callVars = normalizeCallVariablesForDialogAction(payload.callVariables);
  if (callVars != undefined) body.callVariables = callVars;
  for (const key of UPDATE_CALL_DATA_FLAG_KEYS) {
    const v = payload[key];
    if (v !== undefined) body[key] = v;
  }
}

/**
 * POST finesse/teams/{teamId}/user/{finesseUserId}/dialog/{dialogId}/action - Send dialog action (ACCEPT, REJECT, CLOSE, DROP, UPDATE_CALL_DATA, RECLASSIFY)
 */
export const sendFinesseDialogAction = async (
  teamId: number | string,
  finesseUserId: string,
  dialogId: string,
  payload: FinesseDialogActionPayload,
) => {
  const body: Record<string, unknown> = {
    extension: payload.extension,
    action: payload.action,
  };
  if (payload.actionParam != null) body.actionParam = payload.actionParam;
  if (payload.action === "UPDATE_CALL_DATA") {
    applyUpdateCallDataPayloadToBody(body, payload);
  }
  const response = await axiosInstance.post(
    `${prefix}/teams/${teamId}/user/${encodeURIComponent(finesseUserId)}/dialog/${encodeURIComponent(dialogId)}/action`,
    body,
  );
  return response.data;
};

// ==================== Campaign Contacts Import ====================

export interface FinesseCampaignContactsImportPayload {
  allowDuplicateContacts: boolean;
  importType: "MANUAL" | "AUTO";
  contactHeaders?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * POST finesse/admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/contacts/import - Upload + Import Contacts
 */
export const importFinesseCampaignContacts = async (
  teamId: number | string,
  finesseUserId: string,
  campaignId: number | string,
  file: File,
  payload?: FinesseCampaignContactsImportPayload,
) => {
  const formData = new FormData();
  formData.append("file", file);
  if (payload) {
    console.log("payload", payload);
    formData.append(
      "payload",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
  }

  const response = await axiosInstance.post(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/contacts/import`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
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
  includeLoggedOutAgents: boolean = false,
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
  campaignId: number | string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}`,
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
  payload: Record<string, unknown>,
) => {
  const response = await axiosInstance.post(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/schedule`,
    payload,
  );
  return response.data;
};

/**
 * GET admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/contacts/config - Get contacts config
 */
export const getFinesseCampaignContactsConfig = async (
  teamId: number | string,
  finesseUserId: string,
  campaignId: number | string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/contacts/config`,
  );
  return response.data;
};

/**
 * GET teams/{teamId}/users/{finesseUserId}/wrapUpReasons - Get wrap-up reasons for user
 */
export const getFinesseWrapUpReasons = async (
  teamId: number | string,
  finesseUserId: string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/wrapUpReasons`,
  );
  return response.data;
};

/**
 * GET teams/{teamId}/users/{finesseUserId}/teamUsers - Get team users
 */
export const getFinesseTeamUsers = async (
  teamId: number | string,
  finesseUserId: string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/teamUsers`,
  );
  return response.data;
};
