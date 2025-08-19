import { toast } from "react-toastify";
import axiosInstance from "./axios";


interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  draw?: number;
  filters?: any;
  isExport?: boolean;
  exportType?: string;
  reportType?: string;
}

export const ListCallLogs = async (params: PaginationParams = {}, endpoint: string) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '', reportType = '' } = params;
    
    // Create base query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      search: search,
      draw: draw.toString(),
      isExport: isExport.toString(),
      exportType: exportType,
      reportType: reportType
    });
    
    // Flatten filters and add each key-value pair as separate query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays by converting them to JSON strings for proper format
        if (Array.isArray(value)) {
          queryParams.append(key, JSON.stringify(value));
        }
        // Handle objects by converting them to JSON strings
        else if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    if(isExport === true){
      const response = await axiosInstance.get(`${endpoint}?${queryParams.toString()}`, {
        responseType: 'blob',
        headers: {
          'Accept': exportType === 'xlsx' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream, */*'
            : 'audio/*, application/octet-stream, */*'
        }
      });

      return response.data;
    } else {
      const response = await axiosInstance.get(`${endpoint}?${queryParams.toString()}`);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

export const ExportCallLogs = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = true, exportType = 'csv' } = params;
    
    // Create base query parameters
    const queryParams = new URLSearchParams({
      search: search.toString(),
      isExport: 'true',      
      exportType: exportType.toString()
    });
    
    // Flatten filters and add each key-value pair as separate query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays by joining with commas (avoid JSON encoding issues)
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        }
        // Handle objects by converting them to JSON strings
        else if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const exportUrl = `${baseUrl}call-logs/export?${queryParams.toString()}`;
    
    window.open(exportUrl, '_blank');
    
    toast.success(`${exportType.toUpperCase()} export started`);
    
    return { success: true };
  } catch (error) {
    console.error('Export Error:', error);
    toast.error('Export failed');
    throw error;
  }
};

export const DownloadCallRecording = async (id: string, endpoint: string) => {

  try {
    //window.open(`${endpoint}/${id}`, '_blank');
    const response = await axiosInstance.get(`${endpoint}/${id}`, {
      responseType: 'blob'
    });

    if (response.status === 204) {
      toast.error('Audio file not found');
      return;
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recording_${id}.mp3`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return url;
  } catch (error) {
    throw error;
  }
};

export const DownloadStreamingExport = async (params: PaginationParams = {}, endpoint: string) => {
  const {  search = "", filters = {}, isExport = true, exportType = 'excel' } = params;
  
  try {
    // Create base query parameters
    const queryParams = new URLSearchParams({
      search: search,
      isExport: isExport.toString(),
      exportType: exportType,
      reportType: 'recordings'
    });
    
    // Flatten filters and add each key-value pair as separate query parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle arrays by joining with commas (avoid JSON encoding issues)
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        }
        // Handle objects by converting them to JSON strings
        else if (typeof value === 'object') {
          queryParams.append(key, JSON.stringify(value));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    // Set appropriate headers based on export type
    const headers = {
      'Accept': exportType === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream, */*'
        : 'application/pdf, application/octet-stream, */*'
    };

    const response = await axiosInstance.get(`${endpoint}?${queryParams.toString()}`, {
      responseType: 'blob',
      headers
    });

    console.log(response);

    if (response.status === 204) {
      toast.error('No data found for export');
      return;
    }

    // Create blob with appropriate type based on export format
    const blobType = exportType === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf';
    
    const blob = new Blob([response.data], { type: blobType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with timestamp and appropriate extension
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileExtension = exportType === 'excel' ? 'csv' : 'pdf';
    link.setAttribute('download', `call_recordings_${timestamp}.${fileExtension}`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    toast.success(`${exportType.toUpperCase()} file downloaded successfully`);
    return url;
  } catch (error) {
    console.error(`${exportType.toUpperCase()} Download Error:`, error);
    toast.error(`${exportType.toUpperCase()} download failed`);
    throw error;
  }
};