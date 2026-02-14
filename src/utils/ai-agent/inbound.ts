import axiosInstance from "@utils/axios";

const CONTROLHUB_PREFIX = "aiml";
const VOICEBOT_PREFIX = CONTROLHUB_PREFIX + "/voicebot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GetAllInboundCallsPayload {
  session_id?: string;
  call_status?: string;
  created_at_from?: string;
  created_at_to?: string;
  sip_trunkID?: string;
  call_duration_seconds_min?: number;
  call_duration_seconds_max?: number;
  transfer_attempted?: boolean | null;
  call_type?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Reports – Inbound calls (get-all-inbound-calls)
// ---------------------------------------------------------------------------

// Payload (all optional): session_id, sip_call_id, sip_call_id_full, call_status, disconnect_reason, transfer_to, created_at_from/to, updated_at_from/to, session_start_time_from/to, session_end_time_from/to, call_duration_seconds_min/max, total_user_messages_min/max, total_assistant_messages_min/max, transfer_attempted, transfer_successful, idle_timeout_triggered, max_duration_triggered, sip_trunkID, sip_hostname, sip_phoneNumber, sip_callStatus, sip_callID, sip_ruleID, sip_callTag, sip_trunkPhoneNumber, error_message, call_type ("web" or "sip"). Params: page, page_size (max 1000)
export const getAllInboundCalls = async (
  payload: GetAllInboundCallsPayload = {},
  params?: { page?: number; page_size?: number }
) => {
  try {
    const response = await axiosInstance.post(`${VOICEBOT_PREFIX}/get-all-calls`, payload, {
      params: { page: 1, page_size: 50, ...params },
    });
    return response;
  } catch (error) {
    console.error("getAllInboundCalls error:", error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Trunk Profiles (inbound)
// ---------------------------------------------------------------------------

// No payload or params
export const getTrunksInbound = async () => {
  try {
    const response = await axiosInstance.get(`${VOICEBOT_PREFIX}/get_trunks/inbound`);
    return response;
  } catch (error) {
    console.error("getTrunksInbound error:", error);
    throw error;
  }
};
