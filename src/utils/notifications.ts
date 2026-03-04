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
}

export const ListNotifications = async (params: PaginationParams = {}) => {
  try {
    const { page = 1, perPage = 15, search = "", draw = 1, filters = {}, isExport = false, exportType = '' } = params;

    const response = await axiosInstance.get(`/notifications`, {
      params: {
        page,
        perPage,
        search,
        draw,
        ...filters,
        isExport,
        exportType,
      },
    });

    return response?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const MarkNotificationAsRead = async (id: string) => {
  try {
    const response = await axiosInstance.put(`/notifications/mark-as-read/${id}`);
    return response?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const DeleteNotification = async (id: string) => {
  try {
    const response = await axiosInstance.delete(`/notifications/delete-notification/${id}`);
    return response?.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
