import { isAxiosError } from 'axios'
import axiosInstance from '@utils/axios'
import { getHttpApiErrorDetail } from '@utils/errors'

const EMAIL_BASE = '/email'
const WHATSAPP_BASE = '/whatsapp'

/** tenant_id and extension fields are injected by Control Hub when omitted. */
export type TenantAutoFilled = Record<string, never>

export type EmailTenantMode = 'platform' | 'byo_sendgrid'
export type WhatsAppTenantMode = 'platform' | 'byo_twilio'

export type EmailVerificationStatus = 'pending' | 'verified' | 'failed'
export type EmailSenderSource = 'platform' | 'byo_sendgrid'

export type EmailSender = {
  id: number
  tenant_id: string
  source: EmailSenderSource
  from_email: string
  from_name: string
  sendgrid_sender_id?: number | null
  verification_status: EmailVerificationStatus
  is_default: boolean
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type WhatsAppSender = {
  id: number
  tenant_id: string
  source: 'platform' | 'byo_twilio'
  phone_number: string
  display_name?: string | null
  twilio_sender_sid?: string | null
  twilio_status: string
  is_default: boolean
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export type WhatsAppTemplate = {
  id: number
  name: string
  content_sid: string
  params: string[]
  content?: string
  tenant_id?: string | null
}

export type ListPaginationMeta = {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  tenant_mode?: string
}

export type EmailSendersListResult = {
  senders: EmailSender[]
  tenantMode: EmailTenantMode | null
  meta?: ListPaginationMeta
}

export type WhatsAppSendersListResult = {
  senders: WhatsAppSender[]
  tenantMode: WhatsAppTenantMode | null
  meta?: ListPaginationMeta
}

export type SyncResult<T> = {
  items: T[]
  count: number
}

export type SendGridConfig = {
  id?: number
  tenant_id?: string
  api_key_masked?: string
  has_api_key?: boolean
  created_at?: string
  updated_at?: string
}

export type TwilioConfig = {
  id?: number
  tenant_id?: string
  account_sid_masked?: string
  auth_token_masked?: string
  messaging_service_sid?: string | null
  has_credentials?: boolean
  created_at?: string
  updated_at?: string
}

export type ModeConflictCode =
  | 'platform_senders_exist'
  | 'byo_mode_active'
  | 'byo_senders_exist'

export type PlatformEmailInitiatePayload = {
  from_email: string
  from_name: string
  address: string
  city: string
  country: string
  reply_to_email?: string
  reply_to_name?: string
  nickname?: string
  state?: string
  zip?: string
}

export type PlatformWhatsAppInitiatePayload = {
  phone_number: string
  verification_method?: 'sms' | 'voice'
  display_name?: string
}

export type PlatformWhatsAppVerifyPayload = {
  whatsapp_sender_id: number
  verification_code: string
}

export type SendGridConfigPayload = {
  api_key: string
}

export type TwilioConfigPayload = {
  account_sid: string
  auth_token: string
  messaging_service_sid?: string
}

type ApiEnvelope<T> = {
  status?: 'success' | 'error'
  message?: string
  data?: T
  count?: number | null
  meta?: ListPaginationMeta
  tenant_mode?: string
  code?: ModeConflictCode
  errors?: Record<string, string[]>
}

function unwrapData<T>(body: unknown): T | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  const record = body as ApiEnvelope<T>
  if (record.data !== undefined) {
    return record.data
  }
  return body as T
}

function unwrapSenderList<T>(body: unknown): { items: T[]; tenantMode: string | null; meta?: ListPaginationMeta } {
  const record = (body && typeof body === 'object' ? body : {}) as ApiEnvelope<T[]>
  const nested = record.data
  const items = Array.isArray(nested) ? nested : []
  const tenantMode =
    (typeof record.tenant_mode === 'string' && record.tenant_mode) ||
    (typeof record.meta?.tenant_mode === 'string' ? record.meta.tenant_mode : null)
  return { items, tenantMode, meta: record.meta }
}

function unwrapSyncList<T>(body: unknown): SyncResult<T> {
  const record = (body && typeof body === 'object' ? body : {}) as ApiEnvelope<T[]>
  const items = Array.isArray(record.data) ? record.data : []
  const count = typeof record.count === 'number' ? record.count : items.length
  return { items, count }
}

export function getModeConflictMessage(code: string | undefined): string {
  switch (code) {
    case 'platform_senders_exist':
      return 'Remove existing platform senders before connecting your own provider account.'
    case 'byo_mode_active':
      return 'Remove your provider configuration before adding platform senders.'
    case 'byo_senders_exist':
      return 'Delete all synced senders before removing your provider configuration.'
    default:
      return 'This action conflicts with your current sender setup mode.'
  }
}

export function parseMessagingApiError(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const record = data as ApiEnvelope<unknown>
      if (record.code) {
        return getModeConflictMessage(record.code)
      }
      if (typeof record.message === 'string' && record.message.trim()) {
        return record.message.trim()
      }
    }
    return getHttpApiErrorDetail(error, fallback)
  }
  return getHttpApiErrorDetail(error, fallback)
}

export async function listEmailSenders(
  params?: Record<string, string | number>,
): Promise<EmailSendersListResult> {
  const response = await axiosInstance.get(`${EMAIL_BASE}/senders`, { params })
  const { items, tenantMode, meta } = unwrapSenderList<EmailSender>(response.data)
  return {
    senders: items,
    tenantMode: (tenantMode as EmailTenantMode | null) ?? null,
    meta,
  }
}

export async function getEmailSender(id: number): Promise<EmailSender | null> {
  const response = await axiosInstance.get(`${EMAIL_BASE}/senders/${id}`)
  return unwrapData<EmailSender>(response.data)
}

export async function deleteEmailSender(id: number): Promise<void> {
  await axiosInstance.delete(`${EMAIL_BASE}/senders/${id}`)
}

export async function initiatePlatformEmailSender(
  payload: PlatformEmailInitiatePayload,
): Promise<EmailSender> {
  const response = await axiosInstance.post(`${EMAIL_BASE}/senders/platform/initiate`, payload)
  const sender = unwrapData<EmailSender>(response.data)
  if (!sender) {
    throw new Error('Unexpected response when initiating email sender verification.')
  }
  return sender
}

export async function getEmailSenderVerificationStatus(id: number): Promise<EmailSender | null> {
  const response = await axiosInstance.get(`${EMAIL_BASE}/senders/${id}/verification-status`)
  return unwrapData<EmailSender>(response.data)
}

export async function resendEmailSenderVerification(id: number): Promise<void> {
  await axiosInstance.post(`${EMAIL_BASE}/senders/${id}/resend-verification`, {})
}

export async function getSendGridConfig(): Promise<SendGridConfig | null> {
  try {
    const response = await axiosInstance.get(`${EMAIL_BASE}/sendgrid-config`)
    return unwrapData<SendGridConfig>(response.data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function saveSendGridConfig(payload: SendGridConfigPayload): Promise<SendGridConfig> {
  const response = await axiosInstance.post(`${EMAIL_BASE}/sendgrid-config`, payload)
  const config = unwrapData<SendGridConfig>(response.data)
  if (!config) {
    throw new Error('Unexpected response when saving SendGrid configuration.')
  }
  return config
}

export async function deleteSendGridConfig(): Promise<void> {
  await axiosInstance.delete(`${EMAIL_BASE}/sendgrid-config`)
}

export async function syncSendGridSenders(): Promise<SyncResult<EmailSender>> {
  const response = await axiosInstance.post(`${EMAIL_BASE}/sendgrid-config/sync-senders`, {})
  return unwrapSyncList<EmailSender>(response.data)
}

export async function syncSendGridTemplates(): Promise<SyncResult<unknown>> {
  const response = await axiosInstance.post(`${EMAIL_BASE}/sendgrid-config/sync-templates`, {})
  return unwrapSyncList<unknown>(response.data)
}

export async function listWhatsAppSenders(
  params?: Record<string, string | number>,
): Promise<WhatsAppSendersListResult> {
  const response = await axiosInstance.get(`${WHATSAPP_BASE}/senders`, { params })
  const { items, tenantMode, meta } = unwrapSenderList<WhatsAppSender>(response.data)
  return {
    senders: items,
    tenantMode: (tenantMode as WhatsAppTenantMode | null) ?? null,
    meta,
  }
}

export async function getWhatsAppSender(id: number): Promise<WhatsAppSender | null> {
  const response = await axiosInstance.get(`${WHATSAPP_BASE}/senders/${id}`)
  return unwrapData<WhatsAppSender>(response.data)
}

export async function deleteWhatsAppSender(id: number): Promise<void> {
  await axiosInstance.delete(`${WHATSAPP_BASE}/senders/${id}`)
}

export async function initiatePlatformWhatsAppSender(
  payload: PlatformWhatsAppInitiatePayload,
): Promise<WhatsAppSender> {
  const response = await axiosInstance.post(`${WHATSAPP_BASE}/senders/platform/initiate`, payload)
  const sender = unwrapData<WhatsAppSender>(response.data)
  if (!sender) {
    throw new Error('Unexpected response when initiating WhatsApp sender registration.')
  }
  return sender
}

export async function verifyPlatformWhatsAppSender(
  payload: PlatformWhatsAppVerifyPayload,
): Promise<WhatsAppSender> {
  const response = await axiosInstance.post(`${WHATSAPP_BASE}/senders/platform/verify`, payload)
  const sender = unwrapData<WhatsAppSender>(response.data)
  if (!sender) {
    throw new Error('Unexpected response when verifying WhatsApp sender.')
  }
  return sender
}

export async function refreshWhatsAppSenderStatus(id: number): Promise<WhatsAppSender | null> {
  const response = await axiosInstance.get(`${WHATSAPP_BASE}/senders/${id}/refresh-status`)
  return unwrapData<WhatsAppSender>(response.data)
}

export async function getTwilioConfig(): Promise<TwilioConfig | null> {
  try {
    const response = await axiosInstance.get(`${WHATSAPP_BASE}/twilio-config`)
    return unwrapData<TwilioConfig>(response.data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function saveTwilioConfig(payload: TwilioConfigPayload): Promise<TwilioConfig> {
  const response = await axiosInstance.post(`${WHATSAPP_BASE}/twilio-config`, payload)
  const config = unwrapData<TwilioConfig>(response.data)
  if (!config) {
    throw new Error('Unexpected response when saving Twilio configuration.')
  }
  return config
}

export async function deleteTwilioConfig(): Promise<void> {
  await axiosInstance.delete(`${WHATSAPP_BASE}/twilio-config`)
}

export async function syncTwilioSenders(): Promise<SyncResult<WhatsAppSender>> {
  const response = await axiosInstance.post(`${WHATSAPP_BASE}/twilio-config/sync-senders`, {})
  return unwrapSyncList<WhatsAppSender>(response.data)
}

export async function syncTwilioTemplates(): Promise<SyncResult<WhatsAppTemplate>> {
  const response = await axiosInstance.post(`${WHATSAPP_BASE}/twilio-config/sync-templates`, {})
  return unwrapSyncList<WhatsAppTemplate>(response.data)
}

export async function listWhatsAppTemplates(
  params?: Record<string, string | number>,
): Promise<WhatsAppTemplate[]> {
  const response = await axiosInstance.get(`${WHATSAPP_BASE}-templates`, { params })
  const result = unwrapSyncList<WhatsAppTemplate>(response.data)
  return result.items
}
