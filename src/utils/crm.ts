import { toast } from "react-toastify";
import axiosInstance from "./axios";
import { ModuleSlug } from "./Helper";

// API Response Structure from Controlhub
interface ControlhubResponse<T> {
  code: number;
  message: string;
  data: {
    success: boolean;
    data: T;
  };
}

// Pagination wrapper
interface PaginationWrapper<T> {
  data: T[];
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

// Base interfaces matching myapp models exactly
export interface StageData {
  id: number;
  name: string;
  sequence: number;
  is_won: boolean;
  requirements: string | null;
  fold: boolean;
  color: string;
  description: string | null;
  is_default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: "lead" | "lost_reason" | "deal" | "order";
  probability: number;
}

export interface LostReasonData {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  color: string;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingData {
  id?: number;
  name: string;
  meeting_type: string;
  meeting_date: string;
  meeting_time: string;
  meeting_outcome?: string;
  lead_id?: string | number;
  deal_id?: string | number;
  extensions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface LeadData {
  id: number;
  name: string;
  user_extension: string | null;
  type: "lead" | "opportunity";
  description: string | null;
  company_name: string | null;
  company_contact: string | null;
  company_description: string | null;
  status: string;
  stage_id: number | null;
  lost_reason_id: number | null;
  lost_feedback: string | null;
  is_lost: boolean;
  created_at: string;
  updated_at: string;
  stage?: StageData;
  lost_reason?: LostReasonData;
  meetings?: MeetingData[];
  audit_trail?: Array<{
    id: number;
    event: string;
    description: string;
    changes: {
      [key: string]: {
        old: any;
        new: any;
      };
    };
    user_extension: string;
    created_at: string;
    created_at_human: string;
  }>;
  campaign_id: number | null;
  campaign_field_values: Record<string, any> | null;
  crm_data_id: number | null;
}

export interface OpportunityData extends LeadData {
  type: "opportunity";
}

export interface PaginationParams extends Record<string, any> {
  page?: number;
  per_page?: number;
  search?: string;
  module_slug?: string;
}

// CRM Dashboard Data
export interface DashboardData {
  stats: {
    leads: {
      total: number;
      active: number;
      lost: number;
      this_month: number;
    };
    deals: {
      total: number;
      active: number;
      lost: number;
      this_month: number;
    };
    orders: {
      total: number;
      this_month: number;
    };
  };
  monthly_data: Array<{
    month: string;
    month_label: string;
    leads: number | string;
    deals: number | string;
    orders: number | string;
  }>;
  stage_distribution: {
    leads: Array<{
      stage_id: number;
      stage_name: string;
      color: string;
      count: number;
    }>;
    deals: Array<{
      stage_id: number;
      stage_name: string;
      color: string;
      count: number;
    }>;
    orders: Array<{
      stage_id: number;
      stage_name: string;
      color: string;
      count: number;
    }>;
  };
  conversion_stats: {
    last_30_days: {
      leads: number;
      deals: number;
      leads_to_deals_percentage: number;
      orders: number;
      deals_to_orders_percentage: number;
    };
  };
}

// Helper function to extract data from controlhub response
function extractData<T>(response: any): T {
  //console.log("Extracting data from response:", response);

  // Handle successful response with nested data structure
  if (response?.code === 200 && response?.data?.success) {
    console.log("Extracting from nested data structure:", response.data.data);
    return response.data.data;
  }

  // Handle direct data response (fallback)
  if (response?.data) {
    console.log("Extracting from direct data:", response.data);
    return response.data;
  }

  console.error("Failed to extract data from response:", response);

  throw new Error(
    response?.data?.message || response?.message || "API request failed"
  );
}

// CRM Dashboard - construct from available APIs
export const getCrmDashboard = async () => {
  try {
    const response = await axiosInstance.get("/crm/dashboard");
    return extractData(response);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch dashboard data");
    throw error;
  }
};

export const getCrmDashboardOverview = async () => {
  try {
    const response = await axiosInstance.get("/crm/dashboard/overview");
    if(response && response?.data && response?.data?.code === 200 && response?.data?.data?.success === true){
      return response?.data?.data?.data;
    } 
    
  } catch (error: any) {
    throw error;
  }
};

// Lead Management
export const getLeads = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<LeadData>> => {
  try {
    const response = await axiosInstance.get("/crm/leads", { params });
    return extractData<PaginationWrapper<LeadData>>(response);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch leads");
    throw error;
  }
};

export const createLead = async (
  data: Partial<LeadData>
): Promise<LeadData> => {
  try {
    const response = await axiosInstance.post("/crm/create-lead", data);
    return extractData<LeadData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create lead");
    throw error;
  }
};

export const updateLead = async (
  id: number,
  data: Partial<LeadData>
): Promise<LeadData> => {
  try {
    const response = await axiosInstance.put(`/crm/update-lead`, {
      ...data,
      id,
    });
    return extractData<LeadData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update lead");
    throw error;
  }
};

export const deleteLead = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/leads/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete lead");
    throw error;
  }
};

export const restoreLead = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/crm/leads/${id}/restore`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to restore lead");
    throw error;
  }
};

export const getLead = async (id: number): Promise<LeadData> => {
  try {
    const response = await axiosInstance.get(`/crm/leads/${id}`);
    return extractData<LeadData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lead");
    throw error;
  }
};

export const convertLead = async (id: number): Promise<LeadData> => {
  try {
    const response = await axiosInstance.post(`/crm/convert-lead`, {
      lead_id: id,
    });
    return extractData<LeadData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to convert lead");
    throw error;
  }
};

export const markLeadLost = async (
  id: number,
  data: { lost_reason_id: number; lost_feedback?: string }
): Promise<LeadData> => {
  try {
    const response = await axiosInstance.post(`/crm/mark-lead-lost`, {
      lead_id: id,
      ...data,
    });
    return extractData<LeadData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to mark lead as lost");
    throw error;
  }
};
export const markDealLost = async (
  id: number,
  data: { lost_reason_id: number; lost_feedback?: string }
): Promise<LeadData> => {
  try {
    const response = await axiosInstance.post(`/crm/mark-deal-lost`, {
      deal_id: id,
      ...data,
    });
    return extractData<LeadData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to mark deal as lost");
    throw error;
  }
};
export const markOrderLost = async (
  id: number,
  data: { lost_reason_id: number; lost_feedback?: string }
): Promise<LeadData> => {
  try {
    const response = await axiosInstance.post(`/crm/mark-order-lost`, {
      order_id: id,
      ...data,
    });
    return extractData<LeadData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to mark order as lost");
    throw error;
  }
};

export const getLeadsByStage = async (
  stageId: number,
  params: PaginationParams = {}
): Promise<PaginationWrapper<LeadData>> => {
  try {
    const response = await axiosInstance.get(`/crm/leads/by-stage/${stageId}`, {
      params,
    });
    return extractData<PaginationWrapper<LeadData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch leads by stage");
    throw error;
  }
};

export const getLeadsByType = async (
  type: "lead" | "opportunity",
  params: PaginationParams = {}
): Promise<PaginationWrapper<LeadData>> => {
  try {
    const response = await axiosInstance.get(`/crm/leads/by-type/${type}`, {
      params,
    });
    return extractData<PaginationWrapper<LeadData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch leads by type");
    throw error;
  }
};

// Comments
export const addComment = async (
  leadId: number,
  data: { comment: string }
): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `/crm/leads/${leadId}/comments`,
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to add comment");
    throw error;
  }
};

export const getComments = async (leadId: number): Promise<any[]> => {
  try {
    const response = await axiosInstance.get(`/crm/leads/${leadId}/comments`);
    return extractData<any[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch comments");
    throw error;
  }
};

export const addAssigneeComment = async (
  leadId: number,
  data: { comment: string }
): Promise<any> => {
  try {
    const response = await axiosInstance.post(
      `/crm/leads/${leadId}/assignee-comments`,
      data
    );
    return extractData<any>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to add assignee comment");
    throw error;
  }
};

export const getAssigneeComments = async (leadId: number): Promise<any[]> => {
  try {
    const response = await axiosInstance.get(
      `/crm/leads/${leadId}/assignee-comments`
    );
    return extractData<any[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch assignee comments");
    throw error;
  }
};

// Stage Management
export const getStages = async (
  type?: "lead" | "lost_reason" | "deal" | "order",
  params?: { include_archived?: boolean }
): Promise<StageData[]> => {
  try {
    console.log("getStages: Making API call to /crm/stages");
    const requestParams: any = type ? { type } : {};
    if (params?.include_archived) {
      requestParams.include_archived = true;
    }
    const response = await axiosInstance.get("/crm/stages", {
      params: requestParams,
    });
    console.log("getStages: Raw axios response:", response);
    console.log("getStages: Response data:", response.data);

    const extractedData = extractData<StageData[]>(response.data);
    console.log("getStages: Extracted data:", extractedData);
    return extractedData;
  } catch (error: any) {
    console.error("getStages: Error occurred:", error);
    console.error("getStages: Error response:", error.response);
    toast.error(error?.message || "Failed to fetch stages");
    throw error;
  }
};

export const createStage = async (
  data: Partial<StageData>
): Promise<StageData> => {
  try {
    const response = await axiosInstance.post("/crm/create-stage", data);
    return extractData<StageData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create stage");
    throw error;
  }
};

export const updateStage = async (
  id: number,
  data: Partial<StageData>
): Promise<StageData> => {
  try {
    const response = await axiosInstance.put(`/crm/update-stage`, {
      ...data,
      id,
    });
    return extractData<StageData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update stage");
    throw error;
  }
};

export const deleteStage = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/stages/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete stage");
    throw error;
  }
};

export const restoreStage = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/crm/stages/${id}/restore`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to restore stage");
    throw error;
  }
};

// Lost Reasons Management
export const getLostReasons = async (): Promise<LostReasonData[]> => {
  try {
    const response = await axiosInstance.get("/crm/lost-reasons");
    return extractData<LostReasonData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lost reasons");
    throw error;
  }
};

export const createLostReason = async (
  data: Partial<LostReasonData>
): Promise<LostReasonData> => {
  try {
    const response = await axiosInstance.post("/crm/create-lost-reason", data);
    return extractData<LostReasonData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create lost reason");
    throw error;
  }
};

export const updateLostReason = async (
  id: number,
  data: Partial<LostReasonData>
): Promise<LostReasonData> => {
  try {
    const response = await axiosInstance.put(`/crm/update-lost-reason`, {
      ...data,
      id,
    });
    return extractData<LostReasonData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update lost reason");
    throw error;
  }
};

export const deleteLostReason = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/lost-reasons/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete lost reason");
    throw error;
  }
};

export const getLostLeads = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<LeadData>> => {
  try {
    const response = await axiosInstance.get("/crm/lost-leads", { params });
    return extractData<PaginationWrapper<LeadData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lost leads");
    throw error;
  }
};

// Meeting Management
export const getMeetings = async (
  params: { lead_id?: number; extension?: string; per_page?: number } = {}
): Promise<{
  data: MeetingData[];
}> => {
  try {
    const response = await axiosInstance.get("/crm/meetings", { params });
    return extractData<{ data: MeetingData[] }>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch meetings");
    throw error;
  }
};

export const getMeeting = async (id: number): Promise<MeetingData> => {
  try {
    const response = await axiosInstance.get(`/crm/meetings/${id}`);
    return extractData<MeetingData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch meeting");
    throw error;
  }
};

export const getMeetingsByExtension = async (
  extension: string
): Promise<MeetingData[]> => {
  try {
    const response = await axiosInstance.get("/crm/meetings/by-extension", {
      params: { extension },
    });
    return extractData<MeetingData[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch meetings by extension");
    throw error;
  }
};

// Opportunity Management
export const getOpportunities = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<OpportunityData>> => {
  try {
    params.module_slug = ModuleSlug.CRM_OPPORTUNITIES;
    const response = await axiosInstance.get("/crm/opportunities", { params });
    return extractData<PaginationWrapper<OpportunityData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch opportunities");
    throw error;
  }
};

export const createOpportunity = async (
  data: Partial<OpportunityData>
): Promise<OpportunityData> => {
  try {
    const response = await axiosInstance.post("/crm/opportunities", data);
    return extractData<OpportunityData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create opportunity");
    throw error;
  }
};

export const getOpportunity = async (id: number): Promise<OpportunityData> => {
  try {
    const response = await axiosInstance.get(`/crm/opportunities/${id}`);
    return extractData<OpportunityData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch opportunity");
    throw error;
  }
};

export const updateOpportunity = async (
  id: number,
  data: Partial<OpportunityData>
): Promise<OpportunityData> => {
  try {
    const response = await axiosInstance.put(`/crm/opportunities/${id}`, data);
    return extractData<OpportunityData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update opportunity");
    throw error;
  }
};

export const deleteOpportunity = async (id: number): Promise<void> => {
  try {
    return await axiosInstance.delete(`/crm/opportunities/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete opportunity");
    throw error;
  }
};

// CRM Data Management
export interface CrmDataItem {
  id: number;
  phone: string | null;
  name: string | null;
  data: Record<string, any>;
  user_extension: string | null;
  is_viewed: boolean;
  campaign_id: number | null;
  created_at: string;
  updated_at: string;
  scheduled_call_at?: string | null;
  note?: string | null;
}

export interface CrmDataPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface CrmDataMetrics {
  assigned_records: number;
  unassigned_records: number;
  scheduled_records: number;
  not_scheduled_records: number;
  scheduled_next_hour_records: number;
  scheduled_next_24_hours_records: number;
}
export interface CrmDataResponse {
  success: boolean;
  data: CrmDataItem[];
  pagination: CrmDataPagination;
  metrics: CrmDataMetrics;
}

export interface CrmDataApiResponse {
  code: number;
  message: string;
  data: CrmDataResponse;
}

export interface CrmDataUploadResponse {
  success: boolean;
  message: string;
  processed_count: number;
  errors: string[];
}

export const getCrmData = async (
  params: PaginationParams = {}
): Promise<CrmDataResponse> => {
  try {
    params.module_slug = ModuleSlug.CRM_DATA_MANAGEMENT;
    const response = await axiosInstance.get("/crm/crm-data", { params });
    return response.data?.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to fetch CRM data");
    throw error;
  }
};

export const getCrmDataById = async (id: number): Promise<CrmDataItem> => {
  try {
    const response = await axiosInstance.get(`/crm/crm-data/${id}`);
    return response.data?.data?.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to fetch CRM data record"
    );
    throw error;
  }
};

export const uploadCrmDataCsv = async (
  file: File,
  campaignIds: string[] = [],
  fieldTags: string[] = [],
  assignToCampaignUsers: boolean = false
): Promise<CrmDataUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append("csv_file", file);

    // Add campaign_ids as an array
    if (campaignIds.length > 0) {
      campaignIds.forEach((campaignId, index) => {
        formData.append(`campaign_ids[${index}]`, campaignId);
      });
    }

    // Add tags as an array (matching Laravel controller)
    if (fieldTags.length > 0) {
      fieldTags.forEach((tag, index) => {
        formData.append(`tags[${index}]`, tag);
      });
    }

    // Add should_assign flag (matching Laravel controller)
    formData.append("should_assign", assignToCampaignUsers.toString());

    // Add chunk_size for better performance
    formData.append("chunk_size", "1000");

    const response = await axiosInstance.post(
      "/crm/crm-data/upload-csv",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to upload CSV file");
    throw error;
  }
};

export const deleteCrmData = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/crm-data/${id}`);
    toast.success("CRM data deleted successfully");
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to delete CRM data");
    throw error;
  }
};

export const assignCrmDataToExtension = async (
  userExtensions: string[],
  itemIds: number[],
  mode: "auto" | "custom" = "auto",
  customData?: Record<string, number>
): Promise<void> => {
  try {
    const payload: any = {
      user_extensions: userExtensions,
      item_ids: itemIds,
      mode: mode,
    };

    if (mode === "custom" && customData) {
      payload.custom_data = customData;
    }

    await axiosInstance.post("/crm/crm_data/assign", payload);

    const extensionNames = userExtensions.join(", ");
    toast.success(
      `Successfully assigned ${itemIds.length} items to ${extensionNames}`
    );
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to assign CRM data");
    throw error;
  }
};

// New advanced assignment function matching Laravel controller
export const assignCrmDataAdvanced = async (
  campaignIds: number[],
  count: number,
  campaignFilterIds: number[] = [],
  tagIds: number[] = [],
  distributionMode: "equal" | "custom" = "equal",
  campaignDistribution?: Record<number, number>
): Promise<{
  success: boolean;
  message: string;
  assigned_count: number;
  total_filtered: number;
  distribution: Array<{
    campaign_id: number;
    user_count: number;
  }>;
}> => {
  try {
    const payload: any = {
      campaign_ids: campaignIds,
      count: count,
      distribution_mode: distributionMode,
    };

    // Add optional parameters if provided
    if (campaignFilterIds.length > 0) {
      payload.campaign_filter_ids = campaignFilterIds;
    }

    if (tagIds.length > 0) {
      payload.tag_ids = tagIds;
    }

    // Add campaign distribution for custom mode
    if (distributionMode === "custom" && campaignDistribution) {
      payload.campaign_distribution = campaignDistribution;
    }

    const response = await axiosInstance.post("/crm/crm_data/assign", payload);

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to assign CRM data");
    throw error;
  }
};

// Get CRM data counts by campaigns and tags
export const getCrmDataCounts = async (
  campaignIds: number[] = [],
  tags: string[] = []
): Promise<{
  summary: {
    total_records: number;
    assigned_records: number;
    unassigned_records: number;
  };
  scheduled_calls: {
    total_scheduled: number;
    not_scheduled: number;
    next_hour: number;
    next_24_hours: number;
    overdue: number;
  };
  filters: {
    campaign_ids: number[];
    tags: string[];
  };
}> => {
  try {
    const payload = {
      campaign_ids: campaignIds,
      tags: tags,
    };

    const response = await axiosInstance.post("/crm/crm-data/counts", payload);
    return response.data.data?.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to get CRM data counts"
    );
    throw error;
  }
};

// Bulk delete CRM data
export const bulkDeleteCrmData = async (
  ids: number[]
): Promise<{
  success: boolean;
  message: string;
  deleted_count: number;
}> => {
  try {
    const response = await axiosInstance.post("/crm/crm-data/bulk/delete", {
      ids: ids,
    });

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to delete CRM data");
    throw error;
  }
};

// Tag management functions
export const getCrmDataTags = async (): Promise<
  Array<{
    id: number;
    name: string;
    color?: string;
    description?: string;
    created_at: string;
    updated_at: string;
  }>
> => {
  try {
    const response = await axiosInstance.get("/crm/crm-data/tags");
    return response.data.data?.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to get tags");
    throw error;
  }
};

export const createCrmDataTag = async (data: {
  name: string;
  color?: string;
  description?: string;
}): Promise<{
  id: number;
  name: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}> => {
  try {
    const response = await axiosInstance.post("/crm/crm-data/tags", data);

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to create tag");
    throw error;
  }
};

export const updateCrmDataTag = async (
  id: number,
  data: {
    name: string;
    color?: string;
    description?: string;
  }
): Promise<{
  id: number;
  name: string;
  color?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}> => {
  try {
    const response = await axiosInstance.put(`/crm/crm-data/tags/${id}`, data);

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to update tag");
    throw error;
  }
};

export const deleteCrmDataTag = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/crm-data/tags/${id}`);
    toast.success("Tag deleted successfully");
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to delete tag");
    throw error;
  }
};

export const assignTagsToCrmData = async (
  crmDataIds: number[],
  tagIds: number[]
): Promise<void> => {
  try {
    await axiosInstance.post("/crm/crm-data/tags/assign", {
      crm_data_ids: crmDataIds,
      tag_ids: tagIds,
    });
    toast.success("Tags assigned successfully");
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to assign tags");
    throw error;
  }
};

export const removeTagsFromCrmData = async (
  crmDataIds: number[],
  tagIds: number[]
): Promise<void> => {
  try {
    await axiosInstance.post("/crm/crm-data/tags/remove", {
      crm_data_ids: crmDataIds,
      tag_ids: tagIds,
    });
    toast.success("Tags removed successfully");
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to remove tags");
    throw error;
  }
};

export const markCrmDataAsViewed = async (itemId: number): Promise<void> => {
  try {
    await axiosInstance.post("/crm/crm_data/mark-as-viewed", {
      item_id: itemId,
    });
    toast.success("Item marked as viewed");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to mark item as viewed"
    );
    throw error;
  }
};

// Campaign Management
export interface CampaignField {
  id?: number;
  campaign_id?: number;
  field_name: string;
  field_type: "string" | "text" | "integer" | "date" | "email" | "dropdown";
  field_options?: string[];
  options?: Array<string | { value?: string; label?: string }>;
  sort_order?: number;
  is_required?: boolean;
}

export interface CampaignData {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
  options: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  fields?: CampaignField[];
  user_extensions?: {
    id: number;
    campaign_id: number;
    user_extension: string;
    created_at: string;
    updated_at: string;
  }[];
}

export interface CampaignMetrics {
  active_campaigns: number;
  inactive_campaigns: number;
}

export const getCampaigns = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<CampaignData> & { metrics: CampaignMetrics }> => {
  try {
    const {
      page = 1,
      per_page = 15,
      search = "",
      filters = {},
      module_slug = "",
    } = params;

    // Build query parameters
    const queryParams: any = {
      page,
      per_page,
      module_slug: ModuleSlug.CRM_CAMPAIGNS,
      ...filters,
    };

    // Add search if provided
    if (search) {
      queryParams.search = search;
    }

    const response = await axiosInstance.get("/crm/campaigns", {
      params: queryParams,
    });
    response.data.data.data.metrics = response.data?.data?.metrics;
    return extractData<
      PaginationWrapper<CampaignData> & { metrics: CampaignMetrics }
    >(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch campaigns");
    throw error;
  }
};

export const getCampaignById = async (id: number): Promise<CampaignData> => {
  try {
    const response = await axiosInstance.get(`/crm/campaigns/${id}`);
    return extractData<CampaignData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch campaign");
    throw error;
  }
};

export const createCampaign = async (
  data: Partial<CampaignData> & { fields?: CampaignField[] }
): Promise<CampaignData> => {
  try {
    const response = await axiosInstance.post("/crm/campaigns", data);
    return extractData<CampaignData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create campaign");
    throw error;
  }
};

export const getCampaign = async (id: number): Promise<CampaignData> => {
  try {
    const response = await axiosInstance.get(`/crm/campaigns/${id}`);
    return extractData<CampaignData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch campaign");
    throw error;
  }
};

export const updateCampaign = async (
  id: number,
  data: Partial<CampaignData> & { fields?: CampaignField[] }
): Promise<CampaignData> => {
  try {
    const response = await axiosInstance.put(`/crm/campaigns/${id}`, data);
    return extractData<CampaignData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update campaign");
    throw error;
  }
};

export const deleteCampaign = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/campaigns/${id}`);
    // toast.success("Campaign deleted successfully");
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete campaign");
    throw error;
  }
};

export const getCampaignFields = async (
  id: number
): Promise<CampaignField[]> => {
  try {
    const response = await axiosInstance.get(`/crm/campaigns/${id}/fields`);
    return extractData<CampaignField[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch campaign fields");
    throw error;
  }
};

export const createCampaignField = async (
  campaignId: number,
  data: Partial<CampaignField>
): Promise<CampaignField> => {
  try {
    const response = await axiosInstance.post(
      `/crm/campaigns/${campaignId}/fields`,
      data
    );
    return extractData<CampaignField>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create campaign field");
    throw error;
  }
};

// Schedule a call for a CRM data record
export const scheduleCall = async (
  crmDataId: number,
  scheduledCallAt: string,
  userExtension: string,
  notes?: string
): Promise<{
  success: boolean;
  message: string;
  data: any;
}> => {
  try {
    const response = await axiosInstance.post(
      `/crm/crm-data/${crmDataId}/schedule-call`,
      {
        scheduled_call_at: scheduledCallAt,
        user_extension: userExtension,
        note: notes,
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to schedule call");
    throw error;
  }
};

// Update scheduled call time
export const updateScheduledCall = async (
  crmDataId: number,
  scheduledCallAt: string,
  userExtension: string
): Promise<{
  success: boolean;
  message: string;
  data: any;
}> => {
  try {
    const response = await axiosInstance.put(
      `/crm/crm-data/${crmDataId}/schedule-call`,
      {
        scheduled_call_at: scheduledCallAt,
        user_extension: userExtension,
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to update scheduled call"
    );
    throw error;
  }
};

// Cancel scheduled call
export const cancelScheduledCall = async (
  crmDataId: number,
  userExtension: string
): Promise<{
  success: boolean;
  message: string;
  data: any;
}> => {
  try {
    const response = await axiosInstance.delete(
      `/crm/crm-data/${crmDataId}/schedule-call`,
      {
        data: { user_extension: userExtension },
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || "Failed to cancel scheduled call"
    );
    throw error;
  }
};

// Unschedule a call
export const unscheduleCall = async (
  crmDataId: number,
  userExtension: string
): Promise<{
  success: boolean;
  message: string;
  data: any;
}> => {
  try {
    const response = await axiosInstance.post(
      `/crm/crm-data/${crmDataId}/unschedule-call`,
      {
        user_extension: userExtension,
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to unschedule call");
    throw error;
  }
};

// Bulk schedule calls
export const bulkScheduleCalls = async (
  crmDataIds: number[],
  scheduledCallAt: string,
  userExtension: string
): Promise<{
  success: boolean;
  message: string;
  scheduled_count: number;
}> => {
  try {
    const response = await axiosInstance.post(
      "/crm/crm-data/bulk-schedule-calls",
      {
        crm_data_ids: crmDataIds,
        scheduled_call_at: scheduledCallAt,
        user_extension: userExtension,
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to schedule calls");
    throw error;
  }
};

// Bulk unschedule calls
export const bulkUnscheduleCalls = async (
  crmDataIds: number[],
  userExtension: string
): Promise<{
  success: boolean;
  message: string;
  unscheduled_count: number;
}> => {
  try {
    const response = await axiosInstance.post(
      "/crm/crm-data/bulk-unschedule-calls",
      {
        crm_data_ids: crmDataIds,
        user_extension: userExtension,
      }
    );

    if (response.data.success) {
      toast.success(response.data.message);
    }

    return response.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to unschedule calls");
    throw error;
  }
};

// Get CRM data history
export const getCrmDataHistory = async (
  page: number = 1,
  perPage: number = 15,
  filters: {
    user_id?: number;
    user_extensions?: string[];
    action?: string;
    date_from?: string;
    date_to?: string;
  } = {}
): Promise<{
  data: any[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}> => {
  try {
    const params: any = {
      page,
      per_page: perPage,
      ...filters,
    };

    const response = await axiosInstance.get("/crm/crm-data/history", {
      params,
    });

    return {
      data: response.data.data?.data,
      pagination: response.data?.data?.pagination,
    };
  } catch (error: any) {
    console.error("Failed to get CRM data history:", error);
    throw error;
  }
};

// History List Interface
export interface HistoryListRecord {
  updated_at: string;
  record_type: "lead" | "deal" | "order" | "prospect";
  record_name: string;
  action_by: string;
  record_id: string;
  assigned_to: string;
  stage_name: string;
}

// Get History List
export const getHistoryList = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<HistoryListRecord>> => {
  try {
    const response = await axiosInstance.get("/crm/history/list", { params });
    return extractData<{data: PaginationWrapper<HistoryListRecord>}>(response)?.data;
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch history list");
    throw error;
  }
};

// History Chain Record Interface
export interface HistoryChainRecord {
  id: number;
  entity_type: "Prospect" | "Lead" | "Deal" | "Order";
  entity_id: string;
  entity_name: string;
  event: string;
  action: string | null;
  action_display: string;
  description: string;
  changes: any[];
  user_extension: string | null;
  user_extension_done_by: string | null;
  user_extension_done_to: string | null;
  total_records: number | null;
  details: any[];
  created_at: string;
  created_at_human: string;
  created_at_formatted: string;
}

// Get History Chain for a specific record
export const getHistoryChain = async (
  entityType: "prospect" | "lead" | "deal" | "order",
  entityId: string | number
): Promise<HistoryChainRecord[]> => {
  try {
    const response = await axiosInstance.get(`/crm/history/${entityType}/${entityId}/chain`);
    return extractData<HistoryChainRecord[]>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch history chain");
    throw error;
  }
};

// Deal Management
export interface DealData {
  id: number;
  name: string;
  type: string;
  ticket_id: string;
  stage_id: string;
  assigned_to: string;
  probability: number;
  expected_close_date: string;
  company_name: string;
  industry: string;
  decision_maker_title: string;
  decision_maker_name: string;
  decision_maker_phone_country_code: string;
  decision_maker_phone: string;
  decision_maker_email?: string;
  main_decision_maker?: {
    name?: string;
    phone_country_code?: string;
    phone?: string;
    email?: string;
  };
  deal_type: string;
  contract_length: string;
  contract_length_custom: string | null;
  billing_model: string;
  payment_terms: string;
  payment_terms_custom: string | null;
  risk_level: string;
  competitors: string | null;
  negotiation_bar: number;
  quotation_sent: boolean;
  contract_sent: boolean;
  contract_received: boolean;
  estimation_chart: any | null;
  grand_total: string;
  final_estimation_chart: any | null;
  discount_applied: string;
  net_value: string;
  follow_up_date: string | null;
  last_activity_at: string;
  status: string;
  created_at: string;
  updated_at: string;
  is_lost: boolean;
  lost_reason_id: number | null;
  lost_feedback: string | null;
  currency: string;
  tax_percentage?: string | number;
  standard_discount_percentage?: string | number;
  special_discount_percentage?: string | number;
  deleted_at: string | null;
  created_by: string | null;
  stage?: StageData;
  ticket?: any;
  estimates?: Array<{
    id: number;
    deal_id: string;
    version: string;
    estimation_chart: Array<{
      product_service: string;
      description: string;
      qty: number;
      unit_price: number;
      product_id: number;
      original_currency: string;
      original_price: number;
    }>;
    standard_discount_percentage: string;
    special_discount_percentage: string;
    grand_total: string;
    discount_amount: string;
    net_value: string;
    currency: string;
    tax_percentage: string;
    is_final: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  }>;
  meetings?: any[];
  orders?: any[];
  attachments?: Array<{
    id: number;
    file_path: string;
    [key: string]: any;
  }>;
  histories?: Array<{
    id: number;
    [key: string]: any;
  }>;
}

export const getDeals = async (
  params: PaginationParams = {}
): Promise<{
  dataList: DealData[];
  meta: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
  summary_tiles?: {
    upcoming_follow_ups?: number;
    upcoming_meetings?: number;
    deal_types?: Record<string, string>;
  };
}> => {
  try {
    const response = await axiosInstance.get("/crm/deals", { params });
    console.log("Raw response from getDeals:", response);

    // Handle nested response structure
    // The API returns: { code: 200, data: { success: true, data: { current_page, data: [...], total, ... }, summary_tiles: {...} } }
    const responseData: any = response.data?.data;
    const paginationData: any = responseData?.data || {};
    const dealsArray: DealData[] = paginationData?.data || [];
    const pagination = paginationData || {};
    const summaryTiles = responseData?.summary_tiles || null;

    return {
      dataList: Array.isArray(dealsArray) ? dealsArray : [],
      meta: {
        total:
          pagination?.total ||
          (Array.isArray(dealsArray) ? dealsArray.length : 0) ||
          0,
        current_page: pagination?.current_page || 1,
        per_page: pagination?.per_page || 15,
        last_page: pagination?.last_page || 1,
      },
      summary_tiles: summaryTiles,
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch deals");
    throw error;
  }
};

export const getDeal = async (id: number): Promise<DealData> => {
  try {
    const response = await axiosInstance.get(`/crm/deals/${id}`);
    console.log("Raw response from getDeal:", response);
    // Handle nested response structure
    // The API returns: { code: 200, data: { success: true, data: {...} } }
    const responseData: any = response.data?.data;
    const dealData: DealData =
      responseData?.data || responseData || response.data;
    return dealData;
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch deal");
    throw error;
  }
};

export const createDeal = async (
  data: Partial<DealData>
): Promise<{data: DealData}> => {
  try {
    const response = await axiosInstance.post("/crm/create-deal", data);
    const responseData: any = response.data?.data;
    toast.success("Deal created successfully");
    return responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create deal"
    );
    throw error;
  }
};

export const updateDeal = async (
  id: number,
  data: Partial<DealData>
): Promise<DealData> => {
  try {
    data.id = id;
    console.log("updateDeal data:", data);
    const response = await axiosInstance.put(`/crm/update-deal`, data);
    const responseData: any = response.data?.data;
    toast.success("Deal updated successfully");
    return responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update deal"
    );
    throw error;
  }
};

export const deleteDeal = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/deals/${id}`);
    toast.success("Deal deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete deal"
    );
    throw error;
  }
};

export const restoreDeal = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/crm/deals/${id}/restore`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to restore deal");
    throw error;
  }
};

// Create/Update Estimation Chart
export interface CreateEstimatePayload {
  deal_id: number;
  estimation_chart: Array<{
    product_service: string;
    description: string;
    qty: number;
    unit_price: number;
    product_id: number;
    original_currency: string;
    original_price: number;
  }>;
  standard_discount_percentage: number;
  special_discount_percentage: number;
  tax_percentage: number;
  currency: string;
}

export const createEstimate = async (
  data: CreateEstimatePayload,
  showToast: boolean = true
): Promise<any> => {
  try {
    const response = await axiosInstance.post("/crm/create-estimate", data);
    const responseData: any = response.data?.data;
    if (showToast) {
      toast.success("Estimation chart saved successfully");
    }
    return responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to save estimation chart"
    );
    throw error;
  }
};

// Product Management for CRM
export interface CrmProduct {
  id: number;
  name: string;
  description: string;
  sku: string;
  price: string;
  category: string;
  brand: string;
  active: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
}

export const getCrmProducts = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<CrmProduct>> => {
  try {
    const response = await axiosInstance.get("/crm/products", { params });
    return extractData<PaginationWrapper<CrmProduct>>(response.data);
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch products"
    );
    throw error;
  }
};

export interface CreateProductPayload {
  name: string;
  description: string;
  sku: string;
  price: number;
  category: string;
  brand: string;
  active: boolean;
  currency: string;
}

export interface UpdateProductPayload extends CreateProductPayload {
  id: number;
}

export const createProduct = async (
  data: CreateProductPayload
): Promise<CrmProduct> => {
  try {
    const response = await axiosInstance.post("/crm/create-product", data);
    toast.success("Product created successfully");
    return extractData<CrmProduct>(response.data);
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create product"
    );
    throw error;
  }
};

export const updateProduct = async (
  data: UpdateProductPayload
): Promise<CrmProduct> => {
  try {
    const response = await axiosInstance.put("/crm/update-product", data);
    toast.success("Product updated successfully");
    return extractData<CrmProduct>(response.data);
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update product"
    );
    throw error;
  }
};

export const deleteProduct = async (productId: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/products/${productId}/delete`);
    toast.success("Product deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete product"
    );
    throw error;
  }
};

// Order Management
export interface OrderData {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string | null;
  total_amount: string;
  tax_amount: string;
  discount_amount: string;
  final_amount: string;
  order_stage_id: string;
  lost_reason_id: number | null;
  notes: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  inventory_updated: boolean;
  ticket_id: string;
  deal_id: string;
  assigned_to: string | null;
  order_approval_status: string;
  order_priority: string | null;
  contract_type: string | null;
  contract_length: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
  billing_model: string | null;
  billing_status: string | null;
  payment_terms: string | null;
  payment_terms_custom: string | null;
  payment_status: string;
  auto_renewal: boolean | null;
  fulfillment_status: string;
  progress_dial: number;
  poc_title: string | null;
  poc_name: string | null;
  poc_phone_country_code: string | null;
  poc_phone: string | null;
  company: string | null;
  industry: string | null;
  currency: string;
  deleted_at: string | null;
  created_by: string | null;
  stage?: StageData;
  lost_reason?: LostReasonData;
  ticket?: any;
  deal?: DealData;
  items?: Array<{
    id: number;
    order_id: string;
    product_id: string;
    product_variant_id: string | null;
    product_name: string;
    variant_info: string | null;
    quantity: string;
    unit_price: string;
    unit_cost: string | null;
    total_price: string;
    total_cost: string | null;
    tax_percentage: string | null;
    description: string;
    product?: any;
  }>;
}

export const getOrders = async (
  params: PaginationParams = {}
): Promise<{
  dataList: OrderData[];
  meta: {
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
  };
  summary_tiles?: any;
}> => {
  try {
    const response = await axiosInstance.get("/crm/orders", { params });
    console.log("Raw response from getOrders:", response);

    // Handle nested response structure
    const responseData: any = response.data?.data;
    const paginationData: any = responseData?.data || {};
    const ordersArray: OrderData[] = paginationData?.data || [];
    const pagination = paginationData || {};
    const summaryTiles = responseData?.summary_tiles || null;

    return {
      dataList: Array.isArray(ordersArray) ? ordersArray : [],
      meta: {
        total:
          pagination?.total ||
          (Array.isArray(ordersArray) ? ordersArray.length : 0) ||
          0,
        current_page: pagination?.current_page || 1,
        per_page: pagination?.per_page || 15,
        last_page: pagination?.last_page || 1,
      },
      summary_tiles: summaryTiles,
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch orders");
    throw error;
  }
};

export const getOrder = async (id: number): Promise<OrderData> => {
  try {
    const response = await axiosInstance.get(`/crm/orders/${id}`);
    console.log("Raw response from getOrder:", response);
    const responseData: any = response.data?.data;
    const orderData: OrderData =
      responseData?.data || responseData || response.data;
    return orderData;
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order");
    throw error;
  }
};

export const deleteOrder = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/orders/${id}`);
    toast.success("Order deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete order"
    );
    throw error;
  }
};

export const restoreOrder = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/crm/orders/${id}/restore`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to restore order");
    throw error;
  }
};

export const createOrder = async (
  data: Partial<OrderData>
): Promise<OrderData> => {
  try {
    const response = await axiosInstance.post("/crm/create-order", data);
    const responseData: any = response.data?.data;
    toast.success("Order created successfully");
    return responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create order"
    );
    throw error;
  }
};

export const updateOrder = async (
  id: number,
  data: Partial<OrderData>
): Promise<OrderData> => {
  try {
    data.id = id;
    console.log("updateOrder data:", data);
    const response = await axiosInstance.put(`/crm/update-order`, data);
    const responseData: any = response.data?.data;
    toast.success("Order updated successfully");
    return responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update order"
    );
    throw error;
  }
};

// Attachment interfaces
export interface AttachmentData {
  id: number;
  deal_id?: string;
  order_id?: string;
  name: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

// Deal Attachments API
export const getDealAttachments = async (
  dealId: number
): Promise<AttachmentData[]> => {
  try {
    const response = await axiosInstance.get(
      `/crm/deals/${dealId}/attachments`
    );
    const responseData: any = response.data?.data;
    return Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData)
      ? responseData
      : [];
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch attachments"
    );
    throw error;
  }
};

export const uploadDealAttachment = async (
  dealId: number,
  file: File,
  name: string
): Promise<AttachmentData> => {
  try {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Allowed types: PDF, CSV, Excel, or Image"
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const response = await axiosInstance.post(
      `/crm/deals/${dealId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const responseData: any = response.data?.data;
    toast.success("Attachment uploaded successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to upload attachment";
    toast.error(errorMessage);
    throw error;
  }
};

export const deleteDealAttachment = async (
  dealId: number,
  attachmentId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/crm/deals/${dealId}/attachments/${attachmentId}`
    );
    toast.success("Attachment deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete attachment"
    );
    throw error;
  }
};

export const downloadDealAttachment = async (
  dealId: number,
  attachmentId: number
): Promise<void> => {
  try {
    const response = await axiosInstance.get(
      `/crm/deals/${dealId}/attachments/${attachmentId}/download`,
      {
        responseType: "blob",
        headers: {
          Accept: "blob",
        },
      }
    );

    // Check if response is valid
    if (!response.data || response.data.size === 0) {
      throw new Error("Empty file response received");
    }

    // Extract filename from content-disposition header if available
    let filename = `deal-attachment-${attachmentId}`;
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    // response.data is already a blob when responseType is "blob"
    const blob = response.data;

    // Verify blob type (optional check, as we support multiple file types)
    if (!blob.type) {
      console.warn("No blob type detected");
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Attachment downloaded successfully");
  } catch (error: any) {
    console.error("Attachment download error:", error);
    toast.error(error?.message || "Failed to download attachment");
    throw error;
  }
};

// Order Attachments API
export const getOrderAttachments = async (
  orderId: number
): Promise<AttachmentData[]> => {
  try {
    const response = await axiosInstance.get(
      `/crm/orders/${orderId}/attachments`
    );
    const responseData: any = response.data?.data;
    return Array.isArray(responseData?.data)
      ? responseData.data
      : Array.isArray(responseData)
      ? responseData
      : [];
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch attachments"
    );
    throw error;
  }
};

export const uploadOrderAttachment = async (
  orderId: number,
  file: File,
  name: string
): Promise<AttachmentData> => {
  try {
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error("File size exceeds 5MB limit");
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Allowed types: PDF, CSV, Excel, or Image"
      );
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    const response = await axiosInstance.post(
      `/crm/orders/${orderId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const responseData: any = response.data?.data;
    toast.success("Attachment uploaded successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to upload attachment";
    toast.error(errorMessage);
    throw error;
  }
};

export const deleteOrderAttachment = async (
  orderId: number,
  attachmentId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/crm/orders/${orderId}/attachments/${attachmentId}`
    );
    toast.success("Attachment deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete attachment"
    );
    throw error;
  }
};

export const downloadOrderAttachment = async (
  orderId: number,
  attachmentId: number
): Promise<void> => {
  try {
    const response = await axiosInstance.get(
      `/crm/orders/${orderId}/attachments/${attachmentId}/download`,
      {
        responseType: "blob",
        headers: {
          Accept: "blob",
        },
      }
    );

    // Check if response is valid
    if (!response.data || response.data.size === 0) {
      throw new Error("Empty file response received");
    }

    // Extract filename from content-disposition header if available
    let filename = `order-attachment-${attachmentId}`;
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    // response.data is already a blob when responseType is "blob"
    const blob = response.data;

    // Verify blob type (optional check, as we support multiple file types)
    if (!blob.type) {
      console.warn("No blob type detected");
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Attachment downloaded successfully");
  } catch (error: any) {
    console.error("Attachment download error:", error);
    toast.error(error?.message || "Failed to download attachment");
    throw error;
  }
};

// Follow-up interfaces
export interface FollowUpData {
  id?: number;
  lead_id: number;
  follow_up_date: string;
  follow_up_status: string;
  communication_channel: string;
  communication_channel_other?: string;
  notes: string;
  user_extension: string;
  created_at?: string;
  updated_at?: string;
}

// Lead Follow-ups API
export const createLeadFollowUp = async (
  leadId: number,
  data: {
    follow_up_date: string;
    follow_up_status: string;
    communication_channel: string;
    communication_channel_other?: string;
    notes: string;
    user_extension: string;
  }
): Promise<FollowUpData> => {
  try {
    const response = await axiosInstance.post(
      `/crm/leads/${leadId}/follow-ups`,
      data
    );
    const responseData: any = response.data?.data;
    toast.success("Follow-up created successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create follow-up"
    );
    throw error;
  }
};

export const updateLeadFollowUp = async (
  leadId: number,
  followUpId: number,
  data: {
    follow_up_date?: string;
    follow_up_status?: string;
    communication_channel?: string;
    communication_channel_other?: string;
    notes?: string;
    user_extension?: string;
  }
): Promise<FollowUpData> => {
  try {
    const response = await axiosInstance.put(
      `/crm/leads/${leadId}/follow-ups/${followUpId}`,
      data
    );
    const responseData: any = response.data?.data;
    toast.success("Follow-up updated successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update follow-up"
    );
    throw error;
  }
};

export const deleteLeadFollowUp = async (
  leadId: number,
  followUpId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/leads/${leadId}/follow-ups/${followUpId}`);
    toast.success("Follow-up deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete follow-up"
    );
    throw error;
  }
};

// Meetings API
export const createMeeting = async (data: {
  name: string;
  meeting_type: string;
  meeting_date: string;
  meeting_time: string;
  meeting_outcome?: string;
  lead_id?: string;
  deal_id?: string;
  extensions: string[];
}): Promise<MeetingData> => {
  try {
    const response = await axiosInstance.post(`/crm/create-meeting`, data);
    const responseData: any = response.data?.data;
    toast.success("Meeting created successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create meeting"
    );
    throw error;
  }
};

export const updateMeeting = async (
  meetingId: number,
  data: {
    name?: string;
    meeting_type?: string;
    meeting_date?: string;
    meeting_time?: string;
    meeting_outcome?: string;
    extensions?: string[];
    id?: number;
  }
): Promise<MeetingData> => {
  try {
    data.id = meetingId;
    const response = await axiosInstance.put(`/crm/update-meeting`, data);
    const responseData: any = response.data?.data;
    toast.success("Meeting updated successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update meeting"
    );
    throw error;
  }
};

export const deleteMeeting = async (meetingId: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/meetings/${meetingId}`);
    toast.success("Meeting deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete meeting"
    );
    throw error;
  }
};

// Task interfaces
export interface TaskData {
  id?: number;
  name: string;
  user_extension: string;
  created_by: string;
  urgency: "low" | "med" | "high";
  phone?: string;
  email?: string;
  company_name?: string;
  due_date: string;
  time?: string;
  status?: "pending" | "completed" | "failed";
  notes?: TaskNote[];
  created_at?: string;
  updated_at?: string;
}

export interface TaskNote {
  id?: number;
  note: string;
  created_at?: string;
  updated_at?: string;
}

// Tasks API
export const getTasks = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<TaskData>> => {
  try {
    const response = await axiosInstance.get("/crm/tasks", { params });
    return extractData<PaginationWrapper<TaskData>>(response.data);
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch tasks"
    );
    throw error;
  }
};

export const getTask = async (taskId: number): Promise<TaskData> => {
  try {
    const response = await axiosInstance.get(`/crm/tasks/${taskId}`);
    return extractData<TaskData>(response.data);
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message || error?.message || "Failed to fetch task"
    );
    throw error;
  }
};

export const createTask = async (data: {
  name: string;
  user_extension: string;
  created_by: string;
  urgency: "low" | "med" | "high";
  phone?: string;
  email?: string;
  company_name?: string;
  due_date: string;
  time?: string;
  status?: "pending" | "completed" | "failed";
  notes?: Array<{ note: string }>;
}): Promise<TaskData> => {
  try {
    const response = await axiosInstance.post("/crm/tasks", data);
    const responseData: any = response.data?.data;
    toast.success("Task created successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create task"
    );
    throw error;
  }
};

export const updateTask = async (
  taskId: number,
  data: {
    name?: string;
    user_extension?: string;
    created_by?: string;
    urgency?: "low" | "med" | "high";
    phone?: string;
    email?: string;
    company_name?: string;
    due_date?: string;
    time?: string;
    status?: "pending" | "completed" | "failed";
  }
): Promise<TaskData> => {
  try {
    const response = await axiosInstance.put(`/crm/tasks/${taskId}`, data);
    const responseData: any = response.data?.data;
    toast.success("Task updated successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update task"
    );
    throw error;
  }
};

export const deleteTask = async (taskId: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/tasks/${taskId}`);
    toast.success("Task deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete task"
    );
    throw error;
  }
};

// Task Notes API
export const createTaskNote = async (
  taskId: number,
  data: { note: string }
): Promise<TaskNote> => {
  try {
    const response = await axiosInstance.post(
      `/crm/tasks/${taskId}/notes`,
      data
    );
    const responseData: any = response.data?.data;
    toast.success("Note added successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to create note"
    );
    throw error;
  }
};

export const updateTaskNote = async (
  taskId: number,
  noteId: number,
  data: { note: string }
): Promise<TaskNote> => {
  try {
    const response = await axiosInstance.put(
      `/crm/tasks/${taskId}/notes/${noteId}`,
      data
    );
    const responseData: any = response.data?.data;
    toast.success("Note updated successfully");
    return responseData?.data || responseData || response.data;
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to update note"
    );
    throw error;
  }
};

export const deleteTaskNote = async (
  taskId: number,
  noteId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/tasks/${taskId}/notes/${noteId}`);
    toast.success("Note deleted successfully");
  } catch (error: any) {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to delete note"
    );
    throw error;
  }
};

// Lead Reports Interfaces
export interface LeadOverviewReport {
  total_leads: number;
  new_leads: number;
  owned_leads: number;
  unassigned_leads: number;
}

export interface LeadSourceReport {
  source: string;
  count: string;
  percentage: number;
}

export interface LeadAssignmentReport {
  user_extension: string;
  assigned_count: string;
  unassigned_count: number;
}

export interface LeadConversionByStage {
  stage: string;
  count: string;
  converted: number;
}

export interface LeadConversionReport {
  total_leads: number;
  converted_to_deals: number;
  conversion_rate: number;
  by_stage: LeadConversionByStage[];
}

export interface LeadStageDurationReport {
  stage: string;
  lead_count: number;
  avg_duration_days: number;
  min_duration_days: number;
  max_duration_days: number;
}

// Lead Reports API
export interface LeadReportFilters {
  date_from?: string;
  date_to?: string;
  date_field?: string;
  stage_id?: number;
  source?: string;
  owner?: string;
  campaign_id?: number;
}

export const getLeadOverviewReport = async (filters?: LeadReportFilters): Promise<LeadOverviewReport> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.source) params.source = filters.source;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/leads/reports/overview", { params });
    return extractData<LeadOverviewReport>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lead overview report");
    throw error;
  }
};

export const getLeadSourceReport = async (filters?: LeadReportFilters): Promise<LeadSourceReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.source) params.source = filters.source;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/leads/reports/source", { params });
    const data = extractData<LeadSourceReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lead source report");
    throw error;
  }
};

export const getLeadAssignmentReport = async (filters?: LeadReportFilters): Promise<LeadAssignmentReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.source) params.source = filters.source;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/leads/reports/assignment", { params });
    const data = extractData<LeadAssignmentReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lead assignment report");
    throw error;
  }
};

export const getLeadConversionReport = async (filters?: LeadReportFilters): Promise<LeadConversionReport> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.source) params.source = filters.source;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/leads/reports/conversion", { params });
    return extractData<LeadConversionReport>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lead conversion report");
    throw error;
  }
};

export const getLeadStageDurationReport = async (filters?: LeadReportFilters): Promise<LeadStageDurationReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.source) params.source = filters.source;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/leads/reports/stage-duration", { params });
    const data = extractData<LeadStageDurationReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch lead stage duration report");
    throw error;
  }
};

// Deal Reports Interfaces
export interface DealFunnelReport {
  stage: string;
  count: number;
  value: number;
  currency: string;
  percentage: number;
}

export interface DealValueByCurrency {
  currency: string;
  deal_count: number;
  total_value: number;
  avg_value: number;
}

export interface DealValueByOwner {
  owner: string;
  currency: string;
  deal_count: number;
  total_value: number;
  avg_value: number;
}

export interface DealValueReport {
  by_currency: DealValueByCurrency[];
  by_owner: DealValueByOwner[];
}

export interface DealStageDurationReport {
  stage: string;
  deal_count: number;
  avg_duration_days: number;
  min_duration_days: number;
  max_duration_days: number;
}

export interface DealLostReasonReport {
  reason: string;
  currency: string;
  count: number;
  percentage: number;
  total_value: number;
}

export interface DealConversionReport {
  total_deals: number;
  converted_to_orders: number;
  conversion_rate: number;
  order_value_by_currency: Array<{
    currency: string;
    order_count: number;
    total_value: number;
  }>;
}

export interface DealReportFilters {
  date_from?: string;
  date_to?: string;
  date_field?: string;
  stage_id?: number;
  currency?: string;
  owner?: string;
  campaign_id?: number;
}

// Deal Reports API
export const getDealFunnelReport = async (filters?: DealReportFilters): Promise<DealFunnelReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/deals/reports/funnel", { params });
    const data = extractData<DealFunnelReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch deal funnel report");
    throw error;
  }
};

export const getDealValueReport = async (filters?: DealReportFilters): Promise<DealValueReport> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/deals/reports/value", { params });
    return extractData<DealValueReport>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch deal value report");
    throw error;
  }
};

export const getDealStageDurationReport = async (filters?: DealReportFilters): Promise<DealStageDurationReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/deals/reports/stage-duration", { params });
    const data = extractData<DealStageDurationReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch deal stage duration report");
    throw error;
  }
};

export const getDealLostReasonReport = async (filters?: DealReportFilters): Promise<DealLostReasonReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/deals/reports/lost-reasons", { params });
    const data = extractData<DealLostReasonReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch deal lost reason report");
    throw error;
  }
};

export const getDealConversionReport = async (filters?: DealReportFilters): Promise<DealConversionReport> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/deals/reports/conversion", { params });
    return extractData<DealConversionReport>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch deal conversion report");
    throw error;
  }
};

// Order Reports Interfaces
export interface OrderSummaryReport {
  total_orders: number;
  by_currency: Array<{
    currency: string;
    order_count: number;
    total_value: number;
    avg_value: number;
  }>;
}

export interface OrderStatusReport {
  status: string;
  count: number;
  percentage: number;
}

export interface OrderRevenueByMonth {
  month: string;
  currency: string;
  order_count: number;
  total_value: number;
}

export interface OrderRevenueByOwner {
  owner: string | null;
  currency: string;
  order_count: number;
  total_value: number;
}

export interface OrderRevenueReport {
  by_month: OrderRevenueByMonth[];
  by_owner: OrderRevenueByOwner[];
}

export interface OrderStageDurationReport {
  stage: string;
  order_count: number;
  avg_duration_days: number;
  min_duration_days: number;
  max_duration_days: number;
}

export interface OrderCancellationReport {
  reason: string;
  currency: string;
  count: number;
  percentage: number;
  total_value: number;
}

export interface OrderReportFilters {
  date_from?: string;
  date_to?: string;
  date_field?: string;
  stage_id?: number;
  currency?: string;
  owner?: string;
  campaign_id?: number;
}

// Order Reports API
export const getOrderSummaryReport = async (filters?: OrderReportFilters): Promise<OrderSummaryReport> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/orders/reports/summary", { params });
    return extractData<OrderSummaryReport>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order summary report");
    throw error;
  }
};

export const getOrderStatusReport = async (filters?: OrderReportFilters): Promise<OrderStatusReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/orders/reports/status", { params });
    const data = extractData<OrderStatusReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order status report");
    throw error;
  }
};

export const getOrderRevenueReport = async (filters?: OrderReportFilters): Promise<OrderRevenueReport> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/orders/reports/revenue", { params });
    return extractData<OrderRevenueReport>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order revenue report");
    throw error;
  }
};

export const getOrderStageDurationReport = async (filters?: OrderReportFilters): Promise<OrderStageDurationReport[]> => {
  try {
    const params: any = {};
    if (filters?.date_from) params.date_from = filters.date_from;
    if (filters?.date_to) params.date_to = filters.date_to;
    if (filters?.date_field) params.date_field = filters.date_field;
    if (filters?.stage_id) params.stage_id = filters.stage_id;
    if (filters?.currency) params.currency = filters.currency;
    if (filters?.owner) params.owner = filters.owner;
    if (filters?.campaign_id) params.campaign_id = filters.campaign_id;
    
    const response = await axiosInstance.get("/crm/orders/reports/stage-duration", { params });
    const data = extractData<OrderStageDurationReport[]>(response.data);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch order stage duration report");
    throw error;
  }
};

export const getOrderCancellationReport = async (filters?: OrderReportFilters): Promise<OrderCancellationReport[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.date_field) params.append('date_field', filters.date_field);
    if (filters?.stage_id) params.append('stage_id', filters.stage_id.toString());
    if (filters?.currency) params.append('currency', filters.currency);
    if (filters?.owner) params.append('owner', filters.owner);
    if (filters?.campaign_id) params.append('campaign_id', filters.campaign_id.toString());

    const response = await axiosInstance.get(`/crm/orders/reports/cancellation?${params.toString()}`);
    return extractData<OrderCancellationReport[]>(response);
  } catch (error) {
    console.error('Failed to fetch order cancellation report:', error);
    throw error;
  }
}

/**
 * Downloads an example CSV file with sample data
 * This is a frontend-only function that creates and downloads a CSV file
 */
export const downloadExampleCsv = (): void => {
  // CSV headers
  const headers = ['name', 'phone', 'email', 'otherField1', 'other_field_2'];
  
  // Example data with E.164 format phone numbers
  const exampleData = [
    ['John Doe', '+1234567890', 'john.doe@example.com', 'Sample Value 1', 'Sample Value 2'],
    ['Jane Smith', '+1987654321', 'jane.smith@example.com', 'Another Value', 'Different Value']
  ];
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...exampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'example_crm_data.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};
