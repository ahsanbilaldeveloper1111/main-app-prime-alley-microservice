import { toast } from "react-toastify";
import axiosInstance from "./axios";

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
  id: number;
  name: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  lead_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  extensions?: string[];
}

export interface LeadData {
  id: number;
  name: string;
  user_extension: string | null;
  type: "lead" | "opportunity";
  description: string | null;
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
}

// CRM Dashboard Data
export interface DashboardData {
  total_leads: number;
  total_opportunities: number;
  total_meetings: number;
  leads_by_stage: Array<{
    stage_name: string;
    count: number;
    color: string;
  }>;
  recent_leads: LeadData[];
  recent_opportunities: OpportunityData[];
  recent_meetings: MeetingData[];
}

// Helper function to extract data from controlhub response
function extractData<T>(response: any): T {
  console.log("Extracting data from response:", response);

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
export const getCrmDashboard = async (): Promise<DashboardData> => {
  try {
    // Get data from available APIs
    const [leads, opportunities, meetings, stages] = await Promise.all([
      getLeads({ per_page: 1000 }),
      getOpportunities({ per_page: 1000 }),
      getMeetings().then(meetings => meetings.data),
      getStages()
    ]);
    console.log("ZE MEETINGS", meetings);
    // Calculate dashboard data
    const totalLeads = leads?.total || 0;
    const totalOpportunities = opportunities?.total || 0;
    const totalMeetings = meetings?.length || 0;
    
    // Group leads by stage
    const leadsByStage = stages.map((stage: StageData) => ({
      stage_name: stage.name,
      count: leads.data.filter((lead: LeadData) => lead.stage_id == stage.id).length,
      color: stage.color
    }));
    console.log("ZE LEADS BY STAGE", leadsByStage, leads.data);
    
    // Get recent data
    const recentLeads = leads.data.slice(0, 5);
    const recentOpportunities = opportunities.data.slice(0, 5);
    const recentMeetings = meetings.slice(0, 5);
    
    return {
      total_leads: totalLeads,
      total_opportunities: totalOpportunities,
      total_meetings: totalMeetings,
      leads_by_stage: leadsByStage,
      recent_leads: recentLeads,
      recent_opportunities: recentOpportunities,
      recent_meetings: recentMeetings
    };
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch dashboard data");
    throw error;
  }
};

// Lead Management
export const getLeads = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<LeadData>> => {
  try {
    const response = await axiosInstance.get("/crm/leads", { params });
    return extractData<PaginationWrapper<LeadData>>(response.data);
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
export const getStages = async (): Promise<StageData[]> => {
  try {
    console.log("getStages: Making API call to /crm/stages");
    const response = await axiosInstance.get("/crm/stages");
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
  params: { lead_id?: number; extension?: string } = {}
): Promise<{
  data: MeetingData[];
}> => {
  try {
    const response = await axiosInstance.get("/crm/meetings", { params });
    return extractData<{data: MeetingData[]}>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch meetings");
    throw error;
  }
};

export const createMeeting = async (
  data: Partial<MeetingData>
): Promise<MeetingData> => {
  try {
    const response = await axiosInstance.post("/crm/create-meeting", data);
    return extractData<MeetingData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create meeting");
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

export const updateMeeting = async (
  id: number,
  data: Partial<MeetingData>
): Promise<MeetingData> => {
  try {
    const response = await axiosInstance.put(`/crm/update-meeting`, {
      ...data,
      id,
    });
    return extractData<MeetingData>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to update meeting");
    throw error;
  }
};

export const deleteMeeting = async (id: number): Promise<void> => {
  try {
    await axiosInstance.delete(`/crm/meetings/${id}`);
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete meeting");
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
  data: Record<string, any>;
  user_extension: string | null;
  is_viewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmDataPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface CrmDataResponse {
  success: boolean;
  data: CrmDataItem[];
  pagination: CrmDataPagination;
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

export const getCrmData = async (params: PaginationParams = {}): Promise<CrmDataResponse> => {
  try {
    const response = await axiosInstance.get("/crm/crm-data", { params });
    return response.data?.data;
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to fetch CRM data");
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

    // Add field_tags as an array
    if (fieldTags.length > 0) {
      fieldTags.forEach((tag, index) => {
        formData.append(`field_tags[${index}]`, tag);
      });
    }

    // Add assign_to_campaign_users flag
    formData.append("assign_to_campaign_users", assignToCampaignUsers.toString());
    
    const response = await axiosInstance.post("/crm/crm-data/upload-csv", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
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
    toast.success(`Successfully assigned ${itemIds.length} items to ${extensionNames}`);
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to assign CRM data");
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
    toast.error(error?.response?.data?.message || "Failed to mark item as viewed");
    throw error;
  }
};

// Campaign Management
export interface CampaignField {
  id?: number;
  campaign_id?: number;
  field_name: string;
  field_type: 'string' | 'text' | 'integer' | 'date' | 'email' | 'dropdown';
  field_options?: string[];
  sort_order?: number;
}

export interface CampaignData {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive';
  options: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  fields?: CampaignField[];
}

export const getCampaigns = async (
  params: PaginationParams = {}
): Promise<PaginationWrapper<CampaignData>> => {
  try {
    const { page = 1, per_page = 15, search = "", filters = {} } = params;
    
    // Build query parameters
    const queryParams: any = {
      page,
      per_page,
      ...filters
    };
    
    // Add search if provided
    if (search) {
      queryParams.search = search;
    }
    
    const response = await axiosInstance.get("/crm/campaigns", { params: queryParams });
    return extractData<PaginationWrapper<CampaignData>>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to fetch campaigns");
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
    toast.success("Campaign deleted successfully");
  } catch (error: any) {
    toast.error(error?.message || "Failed to delete campaign");
    throw error;
  }
};

export const getCampaignFields = async (id: number): Promise<CampaignField[]> => {
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
    const response = await axiosInstance.post(`/crm/campaigns/${campaignId}/fields`, data);
    return extractData<CampaignField>(response.data);
  } catch (error: any) {
    toast.error(error?.message || "Failed to create campaign field");
    throw error;
  }
};
