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
    RESOURCES: 'Resources',
    HELP_MATERIALS: 'Help Materials',
    FAQ: 'FAQ',
    CONTACT_SUPPORT: 'Contact Support',
    SIM_GATEWAY: 'Telco Gateway',

    CALL_DASHBOARD: 'Call Dashboard',
    CALL_LOGS: 'Call Logs',
    CALL_RECORDINGS: 'Call Recordings',

    REPORTS: 'Reports',
    AI_INSIGHTS: 'AI Insights',
    LIVE_CALLS: 'Live Calls',
    TICKETS: 'Tickets',
    AUTOMATION: 'Automation',
    CRM: 'CRM',
    DNCR: 'DNCR',

    BILLING: 'Billing',
    INVOICES_BILLING: 'Invoices',
    EXPENSES_BILLING: 'Expenses',
    PRODUCTS_BILLING: 'Products',
    INVENTORY_BILLING: 'Inventory',
    COMPANIES_BILLING: 'Companies',
    RESSELLERS_BILLING: 'Resellers',
    LOCATIONS_BILLING: 'Locations',
    SUPPLIERS_BILLING: 'Suppliers',
    PRODUCT_PRICING_BILLING: 'Product Pricing',

    NETOPS: 'NetOps',
    SALES: 'Sales',
    WEB_RTC: 'Web RTC',
    OMNI_CHANNEL: 'Omni Channel',
    HR_SERVICES: 'HR Services',
    CALL_HISTORY: 'Call History'
  } as const,

MENU_COLORS: {
  DASHBOARD: '#007bff',
  CRM: '#6f42c1',
  DNCR: '#dc3545',
  BILLING: '#007bff',
  NETOPS: '#007bff',
  SALES: '#dc3545',
  WEB_RTC: '#6c757d',
  OMNI_CHANNEL: '#6c757d',
  HR_SERVICES: '#dc3545',
  CALL_HISTORY: '#6c757d',
  TICKETS: '#6c757d',
  REPORTS: '#dc3545',
  AUTOMATION: '#007bff',
  AI_INSIGHTS: '#007bff',
  LIVE_CALLS: '#dc3545',
  SIM_GATEWAY: '#007bff',

} as const,

  // Submenu Labels
  SUBMENU_LABELS: {
    // Control Hub
    USER_DIRECTORY: 'User Directory',
    RANKS: 'Ranks',
    GROUPS: 'Groups',
    
    // Sim Gateway
    GSM_DASHBOARD: 'Dashboard',
    GSM_LIST: 'Telco Gateway List',
    COMPANY_ASSIGN: 'Assign',
    PORTS: 'Ports',
    INBOX: 'Inbox',
    SYNC_GSM: 'Sync GSM',
    COMPANY_PO: 'Company Profiling',
    
    // Call Logs
    CALL_LOGS_DASHBOARD: 'Dashboard',
    CALL_LOGS_LIST: 'Call Logs',
    
    // AI Insights
    ANALYSIS: 'Analysis',
    TRANSCRIPTION: 'Transcription',
    TRANSLATE: 'Translate',
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
    
    // Tickets
    TICKETS_DASHBOARD: 'Dashboard',
    TICKETS_LIST: 'Tickets',
    STATUS: 'Status',
    MODULES: 'Modules',
    TYPES: 'Types',
    
    // CRM
    CRM_DASHBOARD: 'Dashboard',
    LEADS: 'Leads',
    OPPORTUNITIES: 'Opportunities',
    STAGES: 'Stages',
    LOST_REASONS_CRM: 'Lost Reasons',
    DATA_MANAGEMENT: 'Data Management',
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
    ERROR_LOGS: 'Error Logs'
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
    CONTROL_HUB_SERVICES: 'control-hub-services',
    GSM_SERVICES: 'gsm-services',


    CALL_LOGS_SERVICES: 'call-logs-services',
    CALL_RECORDINGS_SERVICES: 'call-recordings-services',
    VIEW_CALL_DASHBOARD: 'dashboard-call-logs',
    VIEW_CALL_LOGS: 'view-call-logs',
    VIEW_CALL_RECORDINGS: 'view-call-recordings',

    REPORTS_SERVICES: 'reports-services',

    AI_ML_SERVICES: 'ai-ml-services',
    TRANSCRIPTION_ANALYSIS_AIML: 'transcriptions-analysis-aiml',
    TRANSCRIPTION_ANALYZE_RECORDINGS_AIML: 'analyze-recordings-aiml',
    TRANSLATE_AIML: 'translate-aiml',


    CTI_SERVICES: 'cti-services',
    VIEW_CTI:'view-cti',
    DIAL_CALL_CTI:'dial-call-cti',
    CTI_MONITORING:'dashboard-cti',


    TICKETS_SERVICES: 'tickets-services',
    VIEW_TICKETS_DASHBOARD: 'dashboard-tickets',
    VIEW_TICKETS_LIST: 'view-ticket-tickets',
    VIEW_TICKETS_STATUS: 'ticket-statuses-tickets',
    VIEW_TICKETS_MODULES: 'ticket-modules-tickets',
    VIEW_TICKETS_TYPES: 'view-ticket-types-tickets',



    TMS_SERVICES: 'tms-services',
    CRM_SERVICES: 'crm-services',

    DNCR_SERVICES: 'dncr-services',
    CHECK_NUMBERS_DNCR: 'check-numbers-dncr',

    ACCOUNTS_SERVICES: 'accounts-services',
    NETOPS_SERVICES: 'health-care-services',
    CALL_HISTORY_SERVICES: 'call-history-services',
    RESOURCES_SERVICES: 'resources-services',

    VIEW_COMPANIES_BILLING: 'view-companies-billing',
    VIEW_INVOICES_BILLING: 'view-invoices-billing',
    VIEW_EXPENSES_BILLING: 'view-expenses-billing',
    VIEW_PRODUCTS_BILLING: 'view-products-billing',
    VIEW_SUPPLIERS_BILLING: 'view-suppliers-billing',
    VIEW_LOCATIONS_BILLING: 'view-locations-billing',
    VIEW_RESSELLERS_BILLING: 'view-resellers-billing',
    VIEW_INVENTORY_BILLING: 'view-inventory-billing',
    VIEW_PRODUCT_PRICING_COMPANIES_BILLING: 'manage-pricing-companies-billing',

    VIEW_CRM_DASHBOARD: 'dashboard-crm',
    VIEW_CRM_CAMPAIGNS: 'view-crm-campaigns',
    VIEW_CRM_DATA_MANAGEMENT: 'view-crm-data-management',
    CREATE_CRM_DATA_MANAGEMENT: 'add-crm-data-management',
    VIEW_CRM_OPPORTUNITIES: 'view-crm-opportunities',
    CREATE_CRM_OPPORTUNITIES: 'add-crm-opportunities',
    VIEW_CRM_LEADS: 'view-crm-leads',
    CREATE_CRM_LEADS: 'add-crm-leads',
    VIEW_CRM_STAGES: 'view-crm-stages',
    VIEW_CRM_LOST_REASONS: 'view-crm-lost-reasons',

    VIEW_GSM_DASHBOARD: 'dashboard-gsm-management',
    VIEW_GSM_MANAGEMENT: 'view-gsm-management',
    VIEW_GSM_ASSIGNMENT: 'view-gsm-assignment',
    VIEW_GSM_PORTS: 'view-gsm-ports',
    VIEW_GSM_INBOX: 'view-gsm-inbox',
    VIEW_GSM_SYNC: 'view-gsm-port-sync',
    VIEW_GSM_COMPANY_PROFILLING: 'view-gsm-company-profilling',

    VIEW_NETOPS_DASHBOARD: 'dashboard-netops',
    VIEW_NETOPS_DEVICES: 'devices-netops',
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
    VIEW_UPTIME_SLA_NETOPS: 'monitoring-netops',
    
    
  } as const
} as const;

// Type definitions for better type safety
export type MenuLabel = keyof typeof HEADER_CONSTANTS.MENU_LABELS;
export type SubmenuLabel = keyof typeof HEADER_CONSTANTS.SUBMENU_LABELS;
export type IconName = keyof typeof HEADER_CONSTANTS.ICONS;
export type PermissionName = keyof typeof HEADER_CONSTANTS.PERMISSIONS;
