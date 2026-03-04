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

export interface ZabbixTemplateGroupRef {
  groupid: string;
  name: string;
  [key: string]: unknown;
}

export interface ZabbixTemplate {
  templateid: string;
  name: string;
  groups?: ZabbixTemplateGroupRef[];
  [key: string]: unknown;
}

export interface ZabbixTemplatesListParams {
  search?: string;
  group?: string;
  offset?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ZabbixTemplatesListResponse {
  templates: ZabbixTemplate[];
  total: number;
  offset: number;
  limit: number;
  returned: number;
  has_more: boolean;
}

// Customers v2 (custom backend grouped response)
export interface ZabbixCustomerGroupRow {
  groupid: string;
  name: string;
  device_type?: string;
  host_count?: number;
  [key: string]: unknown;
}

export interface ZabbixCustomersV2Params {
  search?: string;
  offset?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ZabbixCustomersV2Response {
  customers: Record<string, ZabbixCustomerGroupRow[]>;
  customer_names: string[];
  total: number;
  offset: number;
  limit: number;
  returned: number;
  has_more: boolean;
}

// Events (custom backend list response)
export interface ZabbixEventAckComment {
  user: string;
  alias?: string;
  message: string;
  time: string;
  action?: string;
  [key: string]: unknown;
}

export interface ZabbixEventHostRef {
  hostid: string;
  host: string;
  [key: string]: unknown;
}

export interface ZabbixEventRow {
  eventid: string;
  time?: string;
  customer?: string;
  severity?: string;
  severity_class?: string;
  description?: string;
  type?: string;
  hosts?: ZabbixEventHostRef[];
  host_names?: string[];
  timestamp?: number;
  acknowledged?: boolean;
  ack_comments?: ZabbixEventAckComment[];
  [key: string]: unknown;
}

export interface ZabbixEventsListParams {
  /** 1 = problem, 0 = recovery */
  value?: number;
  offset?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ZabbixEventsListResponse {
  events: ZabbixEventRow[];
  offset: number;
  limit: number;
  returned: number;
  has_more: boolean;
}

// Host graphs (custom backend grouped response)
export interface ZabbixGraphRow {
  graphid: string;
  name: string;
  [key: string]: unknown;
}

export interface ZabbixHostGraphsParams {
  key_only?: boolean;
  search?: string;
  [key: string]: unknown;
}

export interface ZabbixHostGraphsResponse {
  sections: Record<string, ZabbixGraphRow[]>;
  total: number;
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
 * GET events – get events list with pagination (events, offset, limit, returned, has_more)
 */
export async function getEvents(
  params: ZabbixEventsListParams = {}
): Promise<ZabbixEventsListResponse> {
  try {
    const requestParams: ZabbixEventsListParams = {
      value: 1,
      offset: 0,
      limit: 25,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixEventsListResponse>(
      `${ZABBIX_PREFIX}/events`,
      { params: payload }
    );
    if (!data || !Array.isArray(data.events)) {
      throw new Error("Invalid events response");
    }
    const offset = data.offset ?? requestParams.offset ?? 0;
    const limit = data.limit ?? requestParams.limit ?? 25;
    const returned = data.returned ?? data.events.length;
    const hasMore =
      data.has_more ?? (returned > 0 && data.events.length >= limit);
    return {
      events: data.events,
      offset,
      limit,
      returned,
      has_more: hasMore,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * GET hosts/{hostid}/events – host scoped events list with pagination
 */
export async function getHostEvents(
  hostid: string,
  params: ZabbixEventsListParams = {}
): Promise<ZabbixEventsListResponse> {
  try {
    const requestParams: ZabbixEventsListParams = {
      value: 1,
      offset: 0,
      limit: 25,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixEventsListResponse>(
      `${ZABBIX_PREFIX}/hosts/${hostid}/events`,
      { params: payload }
    );
    if (!data || !Array.isArray(data.events)) {
      throw new Error("Invalid host events response");
    }
    const offset = data.offset ?? requestParams.offset ?? 0;
    const limit = data.limit ?? requestParams.limit ?? 25;
    const returned = data.returned ?? data.events.length;
    const hasMore =
      data.has_more ?? (returned > 0 && data.events.length >= limit);
    return {
      events: data.events,
      offset,
      limit,
      returned,
      has_more: hasMore,
    };
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

/**
 * GET hosts/{hostid}/graphs – host scoped graphs (grouped sections when key_only=true)
 */
export async function getHostGraphs(
  hostid: string,
  params: ZabbixHostGraphsParams = {}
): Promise<ZabbixHostGraphsResponse> {
  try {
    const requestParams: ZabbixHostGraphsParams = {
      key_only: true,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixHostGraphsResponse>(
      `${ZABBIX_PREFIX}/hosts/${hostid}/graphs`,
      { params: payload }
    );
    if (!data || typeof data.sections !== "object" || data.sections === null) {
      throw new Error("Invalid host graphs response");
    }
    return {
      sections: data.sections,
      total: data.total ?? 0,
    };
  } catch (error) {
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Templates API
// ---------------------------------------------------------------------------

/**
 * GET manage/templates – get templates list with pagination (templates, total, offset, limit, returned, has_more)
 */
export async function getTemplates(
  params: ZabbixTemplatesListParams = {}
): Promise<ZabbixTemplatesListResponse> {
  try {
    const requestParams: ZabbixTemplatesListParams = {
      offset: 0,
      limit: 200,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixTemplatesListResponse>(
      `${ZABBIX_PREFIX}/manage/templates`,
      { params: payload }
    );
    if (!data || !Array.isArray(data.templates)) {
      throw new Error("Invalid templates response");
    }
    const total = data.total ?? data.templates.length;
    const offset = data.offset ?? requestParams.offset ?? 0;
    const limit = data.limit ?? requestParams.limit ?? 200;
    const returned = data.returned ?? data.templates.length;
    const hasMore =
      data.has_more ?? (total > 0 && offset + data.templates.length < total);
    return {
      templates: data.templates,
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
// Customers API (v2)
// ---------------------------------------------------------------------------

/**
 * GET v2/customers – get customers grouped list with pagination
 */
export async function getCustomersV2(
  params: ZabbixCustomersV2Params = {}
): Promise<ZabbixCustomersV2Response> {
  try {
    const requestParams: ZabbixCustomersV2Params = {
      offset: 0,
      limit: 50,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixCustomersV2Response>(
      `${ZABBIX_PREFIX}/v2/customers`,
      { params: payload }
    );
    if (!data || typeof data.customers !== 'object' || data.customers === null) {
      throw new Error('Invalid customers response');
    }
    const customerNames = Array.isArray(data.customer_names)
      ? data.customer_names
      : Object.keys(data.customers ?? {});
    const total = data.total ?? customerNames.length;
    const offset = data.offset ?? requestParams.offset ?? 0;
    const limit = data.limit ?? requestParams.limit ?? 50;
    const returned = data.returned ?? customerNames.length;
    const hasMore =
      data.has_more ?? (total > 0 && offset + returned < total);
    return {
      customers: data.customers ?? {},
      customer_names: customerNames,
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
