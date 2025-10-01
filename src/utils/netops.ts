import { toast } from "react-toastify";
import axiosInstance from "./axios";

// NetOps API Response Types
export interface NetOpsApiResponse<T> {
  code: number;
  message: string;
  data: {
    status_code: number;
    data: T;
    success: boolean;
  };
}

// Device Types
export interface Device {
  id: number;
  hostname: string;
  ip_address: string;
  username: string;
  password: string | null;
  protocol: 'SSH' | 'TELNET' | 'HTTP' | 'HTTPS';
  port: number;
  customer_name: string;
  device_type: 'cisco_ios' | 'cisco_ios_telnet' | 'generic' | null;
  enable_password: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DeviceListResponse {
  devices: Device[];
}

export interface ServiceListResponse {
  services: Service[];
}

// Alert Types
export interface Alert {
  id: number;
  alert_type: 'SERVICE_DOWN' | 'SERVICE_RECOVERY' | 'DEVICE_DOWN' | 'DEVICE_RECOVERY' | 'PING_TIMEOUT' | 'HOST_UNREACHABLE';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  device_id: number;
  service_id: number;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  // Additional fields from comprehensive monitoring response
  hostname?: string;
  customer_name?: string;
  service_name?: string;
}

export interface AlertListResponse {
  alerts: Alert[];
}

export interface DeviceStatusResponse {
  device_statuses: DeviceStatus[];
}

// Service Types (updated based on comprehensive monitoring response)
export interface Service {
  id: number;
  service_name: string;
  service_type: 'PING' | 'HTTP' | 'HTTPS' | 'SSH' | 'TELNET';
  api_endpoint: string | null;
  check_interval: number;
  timeout_seconds: number;
  is_active: boolean;
  status: 'UP' | 'DOWN';
  response_time: number | null;
  error_message: string | null;
  last_checked: string;
  created_at: string;
  updated_at: string;
  alert_count: number;
  alerts: Alert[];
}

export interface ServiceSummary {
  total_services: number;
  services_up: number;
  services_down: number;
}

// Device Status Types (updated based on comprehensive monitoring response)
export interface DeviceStatus {
  device_id: number;
  hostname: string;
  ip_address: string;
  customer_name: string;
  device_type: 'cisco_ios' | 'cisco_ios_telnet' | 'generic' | null;
  protocol: 'SSH' | 'TELNET' | 'HTTP' | 'HTTPS';
  port: number;
  status: 'UP' | 'DOWN';
  last_check: string;
  uptime_percentage: number;
  is_active: boolean;
  created_at: string;
  service_summary: ServiceSummary;
  services: Service[];
  alert_count: number;
  alerts: Alert[];
}

// Monitoring Types
export interface MonitoringSummary {
  total_devices: number;
  total_services: number;
  devices_up: number;
  devices_down: number;
  services_up: number;
  services_down: number;
  active_alerts: number;
  average_uptime: number;
}

export interface AlertsSummary {
  total_alerts: number;
  alerts_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ComprehensiveMonitoringResponse {
  summary: MonitoringSummary;
  devices: DeviceStatus[];
  alerts_summary: AlertsSummary;
  timestamp: string;
}

export interface MonitoringDashboardResponse {
  active_alerts: number;  
  average_uptime: number;
  devices_down: number;
  devices_up: number;
  services_down: number;
  services_up: number;
  total_devices: number;
  total_services: number;
}

export interface DeviceMonitoringStatusResponse {
  device_id: number;
  hostname: string;
  status: 'UP' | 'DOWN';
  last_check: string;
  uptime_percentage: number;
  services: Service[];
  alerts: Alert[];
}

// Helper function to extract data from controlhub response
function extractData<T>(response: NetOpsApiResponse<T>): T {
  console.log("Extracting data from response:", response);

  // Handle successful response with nested data structure
  if (response?.code === 200 && response?.data?.success) {
    console.log("Extracting from nested data structure:", response.data.data);
    return response.data.data;
  }

  // Handle direct data response (fallback)
  if (response?.data) {
    console.log("Extracting from direct data:", response.data);
    return response.data as T;
  }

  console.error("Failed to extract data from response:", response);

  throw new Error(
    response?.message || "API request failed"
  );
}

// Device Management APIs
export const getDevices = async (params: Record<string, any> = {}): Promise<Device[]> => {
  try {
    const response = await axiosInstance.get<NetOpsApiResponse<Device[]>>("/netops/devices", { params });
    console.log("Devices API response:", response.data);
    return extractData<Device[]>(response.data);
  } catch (error: any) {
    console.error("Failed to fetch devices:", error);
    toast.error(error?.message || "Failed to fetch devices");
    throw error;
  }
};

export const createDevice = async (data: Partial<Device>): Promise<Device> => {
  try {
    const response = await axiosInstance.post<NetOpsApiResponse<Device>>("/netops/devices", data);
    console.log("Create device response:", response.data);
    return extractData<Device>(response.data);
  } catch (error: any) {
    console.error("Failed to create device:", error);
    toast.error(error?.message || "Failed to create device");
    throw error;
  }
};

export const updateDevice = async (id: string | number, data: Partial<Device>): Promise<Device> => {
  try {
    const response = await axiosInstance.put<NetOpsApiResponse<Device>>(`/netops/devices/${id}`, data);
    console.log("Update device response:", response.data);
    return extractData<Device>(response.data);
  } catch (error: any) {
    console.error("Failed to update device:", error);
    toast.error(error?.message || "Failed to update device");
    throw error;
  }
};

export const deleteDevice = async (id: string | number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<NetOpsApiResponse<void>>(`/netops/devices/${id}`);
    console.log("Delete device response:", response.data);
    return extractData<void>(response.data);
  } catch (error: any) {
    console.error("Failed to delete device:", error);
    toast.error(error?.message || "Failed to delete device");
    throw error;
  }
};

// Service Management APIs
export const getServices = async (params: Record<string, any> = {}): Promise<Service[]> => {
  try {
    const response = await axiosInstance.get<NetOpsApiResponse<Service[]>>("/netops/services", { params });
    console.log("Services API response:", response.data);
    return extractData<Service[]>(response.data);
  } catch (error: any) {
    console.error("Failed to fetch services:", error);
    toast.error(error?.message || "Failed to fetch services");
    throw error;
  }
};

export const createService = async (data: Partial<Service>): Promise<Service> => {
  try {
    const response = await axiosInstance.post<NetOpsApiResponse<Service>>("/netops/services", data);
    console.log("Create service response:", response.data);
    return extractData<Service>(response.data);
  } catch (error: any) {
    console.error("Failed to create service:", error);
    toast.error(error?.message || "Failed to create service");
    throw error;
  }
};

export const updateService = async (id: string | number, data: Partial<Service>): Promise<Service> => {
  try {
    const response = await axiosInstance.put<NetOpsApiResponse<Service>>(`/netops/services/${id}`, data);
    console.log("Update service response:", response.data);
    return extractData<Service>(response.data);
  } catch (error: any) {
    console.error("Failed to update service:", error);
    toast.error(error?.message || "Failed to update service");
    throw error;
  }
};

export const deleteService = async (id: string | number): Promise<void> => {
  try {
    const response = await axiosInstance.delete<NetOpsApiResponse<void>>(`/netops/services/${id}`);
    console.log("Delete service response:", response.data);
    return extractData<void>(response.data);
  } catch (error: any) {
    console.error("Failed to delete service:", error);
    toast.error(error?.message || "Failed to delete service");
    throw error;
  }
};

// Other APIs
export const getAlerts = async (params: Record<string, any> = {}): Promise<Alert[]> => {
  try {
    const response = await axiosInstance.get<NetOpsApiResponse<Alert[]>>("/netops/alerts", { params });
    console.log("Alerts API response:", response.data);
    return extractData<Alert[]>(response.data);
  } catch (error: any) {
    console.error("Failed to fetch alerts:", error);
    toast.error(error?.message || "Failed to fetch alerts");
    throw error;
  }
};

// export const getDeviceStatus = async (deviceId: string | number): Promise<DeviceStatus[]> => {
//   try {
//     const response = await axiosInstance.get<NetOpsApiResponse<DeviceStatus[]>>(`/netops/device-status/${deviceId}`);
//     console.log("Device status API response:", response.data);
//     return extractData<DeviceStatus[]>(response.data);
//   } catch (error: any) {
//     console.error("Failed to fetch device status:", error);
//     toast.error(error?.message || "Failed to fetch device status");
//     throw error;
//   }
// };

// Monitoring APIs
export const getComprehensiveMonitoring = async (params: Record<string, any> = {}): Promise<ComprehensiveMonitoringResponse> => {
  try {
    const response = await axiosInstance.get<NetOpsApiResponse<ComprehensiveMonitoringResponse>>("/netops/monitoring/comprehensive", { params });
    console.log("Comprehensive monitoring API response:", response.data);
    return extractData<ComprehensiveMonitoringResponse>(response.data);
  } catch (error: any) {
    console.error("Failed to fetch comprehensive monitoring:", error);
    toast.error(error?.message || "Failed to fetch comprehensive monitoring");
    throw error;
  }
};

export const getMonitoringDashboard = async (params: Record<string, any> = {}): Promise<MonitoringDashboardResponse> => {
  try {
    const response = await axiosInstance.get<NetOpsApiResponse<MonitoringDashboardResponse>>("/netops/monitoring/dashboard", { params });
    console.log("Monitoring dashboard API response:", response.data);
    return extractData<MonitoringDashboardResponse>(response.data);
  } catch (error: any) {
    console.error("Failed to fetch monitoring dashboard:", error);
    toast.error(error?.message || "Failed to fetch monitoring dashboard");
    throw error;
  }
};

export const getDeviceMonitoringStatus = async (deviceId: string | number, params: Record<string, any> = {}): Promise<DeviceMonitoringStatusResponse> => {
  try {
    const response = await axiosInstance.get<NetOpsApiResponse<DeviceMonitoringStatusResponse>>(`/netops/monitoring/devices/${deviceId}/status`, { params });
    console.log("Device monitoring status API response:", response.data);
    return extractData<DeviceMonitoringStatusResponse>(response.data);
  } catch (error: any) {
    console.error("Failed to fetch device monitoring status:", error);
    toast.error(error?.message || "Failed to fetch device monitoring status");
    throw error;
  }
};

// Test result types
export interface TestResult {
  success: boolean;
  data: any;
  error: string | null;
}

export interface TestResults {
  [key: string]: TestResult;
}

// Utility function to test all GET endpoints
export const testAllGetEndpoints = async (): Promise<TestResults> => {
  const results: TestResults = {};
  
  try {
    console.log("=== Testing NetOps GET Endpoints ===");
    
    // Test all GET endpoints
    const endpoints = [
      { name: 'devices', fn: () => getDevices() },
      { name: 'services', fn: () => getServices() },
      { name: 'alerts', fn: () => getAlerts() },
      { name: 'device-status', fn: () => getDeviceMonitoringStatus(23) },
      { name: 'comprehensive-monitoring', fn: () => getComprehensiveMonitoring() },
      { name: 'monitoring-dashboard', fn: () => getMonitoringDashboard() },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.name}...`);
        const data = await endpoint.fn();
        results[endpoint.name] = {
          success: true,
          data: data,
          error: null
        };
        console.log(`✅ ${endpoint.name} - Success:`, data);
      } catch (error: any) {
        results[endpoint.name] = {
          success: false,
          data: null,
          error: error.message || 'Unknown error'
        };
        console.error(`❌ ${endpoint.name} - Error:`, error.message);
      }
    }

    // Test device monitoring status with a sample device ID
    try {
      console.log("Testing device monitoring status with sample device ID...");
      const deviceMonitoringData = await getDeviceMonitoringStatus(23);
      results['device-monitoring-status'] = {
        success: true,
        data: deviceMonitoringData,
        error: null
      };
      console.log("✅ device-monitoring-status - Success:", deviceMonitoringData);
    } catch (error: any) {
      results['device-monitoring-status'] = {
        success: false,
        data: null,
        error: error.message || 'Unknown error'
      };
      console.error("❌ device-monitoring-status - Error:", error.message);
    }

    console.log("=== NetOps API Test Results ===", results);
    return results;
    
  } catch (error: any) {
    console.error("Failed to test NetOps endpoints:", error);
    toast.error("Failed to test NetOps endpoints");
    throw error;
  }
};
