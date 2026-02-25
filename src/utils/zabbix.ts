import axiosInstance from "./axios";

const ZABBIX_PREFIX = "zabbix";

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
  [key: string]: unknown;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildPayload<T>(params: T): ZabbixJsonRpcPayload<T> {
  return { params };
}

// ---------------------------------------------------------------------------
// Hosts API
// ---------------------------------------------------------------------------

/**
 * POST hosts – get hosts (host.get)
 */
export async function getHosts(
  params: ZabbixHostGetParams
): Promise<ZabbixJsonRpcResponse<unknown[]>> {
  try {
    const payload = buildPayload(params);
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/hosts`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/hosts/by-name`,
      payload
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
      output: "extend",
      hostids: ids,
      selectInterfaces: "extend",
      selectGroups: "extend",
      selectParentTemplates: ["templateid", "name"],
      ...options,
    };
    const payload = buildPayload(params);
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/hosts/by-id`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<{ hostids: string[] }>>(
      `${ZABBIX_PREFIX}/hosts/create`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<{ hostids: string[] }>>(
      `${ZABBIX_PREFIX}/hosts/update`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<{ hostids: string[] }>>(
      `${ZABBIX_PREFIX}/hosts/delete`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<ZabbixItem[]>>(
      `${ZABBIX_PREFIX}/items/by-host-id`,
      payload
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
 * POST items/by-host-name – get items by host name(s) (item.get with filter)
 */
export async function getItemsByHostName(
  hostNames: string[],
  params?: { output?: string[] }
): Promise<ZabbixJsonRpcResponse<ZabbixItem[]>> {
  try {
    const requestParams = {
      output: params?.output ?? ["itemid", "name", "key_", "lastvalue", "units"],
      filter: { host: hostNames },
    };
    const payload = buildPayload(requestParams);
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<ZabbixItem[]>>(
      `${ZABBIX_PREFIX}/items/by-host-name`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/host-groups`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<unknown[]>>(
      `${ZABBIX_PREFIX}/host-groups/create`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<{ groupids: string[] }>>(
      `${ZABBIX_PREFIX}/host-groups/update`,
      payload
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
    const { data } = await axiosInstance.post<ZabbixJsonRpcResponse<{ groupids: string[] }>>(
      `${ZABBIX_PREFIX}/host-groups/delete`,
      payload
    );
    if (data.error) {
      throw new Error(data.error.message || "Zabbix API error");
    }
    return data;
  } catch (error) {
    throw error;
  }
}
