export interface CtiDevice {
  dn: string
  deviceName: string
  status: string
  terminalState: string
  deviceType: string
}

export interface DnData {
  dn: string
  devices: Record<string, CtiDevice>
}

export interface NotificationState {
  type: string
  message: string
}

export interface ActiveMonitoring {
  dn: string | null
  type: string | null
  monitor?: string
  deviceName?: string | null
}

/** After stop-monitoring, ignore stale supervisor↔agent legs briefly so cards return to idle. */
export interface MonitoringTeardownHint {
  monitorDn?: string
  monitoredDn: string
}

export interface ShowPopup {
  dn: string
  deviceName: string
}

export interface PendingMonitoringData {
  dn: string
  monitorType: string
  toneType: string
  monitoredDeviceName: string
  monitoredDeviceType: string
}

export interface AvailableDevice {
  deviceName: string
  deviceType: string
  terminalState: string
  when: string
  details: string
}

/** Inputs for wallboard {@link categorizeDns} (see helpers.ts). */
export interface CategorizeDnsParams {
  dn: string
  devices: CtiDevice[]
  call: unknown
  active: boolean
  activeMonitoring: ActiveMonitoring
  getCallStateForDevice: (dn: string, deviceName: string) => unknown
  getCallStatesForDn: (dn: string) => unknown[]
  userAddress?: string | null
  monitoringTeardown?: MonitoringTeardownHint | null
  /** True while SSE/log says supervision is still active for this pair. */
  supervisionSessionActive?: boolean
}

