import axiosInstance from "./axios";

const ZEBBIX_PREFIX = "zabbix";

// ---------------------------------------------------------------------------
// JSON-RPC payload / response types (optional, for type safety)
// ---------------------------------------------------------------------------

export interface ZebbixHostInterface {
  interfaceid: string;
  ip: string;
}

export interface ZebbixHost {
  hostid: string;
  host: string;
  name: string;
  interfaces?: ZebbixHostInterface[];
}

export interface ZebbixHostGroup {
  groupid: string;
  name: string;
}

export interface ZebbixItem {
  itemid: string;
  name: string;
  key_: string;
  lastvalue: string;
  units: string;
}

export interface ZebbixAlertHost {
  hostid: string;
  host: string;
}

export interface ZebbixAlert {
  eventid: string;
  name: string;
  severity: string;
  clock: string;
  hosts?: ZebbixAlertHost[];
}

export interface ZebbixJsonRpcResponse<T> {
  jsonrpc: string;
  result?: T;
  error?: { code: number; message: string; data: string };
  id: number;
}

// ---------------------------------------------------------------------------
// API helpers – all POST with JSON-RPC 2.0 payloads
// ---------------------------------------------------------------------------

/**
 * POST zebbix/hosts
 * method: host.get – returns hosts with optional interfaces
 */
export const getHosts = async (params?: {
  output?: string[];
  selectInterfaces?: string[];
}) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "host.get",
      params: {
        output: params?.output ?? ["hostid", "host", "name"],
        selectInterfaces: params?.selectInterfaces ?? ["interfaceid", "ip"],
      },
      id: 1,
    };
    const response = await axiosInstance.post<ZebbixJsonRpcResponse<ZebbixHost[]>>(
      `${ZEBBIX_PREFIX}/hosts`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error("getHosts error:", error);
    throw error;
  }
};

/**
 * POST zebbix/host-groups
 * method: hostgroup.get – returns host groups
 */
export const getHostGroups = async (params?: { output?: string[] }) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "hostgroup.get",
      params: {
        output: params?.output ?? ["groupid", "name"],
      },
      id: 1,
    };
    const response = await axiosInstance.post<
      ZebbixJsonRpcResponse<ZebbixHostGroup[]>
    >(`${ZEBBIX_PREFIX}/host-groups`, payload);
    return response.data;
  } catch (error) {
    console.error("getHostGroups error:", error);
    throw error;
  }
};

/**
 * POST zebbix/hosts/by-name
 * method: item.get – filter by host name(s)
 */
export const getItemsByHostName = async (hostNames: string[], params?: {
  output?: string[];
}) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "item.get",
      params: {
        output: params?.output ?? ["itemid", "name", "key_", "lastvalue", "units"],
        filter: { host: hostNames },
      },
      id: 11,
    };
    const response = await axiosInstance.post<
      ZebbixJsonRpcResponse<ZebbixItem[]>
    >(`${ZEBBIX_PREFIX}/hosts/by-name`, payload);
    return response.data;
  } catch (error) {
    console.error("getItemsByHostName error:", error);
    throw error;
  }
};

/**
 * POST zebbix/items/by-host-id
 * method: item.get – filter by hostid(s)
 */
export const getItemsByHostId = async (
  hostIds: string | string[],
  params?: { output?: string[]; sortfield?: string }
) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "item.get",
      params: {
        hostids: Array.isArray(hostIds) ? hostIds.join(",") : hostIds,
        output: params?.output ?? ["itemid", "name", "key_", "lastvalue", "units"],
        sortfield: params?.sortfield ?? "name",
      },
      id: 2,
    };
    const response = await axiosInstance.post<
      ZebbixJsonRpcResponse<ZebbixItem[]>
    >(`${ZEBBIX_PREFIX}/items/by-host-id`, payload);
    return response.data;
  } catch (error) {
    console.error("getItemsByHostId error:", error);
    throw error;
  }
};

/**
 * POST zebbix/items/by-host-name
 * method: item.get – filter by host name(s)
 */
export const getItemsByHostNameOnly = async (hostNames: string[], params?: {
  output?: string[];
}) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "item.get",
      params: {
        output: params?.output ?? ["itemid", "name", "key_", "lastvalue", "units"],
        filter: { host: hostNames },
      },
      id: 11,
    };
    const response = await axiosInstance.post<
      ZebbixJsonRpcResponse<ZebbixItem[]>
    >(`${ZEBBIX_PREFIX}/items/by-host-name`, payload);
    return response.data;
  } catch (error) {
    console.error("getItemsByHostNameOnly error:", error);
    throw error;
  }
};

/**
 * POST zebbix/alerts
 * method: event.get – alerts/events for a host
 */
export const getAlerts = async (
  hostIds: string | string[],
  params?: {
    output?: string[];
    selectHosts?: string[];
    value?: number;
  }
) => {
  try {
    const payload = {
      jsonrpc: "2.0",
      method: "event.get",
      params: {
        hostids: Array.isArray(hostIds) ? hostIds[0] : hostIds,
        output: params?.output ?? ["eventid", "name", "severity", "clock"],
        selectHosts: params?.selectHosts ?? ["host"],
        value: params?.value ?? 1,
      },
      id: 1,
    };
    const response = await axiosInstance.get<
      ZebbixJsonRpcResponse<ZebbixAlert[]>
    >(`${ZEBBIX_PREFIX}/alerts`, payload);
    return response.data;
  } catch (error) {
    console.error("getAlerts error:", error);
    throw error;
  }
};
