import { HEADER_CONSTANTS } from '@constants/headerConstants'

const { PERMISSIONS } = HEADER_CONSTANTS

export type SidebarItem = {
  id: string
  label: string
  badge?: string
  externalLink?: boolean
  permission?: string
}

export type SidebarGroup = {
  heading: string
  items: SidebarItem[]
}

export const sidebarGroups: SidebarGroup[] = [
  {
    heading: 'Your Preferences',
    items: [
      { id: 'general-prefs', label: 'General' },
      { id: 'notifications', label: 'Notifications', permission: PERMISSIONS.VIEW_USER_NOTIFICATIONS },
    ],
  },
  {
    heading: 'Services',
    items: [
      { id: 'account-defaults', label: 'Account Defaults', permission: PERMISSIONS.VIEW_ACCOUNT_DEFAULTS_GENERAL },
      { id: 'users-teams', label: 'Users & Teams', permission: PERMISSIONS.CONTROL_HUB_SERVICES },
      { id: 'smart-crm', label: 'Smart CRM', permission: PERMISSIONS.CRM_SERVICES },
      { id: 'communications', label: 'Communications', permission: PERMISSIONS.COMMUNICATIONS_SERVICES },
      { id: 'planner', label: 'Planner', permission: PERMISSIONS.WORK_PLANNER_SERVICES },
      { id: 'virtual-agents', label: 'Virtual Agents', permission: PERMISSIONS.VIEW_VIRTUAL_AGENTS },
      { id: 'pulse', label: 'Pulse', permission: PERMISSIONS.PULSE_SERVICES },
      { id: 'compliance', label: 'Compliance', badge: 'Beta', permission: PERMISSIONS.DNCR_SERVICES },
      { id: 'workforce', label: 'Workforce', permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES },
      { id: 'billing', label: 'Billing', permission: PERMISSIONS.ACCOUNTS_SERVICES },
      { id: 'tickets', label: 'Tickets', permission: PERMISSIONS.TICKETS_SERVICES },
      { id: 'help-center', label: 'Help Center', permission: PERMISSIONS.MANAGE_HELP_CENTER },
      { id: 'ai-chat', label: 'AI Chat', permission: PERMISSIONS.VIEW_AI_CHAT },
    ],
  },
]

export const defaultSubTabBySection: Record<string, string | undefined> = {
  'general-prefs': 'profile',
  'account-defaults': 'general',
  'users-teams': 'user-directory',
  'smart-crm': 'stages',
  communications: 'manage-extensions',
  workforce: 'request-categories',
  billing: 'payment-methods',
  tickets: 'statuses',
  'help-center': 'modules',
  'ai-chat': 'tools-profiles',
  'virtual-agents': 'trunk-profiles',
  pulse: 'host-groups',
}
