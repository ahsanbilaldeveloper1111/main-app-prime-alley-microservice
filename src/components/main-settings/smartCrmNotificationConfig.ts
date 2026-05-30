export const SMART_CRM_TOPIC_ID = 'smart-crm'

/** Event key prefixes returned by the CRM notification-settings list API. */
export const SMART_CRM_EVENT_PREFIXES = [
  'crm.',
  'deals.',
  'meetings.',
  'notes.',
  'sales.',
  'tasks.',
  'tickets.',
  'leads.',
  'contacts.',
  'companies.',
  'orders.',
  'campaigns.',
  'prospects.',
] as const

export function isSmartCrmEventKey(eventKey: string): boolean {
  const normalized = eventKey.trim().toLowerCase()
  return SMART_CRM_EVENT_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}
