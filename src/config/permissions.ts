import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export interface RoutePermission {
    path: string;
    permissions: string[];
    children?: RoutePermission[];
}

// Define all route permissions in a hierarchical structure
export const routePermissions: RoutePermission[] = [

    { path: '/settings', permissions: [PERMISSIONS.VIEW_SETTINGS] },
    {path: '/notifications',permissions: [PERMISSIONS.VIEW_USER_NOTIFICATIONS]},
    
    //profile services start
    {path: '/profile',permissions: ['']},
    {path: '/live-monitoring',permissions: ['']},
    {path: '/user-settings',permissions: ['']},
    {path: '/pricing',permissions: ['']},
    
    {path: '/coming-soon',permissions: ['']},
    {path: '/plan-upgrade',permissions: ['']},
    
    // {path: '/resources',permissions: ['']},
    // {path: '/resources/faq',permissions: ['']},
    // {path: '/resources/help-materials',permissions: ['']},
    // {path: '/resources/contact-support',permissions: ['']},

    {path:'/manager-dashboard',permissions: ['']},
    {path:'/unified-workspace',permissions: [PERMISSIONS.VIEW_UNIFIED_WORKSPACE]},
   
    { path: '/billing', permissions: [PERMISSIONS.ACCOUNTS_SERVICES] },
    
    { path: '/dialpad-use', permissions: [PERMISSIONS.VIEW_CTI] },
    
    {path:'/faqs',permissions: [PERMISSIONS.MANAGE_HELP_CENTER]},
    {path:'/faqs/modules',permissions: [PERMISSIONS.MANAGE_HELP_CENTER]},
    {path:'/faqs/items',permissions: [PERMISSIONS.MANAGE_HELP_CENTER]},
    {path:'/faqs/topics',permissions: [PERMISSIONS.MANAGE_HELP_CENTER]},
    {path:'/faqs/types',permissions: [PERMISSIONS.MANAGE_HELP_CENTER]},
    {
        path: '/main-settings',
        permissions: [PERMISSIONS.GENERAL_SERVICES],
        children: [
            { path: '/general-prefs', permissions: [PERMISSIONS.GENERAL_SERVICES] },
            { path: '/notifications', permissions: [PERMISSIONS.VIEW_USER_NOTIFICATIONS] },
            { path: '/account-defaults', permissions: [PERMISSIONS.GENERAL_SERVICES] },
            { path: '/users-teams', permissions: [PERMISSIONS.CONTROL_HUB_SERVICES] },
            { path: '/smart-crm', permissions: [PERMISSIONS.CRM_SERVICES] },
            { path: '/communications', permissions: [PERMISSIONS.COMMUNICATIONS_SERVICES] },
            { path: '/planner', permissions: [PERMISSIONS.WORK_PLANNER_SERVICES] },
            { path: '/pulse', permissions: [PERMISSIONS.PULSE_SERVICES] },
            { path: '/compliance', permissions: [PERMISSIONS.DNCR_SERVICES] },
            { path: '/workforce', permissions: [PERMISSIONS.STAFF_MANAGEMENT_SERVICES] },
            { path: '/billing', permissions: [PERMISSIONS.ACCOUNTS_SERVICES] },
            { path: '/tickets', permissions: [PERMISSIONS.TICKETS_SERVICES] },
            { path: '/help-center', permissions: [PERMISSIONS.MANAGE_HELP_CENTER] },
            {
                path: '/ai-chat',
                permissions: [PERMISSIONS.VIEW_AI_CHAT_AI_CHAT],
                children: [
                    {
                        path: '/ai-chatbot-settings',
                        permissions: [PERMISSIONS.VIEW_TENANT_SETTING_AI_CHAT],
                    },
                ],
            },
        ]
    },
    { path: '/chat', permissions: [PERMISSIONS.VIEW_AI_CHAT_AI_CHAT] },
    
    {path:'/chat/ai-faqs/tenant',permissions: [PERMISSIONS.MANAGE_TENANT_PROFILE_AI_CHAT]},
    { path: '/chat/tenant-dashboard', permissions: [PERMISSIONS.VIEW_TENANT_DASHBOARD_AI_CHAT] },
    { path: '/chat/ai-faqs/global', permissions: [PERMISSIONS.MANAGE_GLOBAL_FAQS_AI_CHAT] },
    { path: '/chat/admin-dashboard', permissions: [PERMISSIONS.VIEW_ADMIN_DASHBOARD_AI_CHAT] },
    { path: '/chat/audit-logs', permissions: [PERMISSIONS.VIEW_ADMIN_DASHBOARD_AI_CHAT] },
    { path: '/chat/faq-profiles', permissions: [PERMISSIONS.VIEW_FAQS_PROFILE_AI_CHAT] },
    { path: '/chat/faq-profiles/tenant', permissions: [PERMISSIONS.MANAGE_TENANT_PROFILE_AI_CHAT] },
    { path: '/chat/faq-profiles/global', permissions: [PERMISSIONS.MANAGE_GLOBAL_FAQS_AI_CHAT] },
    { path: '/chat/usage-reports', permissions: [PERMISSIONS.CHAT_USAGE_REPORTS] },
    {path:'/chat/tools-profiles',permissions: [PERMISSIONS.VIEW_TOOLS_PROFILE_AI_CHAT]},
    { path: '/company', permissions: [PERMISSIONS.SET_COMPANY_IMAGE_USERS] },
    { path: '/audit-logs', permissions: [PERMISSIONS.AUDIT_LOGS_SERVICES] },
   
    {path:'/crm/quotes',permissions: [PERMISSIONS.VIEW_CRM_QUOTES]},



    //dashboards services start
    {
        path: '/dashboards',
        permissions: [''],
        children: [
            { path: '/manager', permissions: [''] },
            { path: '/agent', permissions: [''] },
            { path: '/supervisor', permissions: [''] },
        ]
    },
    //dashboards services end

    //crm services start
    {
        path: '/crm',
        permissions: [PERMISSIONS.CRM_SERVICES],
        children: [
            { 
                path: '/dashboard',permissions: [PERMISSIONS.VIEW_CRM_DASHBOARD]
            },
            { 
                path: '/campaigns',permissions: [PERMISSIONS.VIEW_CRM_CAMPAIGNS],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_CAMPAIGNS]}
                ]
            },
            { 
                path: '/prospects',permissions: [PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT]},
                    { path: '/create',permissions: [PERMISSIONS.CREATE_CRM_DATA_MANAGEMENT]},
                ]
            },
            { path: '/tickets',permissions: [PERMISSIONS.TICKETS_SERVICES]},
            { path: '/tickets/tickets-detailpage',permissions: [PERMISSIONS.TICKETS_SERVICES]},

            { 
                path: '/leads',permissions: [PERMISSIONS.VIEW_CRM_LEADS],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_LEADS]},
                    { path: '/create',permissions: [PERMISSIONS.CREATE_CRM_LEADS]},
                ]
            },
            { 
                path: '/deals',permissions: [PERMISSIONS.VIEW_CRM_DEALS],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_DEALS]},
                    { path: '/create',permissions: [PERMISSIONS.CREATE_CRM_DEALS]},
                ]
            },
            { 
                path: '/orders',permissions: [PERMISSIONS.VIEW_CRM_ORDERS],
                children: [
                    { path: '/',permissions: [PERMISSIONS.VIEW_CRM_ORDERS]},
                    { path: '/create',permissions: [PERMISSIONS.CREATE_CRM_ORDERS]},
                ]
            },
            { path: '/lost-reasons',permissions: [PERMISSIONS.VIEW_CRM_LOST_REASONS]},
            { path: '/opportunities',permissions: [PERMISSIONS.VIEW_CRM_OPPORTUNITIES]},
            { path: '/opportunities/create',permissions: [PERMISSIONS.CREATE_CRM_OPPORTUNITIES]},
            { path: '/stages',permissions: [PERMISSIONS.VIEW_CRM_STAGES]},
            { path: '/tasks',permissions: [PERMISSIONS.VIEW_CRM_TASKS]},
            { path: '/products',permissions: [PERMISSIONS.VIEW_CRM_PRODUCTS]},
            { path: '/activities',permissions: [PERMISSIONS.VIEW_CRM_HISTORY]},
            { path: '/reports',permissions: [PERMISSIONS.VIEW_CRM_REPORTS]},

            { path: '/industries',permissions: [PERMISSIONS.VIEW_CRM_INDUSTRIES]},
            { path: '/deal-templates',permissions: [PERMISSIONS.VIEW_CRM_DEAL_TEMPLATES]},
            { path: '/business-types',permissions: [PERMISSIONS.VIEW_CRM_BUSINESS_TYPES]},
            { path: '/contacts',permissions: [PERMISSIONS.VIEW_CRM_DATA_MANAGEMENT]},
            {path:'/companies',permissions: [PERMISSIONS.VIEW_COMPANIES_CRM]},
            {path:'/approvals',permissions: [PERMISSIONS.APPROVE_REJECT_CRM_DEALS]},//approvals 
            {path:'/approvals/approval-detailpage',permissions: [PERMISSIONS.APPROVE_REJECT_CRM_DEALS]},
            {path:'/inbox',permissions: [PERMISSIONS.VIEW_WHATSAPP_MESSAGES_CRM]},
            {path:'/crm-tasks',permissions: [PERMISSIONS.VIEW_CRM_TASKS]},
            {path:'/main-dashboard',permissions: [PERMISSIONS.VIEW_CRM_DASHBOARD]},
            // Unified CRM detail wrapper route
            {path:'/detailspage',permissions: [PERMISSIONS.CRM_SERVICES]},
            
        ]
    },
    //crm services end


    //communications services start
    {
        path: '/communications',
        permissions: [PERMISSIONS.COMMUNICATIONS_SERVICES],
        children: [
            {
                path: '/dashboard',
                permissions: [PERMISSIONS.VIEW_CALL_DASHBOARD]
            },
            {
                path: '/call-logs',
                permissions: [PERMISSIONS.VIEW_CALL_LOGS]
            },
            {
                path: '/recordings',
                permissions: [PERMISSIONS.VIEW_CALL_RECORDINGS]
            },
            {
                path: '/call-analysis',
                permissions: [PERMISSIONS.TRANSCRIPTION_ANALYZE_RECORDINGS_AIML],
                children: [
                    {
                        path: '/',
                        permissions: [PERMISSIONS.TRANSCRIPTION_ANALYZE_RECORDINGS_AIML]
                    }
                ]
            },
            {
                path: '/wallboards-live',
                permissions: [PERMISSIONS.VIEW_CTI],
            },
            {
                path: '/text-messages',
                permissions: [PERMISSIONS.VIEW_GSM_INBOX]
            },
            {
                path: '/campaign-manager',
                permissions: [PERMISSIONS.VIEW_LIVE_CALLS_CAMPAIGNS_MANAGEMENT]
            },
            {
                path: '/campaign-console',
                permissions: [PERMISSIONS.VIEW_LIVE_CALLS_AGENT_MANAGEMENT]
            },
            {
                path: '/campaign-agent',
                permissions: [PERMISSIONS.VIEW_CAMPAIGN_AGENT],
            },
        ]
    },
    //communications services end

    //planner services start
    {
        path: '/planner',
        permissions: [PERMISSIONS.WORK_PLANNER_SERVICES],
        children: [
            { path: '/orders-delivery',permissions: [PERMISSIONS.VIEW_ORDERS_DELIVERY_WORK_PLANNER]},
            {
                path: '/tasks', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER],
                children: [
                    { path: '/{id}', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER] }
                ]
             },
            { path: '/my-tasks', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER] },
            { path: '/workload', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER] },
            { path: '/calendar', permissions: [PERMISSIONS.VIEW_CALENDAR_WORK_PLANNER] },
            {
                path: '/projects', permissions: [PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER],
                children: [
                    { path: '/{id}', permissions: [PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER] }
                ]
             },
            { path: '/projectstasks', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER]},
            { path: '/dashboard',permissions: [PERMISSIONS.VIEW_PROJECTS_DASHBOARD_WORK_PLANNER]},
            { path: '/statuses',permissions: [PERMISSIONS.VIEW_STATUSES_WORK_PLANNER]},
        ]
    },
    //planner services end


    //compliance services start
    {
        path: '/compliance',
        permissions: [PERMISSIONS.DNCR_SERVICES],
        children: [
            { path: '/api-number-check',permissions: [PERMISSIONS.CHECK_NUMBERS_DNCR]},
            { path: '/cdr-records',permissions: [PERMISSIONS.VIEW_CDR_DNCR]},
            { path: '/add-records',permissions: [PERMISSIONS.VIEW_LOCAL_DND_CALL_BLOCK_DNCR]},
        ]
    },
    //compliance services end


    //billing services start
    {
        path: '/billing',
        permissions: [PERMISSIONS.CUSTOMER_ACCOUNTS_SERVICES],

        children: [
            { path: '/account-billing',permissions: [PERMISSIONS.ACCOUNTS_SERVICES]},
            { path: '/account-billing/:tab',permissions: [PERMISSIONS.ACCOUNTS_SERVICES]},
       
            {
                path: '/customer',
                permissions: [PERMISSIONS.CUSTOMER_ACCOUNTS_SERVICES],
        
                children: [
                    { path: '/dashboard',permissions: [PERMISSIONS.VIEW_CUSTOMER_DASHBOARD_BILLING]},
                    { path: '/account-overview',permissions: [PERMISSIONS.VIEW_CUSTOMER_ACCOUNT_OVERVIEW_BILLING]},
                    { path: '/products',permissions: [PERMISSIONS.VIEW_CUSTOMER_PRODUCTS_BILLING]},
                    { path: '/products/create',permissions: [PERMISSIONS.CREATE_CUSTOMER_PRODUCTS_BILLING]},
                    { path: '/products/edit/:productId',permissions: [PERMISSIONS.UPDATE_CUSTOMER_PRODUCTS_BILLING]},
                    { path: '/products/delete/:productId',permissions: [PERMISSIONS.DELETE_CUSTOMER_PRODUCTS_BILLING]},
                    { path: '/quotes',permissions: [PERMISSIONS.VIEW_CUSTOMER_QUOTES_BILLING]},
                    { path: '/subscriptions',permissions: [PERMISSIONS.VIEW_CUSTOMER_SUBSCRIPTION_BILLING]},
                    { path: '/subscriptions/create',permissions: [PERMISSIONS.CREATE_CUSTOMER_SUBSCRIPTION_BILLING]},
                    { path: '/subscriptions/edit/:subscriptionId',permissions: [PERMISSIONS.UPDATE_CUSTOMER_SUBSCRIPTION_BILLING]},
                    { path: '/subscriptions/delete/:subscriptionId',permissions: [PERMISSIONS.DELETE_CUSTOMER_SUBSCRIPTION_BILLING]},
                    { path: '/payment-history',permissions: [PERMISSIONS.VIEW_CUSTOMER_BILLING_HISTORY_BILLING]},
                    { path: '/payment-methods',permissions: [PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING]},
                    { path: '/invoices', permissions: [PERMISSIONS.VIEW_CUSTOMER_INVOICES_BILLING] },
                    { path: '/invoices/create', permissions: [PERMISSIONS.CREATE_CUSTOMER_INVOICES_BILLING] },
                    { path: '/invoices/edit/:invoiceId', permissions: [PERMISSIONS.UPDATE_CUSTOMER_INVOICES_BILLING] },
                    { path: '/invoices/delete/:invoiceId', permissions: [PERMISSIONS.DELETE_CUSTOMER_INVOICES_BILLING] },
                    { path: '/order-invoicing', permissions: [PERMISSIONS.VIEW_CUSTOMER_ORDERS_BILLING] },
                    { path: '/create-invoice', permissions: [PERMISSIONS.CREATE_CUSTOMER_INVOICES_BILLING] },
                    { path: '/payments', permissions: [PERMISSIONS.VIEW_CUSTOMER_PAYMENTS_BILLING] },
                    { path: '/transactions', permissions: [PERMISSIONS.VIEW_CUSTOMER_BILLING_HISTORY_BILLING] },
                   
                ]
                
            }
           
        ]
        
    },
        //finance services end


    //netops services start
    {
        path: '/pulse',
        permissions: [PERMISSIONS.NETOPS_SERVICES],
        children: [
            {  path: '/devices',permissions: [PERMISSIONS.VIEW_NETOPS_DEVICES]},
            {path: '/services', permissions: [PERMISSIONS.VIEW_NETOPS_SERVICES]},
            {path: '/uptime-sla',permissions: [PERMISSIONS.VIEW_NETOPS_UPTIME_SLA]},
            {path: '/server-insights',permissions: [PERMISSIONS.VIEW_SERVER_INSIGHTS_NETOPS]},
            {path: '/application-monitoring',permissions: [PERMISSIONS.VIEW_SERVER_INSIGHTS_NETOPS]},
            { path: '/gateways', permissions: [PERMISSIONS.VIEW_GSM_MANAGEMENT]},
            { path: '/gateway-ports', permissions: [PERMISSIONS.VIEW_GSM_PORTS]},
        ]
    },
    //netops services end

    //workforce services start
    {
        path: '/workforce',
        permissions: [PERMISSIONS.STAFF_MANAGEMENT_SERVICES],
        children: [
            { path: '/employees',permissions: [PERMISSIONS.VIEW_EMPLOYEES_STAFF_MANAGEMENT]},
            { path: '/dashboard',permissions: [PERMISSIONS.VIEW_EMPLOYEES_DASHBOARD_STAFF_MANAGEMENT]},
            { path: '/journey',permissions: [PERMISSIONS.VIEW_EMPLOYEES_ONBOARDING_STAFF_MANAGEMENT]},
            { path: '/approval-requests',permissions: [PERMISSIONS.VIEW_EMPLOYEES_APPROVAL_REQUEST_STAFF_MANAGEMENT]},
            { path: '/org-chart', permissions: [PERMISSIONS.VIEW_EMPLOYEES_ORGANIZATIONAL_CHART_STAFF_MANAGEMENT] },
            
            { path: '/request-categories', permissions: [PERMISSIONS.VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT] },
            { path: '/sub-categories', permissions: [PERMISSIONS.VIEW_REQUEST_CATEGORIES_STAFF_MANAGEMENT] },

            
            {path:'/attendance',permissions: [PERMISSIONS.VIEW_ATTENDENCE_STAFF_MANAGEMENT]},
        ]
    },
    //workforce services ends


    //reports services start
    {
        path: '/reports',
        permissions: [PERMISSIONS.REPORTS_SERVICES],
        children: [
            { path: '/crm-insights',permissions: [PERMISSIONS.VIEW_CRM_REPORTS]},
            {
                path: '/call-analytics',
                permissions: [PERMISSIONS.VIEW_CALL_REPORTS],
                children: [
                    { path: '/stats/country', permissions: [PERMISSIONS.CALL_STATS_BY_COUNTRY_REPORTS] },
                    {
                        path: '/stats/department',
                        permissions: [PERMISSIONS.CALL_STATS_BY_DEPARTMENT_REPORTS],
                        children: [
                            { path: '/extension', permissions: [PERMISSIONS.CALL_STATS_BY_DEPARTMENT_EXTENSION_REPORTS] }
                        ]
                    },
                    { path: '/stats/extension', permissions: [PERMISSIONS.CALL_STATS_BY_EXTENSION_REPORTS] },
                    { path: '/stats/general', permissions: [PERMISSIONS.GENERAL_CALL_STATISTICS_REPORTS] },
                    { path: '/incoming/country', permissions: [PERMISSIONS.CALL_INCOMING_BY_COUNTRY_REPORTS] },
                    { path: '/incoming/department', permissions: [PERMISSIONS.CALL_INCOMING_BY_DEPARTMENT_REPORTS] },
                    { path: '/incoming/extension', permissions: [PERMISSIONS.CALL_INCOMING_BY_EXTENSION_REPORTS] },
                ]
            },
            { path: '/chat-usage', permissions: [PERMISSIONS.CHAT_USAGE_REPORTS] },
        ]
    },
    //reports services end

   
    {path: '/audit-logs',permissions: ['']},
    {path: '/privacy-policy',permissions: ['']},

    
    {
        path: '/help-center',
        permissions: [PERMISSIONS.VIEW_HELP_CENTER],
        children: [
            { path: '/knowledge-base', permissions: [''] },
            { path: '/knowledge-base/[id]', permissions: [''] },
            { path: '/my-tickets', permissions: [''] },
            { path: '/my-tickets/new', permissions: [''] },
            { path: '/my-tickets/[id]', permissions: [''] },
            { path: '/contact-support', permissions: [''] },
            { path: '/system-status', permissions: [''] },
        ]
    },


   // {path: '/reports',permissions: [PERMISSIONS.REPORTS_SERVICES]},
   // {path: '/billing',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/reseller',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/vendor',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/crm-new',permissions: [PERMISSIONS.REPORTS_SERVICES]},
    {path: '/tickets/dashboardnew',permissions: [PERMISSIONS.REPORTS_SERVICES]},

    
    
     
    
    //controlhub services start
    {
        path: '/controlhub',
        permissions: [PERMISSIONS.CONTROL_HUB_SERVICES],
        children: [
            {
                path: '/ranks',
                permissions: [PERMISSIONS.VIEW_RANKS],
                children: [
                    {
                        path: '/permissions',
                        permissions: ['view-permissions-ranks']
                    },
                    {
                        path: '/permissions/edit',
                        permissions: ['assign-permissions-ranks']
                    }
                ]
            },
            {
                path: '/users',
                permissions: [PERMISSIONS.VIEW_USERS],
                children: [
                    {
                        path: '/',
                        permissions: ['edit-users'],
                    },
                    {
                        path: '/create',
                        permissions: ['add-users']
                    }
                ]
            },
            {
                path: '/groups',
                permissions: [PERMISSIONS.VIEW_GROUPS]
            },
            {
                path: '/teams',
                permissions: [PERMISSIONS.VIEW_TEAMS]
            },
        ]
    },
    
    

 
    
    //call reports services start
    {
        path: '/call-reports',
        permissions: [PERMISSIONS.VIEW_CALL_REPORTS],
        children: [
            {
                path: '/',
                permissions: [PERMISSIONS.VIEW_CALL_REPORTS]
            },
            {
                path: '/stats/general',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_STATISTICS_REPORTS]
            },
            {
                path: '/stats/country',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_STATISTICS_REPORTS]
            },
            {
                path: '/stats/department',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_STATISTICS_REPORTS],
                children: [
                    {
                        path: '/extension',
                        permissions: [PERMISSIONS.CALL_REPORTS_BY_STATISTICS_REPORTS]
                    }
                ]
            },
            {
                path: '/stats/extension',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_STATISTICS_REPORTS]
            },
            {
                path: '/incoming/country',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_CALL_INCOMING_REPORTS]
            },
            {
                path: '/incoming/department',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_CALL_INCOMING_REPORTS]
            },
            {
                path: '/incoming/extension',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_CALL_INCOMING_REPORTS]
            },
            {
                path: '/trend/country',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_TREND_REPORTS]
            },
            {
                path: '/trend/department',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_TREND_REPORTS]
            },
            {
                path: '/trend/extension',
                permissions: [PERMISSIONS.CALL_REPORTS_BY_TREND_REPORTS]
            },
        ]
    },

    //tickets services start
    {
        path: '/tickets',
        permissions: [PERMISSIONS.TICKETS_SERVICES],
        children: [
            {
                path: '/',
                permissions: ['view-ticket-tickets']
            },
            {
                path: '/dashboard',
                permissions: ['dashboard-tickets']
            },
            {
                path: '/list',
                permissions: ['view-ticket-tickets'],
                children: [
                    {
                        path: '/:id',
                        permissions: ['view-ticket-tickets']
                    }
                ]
            },
            {
                path: '/statuses',
                permissions: ['ticket-statuses-tickets']
            },
            {
                path: '/modules',
                permissions: ['ticket-modules-tickets']
            },
            {
                path: '/modules/categories',
                permissions: [HEADER_CONSTANTS.PERMISSIONS.VIEW_TICKETS_CATEGORIES]
            },
            {
                path: '/modules/submodules',
                permissions: [HEADER_CONSTANTS.PERMISSIONS.VIEW_TICKETS_SUBCATEGORIES]
            },
            {
                path: '/types',
                permissions: ['view-ticket-types-tickets']
            }
        ]
    },

    //ai-ml services start
    {
        path: '/ai-ml',
        permissions: [PERMISSIONS.AI_ML_SERVICES],
        children: [
            {
                path: '/analysis',
                permissions: ['transcriptions-analysis-aiml'],
                children: [
                    {
                        path: '/',
                        permissions: ['transcriptions-analysis-aiml']
                    },
                    {
                        path: '/new',
                        permissions: ['transcriptions-analysis-aiml']
                    }
                ]
            },
           
            {
                path: '/manage-extensions',
                permissions: [PERMISSIONS.MANAGE_EXTENSIONS_AIML]
            },
            {
                path: '/translate',
                permissions: ['translate-aiml']
            },
            {
                path: '/transcriptions',
                permissions: ['transcriptions-aiml']
            },
            {
                path: '/outbound-calls',
                permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]
            },
            {
                path: '/trunk-profiles',
                permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]
            },
            {
                path: '/profiles',
                permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]
            },
            {
                path: '/campaigns',
                permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]
            },
            {
                path: '/live-monitoring',
                permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]
            },
            {
                path: '/campaign-reports',
                permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]
            }
        ]
    },

    //gsm services start
    {
        path: '/gsm',
        permissions: [PERMISSIONS.GSM_SERVICES],
        children: [
            {
                path: '/dashboard',
                permissions: [PERMISSIONS.VIEW_GSM_DASHBOARD]
            },
            {
                path: '/list',
                permissions: [PERMISSIONS.VIEW_GSM_MANAGEMENT]
            },
            {
                path: '/assign',
                permissions: [PERMISSIONS.VIEW_GSM_ASSIGNMENT]
            },
            {
                path: '/ports',
                permissions: [PERMISSIONS.VIEW_GSM_PORTS]
            },
            {
                path: '/inbox',
                permissions: [PERMISSIONS.VIEW_GSM_INBOX]
            },
            {
                path: '/sync',
                permissions: [PERMISSIONS.VIEW_GSM_SYNC]
            },
            {
                path: '/company',
                permissions: [PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING],
                children: [
                    { path: '/po',permissions: [PERMISSIONS.VIEW_GSM_COMPANY_PROFILLING]}
                ]
            }
        ]
    },
    
    //tms services start
    {
        path: '/tms',
        permissions: [PERMISSIONS.TMS_SERVICES],
        children: [
            { path: '/audit-logs',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/dashboard',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/settings',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/profile',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/unified-ops',permissions: [PERMISSIONS.TMS_SERVICES]},
            { path: '/verification',permissions: [PERMISSIONS.TMS_SERVICES]},
            { 
                path: '/profiling',permissions: [PERMISSIONS.TMS_SERVICES],
                children: [
                    { path: '/customers',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/customers/create',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/user',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/user/create',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { 
                        path: '/logs',permissions: [PERMISSIONS.TMS_SERVICES],
                        children: [
                            { path: '/',permissions: [PERMISSIONS.TMS_SERVICES]}
                        ]
                    },
                ]
            },
            { 
                path: '/management',permissions: [PERMISSIONS.TMS_SERVICES],
                children: [
                    { path: '/users',permissions: [PERMISSIONS.TMS_SERVICES]},
                ]
            },

        ]
    },

    //netops services start
    {
        path: '/netops',
        permissions: [PERMISSIONS.NETOPS_SERVICES],
        children: [
            { path: '/test',permissions: [PERMISSIONS.NETOPS_SERVICES]}
        ]
    },

    //cti services start
    {
        path: '/cti',
        permissions: [PERMISSIONS.CTI_SERVICES],
        children: [
            { path: '/',permissions: ['view-cti']},
            { path: '/monitoring',permissions: ['view-cti']},
            { path: '/dialer',permissions: ['dial-call-cti']},

        ]
    },


    
];

export function getRequiredPermissions(path: string): string[] {
    // Strip query parameters and normalize path
    const pathWithoutQuery = path.split('?')[0];
    let normalizedPath = pathWithoutQuery.endsWith('/') ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
    // `/workforce` only redirects to `/workforce/dashboard` (see pages/workforce/index.tsx).
    // Without this, search and canAccessRoute treated `/workforce` as parent-permission-only,
    // but navigation landed on the dashboard and failed with Access Denied.
    if (normalizedPath === '/workforce') {
        normalizedPath = '/workforce/dashboard';
    }
    let requiredPermissions: string[] = [];
    let exactMatch = false;

    function traverseRoutes(routes: RoutePermission[], currentPath: string = '') {
        for (const route of routes) {
            const fullPath = `${currentPath}${route.path}`;
            const isExactMatch = normalizedPath === fullPath;
            const hasChildRoute = route.children?.some(child => {
                const childPath = `${fullPath}${child.path}`;
                return normalizedPath === childPath || normalizedPath.startsWith(`${childPath}/`);
            });

            if (isExactMatch || hasChildRoute) {
                exactMatch = true;
                requiredPermissions = [...requiredPermissions, ...route.permissions];
                if (route.children) {
                    traverseRoutes(route.children, fullPath);
                }
            }
        }
    }

    traverseRoutes(routePermissions);
    
    // If no exact match was found in defined routes, return empty array to trigger access denied
    return exactMatch ? Array.from(new Set(requiredPermissions)) : [];
}

// Helper function to check if a path is under any protected route
export function isProtectedPath(path: string): boolean {
    // Strip query parameters and normalize path
    const pathWithoutQuery = path.split('?')[0];
    const normalizedPath = pathWithoutQuery.endsWith('/') ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
    
    function checkRoute(routes: RoutePermission[], currentPath: string = ''): boolean {
        for (const route of routes) {
            const fullPath = `${currentPath}${route.path}`;
            
            // If this is a parent route and the path starts with it, consider it protected
            if (normalizedPath.startsWith(fullPath + '/') || normalizedPath === fullPath) {
                return true;
            }

            // Check children routes
            if (route.children && checkRoute(route.children, fullPath)) {
                return true;
            }
        }
        return false;
    }

    return checkRoute(routePermissions);
}

// Helper function to check if user has required permissions
export function hasRequiredPermissions(userPermissions: string[], path: string): boolean {
    const required = getRequiredPermissions(path);
    return required.every(permission => userPermissions.includes(permission));
}

/** Route entry for search suggestions (path + display label) */
export interface SearchableRoute {
    path: string;
    label: string;
}

function pathToLabel(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replaceAll('-', ' ')).join(' / ') || 'Home';
}

/** True if path contains a dynamic segment ([id], :id, {id}, etc.) */
function isDynamicPath(path: string): boolean {
    // Avoid regex backtracking risks (Sonar S5852): use simple linear checks instead.
    return hasBracketParam(path) || hasColonParam(path) || hasBraceParam(path);
}

function isAsciiWordChar(ch: string): boolean {
    return (
        (ch >= "a" && ch <= "z") ||
        (ch >= "A" && ch <= "Z") ||
        (ch >= "0" && ch <= "9") ||
        ch === "_"
    );
}

function isIdentStartChar(ch: string): boolean {
    return (
        (ch >= "a" && ch <= "z") ||
        (ch >= "A" && ch <= "Z") ||
        ch === "_"
    );
}

function hasBracketParam(path: string): boolean {
    let open = path.indexOf("[");
    while (open !== -1) {
        const close = path.indexOf("]", open + 1);
        if (close === -1) {
            open = path.indexOf("[", open + 1);
            continue;
        }
        if (close > open + 1 && isValidBracketParamName(path, open + 1, close)) return true;
        open = path.indexOf("[", open + 1);
    }
    return false;
}

function isValidBracketParamName(path: string, start: number, end: number): boolean {
    for (let i = start; i < end; i++) {
        const ch = path[i];
        if (!isAsciiWordChar(ch) && ch !== "-") return false;
    }
    return true;
}

function hasColonParam(path: string): boolean {
    let idx = path.indexOf(":");
    while (idx !== -1) {
        const next = path[idx + 1];
        if (next != null && isIdentStartChar(next)) return true;
        idx = path.indexOf(":", idx + 1);
    }
    return false;
}

function hasBraceParam(path: string): boolean {
    let open = path.indexOf("{");
    while (open !== -1) {
        const close = path.indexOf("}", open + 1);
        if (close === -1) {
            open = path.indexOf("{", open + 1);
            continue;
        }
        if (close > open + 1) return true;
        open = path.indexOf("{", open + 1);
    }
    return false;
}

/**
 * Routes (or path prefixes) to exclude from header search suggestions.
 * Exact match or path starting with an entry (e.g. '/help-center/knowledge-base') is excluded.
 */
export const SEARCH_EXCLUDED_ROUTES: string[] = [
   
    '/help-center/knowledge-base/[id]',
    '/help-center/my-tickets/[id]',
    '/planner/tasks/:id',
    '/planner/projects/{id}',
    '/crm-new-dashboard',

    // Smart CRM settings pages – reachable via /main-settings/smart-crm
    // (kept as standalone routes for direct deep-linking, but hidden from
    // global search to avoid duplicate entries).
    '/crm/campaigns',
    '/crm/stages',
    '/crm/products',
    '/crm/deal-templates',
    '/crm/industries',
    '/crm/business-types',

    '/coming-soon',
    '/plan-upgrade',
    '/live-calls-test',
    '/live-call-updated',
    '/test-image-storage',
    '/test-cti-proxy',
    '/manager-dashboard',
    '/dialpad-use',
    '/help-center-new',
    '/dashboards',

    // Redirect stub; use `/workforce/dashboard` or a specific workforce sub-route in search.
    '/workforce',
    ''
];

function isExcludedFromSearch(path: string): boolean {
    const normalized = path.replaceAll(/\/+/g, '/').replace(/\/$/, '') || '/';
    return SEARCH_EXCLUDED_ROUTES.some((ex) => {
        const exNorm = ex.replaceAll(/\/+/g, '/').replace(/\/$/, '') || '/';
        return normalized === exNorm || normalized.startsWith(exNorm + '/');
    });
}

/** Flatten routePermissions into a list of searchable routes with full path and label. Excludes dynamic segments and SEARCH_EXCLUDED_ROUTES. */
export function getSearchableRoutes(): SearchableRoute[] {
    const result: SearchableRoute[] = [];
    function traverse(routes: RoutePermission[], currentPath: string = '') {
        for (const route of routes) {
            const fullPath = `${currentPath}${route.path}`.replaceAll(/\/+/g, '/') || '/';
            if (isDynamicPath(fullPath)) continue;
            const normalized = fullPath.endsWith('/') && fullPath.length > 1 ? fullPath.slice(0, -1) : fullPath;
            if (isExcludedFromSearch(normalized)) continue;
            result.push({ path: normalized, label: pathToLabel(normalized) });
            if (route.children?.length) traverse(route.children, fullPath);
        }
    }
    traverse(routePermissions);
    return result.filter((r, i, arr) => arr.findIndex(x => x.path === r.path) === i);
}

/** Check if user can access route (empty permission = allowed) */
export function canAccessRoute(userPermissions: string[] | undefined, path: string): boolean {
    const required = getRequiredPermissions(path).filter(Boolean);
    return required.length === 0 || (userPermissions != null && required.every(p => userPermissions.includes(p)));
}