import axiosInstance from "./axios";

const ZABBIX_PREFIX = "zabbix-middleware";

// ---------------------------------------------------------------------------
// Types (Zabbix JSON-RPC)
// ---------------------------------------------------------------------------

export interface ZabbixJsonRpcPayload<T = unknown> {
  params?: T;
}

export interface ZabbixJsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  result?: T;
  error?: { code: number; message: string; data: string };
  id: number;
}

// Host result shape (from host.get with output extend)
export interface ZabbixHostInterface {
  interfaceid?: string;
  ip?: string;
  dns?: string;
  port?: string;
  type?: string;
  main?: string;
  [key: string]: unknown;
}

export interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status?: string;
  description?: string;
  interfaces?: ZabbixHostInterface[];
  groups?: Array<{ groupid: string; name?: string }>;
  parentTemplates?: Array<{ templateid: string; name?: string }>;
  [key: string]: unknown;
}

export interface ZabbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue: string;
  units: string;
  lastclock?: string;
  hosts?: Array<{ hostid: string; host: string; name: string }>;
  [key: string]: unknown;
}

export interface ZabbixHostGroup {
  groupid: string;
  name: string;
  hosts?: Array<{ hostid: string }>;
  host_count?: number;
  [key: string]: unknown;
}

/** Response shape for manage/hostgroups API (list with pagination) */
export interface ZabbixHostGroupsListResponse {
  hostgroups: ZabbixHostGroup[];
  total: number;
  offset: number;
  limit: number;
  returned: number;
  has_more: boolean;
}

// Host types
export interface ZabbixHostGetParams {
  output?: string | string[];
  hostids?: string[];
  host?: string;
  selectInterfaces?: string | string[];
  selectGroups?: string | string[];
  selectParentTemplates?: string[];
  search?: string | Record<string, string>;
  searchByAny?: boolean;
  searchWildcardsEnabled?: boolean;
  startSearch?: boolean;
  offset?: number;
  limit?: number;
  [key: string]: unknown;
}

/** Response shape for manage/hosts API (list with pagination) */
export interface ZabbixHostsListResponse {
  hosts: ZabbixHost[];
  total: number;
  offset: number;
  limit: number;
  returned: number;
  has_more: boolean;
}

export interface ZabbixHostCreateParams {
  host: string;
  name?: string;
  interfaces: Array<{
    type: number;
    main: number;
    useip: number;
    ip?: string;
    dns?: string;
    port: string;
  }>;
  groups: Array<{ groupid: string }>;
  templates?: Array<{ templateid: string }>;
  [key: string]: unknown;
}

export interface ZabbixHostUpdateParams {
  hostid: string;
  name?: string;
  status?: number;
  description?: string;
  [key: string]: unknown;
}

// Host group types
export interface ZabbixHostGroupGetParams {
  output?: string | string[];
  groupids?: string[];
  search?: string | Record<string, string>;
  startSearch?: boolean;
  selectHosts?: string[];
  offset?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ZabbixHostGroupUpdateParams {
  groupid: string;
  name: string;
  [key: string]: unknown;
}

// Items params
export interface ZabbixItemsByHostNameParams {
  output?: string[];
  hostids?: string[];
  [key: string]: unknown;
}

export interface ZabbixItemsByGroupParams {
  output?: string[];
  selectHosts?: string[];
  groupids?: string[];
  tags?: Array<{ tag: string; value: string }>;
  evaltype?: number;
  filter?: Record<string, unknown>;
  [key: string]: unknown;
}

// Problems / Events
export interface ZabbixProblemParams {
  output?: string;
  selectAcknowledges?: string;
  recent?: boolean;
  sortfield?: string[];
  sortorder?: string;
  time_from?: string;
  [key: string]: unknown;
}

export interface ZabbixProblemsByHostParams {
  output?: string;
  hostids?: string[];
  recent?: boolean;
  sortfield?: string[];
  sortorder?: string;
  [key: string]: unknown;
}

// Alerts
export interface ZabbixAlertsParams {
  output?: string;
  selectHosts?: string[];
  selectRelatedObject?: string[];
  source?: number;
  object?: number;
  value?: number;
  sortfield?: string[];
  sortorder?: string;
  limit?: number;
  [key: string]: unknown;
}

export interface ZabbixAlertAckComment {
  user: string;
  alias?: string;
  message: string;
  time: string;
  action?: string;
  [key: string]: unknown;
}

export interface ZabbixAlertRow {
  alertid: string;
  time: string;
  severity: string;
  severity_class?: string;
  description: string;
  status?: string;
  acknowledged?: boolean;
  ack_comments?: ZabbixAlertAckComment[];
  timestamp?: number;
  hostid?: string;
  hostname?: string;
  customer?: string;
  [key: string]: unknown;
}

export interface ZabbixAlertsListParams {
  offset?: number;
  limit?: number;
  search?: string;
  /** Optional filter: one of not_classified, information, warning, average, high, disaster */
  severity?: string;
  /** Optional filter by acknowledgment status */
  acknowledged?: boolean;
  /** Back-compat: 1-indexed page number (translated to offset) */
  page?: number;
  /** Back-compat: rows per page (translated to limit) */
  perPage?: number;
  [key: string]: unknown;
}

export interface ZabbixAlertsListResponse {
  alerts: ZabbixAlertRow[];
  total: number;
  offset: number;
  limit: number;
  returned: number;
  has_more: boolean;
}

// Events acknowledge
export interface ZabbixEventAcknowledgeParams {
  eventids: string[];
  action: number;
  message?: string;
  [key: string]: unknown;
}

// Triggers
export interface ZabbixTriggersParams {
  output?: string;
  selectHosts?: string[];
  selectLastEvent?: string;
  monitored?: boolean;
  only_true?: boolean;
  [key: string]: unknown;
}

export interface ZabbixTriggersByHostParams {
  output?: string;
  hostids?: string[];
  monitored?: boolean;
  [key: string]: unknown;
}

// Graphs
export interface ZabbixGraphsByHostParams {
  output?: string;
  hostids?: string[];
  [key: string]: unknown;
}

// Templates
export interface ZabbixTemplatesParams {
  output?: string[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPayload<T>(params: T): T {
  return params;
}

// ---------------------------------------------------------------------------
// Hosts API
// ---------------------------------------------------------------------------

/**
 * GET manage/hosts – get hosts list with pagination (hosts, total, offset, limit, returned, has_more)
 */
export async function getHosts(
  params: ZabbixHostGetParams = {}
): Promise<ZabbixHostsListResponse> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixHostsListResponse>(
      `${ZABBIX_PREFIX}/manage/hosts`,
      { params: payload }
    );
    if (!data || !Array.isArray(data.hosts)) {
      throw new Error("Invalid hosts response");
    }
    const total = data.total ?? data.hosts.length;
    const offset = data.offset ?? 0;
    const limit = data.limit ?? 100;
    const returned = data.returned ?? data.hosts.length;
    const hasMore =
      data.has_more ??
      (total > 0 && offset + data.hosts.length < total);
    return {
      hosts: data.hosts,
      total,
      offset,
      limit,
      returned,
      has_more: hasMore,
    };
  } catch (error) {
    throw error;
  }
}



// ---------------------------------------------------------------------------
// Host groups API
// ---------------------------------------------------------------------------

/**
 * GET manage/hostgroups – get host groups list with pagination (hostgroups, total, offset, limit, returned, has_more)
 */
export async function getHostGroups(
  params: ZabbixHostGroupGetParams = {}
): Promise<ZabbixHostGroupsListResponse> {
  try {
    const defaultParams: ZabbixHostGroupGetParams = {
      output: ["groupid", "name"],
      selectHosts: ["hostid"],
      ...params,
    };
    const payload = buildPayload(defaultParams);
    const { data } = await axiosInstance.get<ZabbixHostGroupsListResponse>(
      `${ZABBIX_PREFIX}/manage/hostgroups`,
      { params: payload }
    );
    if (!data || !Array.isArray(data.hostgroups)) {
      throw new Error("Invalid host groups response");
    }
    const total = data.total ?? data.hostgroups.length;
    const offset = data.offset ?? 0;
    const limit = data.limit ?? 200;
    const returned = data.returned ?? data.hostgroups.length;
    const hasMore =
      data.has_more ?? (total > 0 && offset + data.hostgroups.length < total);
    return {
      hostgroups: data.hostgroups,
      total,
      offset,
      limit,
      returned,
      has_more: hasMore,
    };
  } catch (error) {
    throw error;
  }
}


// ---------------------------------------------------------------------------
// Problems API
// ---------------------------------------------------------------------------

/**
 * POST problems – get problems (problem.get)
 */
export async function getProblems(
  params: ZabbixProblemParams = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: "extend",
      selectAcknowledges: "extend",
      recent: false,
      sortfield: ["eventid"],
      sortorder: "DESC",
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/problems`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * POST problems/by-host – get problems by host id(s)
 */
export async function getProblemsByHost(
  params: ZabbixProblemsByHostParams
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: "extend",
      recent: false,
      sortfield: ["eventid"],
      sortorder: "DESC",
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/problems/by-host`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * POST problems/recent – get recent problems
 */
export async function getProblemsRecent(
  params: ZabbixProblemParams
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: "extend",
      recent: true,
      sortfield: ["eventid"],
      sortorder: "DESC",
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/problems/recent`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Alerts API
// ---------------------------------------------------------------------------

/**
 * GET alerts – get alerts list with pagination (alerts, total, offset, limit, returned, has_more)
 */
export async function getAlerts(
  params: ZabbixAlertsListParams = {}
): Promise<ZabbixAlertsListResponse> {
  try {
    const rawLimit = params.limit ?? params.perPage ?? 50;
    const normalizedLimit = Number.isFinite(rawLimit) ? Number(rawLimit) : 50;
    const normalizedPage =
      params.page !== undefined && Number.isFinite(params.page) ? Number(params.page) : undefined;
    const normalizedOffset =
      params.offset !== undefined && Number.isFinite(params.offset)
        ? Number(params.offset)
        : normalizedPage !== undefined
          ? Math.max(0, (normalizedPage - 1) * normalizedLimit)
          : 0;

    const requestParams: ZabbixAlertsListParams = {
      ...params,
      offset: normalizedOffset,
      limit: normalizedLimit,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixAlertsListResponse>(
      `${ZABBIX_PREFIX}/alerts`,
      { params: payload }
    );
    if (!data || !Array.isArray(data.alerts)) {
      throw new Error("Invalid alerts response");
    }
    const total = data.total ?? data.alerts.length;
    const offset = data.offset ?? requestParams.offset ?? 0;
    const limit = data.limit ?? requestParams.limit ?? 50;
    const returned = data.returned ?? data.alerts.length;
    const hasMore =
      data.has_more ?? (total > 0 && offset + data.alerts.length < total);
    return {
      alerts: data.alerts,
      total,
      offset,
      limit,
      returned,
      has_more: hasMore,
    };
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Events API
// ---------------------------------------------------------------------------

/**
 * POST events – get events (event.get)
 */
export async function getEvents(
  params: Record<string, unknown> = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/events`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * POST events/acknowledge – acknowledge or close events (event.acknowledge)
 * action: 1 = close problem, 6 = acknowledge
 */
export async function acknowledgeEvents(
  params: ZabbixEventAcknowledgeParams
): Promise<ZabbixJsonRpcResponse<{ eventids: string[] }>> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<{ eventids: string[] }>>(
      `${ZABBIX_PREFIX}/events/acknowledge`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Triggers API
// ---------------------------------------------------------------------------

/**
 * POST triggers – get triggers (trigger.get)
 */
export async function getTriggers(
  params: ZabbixTriggersParams = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: "extend",
      selectHosts: ["hostid", "host", "name"],
      selectLastEvent: "extend",
      monitored: true,
      only_true: true,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/triggers`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * POST triggers/by-host – get triggers by host id(s)
 */
export async function getTriggersByHost(
  params: ZabbixTriggersByHostParams
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: "extend",
      monitored: true,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/triggers/by-host`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Graphs API
// ---------------------------------------------------------------------------

/**
 * POST graphs/by-host – get graphs by host id(s)
 */
export async function getGraphsByHost(
  params: ZabbixGraphsByHostParams
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: "extend",
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/graphs/by-host`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Templates API
// ---------------------------------------------------------------------------

/**
 * POST templates – get templates (template.get)
 */
export async function getTemplates(
  params: ZabbixTemplatesParams = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: ["templateid", "name"],
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/templates`,
      { params: payload }
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}
