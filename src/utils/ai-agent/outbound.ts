import axiosInstance from "@utils/axios";

// ---------------------------------------------------------------------------
// Types (aligned with API responses)
// ---------------------------------------------------------------------------

const CONTROLHUB_PREFIX='aiml';
const VOICEBOT_PREFIX='voicebot';


export interface CampaignItem {
  id: number;
  voice_bot_id: number;
  voice_bot_name: string;
  name: string;
  description: string;
  numbers_to_call: string[];
  numbers_count: number;
  context: string;
  status: string;
  schedule_time: string | null;
  campaign_dispatch_result: unknown;
  created_at: string;
  updated_at: string;
}

export interface ListCampaignsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    status: boolean;
    data?: CampaignItem[];
  };
}

export interface GetCampaignResponse {
  status: boolean;
  data: CampaignItem;
}

export interface CreateCampaignPayload {
  voice_bot_id: number;
  name: string;
  description?: string;
  numbers_to_call: string;
  context?: string;
  status?: string;
}

export interface UpdateCampaignPayload {
  name?: string;
  description?: string;
  status?: string;
  numbers_to_call?: string;
}

export interface VoiceBotItem {
  id: number;
  bot_name?: string;
  description?: string;
  category?: string;
  tags?: string;
  owner?: string;
  status?: string;
  trunk?: string;
  caller_id?: string;
  region?: string;
  tts_provider?: string;
  voice_model?: string;
  voice_type?: string;
  greeting_prompt?: string;
  concurrency_limit?: number;
  system_prompt?: string;
  timezone?: string;
  complete_context?: boolean;
  recording_consent?: boolean;
  dnc_registry_check?: boolean;
  callback_waiting?: boolean;
  [key: string]: unknown;
}

export interface CreateVoiceBotPayload {
  bot_name: string;
  description?: string;
  category?: string;
  tags?: string;
  owner?: string;
  status?: string;
  trunk?: string;
  caller_id?: string;
  region?: string;
  tts_provider?: string;
  voice_model?: string;
  voice_type?: string;
  greeting_prompt?: string;
  concurrency_limit?: number;
  system_prompt?: string;
  timezone?: string;
  complete_context?: boolean;
  recording_consent?: boolean;
  dnc_registry_check?: boolean;
  callback_waiting?: boolean;
}

export interface GetAllOutboundCallsPayload {
  session_id?: string;
  call_status?: string;
  created_at_from?: string;
  created_at_to?: string;
  sip_trunkID?: string;
  transfer_attempted?: boolean | null;
  call_type?: string;
  [key: string]: unknown;
}

export interface DispatchCallPayload {
  phone_numbers: string;
  client_info?: string;
  trunk_id?: string;
  vbot_context?: string;
}

// ---------------------------------------------------------------------------
// Campaign APIs (List All, List by Voice Bot, Get by ID, Create, Update, Delete, Get by Voice Bot)
// ---------------------------------------------------------------------------

// Params: page (pagination), voice_bot_id (filter by voice bot), page_size (items per page, default 50)
export const listCampaigns = async (params?: { page?: number; voice_bot_id?: number; page_size?: number }) => {
  try {
    const response = await axiosInstance.get<ListCampaignsResponse>(`${VOICEBOT_PREFIX}/campaign`, { params: { page: 1, page_size: 50, ...params } });
    return response;
  } catch (error) {
    console.error("listCampaigns error:", error);
    throw error;
  }
};

// Path: campaign_id
export const getCampaignById = async (campaignId: number | string) => {
  try {
    const response = await axiosInstance.get<GetCampaignResponse>(`${VOICEBOT_PREFIX}/campaign/${campaignId}`);
    return response;
  } catch (error) {
    console.error("getCampaignById error:", error);
    throw error;
  }
};

// Payload: voice_bot_id, name, description?, numbers_to_call (comma-separated), context?, status?
export const createCampaign = async (payload: CreateCampaignPayload) => {
  try {
    const response = await axiosInstance.post(`${VOICEBOT_PREFIX}/campaign`, payload);
    return response;
  } catch (error) {
    console.error("createCampaign error:", error);
    throw error;
  }
};

// FormData: voice_bot_id, name, description?, numbers_file (file), context?, status?
export const createCampaignWithFile = async (formData: FormData) => {
  try {
    const response = await axiosInstance.post(`${VOICEBOT_PREFIX}/campaign`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error) {
    console.error("createCampaignWithFile error:", error);
    throw error;
  }
};

// Payload (partial): name?, description?, status?, numbers_to_call?
export const updateCampaign = async (campaignId: number | string, payload: UpdateCampaignPayload) => {
  try {
    const response = await axiosInstance.put(`${VOICEBOT_PREFIX}/campaign/${campaignId}`, payload);
    return response;
  } catch (error) {
    console.error("updateCampaign error:", error);
    throw error;
  }
};

// Payload: voice_bot_id (number or null to remove association)
export const updateCampaignVoiceBot = async (campaignId: number | string, voiceBotId: number | null) => {
  try {
    const response = await axiosInstance.put(`${VOICEBOT_PREFIX}/campaign/${campaignId}`, { voice_bot_id: voiceBotId });
    return response;
  } catch (error) {
    console.error("updateCampaignVoiceBot error:", error);
    throw error;
  }
};

// Payload: voice_bot_id: null (removes voice bot from campaign)
export const removeCampaignVoiceBot = async (campaignId: number | string) => {
  try {
    const response = await axiosInstance.put(`${VOICEBOT_PREFIX}/campaign/${campaignId}`, { voice_bot_id: null });
    return response;
  } catch (error) {
    console.error("removeCampaignVoiceBot error:", error);
    throw error;
  }
};

// Path: campaign_id
export const deleteCampaign = async (campaignId: number | string) => {
  try {
    const response = await axiosInstance.delete(`${VOICEBOT_PREFIX}/campaign/${campaignId}`);
    return response;
  } catch (error) {
    console.error("deleteCampaign error:", error);
    throw error;
  }
};

// Path: voice_bot_id. Params: page (pagination)
export const getCampaignsByVoiceBot = async (voiceBotId: number | string, params?: { page?: number }) => {
  try {
    const response = await axiosInstance.get(`${VOICEBOT_PREFIX}/voicebot/${voiceBotId}/campaigns`, { params: { page: 1, ...params } });
    return response;
  } catch (error) {
    console.error("getCampaignsByVoiceBot error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Voice Bot APIs (BotCreation: List, Get by ID, Create, Update, Delete)
// API also supports query: page, page_size, include_campaigns
// ---------------------------------------------------------------------------

// Optional params (if backend supports): page, page_size, include_campaigns
export const listVoiceBots = async () => {
  try {
    const response = await axiosInstance.get(`${CONTROLHUB_PREFIX}/list-voice-bots`);
    return response;
  } catch (error) {
    console.error("listVoiceBots error:", error);
    throw error;
  }
};

// Path: id. Optional query: include_campaigns
export const getVoiceBotById = async (id: number | string) => {
  try {
    const response = await axiosInstance.get<{ status?: boolean; data?: VoiceBotItem }>(`${CONTROLHUB_PREFIX}/get-voice-bot-by-id/${id}`);
    return response;
  } catch (error) {
    console.error("getVoiceBotById error:", error);
    throw error;
  }
};

// Payload: bot_name, description?, category?, tags?, owner?, status?, trunk?, caller_id?, region?, tts_provider?, voice_model?, voice_type?, greeting_prompt?, concurrency_limit?, system_prompt?, timezone?, complete_context?, recording_consent?, dnc_registry_check?, callback_waiting?
export const createVoiceBot = async (payload: CreateVoiceBotPayload) => {
  try {
    const response = await axiosInstance.post(`${CONTROLHUB_PREFIX}/create-voice-bot`, payload);
    return response;
  } catch (error) {
    console.error("createVoiceBot error:", error);
    throw error;
  }
};

// Path: id. Payload (partial): bot_name?, status?, or any CreateVoiceBotPayload fields
export const updateVoiceBot = async (id: number | string, payload: Partial<CreateVoiceBotPayload>) => {
  try {
    const response = await axiosInstance.post(`${CONTROLHUB_PREFIX}/update-voice-bot/${id}`, payload);
    return response;
  } catch (error) {
    console.error("updateVoiceBot error:", error);
    throw error;
  }
};

// Path: id
export const deleteVoiceBot = async (id: number | string) => {
  try {
    const response = await axiosInstance.post(`${CONTROLHUB_PREFIX}/delete-voice-bot/${id}`);
    return response;
  } catch (error) {
    console.error("deleteVoiceBot error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

// Payload: phone_numbers (required), client_info?, trunk_id?, vbot_context?
export const dispatchCall = async (payload: DispatchCallPayload) => {
  try {
    const response = await axiosInstance.post(`${CONTROLHUB_PREFIX}/dispatch-call`, {
      phone_numbers: payload.phone_numbers,
      ...(payload.client_info && { client_info: payload.client_info }),
      ...(payload.trunk_id && { trunk_id: payload.trunk_id }),
      ...(payload.vbot_context && { vbot_context: payload.vbot_context }),
    });
    return response;
  } catch (error) {
    console.error("dispatchCall error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Reports – Outbound calls (get-all-outbound-calls)
// ---------------------------------------------------------------------------

// Payload (all optional): session_id, call_status, created_at_from, created_at_to, sip_trunkID, transfer_attempted, call_type; also session_id, sip_call_id, disconnect_reason, transfer_to, call_duration_seconds_min/max, total_user_messages_min/max, total_assistant_messages_min/max, transfer_successful, idle_timeout_triggered, max_duration_triggered, sip_hostname, sip_phoneNumber, sip_callStatus, sip_callID, sip_ruleID, sip_callTag, sip_trunkPhoneNumber, error_message. Params: page, page_size (max 1000)
export const getAllOutboundCalls = async (
  payload: GetAllOutboundCallsPayload = {},
  params?: { page?: number; page_size?: number }
) => {
  try {
    const response = await axiosInstance.post(`${VOICEBOT_PREFIX}/get-all-outbound-calls`, payload, {
      params: { page: 1, page_size: 50, ...params },
    });
    return response;
  } catch (error) {
    console.error("getAllOutboundCalls error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Trunk Profiles (outbound)
// ---------------------------------------------------------------------------

export interface AddTrunkPayload {
  name: string;
  address: string;
  numbers: string;
}

export interface UpdateTrunkPayload {
  trunk_id: string;
  name: string;
  address: string;
  numbers: string;
}

export interface DeleteTrunkPayload {
  trunk_id: string;
}

// No payload or params
export const getTrunksOutbound = async () => {
  try {

    const responses = await axiosInstance.post(`zabbix/hosts`,{
      params: {
        output: ["hostid", "host", "name"],
        selectInterfaces: ["interfaceid", "ip"],
      }
    });
    console.log(responses);

    return false;
    const response = await axiosInstance.get(`${VOICEBOT_PREFIX}/get_trunks/outbound`);
    return response;
  } catch (error) {
    console.error("getTrunksOutbound error:", error);
    throw error;
  }
};

// Payload: name, address, numbers
export const addTrunk = async (payload: AddTrunkPayload) => {
  try {
    const response = await axiosInstance.post(`${CONTROLHUB_PREFIX}/add-trunk`, payload);
    return response;
  } catch (error) {
    console.error("addTrunk error:", error);
    throw error;
  }
};

// Payload: trunk_id, name, address, numbers
export const updateTrunk = async (payload: UpdateTrunkPayload) => {
  try {
    const response = await axiosInstance.post(`${CONTROLHUB_PREFIX}/update-trunk`, payload);
    return response;
  } catch (error) {
    console.error("updateTrunk error:", error);
    throw error;
  }
};

// Payload: trunk_id
export const deleteTrunk = async (payload: DeleteTrunkPayload) => {
  try {
    const response = await axiosInstance.post(`${CONTROLHUB_PREFIX}/delete-trunk`, payload);
    return response;
  } catch (error) {
    console.error("deleteTrunk error:", error);
    throw error;
  }
};
