import axiosInstance from "./axios";

const prefix = "finesse";

const FINESSE_V1_PREFIX = "v1/finesse";

export const FINESSE_USER_DATA_KEY = "finesseResponseData";
export const FINESSE_TOKEN_KEY = "finesseToken";

export const FINESSE_SELECTED_TEAM_ID_KEY = "finesseSelectedTeamId";

const NEXT_PUBLIC_FINESSED_DEFAULT_TEAM_ID =
  process.env.VITE_PUBLIC_FINESSED_DEFAULT_TEAM_ID || "2";
const DEFAULT_TEAM_ID = Number(NEXT_PUBLIC_FINESSED_DEFAULT_TEAM_ID);

export type FinesseId = number | string;
export type FinesseNullableId = FinesseId | null;

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
  /** Returned on link/login; normalized into `settings.finesseClusterId` for roster STOMP. */
  clusterId?: string | number;
  finesseClusterId?: string | number;
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

/** After explicit Finesse logout, block auto re-link until the user clicks Connect (Campaign Manager/Console). */
const FINESSE_MANUAL_RECONNECT_KEY = "finesseManualReconnectRequired";

export const setFinesseManualReconnectRequired = (): void => {
  if (globalThis.window === undefined) return;
  try {
    globalThis.sessionStorage.setItem(FINESSE_MANUAL_RECONNECT_KEY, "1");
  } catch {
    // ignore
  }
};

export const clearFinesseManualReconnectRequired = (): void => {
  if (globalThis.window === undefined) return;
  try {
    globalThis.sessionStorage.removeItem(FINESSE_MANUAL_RECONNECT_KEY);
  } catch {
    // ignore
  }
};

export const getFinesseManualReconnectRequired = (): boolean => {
  if (globalThis.window === undefined) return false;
  try {
    return (
      globalThis.sessionStorage.getItem(FINESSE_MANUAL_RECONNECT_KEY) === "1"
    );
  } catch {
    return false;
  }
};

/** User.state / User.pendingState values that mean the agent is signed out of Finesse (incl. admin force sign-out). */
const FINESSE_LOGGED_OUT_AGENT_STATES = new Set([
  "LOGOUT",
  "NOT_LOGGED_IN",
  "LOGGED_OUT",
]);

/** Roster states that indicate an agent is on an active call. */
const FINESSE_AGENT_ON_CALL_ROSTER_STATES = new Set([
  "TALKING",
  "ACTIVE",
  "HELD",
]);

/**
 * Avoid `String(object)` → "[object Object]". Supports primitives and Finesse-style `{ label: string }`.
 */
function trimmedStringFromUnknownState(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const label = (value as { label?: unknown }).label;
    if (typeof label === "string") return label.trim();
    if (typeof label === "number" || typeof label === "boolean") {
      return String(label).trim();
    }
  }
  return "";
}

/** Cluster id from API may be string or number; reject objects to avoid `String(object)` noise. */
function trimmedClusterIdFromUnknown(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    return t === "" ? null : t;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw === "boolean") {
    return String(raw);
  }
  return null;
}

export function isFinesseAgentLoggedOutStateField(value: unknown): boolean {
  if (value == null) return false;
  const s = trimmedStringFromUnknownState(value).toUpperCase();
  return s !== "" && FINESSE_LOGGED_OUT_AGENT_STATES.has(s);
}

/** Logged-out or offline — used for filters and roster display. */
export function isFinesseAgentOfflineLikeState(value: unknown): boolean {
  if (isFinesseAgentLoggedOutStateField(value)) return true;
  if (value == null) return false;
  return trimmedStringFromUnknownState(value).toUpperCase() === "OFFLINE";
}

/** True when roster state indicates the agent is on an active call. */
export function isFinesseAgentOnCallFromRosterState(
  value: unknown,
): boolean {
  if (value == null) return false;
  return FINESSE_AGENT_ON_CALL_ROSTER_STATES.has(
    trimmedStringFromUnknownState(value).toUpperCase(),
  );
}

/**
 * Effective agent `state` for UI (TopBar) from STOMP / API user rows.
 * - LOGOUT/OFFLINE pending while state lags → prefer pending.
 * - READY ↔ NOT_READY transitions often expose NOT_READY in `pendingState` first → prefer pending when set.
 */
export function getFinesseEffectiveAgentStateFromStatePayload(
  payload: unknown,
): string | undefined {
  if (payload == null || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  let state: unknown = p.state;
  let pendingState: unknown = p.pendingState;
  const nested = p.User ?? p.user;
  if (nested && typeof nested === "object") {
    const u = nested as Record<string, unknown>;
    state = state ?? u.state;
    pendingState = pendingState ?? u.pendingState;
  }
  const pendStr = trimmedStringFromUnknownState(pendingState);
  const stateStr = trimmedStringFromUnknownState(state);

  if (pendStr !== "") {
    const pu = pendStr.toUpperCase();
    if (isFinesseAgentLoggedOutStateField(pendingState) || pu === "OFFLINE") {
      return pendStr;
    }
    if (
      pu === "NOT_READY" ||
      pu === "READY" ||
      pu === "LOGIN" ||
      pu === "RESERVED_OUTBOUND"
    ) {
      return pendStr;
    }
  }
  if (stateStr !== "") return stateStr;
  if (pendStr !== "") return pendStr;
  return undefined;
}

/** Extract login from a Finesse user `state` notification body (flat or nested User). */
export function getFinesseStateEventLoginId(payload: unknown): string | null {
  if (payload == null || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const direct = p.loginId ?? p.loginName;
  if (typeof direct === "string" && direct.trim() !== "") return direct.trim();
  const nested = p.User ?? p.user;
  if (nested && typeof nested === "object") {
    const u = nested as Record<string, unknown>;
    const id = u.loginId ?? u.loginName;
    if (typeof id === "string" && id.trim() !== "") return id.trim();
  }
  return null;
}

export function finesseStatePayloadIndicatesLoggedOut(
  payload: unknown,
): boolean {
  if (payload == null || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    isFinesseAgentLoggedOutStateField(p.state) ||
    isFinesseAgentLoggedOutStateField(p.pendingState)
  );
}

/**
 * When the payload omits login fields, the STOMP destination is still per-user — treat as self.
 */
export function finesseStateEventSubjectMatchesViewer(
  payload: unknown,
  viewerLogin: string | null | undefined,
): boolean {
  if (viewerLogin == null || String(viewerLogin).trim() === "") return false;
  const id = getFinesseStateEventLoginId(payload);
  if (id == null || id === "") return true;
  return id.trim().toLowerCase() === String(viewerLogin).trim().toLowerCase();
}

export function shouldApplyFinesseRemoteLogoutFromStateEvent(
  payload: unknown,
  streamFinesseUserId: string | null | undefined,
): boolean {
  if (
    streamFinesseUserId == null ||
    String(streamFinesseUserId).trim() === ""
  ) {
    return false;
  }
  if (!finesseStatePayloadIndicatesLoggedOut(payload)) return false;
  return finesseStateEventSubjectMatchesViewer(payload, streamFinesseUserId);
}

/**
 * Clear Finesse session and show manual “Connect to Finesse” (same as user-initiated logout without unlink API when already gone server-side).
 */
export function applyFinesseRemoteForcedLogout(): void {
  if (globalThis.window === undefined) return;
  clearFinesseUserData();
  setFinesseManualReconnectRequired();
  globalThis.dispatchEvent(
    new CustomEvent("finesse-require-reauth", {
      detail: { manualConnect: true },
    }),
  );
}

/**
 * Resolve effective teamId for API calls and UI. When user is linked (data present), uses
 * finesseSelectedTeamId from storage so the teams dropdown and all APIs use the same team.
 * When no user data, returns null. getStoredTeamId() (default 15) is the single source of truth when linked.
 */
export const getEffectiveTeamId = (
  data: FinesseUserData | null,
): FinesseNullableId => {
  if (!data) return null;
  return getStoredTeamId();
};

/**
 * Finesse roster STOMP topic uses `/topic/finesse/cluster/{clusterId}/team/{teamId}/roster/state`.
 * Order: `NEXT_PUBLIC_FINESSE_CLUSTER_ID`, then `clusterId` / `finesseClusterId` from link/login payload
 * (merged into settings by `normalizeFinesseUserData`), then `settings.finesseClusterId` / `settings.clusterId`.
 */
export const getFinesseClusterId = (): string | null => {
  const env = process.env.NEXT_PUBLIC_FINESSE_CLUSTER_ID;
  if (env != null && String(env).trim() !== "") return String(env).trim();
  if (globalThis.window === undefined) return null;
  try {
    const data = getFinesseUserData();
    const s =
      data?.settings?.finesseClusterId ?? data?.settings?.clusterId ?? null;
    if (s != null && String(s).trim() !== "") return String(s).trim();
  } catch {
    // ignore
  }
  return null;
};

/**
 * If GET teamUsers (or similar) includes a cluster id, persist it on the linked user so the
 * SSE stream can subscribe to `/topic/finesse/cluster/{clusterId}/team/{teamId}/roster/state`.
 * Returns true when storage was updated (caller may want to reconnect the Finesse EventSource).
 */
export function mergeClusterIntoStoredUserFromTeamPayload(
  teamPayload: unknown,
): boolean {
  if (teamPayload == null || typeof teamPayload !== "object") return false;
  const p = teamPayload as Record<string, unknown>;
  const fromSettings =
    typeof p.settings === "object" && p.settings !== null
      ? (p.settings as Record<string, unknown>)
      : null;
  const raw =
    p.clusterId ??
    p.finesseClusterId ??
    fromSettings?.clusterId ??
    fromSettings?.finesseClusterId;
  const nextId = trimmedClusterIdFromUnknown(raw);
  if (nextId == null) return false;
  const ud = getFinesseUserData();
  if (!ud) return false;
  const cur = ud.settings?.finesseClusterId ?? ud.settings?.clusterId ?? "";
  if (String(cur).trim() === nextId) return false;
  setFinesseUserData({
    ...ud,
    settings: { ...ud.settings, finesseClusterId: nextId },
  });
  return true;
}

/**
 * Normalize user data: merge cluster id from API into `settings.finesseClusterId`, and set
 * `teamId` from `teams` when API returns teamId null.
 * Call before setFinesseUserData when storing link or getFinesseUser response.
 */
export const normalizeFinesseUserData = (
  data: FinesseUserData,
): FinesseUserData => {
  let next: FinesseUserData = { ...data };

  const rootCluster = next.clusterId ?? next.finesseClusterId;
  const settingCluster =
    next.settings?.finesseClusterId ?? next.settings?.clusterId;
  let resolvedCluster: string | null = null;
  if (rootCluster != null && String(rootCluster).trim() !== "") {
    resolvedCluster = String(rootCluster).trim();
  } else if (settingCluster != null && String(settingCluster).trim() !== "") {
    resolvedCluster = String(settingCluster).trim();
  }

  if (resolvedCluster != null) {
    next = {
      ...next,
      settings: { ...next.settings, finesseClusterId: resolvedCluster },
    };
  }

  if (next.teamId != null) return next;
  const teams = next.teams;
  if (!teams?.length) return next;
  const byName = next.teamName
    ? teams.find((t) => t.name === next.teamName)
    : undefined;
  const resolvedId = byName?.id ?? teams[0]?.id;
  if (resolvedId == null) return next;
  return { ...next, teamId: resolvedId };
};

// ==================== Types/Interfaces ====================

export interface FinesseLinkPayload {
  teamId: FinesseId;
}

function trimmedNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** True when sessionStorage has a Finesse token and linked user identity. */
export function isFinesseSessionReady(): boolean {
  const token = getFinesseToken();
  const userData = getFinesseUserData();
  if (!trimmedNonEmptyString(token) || !userData) return false;
  return Boolean(
    trimmedNonEmptyString(userData.loginId) ??
    trimmedNonEmptyString(userData.loginName),
  );
}

function extractFinesseLinkToken(
  response: Record<string, unknown>,
): string | undefined {
  const nestedData = isPlainRecord(response.data) ? response.data : null;
  const nestedResponseData = isPlainRecord(response.responseData)
    ? response.responseData
    : null;
  return (
    trimmedNonEmptyString(response.token) ??
    (nestedData ? trimmedNonEmptyString(nestedData.token) : undefined) ??
    (nestedResponseData
      ? trimmedNonEmptyString(nestedResponseData.token)
      : undefined)
  );
}

function extractFinesseLinkUserPayload(
  response: Record<string, unknown>,
): FinesseUserData | null {
  const candidates: unknown[] = [
    response.responseData,
    isPlainRecord(response.data) ? response.data : null,
    response,
  ];
  for (const candidate of candidates) {
    if (!isPlainRecord(candidate)) continue;
    const nestedUser = candidate.User ?? candidate.user;
    const payload = isPlainRecord(nestedUser) ? nestedUser : candidate;
    const loginId = trimmedNonEmptyString(payload.loginId);
    const loginName = trimmedNonEmptyString(payload.loginName);
    if (loginId ?? loginName) {
      return payload;
    }
  }
  return null;
}

function isFinesseLinkSuccessResponse(
  response: Record<string, unknown>,
): boolean {
  const status = response.status;
  if (
    status === "success" ||
    status === "SUCCESS" ||
    status === true ||
    response.code === 200 ||
    response.statusCode === 200
  ) {
    return true;
  }
  return extractFinesseLinkUserPayload(response) != null;
}

export type ApplyFinesseLinkResponseResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persist link/login payload into sessionStorage. Accepts common API envelope shapes.
 */
export function applyFinesseLinkResponse(
  response: unknown,
): ApplyFinesseLinkResponseResult {
  if (!isPlainRecord(response)) {
    return { ok: false, error: "Authentication failed." };
  }

  const userPayload = extractFinesseLinkUserPayload(response);
  if (!isFinesseLinkSuccessResponse(response) || !userPayload) {
    const message =
      trimmedNonEmptyString(response.message) ??
      trimmedNonEmptyString(response.statusCode) ??
      "Authentication failed.";
    return { ok: false, error: message };
  }

  const normalized = normalizeFinesseUserData(userPayload);
  setFinesseUserData(normalized);

  const token = extractFinesseLinkToken(response);
  if (token) {
    setFinesseToken(token);
  }

  if (!isFinesseSessionReady()) {
    return {
      ok: false,
      error: "Authentication failed: missing Finesse session token.",
    };
  }

  return { ok: true };
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
  teamId: FinesseId,
) => {
  const response = await axiosInstance.post(`${prefix}/unlink`, {
    finesseUserId: finesseUserId,
    teamId: teamId,
  });
  return response.data;
};

export interface FinesseForceSignOutPayload {
  teamId: FinesseId;
  finesseUserId: string;
  supervisorFinesseUserId: string;
}

/**
 * POST /finesse/force-sign-out — supervisor forces an agent session to end in Finesse.
 * Body: `{ teamId, finesseUserId, supervisorFinesseUserId }`.
 */
export const finesseForceSignOut = async (
  payload: FinesseForceSignOutPayload,
) => {
  const response = await axiosInstance.post(
    `${prefix}/force-sign-out`,
    payload,
  );
  return response.data;
};

export interface FinesseMonitoringSilentMonitorPayload {
  targetAgentId: string;
  supervisorExtension: string;
  agentExtension?: string;
}

export interface FinesseMonitoringBargePayload {
  supervisorExtension: string;
  targetAgentId?: string;
  agentExtension?: string;
  supervisorMonitorDialogId?: FinesseNullableId;
  agentDialogId?: FinesseNullableId;
}

export interface FinesseMonitoringEndPayload {
  supervisorExtension: string;
  supervisorMonitorDialogId?: FinesseNullableId;
  targetAgentId?: string;
  agentExtension?: string;
}

const finesseMonitoringBasePath = (
  teamId: FinesseId,
  supervisorFinesseUserId: string,
): string =>
  `${prefix}/teams/${teamId}/users/${encodeURIComponent(supervisorFinesseUserId)}/monitoring`;

export const getFinesseMonitoringAgentDialogs = async (
  teamId: FinesseId,
  supervisorFinesseUserId: string,
  targetAgentId: string,
) => {
  const response = await axiosInstance.get(
    `${finesseMonitoringBasePath(
      teamId,
      supervisorFinesseUserId,
    )}/agents/${encodeURIComponent(targetAgentId)}/dialogs`,
  );
  return response.data;
};

export const finesseStartSilentMonitor = async (
  teamId: FinesseId,
  supervisorFinesseUserId: string,
  payload: FinesseMonitoringSilentMonitorPayload,
) => {
  const response = await axiosInstance.post(
    `${finesseMonitoringBasePath(
      teamId,
      supervisorFinesseUserId,
    )}/silent-monitor`,
    payload,
  );
  return response.data;
};

export const finesseBarge = async (
  teamId: FinesseId,
  supervisorFinesseUserId: string,
  payload: FinesseMonitoringBargePayload,
) => {
  const response = await axiosInstance.post(
    `${finesseMonitoringBasePath(teamId, supervisorFinesseUserId)}/barge`,
    payload,
  );
  return response.data;
};

export const finesseEndMonitoring = async (
  teamId: FinesseId,
  supervisorFinesseUserId: string,
  payload: FinesseMonitoringEndPayload,
) => {
  const response = await axiosInstance.post(
    `${finesseMonitoringBasePath(teamId, supervisorFinesseUserId)}/end`,
    payload,
  );
  return response.data;
};

/**
 * GET /finesse/teams/{teamId}/users/{finesseUserId} - Fetch Finesse user data
 */
export const getFinesseUser = async (
  teamId: FinesseId,
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
 * POST finesse/teams/{teamId}/users/{finesseUserId}/state — body `{ newState, actingFinesseUserId? }`.
 * When `actingFinesseUserId` is set and differs from the target user, the backend uses the
 * supervisor's linked Finesse credentials to change the agent's state.
 */
export const finesseSetState = async (
  teamId: FinesseId,
  finesseUserId: string,
  newState: "READY" | "NOT_READY",
  actingFinesseUserId?: string | null,
) => {
  const payload: {
    newState: "READY" | "NOT_READY";
    actingFinesseUserId?: string;
  } = { newState };
  const acting = actingFinesseUserId?.trim();
  if (acting && acting !== finesseUserId.trim()) {
    payload.actingFinesseUserId = acting;
  }
  const response = await axiosInstance.post(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/state`,
    payload,
  );
  return response.data;
};

// ==================== Capabilities ====================

/**
 * GET finesse/admins/capabilities/teams/{teamId}/users/{finesseUserId} - Get User Capabilities
 */
export const getFinesseUserCapabilities = async (
  teamId: FinesseId,
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
  teamId: FinesseId,
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
  teamId: FinesseId,
  finesseUserId: string,
  campaignId: FinesseId,
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
  teamId: FinesseId,
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
  teamId: FinesseId,
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
  teamId: FinesseId,
  finesseUserId: string,
  campaignId: FinesseId,
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
  teamId: FinesseId,
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
  teamId: FinesseId,
  finesseUserId: string,
  campaignId: FinesseId,
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
  teamId: FinesseId,
  finesseUserId: string,
  campaignId: FinesseId,
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
  teamId: FinesseId,
  finesseUserId: string,
  campaignId: FinesseId,
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/contacts/config`,
  );
  return response.data;
};

/**
 * GET admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/contacts - Get campaign contacts (used for remaining contacts count)
 */
export const getFinesseCampaignContacts = async (
  teamId: FinesseId,
  finesseUserId: string,
  campaignId: FinesseId,
) => {
  const response = await axiosInstance.get(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/contacts`,
  );
  return response.data;
};

/**
 * DELETE admins/teams/{teamId}/users/{finesseUserId}/campaigns/{campaignId}/contacts - Remove campaign contacts (remaining queue)
 */
export const deleteFinesseCampaignContacts = async (
  teamId: FinesseId,
  finesseUserId: string,
  campaignId: FinesseId,
) => {
  const response = await axiosInstance.delete(
    `${prefix}/admins/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/campaigns/${campaignId}/contacts`,
  );
  return response.data;
};

/**
 * GET teams/{teamId}/users/{finesseUserId}/wrapUpReasons - Get wrap-up reasons for user
 */
export const getFinesseWrapUpReasons = async (
  teamId: FinesseId,
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
  teamId: FinesseId,
  finesseUserId: string,
) => {
  const response = await axiosInstance.get(
    `${prefix}/teams/${teamId}/users/${encodeURIComponent(finesseUserId)}/teamUsers`,
  );
  return response.data;
};
