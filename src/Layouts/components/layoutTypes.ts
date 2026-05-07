/** Device row from CTI dnsMap (before dialer normalization). */
export interface CtiDnsDevice {
  deviceName?: string;
  deviceType?: string;
  terminalState?: string;
}

/** Active call entry from CTI `activeCalls` map (see `CtiContext`). */
export interface CtiActiveCallEntry {
  id: string;
  number: string;
  startTime: Date;
  status: string;
  callId?: string;
  callingAddress?: string;
  calledAddress?: string;
  callingDeviceName?: string;
  callingDeviceType?: string;
  duration?: number;
}

/** Normalized device list from `getAllUserDevices` (see `src/utils/dialer.ts`). */
export interface CtiDialerDevice {
  deviceName: string;
  deviceType: string;
  terminalState: string;
  when: string;
  details: string;
}

export interface SearchableRouteItem {
  path: string;
  label: string;
}

export type DnsMapLike = Record<
  string,
  { devices?: Record<string, CtiDnsDevice> }
> | null | undefined;
