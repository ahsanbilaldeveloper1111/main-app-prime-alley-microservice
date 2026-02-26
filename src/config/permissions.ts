import { HEADER_CONSTANTS } from "@constants/headerConstants";

const { PERMISSIONS } = HEADER_CONSTANTS;

export interface RoutePermission {
    path: string;
    permissions: string[];
    children?: RoutePermission[];
}

// Define all route permissions in a hierarchical structure
export const routePermissions: RoutePermission[] = [
    
    //profile services start
    {path: '/profile',permissions: ['']},
    {path: '/settings',permissions: ['']},
    {path: '/coming-soon',permissions: ['']},
    {path: '/plan-upgrade',permissions: ['']},
    {path: '/live-calls-test',permissions: ['']},
    {path: '/resources',permissions: ['']},
    {path: '/notifications',permissions: ['']},
    {path: '/test-cti-proxy',permissions: ['']},
   
    {path: '/resources/faq',permissions: ['']},
    {path: '/resources/help-materials',permissions: ['']},
    {path: '/resources/contact-support',permissions: ['']},
    {path:'/manager-dashboard',permissions: ['']},
    {path:'/unified-workspace',permissions: [PERMISSIONS.VIEW_UNIFIED_WORKSPACE]},
    {path:'/live-call-updated',permissions: ['']},
    {path:'/test-image-storage',permissions: ['']},
    {path:'/billing',permissions: ['']},
    {path:'/dialpad-use',permissions: ['']},
    {path:'/crm-new-dashboard',permissions: ['']},
    {path:'/help-center-new',permissions: ['']},
    {path:'/faqs',permissions: ['']},
    {path:'/faqs/modules',permissions: ['']},
    {path:'/faqs/items',permissions: ['']},
    {path:'/faqs/topics',permissions: ['']},
    {path:'/faqs/types',permissions: ['']},
    {path:'/crm-tasks',permissions: ['']},
   
    
    {path:'/ai-ml/tenant-faqs',permissions: ['']},
    { path: '/ai-ml/global-faqs', permissions: [''] },
    
    {path:'/chat/ai-faqs',permissions: [PERMISSIONS.TMS_SERVICES]},
    {path:'/chat/ai-bot-faqs',permissions: [PERMISSIONS.TMS_SERVICES]},
    {path:'/chat/ai-faqs/tenant',permissions: [PERMISSIONS.TMS_SERVICES]},
    { path: '/chat/ai-faqs/global', permissions: [PERMISSIONS.TMS_SERVICES] },
    {path:'/chat/faq-profiles',permissions: [PERMISSIONS.TMS_SERVICES]},
    {path:'/chat/faq-profiles/tenant',permissions: [PERMISSIONS.TMS_SERVICES]},
    { path: '/chat/faq-profiles/global', permissions: [PERMISSIONS.TMS_SERVICES] },
    { path: '/chat/usage-reports', permissions: [PERMISSIONS.TMS_SERVICES] },
    {path:'/chat/tools-profiles',permissions: [PERMISSIONS.TMS_SERVICES]},
    
    { path: '/company', permissions: ['set-company-image-users'] },
    { path: '/audit-logs', permissions: [''] },





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
            { path: '/activities',permissions: [PERMISSIONS.VIEW_CRM_HISTORY]},//activities
            { path: '/reports',permissions: [PERMISSIONS.VIEW_CRM_REPORTS]},

            { path: '/industries',permissions: [PERMISSIONS.VIEW_CRM_INDUSTRIES]},
            { path: '/deal-templates',permissions: [PERMISSIONS.VIEW_CRM_DEAL_TEMPLATES]},
            { path: '/business-types',permissions: [PERMISSIONS.VIEW_CRM_BUSINESS_TYPES]},
            {path:'/companies',permissions: ['']},//companies
            {path:'/approvals',permissions: ['']},//approvals 
            {path:'/approvals/approval-detailpage',permissions: ['']},
            {path:'/inbox',permissions: ['']},
            {path:'/crm-tasks',permissions: [PERMISSIONS.VIEW_CRM_TASKS]},
        ]
    },
    //crm services end


    //communications services start
    {
        path: '/communications',
        permissions: [PERMISSIONS.CALL_HISTORY_SERVICES],
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
                path: '/call-analytics',
                permissions: [PERMISSIONS.TRANSCRIPTION_ANALYSIS_AIML],
                children: [
                    {
                        path: '/',
                        permissions: [PERMISSIONS.TRANSCRIPTION_ANALYSIS_AIML]
                    }
                ]
            },
            {
                path: '/wallboards-live',
                permissions: [PERMISSIONS.CTI_SERVICES],
                // children: [
                //     { path: '/',permissions: [PERMISSIONS.VIEW_CTI]},
                //     { path: '/new',permissions: []},
                //     { path: '/dialer',permissions: ['dial-call-cti', 'merge-call-cti', 'transfer-call-cti']},
                //     { path: '/management/campaigns',permissions: [PERMISSIONS.VIEW_LIVE_CALLS_CAMPAIGNS_MANAGEMENT]},
                //     { path: '/management/agents',permissions: [PERMISSIONS.VIEW_LIVE_CALLS_AGENT_MANAGEMENT]},
                // ]
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
        ]
    },
    //communications services end

    //planner services start
    {
        path: '/planner',
        permissions: [PERMISSIONS.WORK_PLANNER_SERVICES],
        children: [
            { path: '/orders-delivery',permissions: [PERMISSIONS.VIEW_RECURRING_REMINDERS_WORK_PLANNER]},
            { path: '/recurring-reminders',permissions: [PERMISSIONS.VIEW_RECURRING_REMINDERS_WORK_PLANNER]},
            { path: '/todo',permissions: [PERMISSIONS.VIEW_DIAL_TODO_WORK_PLANNER]},
            
            { path: '/tasks-old', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER] },
            { path: '/tasks-old/:id', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER] },

            { path: '/tasks', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER] },
            { path: '/tasks/:id', permissions: [PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER] },
            
            {
                path: '/projects', permissions: [PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER],
                children: [
                    { path: '/{id}', permissions: [PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER] }
                ]
             },
            
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
        permissions: [PERMISSIONS.ACCOUNTS_SERVICES],

        children: [
            { path: '/dashboard',permissions: [PERMISSIONS.VIEW_CUSTOMER_DASHBOARD_BILLING]},
            { path: '/account-overview',permissions: [PERMISSIONS.VIEW_ACCOUNT_OVERVIEW_BILLING]},
            { path: '/subscriptions',permissions: [PERMISSIONS.VIEW_PRODUCT_DETAILS_BILLING]},
            { path: '/payment-history',permissions: [PERMISSIONS.VIEW_BILLING_HISTORY_BILLING]},
            { path: '/payment-methods',permissions: [PERMISSIONS.VIEW_PAYMENT_METHODS_BILLING]},
            { path: '/invoices',permissions: [PERMISSIONS.VIEW_INVOICES_BILLING]},
            { path: '/order-invoicing', permissions: [PERMISSIONS.VIEW_INVOICES_BILLING] },
            // {
            //     path: '/companies',
            //     permissions: [PERMISSIONS.VIEW_COMPANIES_BILLING],
            //     children: [
            //         { path: '/product-pricing',permissions: [PERMISSIONS.VIEW_PRODUCT_PRICING_COMPANIES_BILLING]}
            //     ]
            // }
        ]
        
    },
    //finance services end


    //virtual agents services start
    {
        path: '/agents',
        permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML],
        children: [
            { path: '/outbound-agent',permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]},
            { path: '/inbound-agent',permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]},
            { path: '/agent-campaigns', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
            { path: '/create-campaign',permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]},
            { path: '/pitch-deck',permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]},
            { path: '/live-monitoring',permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]},
            { path: '/analytics',permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]},
            { path: '/usage-reports',permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML]},
        ]
    },
    //virtual agents services end

    //netops services start
    {
        path: '/netops',
        permissions: [PERMISSIONS.NETOPS_SERVICES],
        children: [
            {
                path: '/dashboard',
                permissions: [PERMISSIONS.VIEW_NETOPS_DASHBOARD]
            },
            {
                path: '/devices',
                permissions: [PERMISSIONS.VIEW_NETOPS_DEVICES]
            },
            {
                path: '/services',
                permissions: [PERMISSIONS.VIEW_NETOPS_SERVICES]
            },
            {
                path: '/alerts',
                permissions: [PERMISSIONS.VIEW_NETOPS_ALERTS]
            },
            {
                path: '/uptime-sla',
                permissions: [PERMISSIONS.VIEW_NETOPS_UPTIME_SLA]
            },
            {
                path: '/server-insights',
                permissions: [PERMISSIONS.NETOPS_SERVICES]
            },
            {
                path: '/application-monitoring',
                permissions: [PERMISSIONS.NETOPS_SERVICES]
            },
            {
                path: '/hosts',
                permissions: [PERMISSIONS.NETOPS_SERVICES]
            },
            {
                path: '/host-groups',
                permissions: [PERMISSIONS.NETOPS_SERVICES]
            },
            {
                path: '/gateways',
                permissions: [PERMISSIONS.NETOPS_SERVICES]
            },
            {
                path: '/gateway-ports',
                permissions: [PERMISSIONS.NETOPS_SERVICES]
            },
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

            
            {path:'/attendences',permissions: [PERMISSIONS.VIEW_ATTENDENCE_STAFF_MANAGEMENT]},
            {path:'/locations',permissions: [PERMISSIONS.VIEW_LOCATIONS_STAFF_MANAGEMENT]}
        ]
    },
    //workforce services end


    //reports services start
    {
        path: '/reports',
        permissions: [PERMISSIONS.REPORTS_SERVICES],
        children: [
            { path: '/crm-insights',permissions: [PERMISSIONS.VIEW_CRM_REPORTS]},
            { path: '/call-analytics',permissions: [PERMISSIONS.VIEW_CALL_REPORTS]},
            { path: '/chat-usage', permissions: [PERMISSIONS.REPORTS_SERVICES] },
        ]
    },
    //reports services end

   
    {path: '/audit-logs',permissions: ['']},

















    
    {
        path: '/help-center',
        permissions: [''],
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

    //ai-agent services start
    {
        path: '/ai-agent',
        permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML],
        children: [
        
            { path: '/outbound', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML],
                children: [
                    { path: '/trunk-profiles', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
                    { path: '/pitch-deck', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
                    { path: '/usage-reports', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] }
                ]
            },
            { path: '/inbound', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML],
                children: [
                    { path: '/trunk-profiles', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
                    { path: '/faqs', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
                    { path: '/campaign-reports', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
                    { path: '/bot-profiles', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
                    { path: '/live-monitoring', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] },
                    { path: '/usage-reports', permissions: [PERMISSIONS.OUTBOUND_CALLS_AIML] }

                ]
            },

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
                    { 
                        path: '/rank-permissions',permissions: [PERMISSIONS.TMS_SERVICES],
                        children: [
                            { path: '/',permissions: [PERMISSIONS.TMS_SERVICES]}
                        ]
                    },
                ]
            },
            {
                path: '/cisco-pbx',permissions: [PERMISSIONS.TMS_SERVICES],
                children: [
                    { path: '/app-users',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/users-directory',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/users',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/custom-users',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/facilities-info',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/line',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/phone',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/sip-trunks',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/translation-patterns',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/device-pool',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/locations',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/route-partitions',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/css',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/regions',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/route-pattern',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/remote-destination',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/remote-destination/profile',permissions: [PERMISSIONS.TMS_SERVICES]},
                    { path: '/recording-profile',permissions: [PERMISSIONS.TMS_SERVICES]},
                ]
            }

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
    const normalizedPath = pathWithoutQuery.endsWith('/') ? pathWithoutQuery.slice(0, -1) : pathWithoutQuery;
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
    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')).join(' / ') || 'Home';
}

/** True if path contains a dynamic segment ([id], :id, {id}, etc.) */
function isDynamicPath(path: string): boolean {
    return /\[[\w-]*\]|:\w+|\{[^}]+\}/.test(path);
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
    'worforce/sub-categories',
    '/workforce/locations',

    '/coming-soon',
    '/plan-upgrade',
    '/live-calls-test',
    '/live-call-updated',
    '/test-image-storage',
    '/test-cti-proxy',
    '/manager-dashboard',
    '/dialpad-use',
    '/help-center-new',
];

function isExcludedFromSearch(path: string): boolean {
    const normalized = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    return SEARCH_EXCLUDED_ROUTES.some((ex) => {
        const exNorm = ex.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
        return normalized === exNorm || normalized.startsWith(exNorm + '/');
    });
}

/** Flatten routePermissions into a list of searchable routes with full path and label. Excludes dynamic segments and SEARCH_EXCLUDED_ROUTES. */
export function getSearchableRoutes(): SearchableRoute[] {
    const result: SearchableRoute[] = [];
    function traverse(routes: RoutePermission[], currentPath: string = '') {
        for (const route of routes) {
            const fullPath = `${currentPath}${route.path}`.replace(/\/+/g, '/') || '/';
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