import { toast } from "react-toastify";
import axiosInstance from "./axios";

const prefix = "communications";
const meetingsPrefix = prefix + "/meetings";

// ==================== Types ====================

/** Request payload for send-email. */
export interface SendEmailPayload {
  /** Recipient email(s). Array of strings, or single string (accepted for backward compatibility). */
  to: string[] | string;
  /** Subject line (max 255 chars). */
  subject: string;
  /** Body (HTML or plain text). */
  content: string;
  /** Record ID. */
  record_id?: number;
  /** Record type. */
  record_type?: string;
  /** `text/html` (default) or `text/plain`. */
  content_type?: "text/html" | "text/plain";
  /** Sender/extension identifier (default: `unknown`). */
  created_by?: string;
  /** CC addresses; each must be email. */
  cc?: string[];
  /** BCC addresses; each must be email. */
  bcc?: string[];
  /** Reply-to email. */
  reply_to?: string;
  /** Array of file path strings. */
  attachments?: string[];
}

/** Success response (200) for send-email. */
export interface SendEmailSuccessData {
  status_code: number;
  to: string[];
}

export interface SendEmailSuccessResponse {
  status: "success";
  message: string;
  data: SendEmailSuccessData;
}

/** Error response (e.g. 422 validation) for send-email. */
export interface SendEmailErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
}

/** WhatsApp template item from GET whatsapp-templates. */
export interface WhatsAppTemplateItem {
  name: string;
  id: number;
  content_sid: string;
  content?: string;
  params: string[];
}

/** Request payload for send-whatsapp. */
export interface SendWhatsAppPayload {
  /** Recipient phone (E.164, e.g. `+15551234567`). */
  number: string;
  /** Sender/extension (default: `unknown`). */
  created_by?: string;
  /** Body text (max 1600). Required for chat; ignored when using template only. */
  message?: string;
  /** Twilio Content Template SID (for template messages). */
  content_sid?: string;
  /** Key-value variables for the template (e.g. `{"1":"John","2":"Doe"}`). */
  content_variables?: Record<string, string>;
}

/** Success response (200) for send-whatsapp. */
export interface SendWhatsAppSuccessData {
  message_sid: string;
  status: string;
  to: string;
  message?: Record<string, unknown>;
}

export interface SendWhatsAppSuccessResponse {
  status: "success";
  message: string;
  data: SendWhatsAppSuccessData;
}

/** Error response (e.g. 400 window expired) for send-whatsapp. */
export interface SendWhatsAppErrorResponse {
  status: "error";
  message: string;
  window_expired?: boolean;
  window_started_at?: string;
}

/** Request payload for POST send-sms. */
export interface SendSmsPayload {
  /** Recipient phone (E.164, max 32 chars). */
  to: string;
  /** SMS body (max 1600 chars). */
  message: string;
  /** Tenant identifier (max 255 chars). */
  tenant_id: string;
  /** Sender/extension (max 64 chars, e.g. "536"). */
  extension: string;
  /** Optional record type for CRM association (e.g. "lead", "deal"). */
  record_type?: string;
  /** Optional record ID for CRM association. */
  record_id?: number;
}

/** Success response (200) for send-sms. */
export interface SendSmsSuccessData {
  id: number;
  to: string;
  status: string;
  external_id?: string;
  created_at: string;
}

export interface SendSmsSuccessResponse {
  status: "success" | "error";
  message: string;
  data: SendSmsSuccessData;
}

/** Error response (e.g. 422) for send-sms. */
export interface SendSmsErrorResponse {
  status: "error";
  message: string;
  errors?: Record<string, string[]>;
  data?: SendSmsSuccessData;
}

/** SMS list item from GET sms. */
export interface SmsListItem {
  id: number;
  created_by?: string;
  to: string;
  message: string;
  status: string;
  error_message?: string | null;
  external_id?: string | null;
  created_at: string;
  updated_at: string;
}

/** Pagination meta from GET sms. */
export interface SmsListMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

/** Request payload for POST meetings/instant. */
export interface CreateInstantMeetingPayload {
  /** Meeting title (max 255 chars). */
  summary?: string;
  /** Meeting description. */
  description?: string;
  /** Email addresses of attendees. */
  attendees?: string[];
  /** Creator/extension (default: `unknown`). */
  created_by?: string;
}

/** Request payload for POST meetings/scheduled. */
export interface CreateScheduledMeetingPayload {
  /** Start time (ISO 8601 or strtotime-compatible). */
  start_time: string;
  /** End time (defaults to 1 hour after start). */
  end_time?: string;
  /** Meeting title (max 255 chars). */
  summary?: string;
  /** Meeting description. */
  description?: string;
  /** Email addresses. */
  attendees?: string[];
  /** Timezone (max 50 chars; defaults to app timezone). */
  timezone?: string;
  /** Creator/extension (default: `unknown`). */
  created_by?: string;
}

/** Success response (200) for instant or scheduled meeting. */
export interface MeetingSuccessData {
  event_id: string;
  meeting_link: string;
  html_link: string;
  start_time: string;
  end_time: string;
  summary?: string;
}

export interface MeetingSuccessResponse {
  status: "success";
  message: string;
  data: MeetingSuccessData;
}

/** Request payload for POST generate-email. */
export interface GenerateEmailPayload {
  /** Natural-language prompt (e.g. subject + context). */
  query: string;
  /** Existing draft to refine. */
  previous_content?: string;
  /** Sender context (optional). */
  user?: { name: string; extension: number };
  /** Lead context (when opened from leads). */
  lead?: unknown;
  /** Deal context (when opened from deals). */
  deal?: unknown;
  /** Order context (when opened from orders). */
  order?: unknown;
  /** Tone of the message. */
  tone?: string;
  /** Urgency of the message. */
  urgency?: string;
  /** Industry (or custom industry name). */
  industry?: string;
  /** CTA type (or custom CTA). */
  cta_type?: string;
  /** Language of the message. */
  language?: string;
  /** Email style (e.g. formal, casual). */
  email_style?: string;
  /** Desired email length. */
  email_length?: string;
}

/** Success response (200) for generate-email. */
export interface GenerateEmailSuccessResponse {
  result: string;
}

/** Request payload for POST generate-whatsapp. */
export interface GenerateWhatsAppPayload {
  /** Natural-language prompt. */
  query: string;
  /** Existing draft to refine. */
  previous_content?: string;
  /** Tone of the message. */
  tone?: string;
  /** Language of the message. */
  language?: string;
  /** Urgency of the message. */
  urgency?: string;
  /** Industry (or custom industry name when "custom" is selected). */
  industry?: string;
  /** CTA type (or custom CTA when "custom" is selected). */
  cta_type?: string;
  /** Emoji level. */
  emoji_level?: string;
}

/** Success response (200) for generate-whatsapp. */
export interface GenerateWhatsAppSuccessResponse {
  result: string;
}

/** Request payload for POST generate-sms. */
export interface GenerateSmsPayload {
  /** Natural-language prompt for the SMS. */
  query: string;
  /** Existing draft to refine. */
  previous_content?: string;
  /** Lead context (when opened from leads). */
  lead?: unknown;
  /** Deal context (when opened from deals). */
  deal?: unknown;
  /** Order context (when opened from orders). */
  order?: unknown;
  /** Tone of the message. */
  tone?: string;
  /** Language of the message. */
  language?: string;
  /** Urgency of the message. */
  urgency?: string;
}

/** Success response (200) for generate-sms. */
export interface GenerateSmsSuccessResponse {
  result: string;
}

// ==================== APIs ====================

/**
 * POST send-email
 * Sends an email with the given payload.
 */
export const sendEmail = async (
  data: SendEmailPayload,
): Promise<SendEmailSuccessResponse> => {
  const response = await axiosInstance.post<SendEmailSuccessResponse>(
    `${prefix}/send-email`,
    data,
  );
  if (response?.status === 200) {
    toast.success(response.data.message || "Email sent successfully");
    return response.data;
  } else {
    toast.error(response.data.message || "Failed to send Email");
    throw new Error(response.data.message || "Failed to send Email");
  }
};

/**
 * POST send-whatsapp
 * Sends a WhatsApp message (chat within 24h window, or template).
 * Chat: send `message` (and optionally `content_sid`).
 * Template / outside 24h: send `content_sid`; use `content_variables` if the template has placeholders.
 */
export const sendWhatsApp = async (
  data: SendWhatsAppPayload,
): Promise<SendWhatsAppSuccessResponse> => {
  const response = await axiosInstance.post<SendWhatsAppSuccessResponse>(
    `${prefix}/send-whatsapp`,
    data,
  );
  if (response?.status === 200) {
    toast.success(
      response.data.message || "WhatsApp message sent successfully",
    );
    return response.data;
  } else {
    toast.error(response.data.message || "Failed to send WhatsApp message");
    throw new Error(response.data.message || "Failed to send WhatsApp message");
  }
};

/**
 * POST meetings/instant
 * Creates an instant meeting.
 */
export const createInstantMeeting = async (
  data: CreateInstantMeetingPayload = {},
): Promise<MeetingSuccessResponse> => {
  const response = await axiosInstance.post<MeetingSuccessResponse>(
    `${meetingsPrefix}/instant`,
    data,
  );
  if (response?.status === 200) {
    toast.success(
      response.data.message || "Instant meeting created successfully",
    );
    return response.data;
  } else {
    toast.error(response.data.message || "Failed to create instant meeting");
    throw new Error(
      response.data.message || "Failed to create instant meeting",
    );
  }
};

/**
 * POST meetings/scheduled
 * Creates a scheduled meeting.
 */
export const createScheduledMeeting = async (
  data: CreateScheduledMeetingPayload,
): Promise<MeetingSuccessResponse> => {
  const response = await axiosInstance.post<MeetingSuccessResponse>(
    `${meetingsPrefix}/scheduled`,
    data,
  );
  if (response?.status === 200) {
    toast.success(
      response.data.message || "Scheduled meeting created successfully",
    );
    return response.data;
  } else {
    toast.error(response.data.message || "Failed to create scheduled meeting");
    throw new Error(
      response.data.message || "Failed to create scheduled meeting",
    );
  }
};

/**
 * POST generate-email
 * Generates email content from a natural-language prompt.
 */
export const generateEmail = async (
  data: GenerateEmailPayload,
): Promise<GenerateEmailSuccessResponse> => {
  const response = await axiosInstance.post<GenerateEmailSuccessResponse>(
    `${prefix}/generate-email`,
    data,
  );
  return response.data;
};

/**
 * POST generate-whatsapp
 * Generates WhatsApp message content from a natural-language prompt.
 */
export const generateWhatsApp = async (
  data: GenerateWhatsAppPayload,
): Promise<GenerateWhatsAppSuccessResponse> => {
  const response = await axiosInstance.post<GenerateWhatsAppSuccessResponse>(
    `${prefix}/generate-whatsapp`,
    data,
  );
  return response.data;
};

/**
 * POST generate-sms
 * Generates SMS message content from a natural-language prompt.
 */
export const generateSms = async (
  data: GenerateSmsPayload,
): Promise<GenerateSmsSuccessResponse> => {
  const response = await axiosInstance.post<GenerateSmsSuccessResponse>(
    `${prefix}/generate-sms`,
    data,
  );
  return response.data;
};

// ==================== GET APIs ====================

/**
 * GET meetings/test-connection
 * Tests the meetings/calendar connection.
 */
export const getMeetingsTestConnection = async (): Promise<unknown> => {
  const response = await axiosInstance.get(`${meetingsPrefix}/test-connection`);
  return response.data;
};

/**
 * GET meetings/{eventId}
 * Fetches a single meeting by event ID.
 */
export const getMeetingByEventId = async (
  eventId: string,
): Promise<unknown> => {
  const response = await axiosInstance.get(
    `${meetingsPrefix}/${encodeURIComponent(eventId)}`,
  );
  return response.data;
};

/**
 * GET emails
 * Fetches emails list.
 */
export const getEmails = async (
  params?: Record<string, string>,
): Promise<unknown> => {
  const response = await axiosInstance.get(`${prefix}/emails`, { params });
  return response.data;
};

/**
 * GET chats
 * Fetches chats list.
 */
export const getChats = async (
  params?: Record<string, string>,
): Promise<unknown> => {
  const response = await axiosInstance.get(`${prefix}/chats`, { params });
  return response.data;
};

/**
 * GET whatsapp-templates
 * Fetches WhatsApp templates list (name, id, content_sid, params).
 */
export const getWhatsAppTemplates = async (
  params?: Record<string, string>,
): Promise<WhatsAppTemplateItem[]> => {
  const response = await axiosInstance.get<
    WhatsAppTemplateItem[] | { data?: WhatsAppTemplateItem[] }
  >(`${prefix}/whatsapp-templates`, { params });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { data?: WhatsAppTemplateItem[] }).data)
  ) {
    return (data as { data: WhatsAppTemplateItem[] }).data;
  }
  return [];
};

/**
 * GET meetings
 * Fetches meetings list.
 */
export const getMeetings = async (
  params?: Record<string, string>,
): Promise<unknown> => {
  const response = await axiosInstance.get(`${meetingsPrefix}`, { params });
  return response.data;
};

/**
 * GET whatsapp/chat-messages
 * Fetches WhatsApp chat messages.
 */
export const getWhatsAppChatMessages = async (
  params?: Record<string, string>,
): Promise<unknown> => {
  const response = await axiosInstance.get(`${prefix}/whatsapp/chat-messages`, {
    params,
  });
  return response.data;
};

/**
 * GET whatsapp/message-status
 * Fetches WhatsApp message status (e.g. by message_sid).
 */
export const getWhatsAppMessageStatus = async (
  params?: Record<string, string>,
): Promise<unknown> => {
  const response = await axiosInstance.get(
    `${prefix}/whatsapp/message-status`,
    { params },
  );
  return response.data;
};

/**
 * POST send-sms
 * Sends SMS via backend gateway and stores the record.
 */
export const sendSms = async (
  data: SendSmsPayload,
): Promise<SendSmsSuccessResponse> => {
  const response = await axiosInstance.post<SendSmsSuccessResponse>(
    `${prefix}/send-sms`,
    data,
  );
  if (response?.status === 200 && response?.data?.status === "success") {
    toast.success(response.data.message || "SMS sent successfully");
    return response.data;
  } else if (response?.status === 200 && response?.data?.status === "error") {
    toast.error(response.data.message || "Failed to send SMS");
    return {
      status: "error",
      message: response.data.message || "Failed to send SMS",
      data: null,
    } as unknown as SendSmsSuccessResponse;
  } else {
    toast.error("Failed to send SMS");
    throw new Error("Failed to send SMS");
  }
};

/**
 * GET sms
 * Paginated list of sent SMS records. Optional filter by user_extension.
 */
export const getSmsList = async (
  params?: Record<string, string | number | string[]>,
): Promise<{ data: SmsListItem[]; meta: SmsListMeta }> => {
  const normalized = params
    ? Object.fromEntries(
        Object.entries(params).map(([k, v]) => [
          k,
          Array.isArray(v) ? v : String(v),
        ]),
      )
    : undefined;
  const response = await axiosInstance.get<{
    data: SmsListItem[];
    meta: SmsListMeta;
  }>(`${prefix}/sms`, { params: normalized });
  return response.data;
};
