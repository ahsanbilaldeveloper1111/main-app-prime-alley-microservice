// Header Constants - Centralized configuration for header component
export const HEADER_CONSTANTS = {
  // Base URL
  BASE_URL: '',
  
  // DOM Selectors
  DOM_SELECTORS: {
    NAV_LINKS: '#pc-layout-submenus > li > .pc-link',
    SUBMENU_POPUP: '.pc-submenu-popup',
    SIDEBAR: '.pc-sidebar',
    TAB_PANES: '.pc-submenu-popup .tab-pane',
    MENU_ITEMS: '.pc-submenu-popup .tab-pane .pc-item.pc-hasmenu'
  } as const,
  
  // Timing constants
  TIMING: {
    DOM_RENDER_DELAY: 100,
    HEIGHT_UPDATE_DELAY: 10,
    RETRY_DELAY: 200
  } as const,
  
  // Menu Labels
  MENU_LABELS: {
    DASHBOARD: 'Dashboard',
    CONTROL_HUB: 'Control Hub',
    RESOURCES: 'Help Center',
    HELP_MATERIALS: 'Help Materials',
    FAQ: 'FAQ',
    CONTACT_SUPPORT: 'Contact Support',
    SIM_GATEWAY: 'Carrier Gateway',

    CALL_DASHBOARD: 'Call Dashboard',
    CALL_LOGS: 'Call Logs',
    CALL_RECORDINGS: 'Call Recordings',

    REPORTS: 'Unified Reports',
    CALL_REPORTS: 'Call Analytics',
    AI_INSIGHTS: 'AI Insights',
    LIVE_CALLS: 'Live Calls',
    TICKETS: 'Tickets',
    AUTOMATION: 'Campaign Manager',
    CRM: 'CRM',
    DNCR: 'DNCR',
    COMPLIANCES: 'Compliance',

    BILLING: 'Billing & Payments',
    INVOICES_BILLING: 'Invoices',
    EXPENSES_BILLING: 'Expenses',
    PRODUCTS_BILLING: 'Products',
    INVENTORY_BILLING: 'Inventory',
    COMPANIES_BILLING: 'Companies',
    RESSELLERS_BILLING: 'Resellers',
    LOCATIONS_BILLING: 'Locations',
    SUPPLIERS_BILLING: 'Suppliers',
    PRODUCT_PRICING_BILLING: 'Product Pricing',

    NETOPS: 'Device Insights',
    SALES: 'Sales',
    WEB_RTC: 'Web RTC',
    OMNI_CHANNEL: 'Omni Channel',
    HR_SERVICES: 'HR Services',
    CALL_HISTORY: 'Call History'
  } as const,

MENU_COLORS: {
  DASHBOARD: '#0d6efd',
  CRM: '#0d6efd',
  DNCR: '#0d6efd',
  BILLING: '#0d6efd',
  NETOPS: '#0d6efd',
  SALES: '#0d6efd',
  WEB_RTC: '#0d6efd',
  OMNI_CHANNEL: '#0d6efd',
  HR_SERVICES: '#0d6efd',
  CALL_HISTORY: '#0d6efd',
  TICKETS: '#0d6efd',
  REPORTS: '#0d6efd',
  AUTOMATION: '#0d6efd',
  AI_INSIGHTS: '#0d6efd',
  LIVE_CALLS: '#0d6efd',
  SIM_GATEWAY: '#0d6efd',
  CONTROL_HUB: '#0d6efd',
  RESOURCES: '#0d6efd',

} as const,

  // Submenu Labels
  SUBMENU_LABELS: {
    TASKS: 'Tasks',
    // Control Hub
    USER_DIRECTORY: 'User Management',
    TEAMS:'Supervisor Teams',
    RANKS: 'Ranks and Permissions',
    GROUPS: 'Management Groups',
    
    // Sim Gateway
    GSM_DASHBOARD: 'Dashboard',
    GSM_LIST: 'Telco Gateway List',
    COMPANY_ASSIGN: 'Assign',
    PORTS: 'Carrier Ports',
    INBOX: 'Carrier Messages',
    SYNC_GSM: 'Sync GSM',
    COMPANY_PO: 'Company Profiling',
    
    // Call Logs
    CALL_LOGS_DASHBOARD: 'Dashboard',
    CALL_LOGS_LIST: 'Call Logs',
    
    // AI Insights
    ANALYSIS: 'Analysis',
    TRANSCRIPTION: 'Transcription',
    TRANSLATE: 'Translate',
    OUTBOUND_CALLS: 'Outbound Calls',
    ANALYZE_RECORDINGS: 'Analyze Recordings',
    
    // Sales
    SALES_DASHBOARD: 'Dashboard',
    ORDERS: 'Orders',
    PRODUCTS: 'Products',
    ORDER_STAGES: 'Order Stages',
    LOST_REASONS: 'Lost Reasons',
    
    // Live Calls
    LIVE_VIEW: 'Live View',
    CALL_MONITORING: 'Call Monitoring',
    DIALER: 'Dialer',
    
    // DNCR
    CHECK_NUMBER: 'Check Number',
    DNCR: 'DNCR',
    
    // Tickets
    TICKETS_DASHBOARD: 'Dashboard',
    TICKETS_LIST: 'Tickets',
    STATUS: 'Status',
    MODULES: 'Modules',
    TYPES: 'Types',
    TICKET_MODULE_CATEGORIES: 'Categories',
    TICKET_MODULE_SUBCATEGORIES: 'Sub Categories',
    
    // CRM
    CRM_DASHBOARD: 'Dashboard',
    LEADS: 'Leads',
    DEALS: 'Deals',
    OPPORTUNITIES: 'Opportunities',
    STAGES: 'Stages',
    LOST_REASONS_CRM: 'Lost Reasons',
    DATA_MANAGEMENT: 'Prospects',
    CAMPAIGNS: 'Campaigns',
    
    // Call Recordings
    RECORDINGS_DASHBOARD: 'Dashboard',
    RECORDINGS_LIST: 'Recordings List',
    
    // Reports
    CALL_STATS_BY_COUNTRY: 'Call Stats by Country',
    CALL_STATS_BY_DEPARTMENT: 'Call Stats by Department',
    CALL_STATS_BY_EXTENSION: 'Call Stats by Extension',
    INCOMING_STATS_BY_COUNTRY: 'Incoming Stats by Country',
    INCOMING_STATS_BY_DEPARTMENT: 'Incoming Stats by Department',
    INCOMING_STATS_BY_EXTENSION: 'Incoming Stats by Extension',
    CALL_TREND_BY_COUNTRY: 'Call Trend by Country',
    CALL_TREND_BY_DEPARTMENT: 'Call Trend by Department',
    CALL_TREND_BY_EXTENSION: 'Call Trend by Extension',
    
    // TMS/Automation
    TMS_DASHBOARD: 'Dashboard',
    CISCO_PBX: 'Cisco PBX',
    USERS: 'Users',
    USERS_DIRECTORY: 'Users Directory',
    APP_USERS: 'App Users',
    CUSTOM_USERS: 'Custom Users',
    FACILITIES_INFO: 'Facilities Info',
    RECORDING_PROFILE: 'Recording Profile',
    REMOTE_DESTINATION: 'Remote Destination',
    REMOTE_DESTINATION_PROFILE: 'Remote Destination Profile',
    LINE: 'Line',
    PHONE: 'Phone',
    SIP_TRUNKS: 'SIP Trunks',
    TRANSLATION_PATTERNS: 'Translation Patterns',
    DEVICE_POOL: 'Device Pool',
    LOCATIONS: 'Locations',
    ROUTE_PARTITIONS: 'Route Partitions',
    CSS: 'CSS',
    REGIONS: 'Regions',
    ROUTE_PATTERN: 'Route Pattern',
    UNIFIED_OPS: 'Unified Ops',
    AUDIT_LOG: 'Audit Log',
    USERS_MANAGEMENT: 'Users Management',
    RANK_PERMISSIONS: 'Rank Permissions',
    PROFILING: 'Profiling',
    CUSTOMERS: 'Customers',
    CREATE_PROFILE: 'Create Profile',
    USER_PROFILES: 'User Profiles',
    CREATE_USER_PROFILE: 'Create User Profile',
    ERROR_LOGS: 'Error Logs',

    // NetOps
    NETOPS_DASHBOARD: 'Dashboard',
    NETOPS_DEVICES: 'Devices',
    NETOPS_SERVICES: 'Service status',
    NETOPS_ALERTS: 'Alerts and Notifications',
    NETOPS_UPTIME_SLA: 'Uptime & SLA Monitoring',

    // Resources
    FAQ: 'FAQ',
    HELP_MATERIALS: 'Help Materials',
    CONTACT_SUPPORT: 'Contact Support',

  } as const,
  
  // Icons
  ICONS: {
    DASHBOARD: 'ti ti-grid-dots',
    CONTROL_HUB: 'ti ti-settings',
    SIM_GATEWAY: 'ti ti-antenna-bars-4',
    CALL_LOGS: 'ph-duotone ph-file-text',
    CALL_RECORDINGS: 'ph-duotone ph-record',
    REPORTS: 'ph-duotone ph-file-text',
    AI_INSIGHTS: 'ph-duotone ph-robot',
    LIVE_CALLS: 'ph-duotone ph-phone-call',
    TICKETS: 'ph-duotone ph-ticket',
    AUTOMATION: 'ph-duotone ph-link',
    CRM: 'LinkIcon',
    DNCR: 'ph-duotone ph-link',
    BILLING: 'ph-duotone ph-link',
    NETOPS: 'ph-duotone ph-heartbeat',
    SALES: 'ph-duotone ph-gauge',
    WEB_RTC: 'ph-duotone ph-link',
    OMNI_CHANNEL: 'ph-duotone ph-link',
    HR_SERVICES: 'ph-duotone ph-link',
    CALL_HISTORY: 'ph-duotone ph-phone-call',
    
    // Submenu Icons
    USERS: 'ph-duotone ph-users',
    GAUGE: 'ph-duotone ph-gauge',
    LIST: 'ph-duotone ph-list',
    ENVELOPE: 'ph-duotone ph-envelope',
    ARROWS_CLOCKWISE: 'ph-duotone ph-arrows-clockwise',
    BUILDING: 'ph-duotone ph-buildings',
    FILE_ANALYTICS: 'ti ti-file-analytics',
    TRANSLATE: 'ph-duotone ph-translate',
    SHOPPING_CART: 'ph-duotone ph-shopping-cart',
    PACKAGE: 'ph-duotone ph-package',
    TRENDING_UP: 'ph-duotone ph-trend-up',
    X_CIRCLE: 'ph-duotone ph-x-circle',
    PHONE_CALL: 'ph-duotone ph-phone-call',
    PLAY_CIRCLE: 'ph-duotone ph-play-circle',
    TARGET: 'ph-duotone ph-target',
    DATABASE: 'ph-duotone ph-database',
    MEGAPHONE: 'ph-duotone ph-megaphone',
    PHONE: 'ph-duotone ph-phone',
    CARET_RIGHT: 'ph-duotone ph-caret-right',
    CARET_DOWN: 'ph-duotone ph-caret-down',
    RESOURCES: 'ph-duotone ph-notebook',
    HELP_MATERIALS: 'ph-duotone ph-book',
    FAQ: 'ph-duotone ph-question',
    CONTACT_SUPPORT: 'ph-duotone ph-headset'
  } as const,
  
  // Permissions
  PERMISSIONS: {
    STAFF_MANAGEMENT_SERVICES: 'staff-management-services',
    VIEW_EMPLOYEES_STAFF_MANAGEMENT: 'view-employees-staff-management',
    VIEW_EMPLOYEES_DASHBOARD_STAFF_MANAGEMENT: 'view-employees-dashboard-staff-management',
    VIEW_EMPLOYEES_ONBOARDING_STAFF_MANAGEMENT: 'view-employees-onboarding-staff-management',
    VIEW_EMPLOYEES_APPROVAL_REQUEST_STAFF_MANAGEMENT: 'view-approval-request-staff-management',
    VIEW_EMPLOYEES_ORGANIZATIONAL_CHART_STAFF_MANAGEMENT: 'view-organizational-chart-staff-management',
    VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT: 'view-request-categories-staff-management',
    VIEW_ATTENDENCE_STAFF_MANAGEMENT:'view-attendences-staff-management',

    VIEW_LOCATIONS_STAFF_MANAGEMENT: 'view-locations-staff-management',
    ADD_LOCATION_STAFF_MANAGEMENT: 'add-location-staff-management',
    UPDATE_LOCATION_STAFF_MANAGEMENT: 'update-location-staff-management',
    DELETE_LOCATION_STAFF_MANAGEMENT: 'delete-location-staff-management',

    CONTROL_HUB_SERVICES: 'control-hub-services',
    VIEW_USERS: 'view-users',
    VIEW_TEAMS: 'view-teams',
    VIEW_RANKS: 'view-ranks',
    VIEW_GROUPS: 'view-groups',


    GSM_SERVICES: 'gsm-services',

    WORK_PLANNER_SERVICES: 'work-planner-services',
    VIEW_RECURRING_REMINDERS_WORK_PLANNER: 'view-recurring-reminders-work-planner',
    VIEW_DIAL_TODO_WORK_PLANNER: 'view-dial-todo-work-planner',
    VIEW_TASKSLIST_WORK_PLANNER: 'view-tasks-work-planner',


    CALL_LOGS_SERVICES: 'call-logs-services',
    CALL_RECORDINGS_SERVICES: 'call-recordings-services',
    VIEW_CALL_DASHBOARD: 'dashboard-call-logs',
    VIEW_CALL_LOGS: 'view-call-logs',
    VIEW_CALL_RECORDINGS: 'view-call-recordings',
    VIEW_CALL_REPORTS: 'view-call-reports',
    CALL_REPORTS_BY_STATISTICS_REPORTS: 'call-reports-by-statistics-reports',
    CALL_REPORTS_BY_CALL_INCOMING_REPORTS: 'call-reports-by-call-incoming-reports',
    CALL_REPORTS_BY_TREND_REPORTS: 'call-reports-by-trend-reports',

    REPORTS_SERVICES: 'reports-services',

    AI_ML_SERVICES: 'ai-ml-services',
    TRANSCRIPTION_ANALYSIS_AIML: 'transcriptions-analysis-aiml',
    TRANSCRIPTION_ANALYZE_RECORDINGS_AIML: 'analyze-recordings-aiml',
    TRANSLATE_AIML: 'translate-aiml',
    MANAGE_EXTENSIONS_AIML: 'manage-extensions-aiml',
    OUTBOUND_CALLS_AIML: 'outbound-call-aiml',
    LIVE_CHAT_AIML: 'live-chat-users',

    CTI_SERVICES: 'cti-services',
    VIEW_CTI:'view-cti',
    DIAL_CALL_CTI:'dial-call-cti',
    CTI_MONITORING:'dashboard-cti',
    VIEW_LIVE_CALLS_CAMPAIGNS_MANAGEMENT: 'view-campaigns-tms',
    VIEW_LIVE_CALLS_AGENT_MANAGEMENT: 'view-teams-tms',


    TICKETS_SERVICES: 'tickets-services',
    VIEW_TICKETS_DASHBOARD: 'dashboard-tickets',
    VIEW_TICKETS_LIST: 'view-ticket-tickets',
    VIEW_TICKETS_STATUS: 'ticket-statuses-tickets',
    VIEW_TICKETS_MODULES: 'ticket-modules-tickets',
    VIEW_TICKETS_TYPES: 'view-ticket-types-tickets',
    VIEW_TICKETS_CATEGORIES: 'manage-ticket-module-category-tickets',
    VIEW_TICKETS_SUBCATEGORIES: 'manage-ticket-module-subcategory-tickets',



    TMS_SERVICES: 'tms-services',
    CRM_SERVICES: 'crm-services',

    DNCR_SERVICES: 'dncr-services',
    CHECK_NUMBERS_DNCR: 'check-numbers-dncr',
    VIEW_CDR_DNCR: 'view-cdr-dncr',
    VIEW_LOCAL_DND_CALL_BLOCK_DNCR: 'view-local-dnd-blocks-dncr',


    ACCOUNTS_SERVICES: 'accounts-services',

    NETOPS_SERVICES: 'health-care-services',
    VIEW_NETOPS_DASHBOARD: 'dashboard-netops',
    VIEW_NETOPS_DEVICES: 'devices-netops',
    VIEW_NETOPS_SERVICES: 'services-netops',
    VIEW_NETOPS_ALERTS: 'alerts-netops',
    VIEW_NETOPS_UPTIME_SLA: 'uptime-sla-netops',
    ADD_NEW_DEVICE: 'add-device-netops',
    EDIT_DEVICE: 'edit-device-netops',
    DELETE_DEVICE: 'delete-device-netops',

    VIEW_SERVICES_NETOPS: 'services-netops',
    ADD_NEW_SERVICE: 'add-service-netops',
    EDIT_SERVICE: 'edit-service-netops',
    DELETE_SERVICE: 'delete-service-netops',

    VIEW_ALERTS_NETOPS: 'alerts-netops',
    RESOLVE_ALERT: 'resolve-alert-netops',
    MONITER_NETOPS: 'moniter-netops',


    CALL_HISTORY_SERVICES: 'call-history-services',
    RESOURCES_SERVICES: 'resources-services',

    VIEW_COMPANIES_BILLING: 'view-companies-billing',
  
    VIEW_EXPENSES_BILLING: 'view-expenses-billing',
    VIEW_PRODUCTS_BILLING: 'view-products-billing',
    VIEW_SUPPLIERS_BILLING: 'view-suppliers-billing',
    VIEW_LOCATIONS_BILLING: 'view-locations-billing',
    VIEW_RESSELLERS_BILLING: 'view-resellers-billing',
    VIEW_INVENTORY_BILLING: 'view-inventory-billing',
    VIEW_PRODUCT_PRICING_COMPANIES_BILLING: 'manage-pricing-companies-billing',

    VIEW_CUSTOMER_DASHBOARD_BILLING: 'dashboard-billing',
    VIEW_ACCOUNT_OVERVIEW_BILLING: 'account-overview-billing',
    VIEW_PRODUCT_DETAILS_BILLING: 'products-billing',
    VIEW_BILLING_HISTORY_BILLING: 'billing-history-billing',
    VIEW_INVOICES_BILLING: 'invoices-billing',
    VIEW_PAYMENT_METHODS_BILLING: 'payment-methods-billing',

    VIEW_CRM_DASHBOARD: 'dashboard-crm',
    VIEW_CRM_CAMPAIGNS: 'view-crm-campaigns',
    VIEW_CRM_DATA_MANAGEMENT: 'view-crm-data-management',
    CREATE_CRM_DATA_MANAGEMENT: 'add-crm-data-management',
    VIEW_CRM_OPPORTUNITIES: 'view-crm-opportunities',
    CREATE_CRM_OPPORTUNITIES: 'add-crm-opportunities',
    VIEW_CRM_LEADS: 'view-crm-leads',
    CREATE_CRM_LEADS: 'add-crm-leads',
    VIEW_CRM_DEALS: 'view-crm-deals',
    CREATE_CRM_DEALS: 'add-crm-deals',
    VIEW_CRM_ORDERS: 'view-crm-orders',
    CREATE_CRM_ORDERS: 'add-crm-orders',
    VIEW_CRM_TASKS: 'view-crm-tasks',
    VIEW_CRM_PRODUCTS: 'view-crm-products',
    VIEW_CRM_STAGES: 'view-crm-stages',
    VIEW_CRM_LOST_REASONS: 'view-crm-lost-reasons',
    VIEW_CRM_REPORTS: 'view-reports-crm-reports',
    VIEW_CRM_LEADS_REPORTS: 'view-leads-reports-crm-reports',
    VIEW_CRM_DEALS_REPORTS: 'view-deals-reports-crm-reports',
    VIEW_CRM_ORDERS_REPORTS: 'view-orders-reports-crm-reports',
    VIEW_CRM_HISTORY: 'view-crm-history',

    VIEW_CRM_DEAL_TEMPLATES: 'view-crm-deal-templates',
    VIEW_CRM_INDUSTRIES: 'view-crm-industry',
    VIEW_CRM_BUSINESS_TYPES: 'view-crm-business-types',
    CREATE_CRM_BUSINESS_TYPES: 'add-crm-business-types',
    EDIT_CRM_BUSINESS_TYPES: 'edit-crm-business-types',
    DELETE_CRM_BUSINESS_TYPES: 'delete-crm-business-types',

    VIEW_GSM_DASHBOARD: 'dashboard-gsm-management',
    VIEW_GSM_MANAGEMENT: 'view-gsm-management',
    VIEW_GSM_ASSIGNMENT: 'view-gsm-assignment',
    VIEW_GSM_PORTS: 'view-gsm-ports',
    VIEW_GSM_INBOX: 'view-gsm-inbox',
    VIEW_GSM_SYNC: 'view-gsm-port-sync',
    VIEW_GSM_COMPANY_PROFILLING: 'view-gsm-company-profilling',

    VIEW_UNIFIED_WORKSPACE: 'unified-workspace-services',
    VIEW_USER_NOTIFICATIONS: 'notifications-users',

    
    
    
  } as const
} as const;

// Type definitions for better type safety
export type MenuLabel = keyof typeof HEADER_CONSTANTS.MENU_LABELS;
export type SubmenuLabel = keyof typeof HEADER_CONSTANTS.SUBMENU_LABELS;
export type IconName = keyof typeof HEADER_CONSTANTS.ICONS;
export type PermissionName = keyof typeof HEADER_CONSTANTS.PERMISSIONS;
