import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export type SidebarItem = {
  id: string;
  label: string;
  badge?: string;
  externalLink?: boolean;
  permission?: string | readonly string[];
};

export type SidebarGroup = {
  heading: string;
  items: SidebarItem[];
};

/** Searchable main-settings sub-tabs (section + subTab navigation). */
export type SettingsSubTabSearchItem = {
  sectionId: string;
  subTabId: string;
  label: string;
  permission?: string | readonly string[];
};

export const settingsSubTabSearchItems: SettingsSubTabSearchItem[] = [
  {
    sectionId: "users-teams",
    subTabId: "user-directory",
    label: "User Directory",
    permission: PERMISSIONS.VIEW_USERS,
  },
  {
    sectionId: "users-teams",
    subTabId: "supervisor-teams",
    label: "Supervisor Teams",
    permission: PERMISSIONS.VIEW_TEAMS,
  },
  {
    sectionId: "users-teams",
    subTabId: "management-groups",
    label: "Management Groups",
    permission: PERMISSIONS.VIEW_GROUPS,
  },
  {
    sectionId: "users-teams",
    subTabId: "ranks-and-permissions",
    label: "Ranks and Permissions",
    permission: PERMISSIONS.VIEW_RANKS,
  },
  {
    sectionId: "help-center",
    subTabId: "modules",
    label: "FAQ Modules",
    permission: PERMISSIONS.MANAGE_HELP_CENTER,
  },
  {
    sectionId: "help-center",
    subTabId: "topics",
    label: "FAQ Topics",
    permission: PERMISSIONS.MANAGE_HELP_CENTER,
  },
  {
    sectionId: "help-center",
    subTabId: "items",
    label: "FAQ Items",
    permission: PERMISSIONS.MANAGE_HELP_CENTER,
  },
  {
    sectionId: "help-center",
    subTabId: "types",
    label: "FAQ Types",
    permission: PERMISSIONS.MANAGE_HELP_CENTER,
  },
  {
    sectionId: "tickets",
    subTabId: "statuses",
    label: "Ticket Statuses",
    permission: PERMISSIONS.VIEW_TICKETS_STATUS,
  },
  {
    sectionId: "tickets",
    subTabId: "modules",
    label: "Ticket Modules",
    permission: PERMISSIONS.VIEW_TICKETS_MODULES,
  },
  {
    sectionId: "tickets",
    subTabId: "categories",
    label: "Ticket Categories",
    permission: PERMISSIONS.VIEW_TICKETS_CATEGORIES,
  },
  {
    sectionId: "tickets",
    subTabId: "sub-categories",
    label: "Ticket Sub Categories",
    permission: PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES,
  },
  {
    sectionId: "tickets",
    subTabId: "types",
    label: "Ticket Types",
    permission: PERMISSIONS.VIEW_TICKETS_TYPES,
  },
  {
    sectionId: "smart-crm",
    subTabId: "stages",
    label: "CRM Stages",
    permission: PERMISSIONS.VIEW_CRM_STAGES,
  },
  {
    sectionId: "smart-crm",
    subTabId: "industries",
    label: "CRM Product Groups",
    permission: PERMISSIONS.VIEW_CRM_INDUSTRIES,
  },
  {
    sectionId: "smart-crm",
    subTabId: "products",
    label: "CRM Products",
    permission: PERMISSIONS.VIEW_CRM_PRODUCTS,
  },
  {
    sectionId: "smart-crm",
    subTabId: "deal-templates",
    label: "CRM Deal Templates",
    permission: PERMISSIONS.VIEW_CRM_DEAL_TEMPLATES,
  },
  {
    sectionId: "smart-crm",
    subTabId: "business-types",
    label: "CRM Business Types",
    permission: PERMISSIONS.VIEW_CRM_BUSINESS_TYPES,
  },
  {
    sectionId: "smart-crm",
    subTabId: "campaigns",
    label: "CRM Campaigns",
    permission: PERMISSIONS.VIEW_CRM_CAMPAIGNS,
  },
];

export const sidebarGroups: SidebarGroup[] = [
  {
    heading: "Your Preferences",
    items: [
      {
        id: "general-prefs",
        label: "General",
        permission: PERMISSIONS.VIEW_GENERAL_SETTINGS,
      },
      {
        id: "notifications",
        label: "Notifications",
        permission: PERMISSIONS.VIEW_NOTIFICATIONS_SETTINGS,
      },
    ],
  },
  {
    heading: "Services",
    items: [
      {
        id: "account-defaults",
        label: "Account Defaults",
        permission: PERMISSIONS.ACCOUNT_DEFAULTS_SERVICES,
      },
      {
        id: "users-teams",
        label: "Users & Teams",
        permission: PERMISSIONS.CONTROL_HUB_SERVICES,
      },
      {
        id: "smart-crm",
        label: "Smart CRM",
        permission: PERMISSIONS.CRM_SERVICES,
      },
      {
        id: "communications",
        label: "Communications",
        permission: PERMISSIONS.COMMUNICATIONS_SERVICES,
      },
      {
        id: "planner",
        label: "Planner",
        permission: PERMISSIONS.WORK_PLANNER_SERVICES,
      },
      { id: "pulse", label: "Pulse", permission: PERMISSIONS.PULSE_SERVICES },
      {
        id: "compliance",
        label: "Compliance",
        badge: "Beta",
        permission: PERMISSIONS.DNCR_SERVICES,
      },
      {
        id: "workforce",
        label: "Workforce",
        permission: PERMISSIONS.STAFF_MANAGEMENT_SERVICES,
      },
      {
        id: "billing",
        label: "Billing",
        permission: PERMISSIONS.ACCOUNTS_SERVICES,
      },
      {
        id: "tickets",
        label: "Tickets",
        permission: PERMISSIONS.TICKETS_SERVICES,
      },
      {
        id: "help-center",
        label: "Help Center",
        permission: PERMISSIONS.FOR_VIEW_HELP_CENTER_SERVICES,
      },
      {
        id: "ai-chat",
        label: "AI Chat",
        permission: PERMISSIONS.AI_ML_SERVICES,
      },
    ],
  },
];

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
