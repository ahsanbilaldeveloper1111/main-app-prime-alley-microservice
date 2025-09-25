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
    DASHBOARD: 'Home',
    CONTROL_HUB: 'Control Hub',
    SIM_GATEWAY: 'Sim Gateway',
    CALL_LOGS: 'Call Logs',
    CALL_RECORDINGS: 'Call Recordings',
    REPORTS: 'Reports',
    AI_INSIGHTS: 'Ai Insights',
    LIVE_CALLS: 'Live Calls',
    TICKETS: 'Tickets',
    AUTOMATION: 'Automation',
    CRM: 'CRM',
    DNCR: 'DNCR',
    BILLING: 'Billing',
    NETOPS: 'NetOps',
    SALES: 'Sales',
    WEB_RTC: 'Web RTC',
    OMNI_CHANNEL: 'Omni Channel',
    HR_SERVICES: 'HR Services'
  } as const,
  
  // Submenu Labels
  SUBMENU_LABELS: {
    // Control Hub
    USER_DIRECTORY: 'User Directory',
    RANKS: 'Ranks',
    GROUPS: 'Groups',
    
    // Sim Gateway
    GSM_DASHBOARD: 'Dashboard',
    GSM_LIST: 'Gsm List',
    COMPANY_ASSIGN: 'Company Assign',
    PORTS: 'Ports',
    INBOX: 'Inbox',
    SYNC_GSM: 'Sync GSM',
    COMPANY_PO: 'Company PO',
    
    // Call Logs
    CALL_LOGS_DASHBOARD: 'Dashboard',
    CALL_LOGS_LIST: 'Call Logs',
    
    // AI Insights
    ANALYSIS: 'Analysis',
    TRANSCRIPTION: 'Transcription',
    TRANSLATE: 'Translate',
    
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
    DASHBOARD: 'ti ti-settings',
    CONTROL_HUB: 'ti ti-settings',
    SIM_GATEWAY: 'ti ti-antenna-bars-4',
    CALL_LOGS: 'ph-duotone ph-file-text',
    CALL_RECORDINGS: 'ph-duotone ph-record',
    REPORTS: 'ph-duotone ph-file-text',
    AI_INSIGHTS: 'ph-duotone ph-robot',
    LIVE_CALLS: 'ph-duotone ph-phone-call',
    TICKETS: 'ph-duotone ph-ticket',
    AUTOMATION: 'ph-duotone ph-link',
    CRM: 'ph-duotone ph-link',
    DNCR: 'ph-duotone ph-link',
    BILLING: 'ph-duotone ph-link',
    NETOPS: 'ph-duotone ph-heartbeat',
    SALES: 'ph-duotone ph-gauge',
    WEB_RTC: 'ph-duotone ph-link',
    OMNI_CHANNEL: 'ph-duotone ph-link',
    HR_SERVICES: 'ph-duotone ph-link',
    
    // Submenu Icons
    USERS: 'ph-duotone ph-users',
    GAUGE: 'ph-duotone ph-gauge',
    LIST: 'ph-duotone ph-list',
    ENVELOPE: 'ph-duotone ph-envelope',
    ARROWS_CLOCKWISE: 'ph-duotone ph-arrows-clockwise',
    BUILDING: 'ph-duotone ph-building',
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
    CARET_DOWN: 'ph-duotone ph-caret-down'
  } as const,
  
  // Permissions
  PERMISSIONS: {
    CONTROL_HUB_SERVICES: 'control-hub-services',
    GSM_SERVICES: 'gsm-services',
    CALL_LOGS_SERVICES: 'call-logs-services',
    CALL_RECORDINGS_SERVICES: 'call-recordings-services',
    REPORTS_SERVICES: 'reports-services',
    AI_ML_SERVICES: 'ai-ml-services',
    CTI_SERVICES: 'cti-services',
    TICKETS_SERVICES: 'tickets-services',
    TMS_SERVICES: 'tms-services',
    CRM_SERVICES: 'crm-services',
    DNCR_SERVICES: 'dncr-services',
    ACCOUNTS_SERVICES: 'accounts-services',
    NETOPS_SERVICES: 'netops-services'
  } as const
} as const;

// Type definitions for better type safety
export type MenuLabel = keyof typeof HEADER_CONSTANTS.MENU_LABELS;
export type SubmenuLabel = keyof typeof HEADER_CONSTANTS.SUBMENU_LABELS;
export type IconName = keyof typeof HEADER_CONSTANTS.ICONS;
export type PermissionName = keyof typeof HEADER_CONSTANTS.PERMISSIONS;
