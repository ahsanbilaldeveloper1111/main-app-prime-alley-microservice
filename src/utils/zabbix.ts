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
  [key: string]: unknown;
}

// Host types
export interface ZabbixHostGetParams {
  output?: string | string[];
  hostids?: string[];
  host?: string;
  selectInterfaces?: string | string[];
  selectGroups?: string | string[];
  selectParentTemplates?: string[];
  search?: Record<string, string>;
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
  search?: Record<string, string>;
  startSearch?: boolean;
  selectHosts?: string[];
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

/**
 * POST hosts/by-name – get host by name (host.get with host filter)
 */
export async function getHostByName(
  name: string,
  options: Partial<ZabbixHostGetParams> = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const params: ZabbixHostGetParams = {
      output: "extend",
      selectInterfaces: "extend",
      selectGroups: "extend",
      selectParentTemplates: ["templateid", "name"],
      host: name,
      ...options,
    };
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/manage/hosts/by-name`,
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
 * POST hosts/by-id – get host by id (host.get with hostids)
 */
export async function getHostById(
  hostids: string | string[],
  options: Partial<ZabbixHostGetParams> = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const ids = Array.isArray(hostids) ? hostids : [hostids];
    const params: ZabbixHostGetParams = {
      // output: "extend",
      hostids: ids,
      // selectInterfaces: "extend",
      // selectGroups: "extend",
      // selectParentTemplates: ["templateid", "name"],
      ...options,
    };
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/manage/hosts/by-id`,
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
 * POST hosts/create – create host (host.create)
 */
export async function createHost(
  params: ZabbixHostCreateParams
): Promise<ZabbixJsonRpcResponse<{ hostids: string[] }>> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<{ hostids: string[] }>>(
      `${ZABBIX_PREFIX}/manage/hosts/create`,
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
 * POST hosts/update – update host (host.update)
 */
export async function updateHost(
  params: ZabbixHostUpdateParams
): Promise<ZabbixJsonRpcResponse<{ hostids: string[] }>> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<{ hostids: string[] }>>(
      `${ZABBIX_PREFIX}/manage/hosts/update`,
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
 * POST hosts/delete – delete hosts (host.delete)
 */
export async function deleteHosts(
  hostids: string | string[]
): Promise<ZabbixJsonRpcResponse<{ hostids: string[] }>> {
  try {
    const ids = Array.isArray(hostids) ? hostids : [hostids];
    const payload = buildPayload(ids);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<{ hostids: string[] }>>(
      `${ZABBIX_PREFIX}/manage/hosts/delete`,
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
 * POST items/by-host-id – get items by host id(s) (item.get with hostids)
 */
export async function getItemsByHostId(
  hostIds: string | string[],
  params?: { output?: string[]; sortfield?: string }
): Promise<ZabbixJsonRpcResponse<ZabbixItem[]>> {
  try {
    const ids = Array.isArray(hostIds) ? hostIds : [hostIds];
    const requestParams = {
      hostids: ids,
      output: params?.output ?? ["itemid", "name", "key_", "lastvalue", "units"],
      sortfield: params?.sortfield ?? "name",
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<ZabbixItem[]>>(
      `${ZABBIX_PREFIX}/manage/items/by-host-id`,
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
 * POST items/by-host-name – get items by host name(s) or host id(s) (item.get)
 */
export async function getItemsByHostName(
  hostNames: string[],
  options?: { output?: string[] }
): Promise<ZabbixJsonRpcResponse<ZabbixItem[]>>;
export async function getItemsByHostName(
  params: ZabbixItemsByHostNameParams
): Promise<ZabbixJsonRpcResponse<ZabbixItem[]>>;
export async function getItemsByHostName(
  hostNamesOrParams: string[] | ZabbixItemsByHostNameParams,
  options?: { output?: string[] }
): Promise<ZabbixJsonRpcResponse<ZabbixItem[]>> {
  try {
    const isParams = !Array.isArray(hostNamesOrParams);
    const requestParams = isParams
      ? {
          output: (hostNamesOrParams as ZabbixItemsByHostNameParams).output ?? [
            "itemid",
            "name",
            "key_",
            "lastvalue",
            "units",
          ],
          ...(hostNamesOrParams as ZabbixItemsByHostNameParams),
        }
      : {
          output: options?.output ?? ["itemid", "name", "key_", "lastvalue", "units"],
          filter: { host: hostNamesOrParams as string[] },
        };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<ZabbixItem[]>>(
      `${ZABBIX_PREFIX}/items/by-host-name`,
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
 * POST items/by-group – get items by group(s) (item.get with groupids, tags, filter)
 */
export async function getItemsByGroup(
  params: ZabbixItemsByGroupParams
): Promise<ZabbixJsonRpcResponse<ZabbixItem[]>> {
  try {
    const defaultParams: ZabbixItemsByGroupParams = {
      output: ["itemid", "name", "key_", "lastvalue", "units", "lastclock"],
      selectHosts: ["hostid", "host", "name"],
      ...params,
    };
    const payload = buildPayload(defaultParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<ZabbixItem[]>>(
      `${ZABBIX_PREFIX}/items/by-group`,
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
// Host groups API
// ---------------------------------------------------------------------------

/**
 * POST host-groups – get host groups (hostgroup.get)
 */
export async function getHostGroups(
  params: ZabbixHostGroupGetParams = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const defaultParams: ZabbixHostGroupGetParams = {
      output: ["groupid", "name"],
      selectHosts: ["hostid"],
      ...params,
    };
    const payload = buildPayload(defaultParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/host-groups`,
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
 * POST host-groups/create – get host groups with search (hostgroup.get with search)
 */
export async function getHostGroupsSearch(
  params: ZabbixHostGroupGetParams
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/host-groups/create`,
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
 * POST host-groups/update – update host group (hostgroup.update)
 */
export async function updateHostGroup(
  params: ZabbixHostGroupUpdateParams
): Promise<ZabbixJsonRpcResponse<{ groupids: string[] }>> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<{ groupids: string[] }>>(
      `${ZABBIX_PREFIX}/host-groups/update`,
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
 * POST host-groups/delete – delete host groups (hostgroup.delete)
 */
export async function deleteHostGroups(
  groupids: string | string[]
): Promise<ZabbixJsonRpcResponse<{ groupids: string[] }>> {
  try {
    const ids = Array.isArray(groupids) ? groupids : [groupids];
    const payload = buildPayload(ids);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<{ groupids: string[] }>>(
      `${ZABBIX_PREFIX}/host-groups/delete`,
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
 * POST alerts – get alerts (alert.get)
 */
export async function getAlerts(
  params: ZabbixAlertsParams = {}
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const requestParams = {
      output: "extend",
      selectHosts: ["hostid", "name"],
      selectRelatedObject: ["description", "priority"],
      source: 0,
      object: 0,
      value: 1,
      sortfield: ["clock"],
      sortorder: "DESC",
      limit: 50,
      ...params,
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.get<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/alerts`,
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
