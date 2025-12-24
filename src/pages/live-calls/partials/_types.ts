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

