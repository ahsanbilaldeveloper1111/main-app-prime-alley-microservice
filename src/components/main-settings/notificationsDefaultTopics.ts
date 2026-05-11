import type { NotificationTopic } from './notificationsSettingsTypes'

export const defaultNotificationTopics: NotificationTopic[] = [
  {
    id: 'account-defaults',
    label: 'Account Defaults',
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      {
        id: 'account-defaults-general',
        label: 'General settingsss',
        description: 'Get notified about changes to account defaults and general settings.',
        channels: { popup: false, browser: false, bell: true, email: true },
      },
      {
        id: 'account-defaults-currency',
        label: 'Currency updates',
        description: 'Receive notifications about currency and fiscal year changes.',
        channels: { popup: false, browser: false, bell: false, email: true },
      },
    ],
  },
  {
    id: 'users-teams',
    label: 'Users & Teams',
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      {
        id: 'users-added',
        label: 'New users added',
        description: 'Get notified when new users are added to your account.',
        channels: { popup: false, browser: false, bell: true, email: true },
      },
      {
        id: 'team-changes',
        label: 'Team changes',
        description: 'Receive notifications about team structure and permission changes.',
        channels: { popup: false, browser: false, bell: true, email: false },
      },
    ],
  },
  {
    id: 'smart-crm',
    label: 'Smart CRM',
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      {
        id: 'crm-deals',
        label: 'Deal updates',
        description: 'Get notified about deal stage changes and new opportunities.',
        channels: { popup: true, browser: true, bell: true, email: false },
      },
      {
        id: 'crm-leads',
        label: 'New leads',
        description: 'Receive notifications when new leads are assigned to you.',
        channels: { popup: true, browser: false, bell: true, email: false },
      },
    ],
  },
  {
    id: 'communications',
    label: 'Communications',
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      {
        id: 'comm-calls',
        label: 'Incoming calls',
        description: 'Get notified about incoming calls and missed calls.',
        channels: { popup: true, browser: true, bell: true, email: false },
      },
      {
        id: 'comm-messages',
        label: 'New messages',
        description: 'Receive notifications for new SMS and chat messages.',
        channels: { popup: true, browser: true, bell: true, email: false },
      },
    ],
  },
  {
    id: 'planner',
    label: 'Planner',
    channels: { popup: false, browser: true, bell: true, email: true },
    subtopics: [
      {
        id: 'planner-tasks',
        label: 'Task reminders',
        description: 'Get notified about upcoming tasks and deadlines.',
        channels: { popup: false, browser: true, bell: true, email: true },
      },
      {
        id: 'planner-assignments',
        label: 'New assignments',
        description: 'Receive notifications when work items are assigned to you.',
        channels: { popup: false, browser: false, bell: true, email: false },
      },
    ],
  },
  {
    id: 'pulse',
    label: 'Pulse',
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      {
        id: 'pulse-alerts',
        label: 'System alerts',
        description: 'Get notified about critical system events and host status.',
        channels: { popup: false, browser: false, bell: true, email: true },
      },
      {
        id: 'pulse-monitoring',
        label: 'Monitoring updates',
        description: 'Receive notifications about monitoring threshold breaches.',
        channels: { popup: false, browser: false, bell: true, email: true },
      },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance (Beta)',
    channels: { popup: false, browser: false, bell: true, email: true },
    subtopics: [
      {
        id: 'compliance-reports',
        label: 'Compliance reports',
        description: 'Get notified when compliance reports are generated.',
        channels: { popup: false, browser: false, bell: true, email: true },
      },
      {
        id: 'compliance-violations',
        label: 'Policy violations',
        description: 'Receive immediate alerts about compliance violations.',
        channels: { popup: false, browser: false, bell: true, email: true },
      },
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce',
    channels: { popup: false, browser: false, bell: true, email: false },
    subtopics: [
      {
        id: 'workforce-requests',
        label: 'New requests',
        description: 'Get notified about new workforce requests and approvals.',
        channels: { popup: false, browser: false, bell: true, email: false },
      },
      {
        id: 'workforce-timeoff',
        label: 'Time-off updates',
        description: 'Receive notifications about time-off request status changes.',
        channels: { popup: false, browser: false, bell: false, email: false },
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    channels: { popup: false, browser: false, bell: false, email: true },
    subtopics: [
      {
        id: 'billing-invoices',
        label: 'New invoices',
        description: 'Get notified when new invoices are generated.',
        channels: { popup: false, browser: false, bell: false, email: true },
      },
      {
        id: 'billing-payments',
        label: 'Payment confirmations',
        description: 'Receive notifications about successful payments.',
        channels: { popup: false, browser: false, bell: false, email: true },
      },
    ],
  },
  {
    id: 'tickets',
    label: 'Tickets',
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      {
        id: 'tickets-assigned',
        label: 'Ticket assigned',
        description: 'Get notified when a ticket is assigned to you.',
        channels: { popup: true, browser: true, bell: true, email: false },
      },
      {
        id: 'tickets-updates',
        label: 'Ticket updates',
        description: 'Receive notifications about ticket status changes.',
        channels: { popup: false, browser: false, bell: true, email: false },
      },
    ],
  },
  {
    id: 'help-center',
    label: 'Help Center',
    channels: { popup: false, browser: false, bell: false, email: true },
    subtopics: [
      {
        id: 'help-center-articles',
        label: 'New articles',
        description: 'Get notified when new help articles are published.',
        channels: { popup: false, browser: false, bell: false, email: true },
      },
      {
        id: 'help-center-faqs',
        label: 'FAQ updates',
        description: 'Receive notifications about FAQ updates.',
        channels: { popup: false, browser: false, bell: false, email: false },
      },
    ],
  },
  {
    id: 'ai-chat',
    label: 'AI Chat',
    channels: { popup: true, browser: true, bell: true, email: false },
    subtopics: [
      {
        id: 'ai-chat-mentions',
        label: 'Chat mentions',
        description: "Get notified when you're mentioned in AI chat conversations.",
        channels: { popup: true, browser: true, bell: true, email: false },
      },
      {
        id: 'ai-chat-responses',
        label: 'AI responses',
        description: 'Receive notifications about AI-generated responses.',
        channels: { popup: false, browser: false, bell: false, email: false },
      },
    ],
  },
]
