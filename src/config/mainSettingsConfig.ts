import { HEADER_CONSTANTS } from '@constants/headerConstants'
import { AI_CHAT_SETTINGS_SECTION_PERMISSIONS } from '@config/aiChatPermissions'

const { PERMISSIONS } = HEADER_CONSTANTS

export type SidebarItem = {
  id: string
  label: string
  badge?: string
  externalLink?: boolean
  /** Single permission or any-of list for section visibility. */
  permission?: string | readonly string[]
}

export type SidebarGroup = {
  heading: string
  items: SidebarItem[]
}

export const sidebarGroups: SidebarGroup[] = [
  {
    heading: 'Your Preferences',
    items: [
      { id: 'general-prefs', label: 'General', permission: PERMISSIONS.VIEW_GENERAL_SETTINGS },
      { id: 'notifications', label: 'Notifications', permission: PERMISSIONS.VIEW_NOTIFICATIONS_SETTINGS },
    ],
  },
  {
    heading: 'Services',
    items: [
      { id: 'account-defaults', label: 'Account Defaults', permission: PERMISSIONS.ACCOUNT_DEFAULTS_SERVICES },
      { id: 'users-teams', label: 'Users & Teams', permission: PERMISSIONS.CONTROL_HUB_SERVICES },
      { id: 'smart-crm', label: 'Smart CRM', permission: PERMISSIONS.CRM_SERVICES },
      { id: 'communications', label: 'Communications', permission: PERMISSIONS.COMMUNICATIONS_SERVICES },
      { id: 'planner', label: 'Planner', permission: PERMISSIONS.WORK_PLANNER_SERVICES },
      { id: 'pulse', label: 'Pulse', permission: PERMISSIONS.PULSE_SERVICES },
      { id: 'compliance', label: 'Compliance', badge: 'Beta', permission: PERMISSIONS.DNCR_SERVICES },
      { id: 'workforce', label: 'Workforce', permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES },
      { id: 'billing', label: 'Billing', permission: PERMISSIONS.ACCOUNTS_SERVICES },
      { id: 'tickets', label: 'Tickets', permission: PERMISSIONS.TICKETS_SERVICES },
      { id: 'help-center', label: 'Help Center', permission: PERMISSIONS.FOR_VIEW_HELP_CENTER_SERVICES },
      { id: 'ai-chat', label: 'AI Chat', permission: AI_CHAT_SETTINGS_SECTION_PERMISSIONS },
    ],
  },
]

export const defaultSubTabBySection: Record<string, string | undefined> = {
  'general-prefs': 'profile',
  'account-defaults': 'general',
  'users-teams': 'user-directory',
  'smart-crm': 'stages',
  communications: 'manage-extensions',
  planner: 'general',
  workforce: 'request-categories',
  billing: 'payment-methods',
  tickets: 'statuses',
  'help-center': 'modules',
  'ai-chat': 'ai-chatbot-settings',
  pulse: 'assign-devices',
}
